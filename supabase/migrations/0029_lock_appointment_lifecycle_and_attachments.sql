-- ProMediCare AI — appointment lifecycle + attachment destruction (audit 0029)
--
-- Gaps left after 0013/0020 (RLS is the real boundary; the anon key is public):
-- 1. guard_patient_appointment_update let patients PATCH deleted_at. The
--    appointments_no_overlap exclusion only covers deleted_at IS NULL rows, so
--    a soft-deleted visit frees the doctor slot for a second booking while
--    vanishing from every app query that filters deleted_at IS NULL.
-- 2. The same guard allowed patients to set status = cancelled from any prior
--    status, including in_progress / completed, corrupting active or finished
--    encounters (app cancelAppointment only allows pending/confirmed).
-- 3. Moving status to checked_in had no DB fee gate — any receptionist /
--    hospital admin / assigned doctor could PostgREST-PATCH past checkInWithFee
--    and skip appointment_payments entirely.
-- 4. medical_attachments DELETE (and storage medical-files DELETE) allowed any
--    same-hospital doctor to permanently destroy a peer's labs/imaging.
-- 5. consultation_notes / medical_attachments writes did not require
--    patient_id = appointments.patient_id, so a doctor could park clinical
--    content on the wrong chart (silent PHI misattribution).

-- ---------------------------------------------------------------------------
-- patients: cancel only pre-visit; never soft-delete via PostgREST
-- ---------------------------------------------------------------------------
create or replace function public.guard_patient_appointment_update()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Trusted backend (migrations / service role) has no JWT: skip.
  if auth.uid() is null then return new; end if;
  -- Only constrain when the actor is the owning patient and not staff/admin.
  if public.is_staff() or public.is_super_admin() then return new; end if;
  if new.patient_id is distinct from public.current_patient_id() then return new; end if;

  if (new.hospital_id is distinct from old.hospital_id)
     or (new.doctor_id is distinct from old.doctor_id)
     or (new.patient_id is distinct from old.patient_id)
     or (new.department_id is distinct from old.department_id) then
    raise exception 'Patients cannot reassign an appointment''s hospital, doctor, or department';
  end if;

  -- Soft-delete would drop the row out of appointments_no_overlap and hide it
  -- from operational UIs without going through cancel.
  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'Patients cannot delete an appointment';
  end if;

  -- Patients may only leave the status unchanged (reschedule) or cancel a
  -- not-yet-started visit. Mid-visit / completed rows stay immutable for them.
  if new.status is distinct from old.status then
    if new.status <> 'cancelled' then
      raise exception 'Patients can only cancel an appointment';
    end if;
    if old.status not in ('pending', 'confirmed') then
      raise exception 'Patients can only cancel pending or confirmed appointments';
    end if;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- check-in: fee row must exist before status becomes checked_in
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_checkin_has_payment()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if new.status = 'checked_in' and (old.status is distinct from 'checked_in') then
    if not exists (
      select 1 from public.appointment_payments p
      where p.appointment_id = new.id
    ) then
      raise exception 'Fee payment is required before check-in';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_checkin_has_payment on public.appointments;
create trigger guard_appointment_checkin_has_payment
  before update of status on public.appointments
  for each row execute function public.guard_appointment_checkin_has_payment();

revoke execute on function public.guard_appointment_checkin_has_payment() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- clinical rows: patient_id must match the linked appointment
-- ---------------------------------------------------------------------------
create or replace function public.guard_clinical_patient_matches_appointment()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_patient uuid;
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;
  if new.appointment_id is null then return new; end if;

  select a.patient_id into v_patient
  from public.appointments a
  where a.id = new.appointment_id;

  if v_patient is null then
    raise exception 'Appointment not found for clinical row';
  end if;

  if new.patient_id is distinct from v_patient then
    raise exception 'Clinical row patient must match the appointment patient';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_clinical_patient_matches_appointment on public.consultation_notes;
create trigger guard_clinical_patient_matches_appointment
  before insert or update on public.consultation_notes
  for each row execute function public.guard_clinical_patient_matches_appointment();

drop trigger if exists guard_attachment_patient_matches_appointment on public.medical_attachments;
create trigger guard_attachment_patient_matches_appointment
  before insert or update on public.medical_attachments
  for each row execute function public.guard_clinical_patient_matches_appointment();

revoke execute on function public.guard_clinical_patient_matches_appointment() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- medical_attachments: only uploader (or super admin) may mutate / destroy
-- ---------------------------------------------------------------------------
drop policy if exists attachments_update on public.medical_attachments;
create policy attachments_update on public.medical_attachments for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_role() = 'doctor'
      and hospital_id = public.current_hospital_id()
      and uploaded_by = auth.uid()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.current_role() = 'doctor'
      and hospital_id = public.current_hospital_id()
      and uploaded_by = auth.uid()
    )
  );

drop policy if exists attachments_delete on public.medical_attachments;
create policy attachments_delete on public.medical_attachments for delete to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_role() = 'doctor'
      and hospital_id = public.current_hospital_id()
      and uploaded_by = auth.uid()
    )
  );

-- Storage objects: only the uploading doctor (storage.objects.owner) or a
-- super admin may update/delete. Keeps upload-rollback cleanup working when
-- metadata insert fails, while blocking peer doctors from overwriting or
-- wiping shared hospital paths.
drop policy if exists medical_files_update on storage.objects;
create policy medical_files_update on storage.objects for update to authenticated
  using (
    bucket_id = 'medical-files'
    and (
      public.is_super_admin()
      or (
        public.current_role() = 'doctor'
        and (storage.foldername(name))[1] = public.current_hospital_id()::text
        and owner = auth.uid()
      )
    )
  )
  with check (
    bucket_id = 'medical-files'
    and (
      public.is_super_admin()
      or (
        public.current_role() = 'doctor'
        and (storage.foldername(name))[1] = public.current_hospital_id()::text
        and owner = auth.uid()
      )
    )
  );

drop policy if exists medical_files_delete on storage.objects;
create policy medical_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'medical-files'
    and (
      public.is_super_admin()
      or (
        public.current_role() = 'doctor'
        and (storage.foldername(name))[1] = public.current_hospital_id()::text
        and owner = auth.uid()
      )
    )
  );

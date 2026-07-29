-- ProMediCare AI — clinical write ownership (audit 0026)
--
-- Gaps left after 0013/0020:
-- 1. consultation_notes insert/update required can_access_appointment(), which
--    is true for ANY same-hospital staff. A doctor could therefore insert a note
--    under their own doctor_id on a colleague's appointment, satisfy the unique
--    index, forge the medical record, and mark the visit completed.
-- 2. predictions_update still allowed the creating patient (or any staff with
--    patient access, including reception) to PATCH risk/status/review fields,
--    so a patient could dismiss an urgent screening from the doctor queue.
-- 3. Appointment completion only checked that *some* note existed, not that it
--    belonged to the assigned clinician, and any same-hospital staff could flip
--    status to in_progress/completed via PostgREST.

-- ---------------------------------------------------------------------------
-- consultation_notes: only the assigned appointment doctor may write
-- ---------------------------------------------------------------------------
drop policy if exists notes_insert on public.consultation_notes;
create policy notes_insert on public.consultation_notes for insert to authenticated
  with check (
    public.current_role() = 'doctor'
    and doctor_id = public.current_doctor_id()
    and exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and a.doctor_id = public.current_doctor_id()
        and a.deleted_at is null
    )
  );

drop policy if exists notes_update on public.consultation_notes;
create policy notes_update on public.consultation_notes for update to authenticated
  using (
    public.current_role() = 'doctor'
    and doctor_id = public.current_doctor_id()
    and exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and a.doctor_id = public.current_doctor_id()
        and a.deleted_at is null
    )
  )
  with check (
    public.current_role() = 'doctor'
    and doctor_id = public.current_doctor_id()
    and exists (
      select 1
      from public.appointments a
      where a.id = appointment_id
        and a.doctor_id = public.current_doctor_id()
        and a.deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- medical_attachments: appointment-linked rows must belong to the writer
-- ---------------------------------------------------------------------------
drop policy if exists attachments_insert on public.medical_attachments;
create policy attachments_insert on public.medical_attachments for insert to authenticated
  with check (
    public.current_role() = 'doctor'
    and hospital_id = public.current_hospital_id()
    and public.can_access_patient(patient_id)
    and (
      appointment_id is null
      or exists (
        select 1
        from public.appointments a
        where a.id = appointment_id
          and a.doctor_id = public.current_doctor_id()
          and a.deleted_at is null
      )
    )
  );

-- ---------------------------------------------------------------------------
-- predictions: only clinical reviewers may update (matches reviewPrediction /
-- ensureClinicalSummary). Patients retain insert + select of their own rows.
-- ---------------------------------------------------------------------------
drop policy if exists predictions_update on public.predictions;
create policy predictions_update on public.predictions for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_role() in ('doctor', 'hospital_admin')
      and (patient_id is null or public.can_access_patient(patient_id))
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.current_role() in ('doctor', 'hospital_admin')
      and (patient_id is null or public.can_access_patient(patient_id))
    )
  );

-- ---------------------------------------------------------------------------
-- Completing / starting a visit: assigned doctor only; note must match them
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_completed_has_note()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Trusted backend (migrations / service role) has no JWT: skip actor checks.
  if auth.uid() is not null
     and not public.is_super_admin()
     and new.status is distinct from old.status
     and new.status in ('in_progress', 'completed') then
    if public.current_doctor_id() is distinct from new.doctor_id then
      raise exception 'Only the assigned doctor can start or complete this appointment';
    end if;
  end if;

  if new.status = 'completed' and (old.status is distinct from 'completed') then
    if not exists (
      select 1 from public.consultation_notes n
      where n.appointment_id = new.id
        and n.deleted_at is null
        and n.doctor_id = new.doctor_id
    ) then
      raise exception 'Consultation notes from the assigned doctor are required before completing an appointment';
    end if;
  end if;
  return new;
end;
$$;

-- ProMediCare AI — RLS hardening (audit 0020)
--
-- The Supabase anon key is public and every client can call PostgREST directly,
-- so RLS — not server-action guards — is the real security boundary. This
-- migration closes several policies that allowed cross-tenant reads or let a
-- patient bypass the `book_appointment` RPC by writing appointment rows
-- directly. It also adds soft-delete filters so archived rows stop surfacing.

-- ---------------------------------------------------------------------------
-- doctor_availability: no longer world-readable by every authenticated user.
-- Managers (super admin, hospital admin, the owning doctor) keep full read;
-- everyone else may only read schedules for active, non-deleted doctors, which
-- is what the (cross-hospital) booking flow needs. Soft-deleted / deactivated
-- doctors' schedules are no longer exposed.
-- ---------------------------------------------------------------------------
drop policy if exists availability_select on public.doctor_availability;
create policy availability_select on public.doctor_availability for select to authenticated
  using (
    public.can_manage_doctor(doctor_id)
    or exists (
      select 1 from public.doctors d
      where d.id = doctor_availability.doctor_id
        and d.is_active
        and d.deleted_at is null
    )
  );

-- ---------------------------------------------------------------------------
-- appointments: force patients through the transactional book_appointment RPC
-- (SECURITY DEFINER, so it still works) and stop them from self-confirming,
-- reassigning the doctor/hospital/department, or moving another patient's row.
-- ---------------------------------------------------------------------------
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert to authenticated
  with check (public.is_super_admin()
              or (public.is_staff() and hospital_id = public.current_hospital_id()));

-- Patients keep UPDATE (cancel / reschedule) but a trigger constrains which
-- columns they may touch; staff/doctor/super_admin branches are unchanged.
drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments for update to authenticated
  using (public.is_super_admin()
         or (public.is_staff() and hospital_id = public.current_hospital_id())
         or patient_id = public.current_patient_id()
         or doctor_id = public.current_doctor_id())
  with check (public.is_super_admin()
         or (public.is_staff() and hospital_id = public.current_hospital_id())
         or patient_id = public.current_patient_id()
         or doctor_id = public.current_doctor_id());

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

  -- Patients may only leave the status unchanged (reschedule) or cancel it.
  if (new.status is distinct from old.status) and (new.status <> 'cancelled') then
    raise exception 'Patients can only cancel an appointment';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_patient_appointment_update on public.appointments;
create trigger guard_patient_appointment_update
  before update on public.appointments
  for each row execute function public.guard_patient_appointment_update();

-- ---------------------------------------------------------------------------
-- notifications: direct INSERT is limited to notifying yourself. Cross-user
-- notifications must go through create_notification() (SECURITY DEFINER).
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated
  with check (recipient_id = auth.uid());

-- ---------------------------------------------------------------------------
-- predictions: tie the row to its creator and a patient the creator can access
-- (stops staff writing screenings for arbitrary patients).
-- ---------------------------------------------------------------------------
drop policy if exists predictions_insert on public.predictions;
create policy predictions_insert on public.predictions for insert to authenticated
  with check (
    created_by = auth.uid()
    and (patient_id is null or public.can_access_patient(patient_id))
  );

-- ---------------------------------------------------------------------------
-- storage: keep clinical files away from front-desk (receptionist) staff.
-- Read is limited to super admins, same-hospital doctors / hospital admins,
-- and the patient who owns the file.
-- ---------------------------------------------------------------------------
drop policy if exists medical_files_select on storage.objects;
create policy medical_files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'medical-files'
    and (
      public.is_super_admin()
      or (
        public.current_role() in ('doctor', 'hospital_admin')
        and (storage.foldername(name))[1] = public.current_hospital_id()::text
      )
      or exists (
        select 1 from public.patients p
        where p.id::text = (storage.foldername(name))[2]
          and p.profile_id = auth.uid()
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Soft-delete filters: stop archived rows from surfacing to their tenants.
-- ---------------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = auth.uid()
    or public.is_super_admin()
    or (public.is_staff() and hospital_id is not null
        and hospital_id = public.current_hospital_id() and deleted_at is null)
  );

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      public.is_staff()
      and hospital_id is not null
      and hospital_id = public.current_hospital_id()
      and deleted_at is null
    )
    or public.can_access_patient(id)
  );

drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments for select to authenticated
  using (
    public.is_super_admin()
    or (public.is_staff() and hospital_id = public.current_hospital_id()
        and deleted_at is null)
    or exists (
      select 1 from public.appointments a
      where a.department_id = departments.id
        and a.patient_id = public.current_patient_id()
    )
  );

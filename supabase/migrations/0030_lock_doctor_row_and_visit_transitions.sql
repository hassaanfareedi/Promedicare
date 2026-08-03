-- ProMediCare AI — doctor row ownership + visit transition integrity (audit 0030)
--
-- Gaps left after 0004/0005/0020 (RLS is the real boundary; the anon key is public):
-- 1. doctors_update used can_manage_doctor(), which returns true for the owning
--    clinician. A doctor could PostgREST-PATCH hospital_id / profile_id /
--    is_active / specialty / department and self-transfer or rebind identity.
--    Availability management correctly uses can_manage_doctor; the doctors ROW
--    itself must be admin-managed (matches every app write path).
-- 2. Staff (receptionist / doctor / hospital_admin) could PATCH
--    appointments.deleted_at. The overlap exclusion only covers deleted_at IS
--    NULL rows, so soft-delete frees the doctor slot while hiding the visit
--    (PR #7 only closed the patient path).
-- 3. notes_delete allowed the assigned doctor to hard-DELETE consultation_notes
--    after completion — permanent destruction of the medical record the
--    completion gate required. App flows never hard-delete notes.
-- 4. No staff status machine: pending/confirmed could jump to in_progress and
--    skip check-in fee capture; completed/cancelled/no_show could be rewound.
--    UI only offers checked_in→in_progress and treats terminal statuses as final.
-- 5. patients_update used can_access_patient(), whose appointment branch grants
--    write access to staff at ANY hospital that ever booked the patient — so
--    Hospital B staff could rewrite Hospital A's master demographics (PHI).

-- ---------------------------------------------------------------------------
-- doctors: only hospital / platform admins may update the clinical row
-- ---------------------------------------------------------------------------
drop policy if exists doctors_update on public.doctors;
create policy doctors_update on public.doctors for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_hospital_admin()
      and hospital_id = public.current_hospital_id()
    )
  )
  with check (
    public.is_super_admin()
    or (
      public.is_hospital_admin()
      and hospital_id = public.current_hospital_id()
    )
  );

-- Freeze tenancy / identity columns for JWT callers (hospital admins included).
-- Super admin and service-role (auth.uid() is null) may still transfer/rebind.
create or replace function public.guard_doctor_identity_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if (new.profile_id is distinct from old.profile_id)
     or (new.hospital_id is distinct from old.hospital_id) then
    raise exception 'Doctor account link and hospital assignment cannot be changed this way';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_doctor_identity_change on public.doctors;
create trigger guard_doctor_identity_change
  before update on public.doctors
  for each row execute function public.guard_doctor_identity_change();

revoke execute on function public.guard_doctor_identity_change() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- appointments: soft-delete is not a staff cancel path (frees overlap slot)
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_soft_delete()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'Appointments cannot be soft-deleted this way; cancel the visit instead';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_soft_delete on public.appointments;
create trigger guard_appointment_soft_delete
  before update on public.appointments
  for each row execute function public.guard_appointment_soft_delete();

revoke execute on function public.guard_appointment_soft_delete() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- appointments: enforce the operational status machine (matches UI)
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_status_transition()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_allowed boolean := false;
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;
  if new.status is not distinct from old.status then return new; end if;

  -- Terminal visits are immutable for JWT callers.
  if old.status in ('completed', 'cancelled', 'no_show') then
    raise exception 'Terminal appointment status cannot be changed';
  end if;

  v_allowed := case old.status
    when 'pending' then new.status in ('confirmed', 'cancelled', 'no_show')
    when 'confirmed' then new.status in ('checked_in', 'cancelled', 'no_show')
    when 'checked_in' then new.status in ('in_progress', 'cancelled', 'no_show')
    -- Mid-visit: only complete (cancel/no-show would drop the row out of the
    -- overlap exclusion while clinical work may still be in flight).
    when 'in_progress' then new.status = 'completed'
    else false
  end;

  if not v_allowed then
    raise exception 'Invalid appointment status transition from % to %', old.status, new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_status_transition on public.appointments;
create trigger guard_appointment_status_transition
  before update of status on public.appointments
  for each row execute function public.guard_appointment_status_transition();

revoke execute on function public.guard_appointment_status_transition() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- consultation_notes: hard DELETE is super-admin only (retain medical record)
-- ---------------------------------------------------------------------------
drop policy if exists notes_delete on public.consultation_notes;
create policy notes_delete on public.consultation_notes for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- patients: staff may only update charts owned by their hospital
-- ---------------------------------------------------------------------------
drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients for update to authenticated
  using (
    public.is_super_admin()
    or profile_id = auth.uid()
    or (
      public.is_staff()
      and hospital_id is not null
      and hospital_id = public.current_hospital_id()
      and deleted_at is null
    )
  )
  with check (
    public.is_super_admin()
    or profile_id = auth.uid()
    or (
      public.is_staff()
      and hospital_id is not null
      and hospital_id = public.current_hospital_id()
      and deleted_at is null
    )
  );

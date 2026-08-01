-- ProMediCare AI — lock patient identity + visit parties (audit 0028)
--
-- Gaps left after 0020 (RLS is the real boundary; the anon key is public):
-- 1. patients_update allowed any same-hospital staff to PATCH profile_id /
--    hospital_id. Binding profile_id to an attacker uid makes current_patient_id()
--    resolve to the victim chart (PHI takeover); nulling it locks the owner out.
-- 2. appointments_update let any same-hospital staff rewrite doctor_id /
--    patient_id / hospital_id / department_id, defeating assigned-doctor clinical
--    ownership and swapping visit parties without an audit trail.
-- 3. appointments_insert allowed staff to create rows already in checked_in /
--    in_progress / completed, skipping fee capture and the note-required
--    completion trigger (BEFORE UPDATE OF status only).
-- 4. predictions_insert claimed to stop staff writing for arbitrary patients but
--    only required can_access_patient(), which every same-hospital staff passes.

-- ---------------------------------------------------------------------------
-- patients: identity columns are immutable for JWT callers
-- ---------------------------------------------------------------------------
create or replace function public.guard_patient_identity_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Trusted backend (migrations / service role) has no JWT: skip.
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if (new.profile_id is distinct from old.profile_id)
     or (new.hospital_id is distinct from old.hospital_id) then
    raise exception 'Patient account link and hospital assignment cannot be changed this way';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_patient_identity_change on public.patients;
create trigger guard_patient_identity_change
  before update on public.patients
  for each row execute function public.guard_patient_identity_change();

revoke execute on function public.guard_patient_identity_change() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- appointments: party columns immutable after insert; insert status limited
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_party_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if (new.hospital_id is distinct from old.hospital_id)
     or (new.doctor_id is distinct from old.doctor_id)
     or (new.patient_id is distinct from old.patient_id)
     or (new.department_id is distinct from old.department_id) then
    raise exception 'Appointment hospital, doctor, patient, or department cannot be reassigned this way';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_party_change on public.appointments;
create trigger guard_appointment_party_change
  before update on public.appointments
  for each row execute function public.guard_appointment_party_change();

revoke execute on function public.guard_appointment_party_change() from anon, authenticated;

create or replace function public.guard_appointment_insert_status()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  -- Staff booking / walk-in paths only create pending or confirmed visits.
  -- Terminal and mid-visit statuses must be reached via UPDATE so fee / note
  -- gates and assigned-doctor checks can run.
  if new.status not in ('pending', 'confirmed') then
    raise exception 'New appointments must be created as pending or confirmed';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_insert_status on public.appointments;
create trigger guard_appointment_insert_status
  before insert on public.appointments
  for each row execute function public.guard_appointment_insert_status();

revoke execute on function public.guard_appointment_insert_status() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- predictions: only the owning patient (or super admin) may insert
-- ---------------------------------------------------------------------------
drop policy if exists predictions_insert on public.predictions;
create policy predictions_insert on public.predictions for insert to authenticated
  with check (
    created_by = auth.uid()
    and (
      public.is_super_admin()
      or patient_id = public.current_patient_id()
    )
  );

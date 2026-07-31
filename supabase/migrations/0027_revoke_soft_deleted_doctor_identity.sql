-- ProMediCare AI — revoke soft-deleted doctor identity
--
-- current_doctor_id() and can_manage_doctor() ignored doctors.deleted_at.
-- After demoteToPatient / assignRole(receptionist) / assignHospitalAdmin soft-
-- deletes a doctor row, the former clinician retained SECURITY DEFINER identity:
--   * appointments_update still matched doctor_id = current_doctor_id()
--   * patient appointment guard skipped them (they are not the patient)
--   * can_manage_doctor(self) still authorized availability / doctors updates
--     (including clearing deleted_at to self-resurrect)
-- Soft-delete is the retirement signal; helpers must honor it.

create or replace function public.current_doctor_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id
  from public.doctors
  where profile_id = auth.uid()
    and deleted_at is null;
$$;

create or replace function public.current_patient_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id
  from public.patients
  where profile_id = auth.uid()
    and deleted_at is null;
$$;

create or replace function public.can_manage_doctor(p_doctor uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_profile uuid;
  v_hospital uuid;
begin
  if p_doctor is null then return false; end if;
  if public.is_super_admin() then return true; end if;

  select profile_id, hospital_id into v_profile, v_hospital
  from public.doctors
  where id = p_doctor
    and deleted_at is null;

  if not found then return false; end if;
  if v_profile = auth.uid() then return true; end if;
  if public.is_hospital_admin() and v_hospital = public.current_hospital_id() then
    return true;
  end if;
  return false;
end;
$$;

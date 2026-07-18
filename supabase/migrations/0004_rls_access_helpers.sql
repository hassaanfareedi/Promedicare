-- ProMediCare AI — access-check helpers (SECURITY DEFINER) + privilege guard

-- true if current user may read a given patient row
create or replace function public.can_access_patient(p_patient uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_profile uuid;
  v_hospital uuid;
begin
  if p_patient is null then return false; end if;
  if public.is_super_admin() then return true; end if;

  select profile_id, hospital_id into v_profile, v_hospital
  from public.patients where id = p_patient;

  if v_profile is not null and v_profile = auth.uid() then
    return true;
  end if;

  if public.is_staff() then
    if v_hospital is not null and v_hospital = public.current_hospital_id() then
      return true;
    end if;
    if exists (
      select 1 from public.appointments a
      where a.patient_id = p_patient and a.hospital_id = public.current_hospital_id()
    ) then
      return true;
    end if;
  end if;

  return false;
end;
$$;

-- true if current user may manage a given doctor row (and its availability)
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
  from public.doctors where id = p_doctor;

  if v_profile = auth.uid() then return true; end if;
  if public.is_hospital_admin() and v_hospital = public.current_hospital_id() then
    return true;
  end if;
  return false;
end;
$$;

-- true if current user may access a given appointment (and its notes)
create or replace function public.can_access_appointment(p_appt uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_hospital uuid;
  v_patient uuid;
  v_doctor uuid;
begin
  if p_appt is null then return false; end if;
  if public.is_super_admin() then return true; end if;

  select hospital_id, patient_id, doctor_id into v_hospital, v_patient, v_doctor
  from public.appointments where id = p_appt;

  if public.is_staff() and v_hospital = public.current_hospital_id() then return true; end if;
  if v_patient = public.current_patient_id() then return true; end if;
  if v_doctor = public.current_doctor_id() then return true; end if;
  return false;
end;
$$;

-- prevent privilege escalation: only super admin (or trusted backend with no JWT)
-- may change role/hospital; hospital admin may set staff roles within their hospital
create or replace function public.guard_profile_privileged_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (new.role is distinct from old.role) or (new.hospital_id is distinct from old.hospital_id) then
    -- trusted backend context (migrations, service role, SQL editor)
    if auth.uid() is null then return new; end if;
    if public.is_super_admin() then return new; end if;
    if public.is_hospital_admin()
       and new.hospital_id = public.current_hospital_id()
       and new.role in ('doctor','receptionist')
       and old.role in ('patient','doctor','receptionist') then
      return new;
    end if;
    raise exception 'Not authorized to change role or hospital assignment';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_privileged_change on public.profiles;
create trigger guard_profile_privileged_change
  before update on public.profiles
  for each row execute function public.guard_profile_privileged_change();

-- ProMediCare AI — Schema v1: indexes, triggers, RLS helper functions

-- Indexes -------------------------------------------------------------------
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_hospital on public.profiles(hospital_id);
create index if not exists idx_departments_hospital on public.departments(hospital_id);
create index if not exists idx_doctors_hospital on public.doctors(hospital_id);
create index if not exists idx_doctors_department on public.doctors(department_id);
create index if not exists idx_doctors_specialty on public.doctors(specialty_id);
create index if not exists idx_patients_profile on public.patients(profile_id);
create index if not exists idx_patients_hospital on public.patients(hospital_id);
create index if not exists idx_patients_phone on public.patients(phone);
create index if not exists idx_patients_dob on public.patients(dob);
create index if not exists idx_availability_doctor on public.doctor_availability(doctor_id);
create index if not exists idx_predictions_patient on public.predictions(patient_id);
create index if not exists idx_predictions_created_by on public.predictions(created_by);
create index if not exists idx_predictions_status on public.predictions(status);
create index if not exists idx_predictions_hospital on public.predictions(hospital_id);
create index if not exists idx_appointments_hospital on public.appointments(hospital_id);
create index if not exists idx_appointments_patient on public.appointments(patient_id);
create index if not exists idx_appointments_doctor on public.appointments(doctor_id);
create index if not exists idx_appointments_start on public.appointments(scheduled_start);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_notes_appointment on public.consultation_notes(appointment_id);
create index if not exists idx_notes_patient on public.consultation_notes(patient_id);
create index if not exists idx_notifications_recipient on public.notifications(recipient_id, read_at);
create index if not exists idx_audit_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_entity on public.audit_logs(entity_type, entity_id);

-- updated_at triggers -------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'hospitals','specialties','profiles','departments','doctors','patients',
    'doctor_availability','predictions','appointments','consultation_notes','notifications'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',
      t
    );
  end loop;
end $$;

-- new-user -> profile -------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS helper functions (SECURITY DEFINER so they bypass RLS internally) ------
create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_hospital_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select hospital_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_hospital_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'hospital_admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('doctor','receptionist','hospital_admin','super_admin')
                   from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_patient_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.patients where profile_id = auth.uid();
$$;

create or replace function public.current_doctor_id()
returns uuid
language sql stable security definer set search_path = public as $$
  select id from public.doctors where profile_id = auth.uid();
$$;

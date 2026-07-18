-- ProMediCare AI — enable RLS + per-role policies on every table

alter table public.hospitals            enable row level security;
alter table public.specialties          enable row level security;
alter table public.profiles             enable row level security;
alter table public.departments          enable row level security;
alter table public.doctors              enable row level security;
alter table public.patients             enable row level security;
alter table public.doctor_availability  enable row level security;
alter table public.predictions          enable row level security;
alter table public.appointments         enable row level security;
alter table public.consultation_notes   enable row level security;
alter table public.notifications        enable row level security;
alter table public.audit_logs           enable row level security;

-- hospitals -----------------------------------------------------------------
drop policy if exists hospitals_select on public.hospitals;
create policy hospitals_select on public.hospitals for select to anon, authenticated
  using (deleted_at is null and (is_active or public.is_super_admin() or id = public.current_hospital_id()));
drop policy if exists hospitals_insert on public.hospitals;
create policy hospitals_insert on public.hospitals for insert to authenticated
  with check (public.is_super_admin());
drop policy if exists hospitals_update on public.hospitals;
create policy hospitals_update on public.hospitals for update to authenticated
  using (public.is_super_admin() or (public.is_hospital_admin() and id = public.current_hospital_id()))
  with check (public.is_super_admin() or (public.is_hospital_admin() and id = public.current_hospital_id()));
drop policy if exists hospitals_delete on public.hospitals;
create policy hospitals_delete on public.hospitals for delete to authenticated
  using (public.is_super_admin());

-- specialties ---------------------------------------------------------------
drop policy if exists specialties_select on public.specialties;
create policy specialties_select on public.specialties for select to anon, authenticated using (true);
drop policy if exists specialties_insert on public.specialties;
create policy specialties_insert on public.specialties for insert to authenticated with check (public.is_super_admin());
drop policy if exists specialties_update on public.specialties;
create policy specialties_update on public.specialties for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
drop policy if exists specialties_delete on public.specialties;
create policy specialties_delete on public.specialties for delete to authenticated using (public.is_super_admin());

-- profiles ------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin()
         or (public.is_staff() and hospital_id is not null and hospital_id = public.current_hospital_id()));
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = auth.uid() or public.is_super_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_super_admin()
         or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()))
  with check (id = auth.uid() or public.is_super_admin()
         or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated using (public.is_super_admin());

-- departments ---------------------------------------------------------------
drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments for select to authenticated
  using (deleted_at is null or public.is_super_admin()
         or (public.is_staff() and hospital_id = public.current_hospital_id()));
drop policy if exists departments_insert on public.departments;
create policy departments_insert on public.departments for insert to authenticated
  with check (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));
drop policy if exists departments_update on public.departments;
create policy departments_update on public.departments for update to authenticated
  using (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()))
  with check (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));
drop policy if exists departments_delete on public.departments;
create policy departments_delete on public.departments for delete to authenticated
  using (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));

-- doctors -------------------------------------------------------------------
drop policy if exists doctors_select on public.doctors;
create policy doctors_select on public.doctors for select to authenticated
  using (deleted_at is null or public.is_super_admin()
         or (public.is_staff() and hospital_id = public.current_hospital_id()));
drop policy if exists doctors_insert on public.doctors;
create policy doctors_insert on public.doctors for insert to authenticated
  with check (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));
drop policy if exists doctors_update on public.doctors;
create policy doctors_update on public.doctors for update to authenticated
  using (public.can_manage_doctor(id)) with check (public.can_manage_doctor(id));
drop policy if exists doctors_delete on public.doctors;
create policy doctors_delete on public.doctors for delete to authenticated
  using (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));

-- patients ------------------------------------------------------------------
drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients for select to authenticated
  using (public.can_access_patient(id));
drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert to authenticated
  with check (profile_id = auth.uid() or public.is_super_admin()
              or (public.is_staff() and hospital_id = public.current_hospital_id()));
drop policy if exists patients_update on public.patients;
create policy patients_update on public.patients for update to authenticated
  using (public.can_access_patient(id)) with check (public.can_access_patient(id));
drop policy if exists patients_delete on public.patients;
create policy patients_delete on public.patients for delete to authenticated
  using (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));

-- doctor_availability -------------------------------------------------------
drop policy if exists availability_select on public.doctor_availability;
create policy availability_select on public.doctor_availability for select to authenticated using (true);
drop policy if exists availability_insert on public.doctor_availability;
create policy availability_insert on public.doctor_availability for insert to authenticated
  with check (public.can_manage_doctor(doctor_id));
drop policy if exists availability_update on public.doctor_availability;
create policy availability_update on public.doctor_availability for update to authenticated
  using (public.can_manage_doctor(doctor_id)) with check (public.can_manage_doctor(doctor_id));
drop policy if exists availability_delete on public.doctor_availability;
create policy availability_delete on public.doctor_availability for delete to authenticated
  using (public.can_manage_doctor(doctor_id));

-- predictions ---------------------------------------------------------------
drop policy if exists predictions_select on public.predictions;
create policy predictions_select on public.predictions for select to authenticated
  using (created_by = auth.uid() or public.can_access_patient(patient_id));
drop policy if exists predictions_insert on public.predictions;
create policy predictions_insert on public.predictions for insert to authenticated
  with check (created_by = auth.uid() or public.is_staff() or public.is_super_admin());
drop policy if exists predictions_update on public.predictions;
create policy predictions_update on public.predictions for update to authenticated
  using (created_by = auth.uid() or public.can_access_patient(patient_id))
  with check (created_by = auth.uid() or public.can_access_patient(patient_id));
drop policy if exists predictions_delete on public.predictions;
create policy predictions_delete on public.predictions for delete to authenticated using (public.is_super_admin());

-- appointments --------------------------------------------------------------
drop policy if exists appointments_select on public.appointments;
create policy appointments_select on public.appointments for select to authenticated
  using (public.is_super_admin()
         or (public.is_staff() and hospital_id = public.current_hospital_id())
         or patient_id = public.current_patient_id()
         or doctor_id = public.current_doctor_id());
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert to authenticated
  with check (public.is_super_admin()
              or (public.is_staff() and hospital_id = public.current_hospital_id())
              or patient_id = public.current_patient_id());
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
drop policy if exists appointments_delete on public.appointments;
create policy appointments_delete on public.appointments for delete to authenticated
  using (public.is_super_admin() or (public.is_hospital_admin() and hospital_id = public.current_hospital_id()));

-- consultation_notes --------------------------------------------------------
drop policy if exists notes_select on public.consultation_notes;
create policy notes_select on public.consultation_notes for select to authenticated
  using (public.can_access_appointment(appointment_id));
drop policy if exists notes_insert on public.consultation_notes;
create policy notes_insert on public.consultation_notes for insert to authenticated
  with check (public.is_staff() and public.can_access_appointment(appointment_id));
drop policy if exists notes_update on public.consultation_notes;
create policy notes_update on public.consultation_notes for update to authenticated
  using (public.is_staff() and public.can_access_appointment(appointment_id))
  with check (public.is_staff() and public.can_access_appointment(appointment_id));
drop policy if exists notes_delete on public.consultation_notes;
create policy notes_delete on public.consultation_notes for delete to authenticated
  using (public.is_super_admin() or doctor_id = public.current_doctor_id());

-- notifications -------------------------------------------------------------
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications for select to authenticated
  using (recipient_id = auth.uid() or public.is_super_admin());
drop policy if exists notifications_insert on public.notifications;
create policy notifications_insert on public.notifications for insert to authenticated
  with check (public.is_staff() or public.is_super_admin() or recipient_id = auth.uid());
drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_id = auth.uid() or public.is_super_admin())
  with check (recipient_id = auth.uid() or public.is_super_admin());
drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications for delete to authenticated
  using (recipient_id = auth.uid() or public.is_super_admin());

-- audit_logs (read-only to super admin; writes only via SECURITY DEFINER) ----
drop policy if exists audit_select on public.audit_logs;
create policy audit_select on public.audit_logs for select to authenticated using (public.is_super_admin());

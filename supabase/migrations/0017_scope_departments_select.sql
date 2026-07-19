-- ProMediCare AI — scope departments_select to the caller's hospital.
-- The prior policy's leading `deleted_at is null` branch made every live
-- department readable by any authenticated user (cross-hospital leak). Scope
-- reads to super admins, same-hospital staff, and patients viewing a department
-- tied to one of their own appointments (needed for appointment display).
-- Booking is unaffected: doctor_directory is security_invoker = false and
-- bypasses this policy.

drop policy if exists departments_select on public.departments;
create policy departments_select on public.departments for select to authenticated
  using (
    public.is_super_admin()
    or (public.is_staff() and hospital_id = public.current_hospital_id())
    or exists (
      select 1 from public.appointments a
      where a.department_id = departments.id
        and a.patient_id = public.current_patient_id()
    )
  );

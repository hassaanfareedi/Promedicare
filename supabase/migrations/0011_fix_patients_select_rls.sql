-- Fix onboarding INSERT … RETURNING: patients_select previously only used
-- can_access_patient(id), which re-queries patients and cannot see the
-- in-flight row. Allow owners to select by profile_id so RETURNING works;
-- staff/super-admin access still goes through can_access_patient.

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
  for select to authenticated
  using (
    profile_id = auth.uid()
    or public.can_access_patient(id)
  );

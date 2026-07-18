-- Fix walk-in INSERT … RETURNING for staff: walk-ins have null profile_id,
-- so the owner-only SELECT branch does not apply. Allow staff to select rows
-- in their hospital by hospital_id (available on the RETURNING row without
-- re-querying). Aligns SELECT with the existing patients_insert staff rule.

drop policy if exists patients_select on public.patients;
create policy patients_select on public.patients
  for select to authenticated
  using (
    profile_id = auth.uid()
    or (
      public.is_staff()
      and hospital_id is not null
      and hospital_id = public.current_hospital_id()
    )
    or public.can_access_patient(id)
  );

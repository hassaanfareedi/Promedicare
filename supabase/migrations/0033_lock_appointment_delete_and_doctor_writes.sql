-- ProMediCare AI — appointment hard-delete + doctor peer-write lock (audit 0033)
--
-- 1. appointments_delete allowed hospital admins to hard-DELETE visits. Notes and
--    fee rows reference appointments ON DELETE CASCADE, so one PostgREST DELETE
--    permanently destroys the medical note and collected payment for that visit.
--    App flows never hard-delete appointments (cancel / soft-delete conventions).
--    Match patients_delete / doctors_delete / notes_delete: super-admin only.
--
-- 2. appointments_update / appointments_insert used is_staff(), which includes
--    doctors. That made the assigned-doctor branch redundant for same-hospital
--    clinicians: Doctor A could cancel, reschedule, or start Doctor B's visits
--    (and insert confirmed rows onto a peer's calendar). App status updates
--    already reject non-owned doctor writes; RLS must match.

-- ---------------------------------------------------------------------------
-- appointments: hard DELETE is super-admin only (retain clinical + billing)
-- ---------------------------------------------------------------------------
drop policy if exists appointments_delete on public.appointments;
create policy appointments_delete on public.appointments for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- appointments: doctors write only their own caseload; desk/admin keep hospital
-- ---------------------------------------------------------------------------
drop policy if exists appointments_insert on public.appointments;
create policy appointments_insert on public.appointments for insert to authenticated
  with check (
    public.is_super_admin()
    or (
      public.current_role() in ('hospital_admin', 'receptionist')
      and hospital_id = public.current_hospital_id()
    )
    or (
      public.current_role() = 'doctor'
      and hospital_id = public.current_hospital_id()
      and doctor_id = public.current_doctor_id()
    )
  );

drop policy if exists appointments_update on public.appointments;
create policy appointments_update on public.appointments for update to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_role() in ('hospital_admin', 'receptionist')
      and hospital_id = public.current_hospital_id()
    )
    or doctor_id = public.current_doctor_id()
    or patient_id = public.current_patient_id()
  )
  with check (
    public.is_super_admin()
    or (
      public.current_role() in ('hospital_admin', 'receptionist')
      and hospital_id = public.current_hospital_id()
    )
    or doctor_id = public.current_doctor_id()
    or patient_id = public.current_patient_id()
  );

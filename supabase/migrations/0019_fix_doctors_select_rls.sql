-- ProMediCare AI — scope doctors_select to the caller's hospital / own row.
-- The prior policy's leading `deleted_at is null` OR-branch made every live
-- doctor readable by any authenticated user (cross-hospital leak). That let
-- hospital admins see other hospitals' doctors in /admin/doctors while
-- setDoctorActive correctly refused updates → "Doctor not found in your hospital."
-- Booking is unaffected: doctor_directory is security_invoker = false.

drop policy if exists doctors_select on public.doctors;
create policy doctors_select on public.doctors for select to authenticated
  using (
    public.is_super_admin()
    or (
      deleted_at is null
      and (
        profile_id = auth.uid()
        or (public.is_staff() and hospital_id = public.current_hospital_id())
      )
    )
  );

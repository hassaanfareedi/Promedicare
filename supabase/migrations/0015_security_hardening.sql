-- ProMediCare AI — security hardening
--   1. Scope notification RPCs to prevent spoofing/spam to arbitrary users.
--   2. Restrict self-service profile inserts to the patient role.
--   3. FORCE row level security on all application tables (defense in depth).

-- 1. Notification scoping ----------------------------------------------------

-- true if the caller is allowed to send a notification to p_recipient.
-- Legit flows: staff notify anyone connected to their hospital (fellow staff,
-- or the patient/doctor of an in-hospital appointment, or the author of an
-- accessible prediction); a patient may notify a doctor they share an
-- appointment with; anyone may notify themselves; super admins may notify all.
create or replace function public.can_notify(p_recipient uuid)
returns boolean
language plpgsql stable security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if p_recipient is null or v_uid is null then return false; end if;
  if p_recipient = v_uid then return true; end if;
  if public.is_super_admin() then return true; end if;

  if public.is_staff() then
    -- fellow staff/admin in the same hospital
    if exists (
      select 1 from public.profiles pr
      where pr.id = p_recipient
        and pr.hospital_id is not null
        and pr.hospital_id = public.current_hospital_id()
    ) then return true; end if;

    -- patient or doctor tied to an appointment in the caller's hospital
    if exists (
      select 1 from public.appointments a
      left join public.patients pt on pt.id = a.patient_id
      left join public.doctors d on d.id = a.doctor_id
      where a.hospital_id = public.current_hospital_id()
        and (pt.profile_id = p_recipient or d.profile_id = p_recipient)
    ) then return true; end if;

    -- author of a prediction the caller is permitted to access
    if exists (
      select 1 from public.predictions pr
      where pr.created_by = p_recipient
        and public.can_access_patient(pr.patient_id)
    ) then return true; end if;

    return false;
  end if;

  -- Non-staff (patient): may notify a doctor they share an appointment with.
  return exists (
    select 1 from public.appointments a
    join public.patients pt on pt.id = a.patient_id
    join public.doctors d on d.id = a.doctor_id
    where pt.profile_id = v_uid
      and d.profile_id = p_recipient
  );
end;
$$;

revoke execute on function public.can_notify(uuid) from anon;
grant execute on function public.can_notify(uuid) to authenticated;

-- Gate create_notification on the relationship check above.
create or replace function public.create_notification(
  p_recipient uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_data jsonb default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not public.can_notify(p_recipient) then
    raise exception 'Not authorized to notify this recipient';
  end if;
  insert into public.notifications (recipient_id, type, title, body, data)
  values (p_recipient, p_type, p_title, p_body, p_data)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_notification(uuid, public.notification_type, text, text, jsonb) from anon;
grant execute on function public.create_notification(uuid, public.notification_type, text, text, jsonb) to authenticated;

-- Booking-staff fan-out: only notify for a real appointment that belongs to
-- p_hospital and to which the caller is a party (its patient, in-hospital
-- staff, or super admin). Blocks cross-hospital spam via arbitrary arguments.
create or replace function public.notify_hospital_booking_staff(
  p_hospital uuid,
  p_appointment uuid,
  p_title text default 'New appointment request',
  p_body text default 'A patient has requested an appointment.'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.appointments a
    left join public.patients pt on pt.id = a.patient_id
    where a.id = p_appointment
      and a.hospital_id = p_hospital
      and (
        pt.profile_id = auth.uid()
        or public.is_super_admin()
        or (public.is_staff() and a.hospital_id = public.current_hospital_id())
      )
  ) then
    raise exception 'Not authorized to notify for this appointment';
  end if;

  insert into public.notifications (recipient_id, type, title, body, data)
  select
    p.id,
    'appointment_booked'::public.notification_type,
    p_title,
    p_body,
    jsonb_build_object('appointmentId', p_appointment)
  from public.profiles p
  where p.hospital_id = p_hospital
    and p.role in ('hospital_admin', 'receptionist')
    and p.deleted_at is null;
end;
$$;

revoke execute on function public.notify_hospital_booking_staff(uuid, uuid, text, text) from anon;
grant execute on function public.notify_hospital_booking_staff(uuid, uuid, text, text) to authenticated;

-- 2. Restrict self-service profile inserts to the patient role ---------------
-- A user may only insert their OWN profile row and only as 'patient'. Staff
-- roles are set by the promote/assign flows (guarded by the privilege trigger)
-- or by a super admin. Prevents seeding a privileged role at insert time.
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (
    public.is_super_admin()
    or (id = auth.uid() and role = 'patient')
  );

-- 3. FORCE row level security on all application tables ----------------------
-- App connections use the anon/authenticated roles (already subject to RLS);
-- FORCE additionally subjects the table-owner role. SECURITY DEFINER helpers
-- run as a BYPASSRLS role, so they are unaffected.
alter table public.hospitals            force row level security;
alter table public.specialties          force row level security;
alter table public.profiles             force row level security;
alter table public.departments          force row level security;
alter table public.doctors              force row level security;
alter table public.patients             force row level security;
alter table public.doctor_availability  force row level security;
alter table public.predictions          force row level security;
alter table public.appointments         force row level security;
alter table public.consultation_notes   force row level security;
alter table public.notifications        force row level security;
alter table public.audit_logs           force row level security;
alter table public.appointment_payments force row level security;
alter table public.medical_attachments  force row level security;

-- ProMediCare AI — fix doctor_availability SELECT for patients (booking slots)
--
-- Migration 0020 tightened availability_select to only expose schedules for
-- active, non-deleted doctors via EXISTS against public.doctors. Migration
-- 0019 then scoped doctors_select so patients cannot read doctors rows.
-- Postgres applies RLS inside that EXISTS, so patients always got zero
-- availability rows and the booking Time step looked empty even when
-- schedules existed. Booking listing still worked via doctor_directory
-- (security_invoker = false).
--
-- Fix: SECURITY DEFINER helper that checks bookable doctors without
-- depending on doctors RLS (same pattern as can_manage_doctor).

create or replace function public.is_bookable_doctor(p_doctor uuid)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.doctors d
    where d.id = p_doctor
      and d.is_active
      and d.deleted_at is null
  );
$$;

drop policy if exists availability_select on public.doctor_availability;
create policy availability_select on public.doctor_availability for select to authenticated
  using (
    public.can_manage_doctor(doctor_id)
    or public.is_bookable_doctor(doctor_id)
  );

-- Backfill Mon–Fri 09:00–17:00 (30-min slots) for active doctors who have
-- never had any availability row configured (idempotent).
insert into public.doctor_availability (
  doctor_id, weekday, start_time, end_time, slot_minutes, is_active
)
select
  d.id,
  w.weekday,
  time '09:00',
  time '17:00',
  30,
  true
from public.doctors d
cross join (values (1), (2), (3), (4), (5)) as w(weekday)
where d.is_active
  and d.deleted_at is null
  and not exists (
    select 1 from public.doctor_availability a
    where a.doctor_id = d.id
  );

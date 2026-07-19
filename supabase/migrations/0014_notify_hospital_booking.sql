-- Notify hospital admin + reception staff when a patient books (SECURITY DEFINER;
-- patients cannot SELECT other staff profiles under RLS).

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

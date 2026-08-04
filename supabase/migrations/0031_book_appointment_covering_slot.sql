-- ProMediCare AI — book against the covering availability window (audit 0031)
--
-- book_appointment (and the mirrored reception paths) previously picked
-- min(slot_minutes) across ALL active availability rows for the doctor.
-- UI slot generation uses each row's own slot_minutes, so a 60-minute morning
-- block was stored as a 15-minute visit whenever any shorter block existed.
-- The gist exclusion then only protected the shortened range, allowing a
-- second booking into the remainder of the clinical slot (real overlap).
--
-- Fix: resolve duration from the availability row that covers p_start in the
-- hospital timezone (weekday + window + slot alignment), and reject starts
-- that are not covered.

create or replace function public.book_appointment(
  p_hospital uuid,
  p_doctor uuid,
  p_department uuid default null,
  p_start timestamptz default null,
  p_reason text default null,
  p_prediction uuid default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_patient uuid;
  v_slot int;
  v_end timestamptz;
  v_id uuid;
  v_doc_hospital uuid;
  v_tz text;
  v_local timestamp;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_start is null then raise exception 'Choose a time slot'; end if;
  if p_start <= now() then raise exception 'Choose a future time slot'; end if;

  v_patient := public.current_patient_id();
  if v_patient is null then raise exception 'Complete your patient profile first'; end if;

  select hospital_id into v_doc_hospital
  from public.doctors
  where id = p_doctor and is_active and deleted_at is null;

  if v_doc_hospital is null or v_doc_hospital <> p_hospital then
    raise exception 'Selected doctor is not available at this hospital';
  end if;

  if p_prediction is not null then
    if not exists (
      select 1 from public.predictions pr
      where pr.id = p_prediction
        and (pr.patient_id = v_patient or pr.created_by = auth.uid())
    ) then
      raise exception 'Invalid prediction reference';
    end if;
  end if;

  select coalesce(nullif(trim(h.timezone), ''), 'UTC') into v_tz
  from public.hospitals h
  where h.id = p_hospital;

  if v_tz is null then
    raise exception 'Hospital not found';
  end if;

  v_local := p_start at time zone v_tz;

  select da.slot_minutes into v_slot
  from public.doctor_availability da
  where da.doctor_id = p_doctor
    and da.is_active
    and da.weekday = extract(dow from v_local)::int
    and v_local::time >= da.start_time
    and v_local::time < da.end_time
    and mod(
      (extract(epoch from (v_local::time - da.start_time)) / 60)::int,
      greatest(da.slot_minutes, 1)
    ) = 0
    and v_local::time + make_interval(mins => greatest(da.slot_minutes, 1))
        <= da.end_time
  order by da.slot_minutes desc
  limit 1;

  if v_slot is null then
    raise exception 'Selected time is outside this doctor''s availability';
  end if;

  v_end := p_start + make_interval(mins => v_slot);

  insert into public.appointments (
    hospital_id, patient_id, doctor_id, department_id, prediction_id,
    scheduled_start, scheduled_end, status, source, reason, created_by
  )
  values (
    p_hospital, v_patient, p_doctor, p_department, p_prediction,
    p_start, v_end, 'pending', 'online', p_reason, auth.uid()
  )
  returning id into v_id;

  return v_id;
exception
  when exclusion_violation then
    raise exception 'That time slot was just taken. Please choose another.';
end;
$$;

grant execute on function public.book_appointment(uuid, uuid, uuid, timestamptz, text, uuid) to authenticated;
revoke execute on function public.book_appointment(uuid, uuid, uuid, timestamptz, text, uuid) from anon;

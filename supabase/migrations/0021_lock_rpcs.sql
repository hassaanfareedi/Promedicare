-- ProMediCare AI — RPC hardening (audit 0021)

-- ---------------------------------------------------------------------------
-- log_audit: previously any authenticated user could call it to forge audit
-- rows. Audit writes now go through the service-role client only (see
-- src/lib/audit.ts), so revoke direct execute from authenticated/anon.
-- ---------------------------------------------------------------------------
revoke execute on function public.log_audit(text, text, text, jsonb) from anon;
revoke execute on function public.log_audit(text, text, text, jsonb) from authenticated;

-- ---------------------------------------------------------------------------
-- book_appointment: reject a p_prediction that does not belong to the booking
-- patient (or was not created by the caller), so a patient can't attach an
-- unrelated screening to their appointment.
-- ---------------------------------------------------------------------------
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

  select slot_minutes into v_slot
  from public.doctor_availability
  where doctor_id = p_doctor and is_active
  order by slot_minutes asc
  limit 1;

  v_slot := coalesce(v_slot, 30);
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

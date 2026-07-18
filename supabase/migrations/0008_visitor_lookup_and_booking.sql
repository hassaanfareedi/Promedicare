-- ProMediCare AI — public visitor lookup + transactional appointment booking

-- Public, minimal-exposure patient lookup. Requires patient code PLUS a second
-- factor (DOB or registered phone). Returns null unless the second factor
-- matches, preventing record disclosure from a guessable id alone.
create or replace function public.visitor_lookup(
  p_code text,
  p_dob date default null,
  p_phone text default null
)
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_patient public.patients%rowtype;
  v_verified boolean := false;
  v_hospital text;
  v_next jsonb;
  v_history jsonb;
begin
  if p_code is null or (p_dob is null and (p_phone is null or length(btrim(p_phone)) = 0)) then
    return null;
  end if;

  select * into v_patient
  from public.patients
  where upper(patient_code) = upper(btrim(p_code)) and deleted_at is null
  limit 1;

  if not found then
    return null;
  end if;

  if p_dob is not null and v_patient.dob is not null and v_patient.dob = p_dob then
    v_verified := true;
  end if;

  if not v_verified and p_phone is not null and v_patient.phone is not null
     and regexp_replace(v_patient.phone, '\D', '', 'g') = regexp_replace(p_phone, '\D', '', 'g')
     and length(regexp_replace(p_phone, '\D', '', 'g')) >= 7 then
    v_verified := true;
  end if;

  if not v_verified then
    return null;
  end if;

  select h.name into v_hospital from public.hospitals h where h.id = v_patient.hospital_id;

  select jsonb_build_object(
           'date', a.scheduled_start,
           'status', a.status,
           'doctor', pr.full_name,
           'department', d.name
         )
    into v_next
  from public.appointments a
  left join public.doctors doc on doc.id = a.doctor_id
  left join public.profiles pr on pr.id = doc.profile_id
  left join public.departments d on d.id = a.department_id
  where a.patient_id = v_patient.id
    and a.deleted_at is null
    and a.scheduled_start >= now()
    and a.status in ('pending', 'confirmed', 'checked_in')
  order by a.scheduled_start asc
  limit 1;

  select coalesce(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    into v_history
  from (
    select a.scheduled_start as date, a.status, pr.full_name as doctor
    from public.appointments a
    left join public.doctors doc on doc.id = a.doctor_id
    left join public.profiles pr on pr.id = doc.profile_id
    where a.patient_id = v_patient.id and a.deleted_at is null
    order by a.scheduled_start desc
    limit 5
  ) t;

  return jsonb_build_object(
    'patientCode', v_patient.patient_code,
    'fullName', v_patient.full_name,
    'registeredHospital', v_hospital,
    'nextAppointment', v_next,
    'recentHistory', v_history
  );
end;
$$;

grant execute on function public.visitor_lookup(text, date, text) to anon, authenticated;

-- Transactional booking. Runs as definer but authorizes internally: the patient
-- is derived from the caller's identity, and the DB exclusion constraint plus
-- this function guarantee no double-booking of a doctor's slot.
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

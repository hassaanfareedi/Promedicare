-- ProMediCare AI — public visitor lookup: show only completed visits in history.
-- A just-booked (pending/confirmed) appointment is upcoming, not a visit record;
-- it already surfaces under nextAppointment. "Recent history" must reflect only
-- visits that actually happened, so filter it to status = 'completed'.

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
    where a.patient_id = v_patient.id
      and a.deleted_at is null
      and a.status = 'completed'
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

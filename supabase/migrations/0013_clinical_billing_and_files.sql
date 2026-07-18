-- ProMediCare AI — clinical notes hardening, fees, medical attachments, visitor history

-- ---------------------------------------------------------------------------
-- consultation_notes: one note per visit + structured medications
-- ---------------------------------------------------------------------------
alter table public.consultation_notes
  add column if not exists medications jsonb;

create unique index if not exists consultation_notes_appointment_uidx
  on public.consultation_notes (appointment_id)
  where deleted_at is null;

-- Doctor-only clinical writes (tighten from generic staff)
drop policy if exists notes_insert on public.consultation_notes;
create policy notes_insert on public.consultation_notes for insert to authenticated
  with check (
    public.current_role() = 'doctor'
    and doctor_id = public.current_doctor_id()
    and public.can_access_appointment(appointment_id)
  );

drop policy if exists notes_update on public.consultation_notes;
create policy notes_update on public.consultation_notes for update to authenticated
  using (
    public.current_role() = 'doctor'
    and doctor_id = public.current_doctor_id()
    and public.can_access_appointment(appointment_id)
  )
  with check (
    public.current_role() = 'doctor'
    and doctor_id = public.current_doctor_id()
    and public.can_access_appointment(appointment_id)
  );

-- Gate: cannot mark appointment completed without a consultation note
create or replace function public.guard_appointment_completed_has_note()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    if not exists (
      select 1 from public.consultation_notes n
      where n.appointment_id = new.id and n.deleted_at is null
    ) then
      raise exception 'Consultation notes are required before completing an appointment';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_appointment_completed_has_note on public.appointments;
create trigger guard_appointment_completed_has_note
  before update of status on public.appointments
  for each row execute function public.guard_appointment_completed_has_note();

-- ---------------------------------------------------------------------------
-- appointment_payments (fee capture at check-in)
-- ---------------------------------------------------------------------------
create table if not exists public.appointment_payments (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'PKR',
  method text not null default 'cash' check (method in ('cash', 'card', 'other')),
  notes text,
  collected_by uuid references public.profiles(id) on delete set null,
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_hospital_collected
  on public.appointment_payments (hospital_id, collected_at desc);
create index if not exists idx_payments_appointment
  on public.appointment_payments (appointment_id);
create unique index if not exists appointment_payments_appointment_uidx
  on public.appointment_payments (appointment_id);

alter table public.appointment_payments enable row level security;

drop policy if exists payments_select on public.appointment_payments;
create policy payments_select on public.appointment_payments for select to authenticated
  using (
    public.is_super_admin()
    or (
      public.is_staff()
      and hospital_id = public.current_hospital_id()
    )
  );

drop policy if exists payments_insert on public.appointment_payments;
create policy payments_insert on public.appointment_payments for insert to authenticated
  with check (
    public.current_role() in ('receptionist', 'hospital_admin')
    and hospital_id = public.current_hospital_id()
    and public.can_access_appointment(appointment_id)
  );

drop policy if exists payments_update on public.appointment_payments;
create policy payments_update on public.appointment_payments for update to authenticated
  using (
    public.current_role() in ('hospital_admin', 'super_admin')
    and (public.is_super_admin() or hospital_id = public.current_hospital_id())
  )
  with check (
    public.current_role() in ('hospital_admin', 'super_admin')
    and (public.is_super_admin() or hospital_id = public.current_hospital_id())
  );

drop policy if exists payments_delete on public.appointment_payments;
create policy payments_delete on public.appointment_payments for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- medical_attachments
-- ---------------------------------------------------------------------------
create table if not exists public.medical_attachments (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  appointment_id uuid references public.appointments(id) on delete set null,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  file_path text not null,
  file_name text not null,
  mime_type text,
  kind text not null default 'other' check (kind in ('lab', 'imaging', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_attachments_patient
  on public.medical_attachments (patient_id)
  where deleted_at is null;
create index if not exists idx_attachments_appointment
  on public.medical_attachments (appointment_id)
  where deleted_at is null;

alter table public.medical_attachments enable row level security;

drop policy if exists attachments_select on public.medical_attachments;
create policy attachments_select on public.medical_attachments for select to authenticated
  using (
    deleted_at is null
    and public.can_access_patient(patient_id)
  );

drop policy if exists attachments_insert on public.medical_attachments;
create policy attachments_insert on public.medical_attachments for insert to authenticated
  with check (
    public.current_role() = 'doctor'
    and hospital_id = public.current_hospital_id()
    and public.can_access_patient(patient_id)
    and (appointment_id is null or public.can_access_appointment(appointment_id))
  );

drop policy if exists attachments_update on public.medical_attachments;
create policy attachments_update on public.medical_attachments for update to authenticated
  using (
    public.current_role() = 'doctor'
    and hospital_id = public.current_hospital_id()
    and public.can_access_patient(patient_id)
  )
  with check (
    public.current_role() = 'doctor'
    and hospital_id = public.current_hospital_id()
    and public.can_access_patient(patient_id)
  );

drop policy if exists attachments_delete on public.medical_attachments;
create policy attachments_delete on public.medical_attachments for delete to authenticated
  using (
    public.is_super_admin()
    or (
      public.current_role() = 'doctor'
      and hospital_id = public.current_hospital_id()
    )
  );

-- updated_at for new tables
drop trigger if exists set_updated_at on public.appointment_payments;
create trigger set_updated_at
  before update on public.appointment_payments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.medical_attachments;
create trigger set_updated_at
  before update on public.medical_attachments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Storage bucket: medical-files (private)
-- Path convention: {hospital_id}/{patient_id}/{appointment_id}/{filename}
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'medical-files',
  'medical-files',
  false,
  10485760,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists medical_files_select on storage.objects;
create policy medical_files_select on storage.objects for select to authenticated
  using (
    bucket_id = 'medical-files'
    and (
      public.is_super_admin()
      or (storage.foldername(name))[1] = public.current_hospital_id()::text
      or exists (
        select 1 from public.patients p
        where p.id::text = (storage.foldername(name))[2]
          and p.profile_id = auth.uid()
      )
    )
  );

drop policy if exists medical_files_insert on storage.objects;
create policy medical_files_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'medical-files'
    and public.current_role() = 'doctor'
    and (storage.foldername(name))[1] = public.current_hospital_id()::text
  );

drop policy if exists medical_files_update on storage.objects;
create policy medical_files_update on storage.objects for update to authenticated
  using (
    bucket_id = 'medical-files'
    and public.current_role() = 'doctor'
    and (storage.foldername(name))[1] = public.current_hospital_id()::text
  )
  with check (
    bucket_id = 'medical-files'
    and public.current_role() = 'doctor'
    and (storage.foldername(name))[1] = public.current_hospital_id()::text
  );

drop policy if exists medical_files_delete on storage.objects;
create policy medical_files_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'medical-files'
    and (
      public.is_super_admin()
      or (
        public.current_role() = 'doctor'
        and (storage.foldername(name))[1] = public.current_hospital_id()::text
      )
    )
  );

-- ---------------------------------------------------------------------------
-- visitor_lookup: history = past / terminal statuses only (no duplicate of next)
-- ---------------------------------------------------------------------------
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
  v_next_id uuid;
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

  select a.id,
         jsonb_build_object(
           'date', a.scheduled_start,
           'status', a.status,
           'doctor', pr.full_name,
           'department', d.name
         )
    into v_next_id, v_next
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
      and (v_next_id is null or a.id <> v_next_id)
      and (
        a.scheduled_start < now()
        or a.status in ('completed', 'cancelled', 'no_show')
      )
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

-- Normalize seed-style "Dr. …" doctor names so UI can prefix once
update public.profiles
set full_name = regexp_replace(btrim(full_name), '^(dr\.?\s*)+', '', 'i')
where role = 'doctor'
  and full_name ~* '^dr\.?\s+';

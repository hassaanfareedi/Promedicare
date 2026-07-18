-- ProMediCare AI — Schema v1: core tables
create extension if not exists btree_gist;

create sequence if not exists public.patient_code_seq start 100000;

-- hospitals -----------------------------------------------------------------
create table if not exists public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address text,
  city text,
  phone text,
  email text,
  logo_url text,
  timezone text not null default 'UTC',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- specialties (global catalog) ----------------------------------------------
create table if not exists public.specialties (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- profiles (1:1 with auth.users) --------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'patient',
  hospital_id uuid references public.hospitals(id) on delete set null,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- departments ---------------------------------------------------------------
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (hospital_id, name)
);

-- doctors -------------------------------------------------------------------
create table if not exists public.doctors (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  specialty_id uuid references public.specialties(id) on delete set null,
  license_number text,
  bio text,
  consultation_fee numeric(10,2),
  years_experience int,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- patients ------------------------------------------------------------------
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  patient_code text not null unique default ('PMC-' || lpad(nextval('public.patient_code_seq')::text, 6, '0')),
  full_name text not null,
  dob date,
  gender public.gender,
  blood_group text,
  phone text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- doctor availability -------------------------------------------------------
create table if not exists public.doctor_availability (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  slot_minutes int not null default 30,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

-- predictions (AI screening log) --------------------------------------------
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  hospital_id uuid references public.hospitals(id) on delete set null,
  input_symptoms jsonb not null default '[]',
  input_text text,
  model text not null,
  model_version text,
  raw_output jsonb,
  predicted_conditions jsonb not null default '[]',
  confidence numeric(5,4),
  risk_level public.risk_level not null,
  explanation text,
  recommended_specialty_id uuid references public.specialties(id) on delete set null,
  recommended_specialty_label text,
  status public.prediction_status not null default 'pending_review',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- appointments --------------------------------------------------------------
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  hospital_id uuid not null references public.hospitals(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  department_id uuid references public.departments(id) on delete set null,
  prediction_id uuid references public.predictions(id) on delete set null,
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null,
  status public.appointment_status not null default 'pending',
  source public.appointment_source not null default 'online',
  reason text,
  notes text,
  queue_number int,
  created_by uuid references public.profiles(id) on delete set null,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check (scheduled_end > scheduled_start)
);

-- prevent double-booking the same doctor for overlapping active appointments
alter table public.appointments drop constraint if exists appointments_no_overlap;
alter table public.appointments add constraint appointments_no_overlap
  exclude using gist (
    doctor_id with =,
    tstzrange(scheduled_start, scheduled_end) with &&
  )
  where (
    doctor_id is not null
    and deleted_at is null
    and status in ('pending', 'confirmed', 'checked_in', 'in_progress')
  );

-- consultation notes --------------------------------------------------------
create table if not exists public.consultation_notes (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid not null references public.appointments(id) on delete cascade,
  doctor_id uuid references public.doctors(id) on delete set null,
  patient_id uuid references public.patients(id) on delete cascade,
  subjective text,
  objective text,
  assessment text,
  plan text,
  diagnosis text,
  prescription text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- notifications -------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  data jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- audit logs ----------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

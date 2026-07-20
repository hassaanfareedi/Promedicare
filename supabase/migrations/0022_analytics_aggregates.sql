-- ProMediCare AI — analytics aggregates + composite indexes (audit 0022)
--
-- Dashboards previously pulled whole tables to the app and counted in JS. These
-- SECURITY INVOKER aggregate functions push the grouping into Postgres (and stay
-- RLS-scoped to the caller), and the composite indexes back the hot filters.

-- Composite indexes for the common filter/sort combinations.
create index if not exists idx_appointments_status_start
  on public.appointments (status, scheduled_start);
create index if not exists idx_appointments_hospital_start
  on public.appointments (hospital_id, scheduled_start);
create index if not exists idx_profiles_role_hospital
  on public.profiles (role, hospital_id);

-- Appointment counts grouped by status (RLS scopes rows to the caller).
create or replace function public.appointment_status_counts()
returns table(status public.appointment_status, count bigint)
language sql stable security invoker set search_path = public as $$
  select a.status, count(*)::bigint
  from public.appointments a
  where a.deleted_at is null
  group by a.status;
$$;

-- Screening counts grouped by risk level.
create or replace function public.prediction_risk_counts()
returns table(risk_level public.risk_level, count bigint)
language sql stable security invoker set search_path = public as $$
  select p.risk_level, count(*)::bigint
  from public.predictions p
  where p.deleted_at is null
  group by p.risk_level;
$$;

-- Profile counts grouped by role.
create or replace function public.profile_role_counts()
returns table(role public.user_role, count bigint)
language sql stable security invoker set search_path = public as $$
  select pr.role, count(*)::bigint
  from public.profiles pr
  where pr.deleted_at is null
  group by pr.role;
$$;

-- Appointment counts grouped by hospital.
create or replace function public.appointments_count_by_hospital()
returns table(hospital_id uuid, count bigint)
language sql stable security invoker set search_path = public as $$
  select a.hospital_id, count(*)::bigint
  from public.appointments a
  where a.deleted_at is null
  group by a.hospital_id;
$$;

-- Collected income grouped by hospital.
create or replace function public.payment_income_by_hospital()
returns table(hospital_id uuid, amount numeric)
language sql stable security invoker set search_path = public as $$
  select ap.hospital_id, coalesce(sum(ap.amount), 0)::numeric
  from public.appointment_payments ap
  group by ap.hospital_id;
$$;

grant execute on function public.appointment_status_counts() to authenticated;
grant execute on function public.prediction_risk_counts() to authenticated;
grant execute on function public.profile_role_counts() to authenticated;
grant execute on function public.appointments_count_by_hospital() to authenticated;
grant execute on function public.payment_income_by_hospital() to authenticated;

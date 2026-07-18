-- ProMediCare AI — Schema v1: enums + utility functions
-- Applied live via Supabase MCP. Kept here for version control.

-- Enums ---------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum (
    'patient', 'doctor', 'receptionist', 'hospital_admin', 'super_admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum (
    'pending', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_source as enum ('online', 'walk_in');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.risk_level as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.prediction_status as enum ('pending_review', 'reviewed', 'dismissed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender as enum ('male', 'female', 'other', 'prefer_not_to_say');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.notification_type as enum (
    'appointment_booked', 'appointment_confirmed', 'appointment_reminder',
    'appointment_cancelled', 'appointment_rescheduled', 'prediction_reviewed', 'system'
  );
exception when duplicate_object then null; end $$;

-- updated_at trigger --------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ProMediCare AI — insert tenancy + destruction / fee-identity gaps (audit 0032)
--
-- Gaps left after 0005/0013/0020 (RLS is the real boundary; the anon key is public):
-- 1. appointments_insert only checked hospital_id = current_hospital_id(). Staff
--    could attach a peer hospital's doctor_id (stealing overlap slots) or
--    patient_id (opening can_access_patient PHI via the appointment branch).
-- 2. patients_insert let staff set an arbitrary profile_id, planting a chart that
--    hijacks current_patient_id() for a victim who has not onboarded yet.
-- 3. consultation_notes UPDATE still allowed soft-delete (deleted_at). After hard
--    DELETE is locked, soft-delete still wipes the chart (app filters null) and
--    frees the partial unique index so notes can be rewritten post-completion.
-- 4. appointment_payments UPDATE did not freeze appointment_id / hospital_id, so
--    a hospital admin could rebind a collected fee onto an unpaid visit and
--    satisfy any EXISTS-based check-in gate.
-- 5. patients_delete / doctors_delete allowed hospital admins to hard-DELETE,
--    cascading away appointments/notes/predictions (or nulling doctor_id and
--    freeing overlap slots). App paths only soft-delete.
-- 6. Appointment schedule columns were unconstrained on UPDATE: shrinking
--    scheduled_end frees the overlap range while expanding can block a day.
--    App reschedule preserves duration and only moves pending/confirmed visits.

-- ---------------------------------------------------------------------------
-- appointments: doctor/patient must belong to the visit hospital on insert
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_insert_tenancy()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  -- Trusted backend (migrations / service role) has no JWT: skip.
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if new.doctor_id is not null then
    if not exists (
      select 1 from public.doctors d
      where d.id = new.doctor_id
        and d.hospital_id = new.hospital_id
        and d.deleted_at is null
    ) then
      raise exception 'Appointment doctor must belong to the appointment hospital';
    end if;
  end if;

  if public.is_staff() then
    -- Matches reception booking: existing patients must already be hospital-scoped.
    if not exists (
      select 1 from public.patients p
      where p.id = new.patient_id
        and p.hospital_id = new.hospital_id
        and p.deleted_at is null
    ) then
      raise exception 'Appointment patient must belong to the appointment hospital';
    end if;
  else
    -- Online book_appointment (SECURITY DEFINER) inserts as the patient; charts
    -- may still have null hospital_id. Never allow forging another patient's visit.
    if new.patient_id is distinct from public.current_patient_id() then
      raise exception 'Patients can only book appointments for themselves';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_insert_tenancy on public.appointments;
create trigger guard_appointment_insert_tenancy
  before insert on public.appointments
  for each row execute function public.guard_appointment_insert_tenancy();

revoke execute on function public.guard_appointment_insert_tenancy() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- appointments: preserve duration; only pre-visit rows may move
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_schedule_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if (new.scheduled_start is not distinct from old.scheduled_start)
     and (new.scheduled_end is not distinct from old.scheduled_end) then
    return new;
  end if;

  if old.status not in ('pending', 'confirmed') then
    raise exception 'Only pending or confirmed appointments can be rescheduled';
  end if;

  -- Reschedule must slide the window, not shrink/expand it (defeats overlap).
  if (new.scheduled_end - new.scheduled_start)
     is distinct from (old.scheduled_end - old.scheduled_start) then
    raise exception 'Appointment duration cannot be changed this way';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_schedule_change on public.appointments;
create trigger guard_appointment_schedule_change
  before update on public.appointments
  for each row execute function public.guard_appointment_schedule_change();

revoke execute on function public.guard_appointment_schedule_change() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- patients: staff walk-ins cannot bind an account on insert
-- ---------------------------------------------------------------------------
drop policy if exists patients_insert on public.patients;
create policy patients_insert on public.patients for insert to authenticated
  with check (
    public.is_super_admin()
    or profile_id = auth.uid()
    or (
      public.is_staff()
      and hospital_id = public.current_hospital_id()
      and profile_id is null
    )
  );

-- ---------------------------------------------------------------------------
-- patients / doctors: hard DELETE is super-admin only (retain clinical history)
-- ---------------------------------------------------------------------------
drop policy if exists patients_delete on public.patients;
create policy patients_delete on public.patients for delete to authenticated
  using (public.is_super_admin());

drop policy if exists doctors_delete on public.doctors;
create policy doctors_delete on public.doctors for delete to authenticated
  using (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- consultation_notes: soft-delete is not a clinical destroy path
-- ---------------------------------------------------------------------------
create or replace function public.guard_consultation_note_soft_delete()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if new.deleted_at is distinct from old.deleted_at then
    raise exception 'Consultation notes cannot be soft-deleted this way';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_consultation_note_soft_delete on public.consultation_notes;
create trigger guard_consultation_note_soft_delete
  before update on public.consultation_notes
  for each row execute function public.guard_consultation_note_soft_delete();

revoke execute on function public.guard_consultation_note_soft_delete() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- appointment_payments: freeze fee identity columns after insert
-- ---------------------------------------------------------------------------
create or replace function public.guard_payment_identity_change()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if (new.appointment_id is distinct from old.appointment_id)
     or (new.hospital_id is distinct from old.hospital_id) then
    raise exception 'Payment appointment and hospital cannot be reassigned';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_payment_identity_change on public.appointment_payments;
create trigger guard_payment_identity_change
  before update on public.appointment_payments
  for each row execute function public.guard_payment_identity_change();

revoke execute on function public.guard_payment_identity_change() from anon, authenticated;

-- ---------------------------------------------------------------------------
-- check-in: require a positive fee when the doctor charges one
-- (complements any EXISTS-only gate; blocks amount=0 placeholders)
-- ---------------------------------------------------------------------------
create or replace function public.guard_appointment_checkin_fee_amount()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_fee numeric(10, 2);
begin
  if auth.uid() is null then return new; end if;
  if public.is_super_admin() then return new; end if;

  if new.status = 'checked_in' and (old.status is distinct from 'checked_in') then
    select coalesce(d.consultation_fee, 0) into v_fee
    from public.doctors d
    where d.id = new.doctor_id;

    if coalesce(v_fee, 0) > 0 then
      if not exists (
        select 1 from public.appointment_payments p
        where p.appointment_id = new.id
          and p.amount > 0
      ) then
        raise exception 'A non-zero fee payment is required before check-in';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_appointment_checkin_fee_amount on public.appointments;
create trigger guard_appointment_checkin_fee_amount
  before update of status on public.appointments
  for each row execute function public.guard_appointment_checkin_fee_amount();

revoke execute on function public.guard_appointment_checkin_fee_amount() from anon, authenticated;

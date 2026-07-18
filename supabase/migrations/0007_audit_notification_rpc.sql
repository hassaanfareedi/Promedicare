-- ProMediCare AI — audit + notification write RPCs (SECURITY DEFINER)

-- Insert an audit row on behalf of the current user (audit_logs has no direct
-- INSERT policy, so writes must go through this definer function).
create or replace function public.log_audit(
  p_action text,
  p_entity_type text default null,
  p_entity_id text default null,
  p_metadata jsonb default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata);
end;
$$;

revoke execute on function public.log_audit(text, text, text, jsonb) from anon;
grant execute on function public.log_audit(text, text, text, jsonb) to authenticated;

-- Create a notification for a recipient (used when one user must notify another,
-- e.g. a patient booking notifies the assigned doctor).
create or replace function public.create_notification(
  p_recipient uuid,
  p_type public.notification_type,
  p_title text,
  p_body text default null,
  p_data jsonb default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  insert into public.notifications (recipient_id, type, title, body, data)
  values (p_recipient, p_type, p_title, p_body, p_data)
  returning id into v_id;
  return v_id;
end;
$$;

revoke execute on function public.create_notification(uuid, public.notification_type, text, text, jsonb) from anon;
grant execute on function public.create_notification(uuid, public.notification_type, text, text, jsonb) to authenticated;

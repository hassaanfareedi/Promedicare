-- ProMediCare AI — function hardening (advisor follow-up)

-- pin search_path on the updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- trigger-only functions should not be callable directly via PostgREST RPC
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.guard_profile_privileged_change() from anon, authenticated;

-- ProMediCare AI — fully lock log_audit (audit 0023)
--
-- Postgres grants EXECUTE on functions to PUBLIC by default, so revoking from
-- anon/authenticated in 0021 was not enough — both roles still inherited access
-- via PUBLIC. Revoke from PUBLIC so only the service role (used by the server's
-- audit writer) can execute it.
revoke execute on function public.log_audit(text, text, text, jsonb) from public;
revoke execute on function public.log_audit(text, text, text, jsonb) from anon;
revoke execute on function public.log_audit(text, text, text, jsonb) from authenticated;
grant execute on function public.log_audit(text, text, text, jsonb) to service_role;

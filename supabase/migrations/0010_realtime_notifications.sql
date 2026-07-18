-- ProMediCare AI — enable Realtime for in-app notifications
-- Adds the notifications table to the supabase_realtime publication so clients
-- can subscribe to inserts. RLS still governs which rows each client receives.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;

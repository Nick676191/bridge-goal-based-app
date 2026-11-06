-- PYN database fix: let the app reach the stage 1 tables.
--
-- Newer Supabase projects don't automatically let the app's logged-in users
-- reach new tables; each table needs a "grant" first. Without these, the app
-- gets "permission denied for table profiles". The row-level security rules
-- in the stage 1 file still decide which rows each person can read or change;
-- these grants only open the door for those rules to apply.
--
-- Safe to run more than once.

grant usage on schema public to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.goals to authenticated;
grant select, insert, delete on public.follows to authenticated;

grant execute on function public.username_available(text) to anon, authenticated;

-- Run this in Supabase SQL editor after 001_schema.sql

-- Allows a signed-in user to delete their own account.
-- Called via: supabase.rpc('delete_user')
create or replace function delete_user()
returns void
language plpgsql
security definer          -- runs with owner rights so it can delete from auth.users
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

-- Restrict: only the calling user can invoke this (no direct grants needed —
-- anon/authenticated roles can call any security-definer function, but the
-- body uses auth.uid() so it only ever deletes the caller).
revoke all on function delete_user() from anon;
grant execute on function delete_user() to authenticated;

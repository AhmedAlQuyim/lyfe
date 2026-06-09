-- LYFE App — calendar feed (iOS / Google subscription)
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)

-- ─── calendar_tokens ─────────────────────────────────────────────────────────
-- One secret feed token per user. The token is embedded in the public .ics feed
-- URL (which iOS / Google poll unauthenticated), so it must be unguessable and
-- is revocable by regenerating it.
create table if not exists calendar_tokens (
  user_id     uuid        primary key references auth.users(id) on delete cascade,
  token       text        not null unique,
  created_at  timestamptz not null default now()
);

alter table calendar_tokens enable row level security;
drop policy if exists "calendar_tokens: user owns" on calendar_tokens;
create policy "calendar_tokens: user owns" on calendar_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── calendar_feed(token) ────────────────────────────────────────────────────
-- Returns the calendar events for whoever owns the given token. SECURITY DEFINER
-- so the unauthenticated feed endpoint (anon key) can read the right user's rows
-- WITHOUT a service-role key — the function only ever returns rows for the user
-- the token maps to. Completed tasks are excluded; non-recurring tasks are
-- limited to a rolling 60-day-back window; recurring tasks are always included
-- (their RRULE carries them forward).
create or replace function calendar_feed(p_token text)
returns table (
  id                    text,
  title                 text,
  icon                  text,
  due_date              text,
  start_time            text,
  end_time              text,
  notes                 text,
  priority              text,
  recurring             boolean,
  recurrence_frequency  text
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.title, t.icon, t.due_date, t.start_time, t.end_time,
         t.notes, t.priority, t.recurring, t.recurrence_frequency
  from tasks t
  join calendar_tokens c on c.user_id = t.user_id
  where c.token = p_token
    and t.completed = false
    and (t.recurring = true or t.due_date >= to_char(current_date - 60, 'YYYY-MM-DD'))
$$;

revoke all on function calendar_feed(text) from public;
grant execute on function calendar_feed(text) to anon, authenticated;

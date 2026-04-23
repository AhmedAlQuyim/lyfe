-- LYFE App — workout templates + programs persistence
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)

-- ─── workout_templates ───────────────────────────────────────────────────────
create table if not exists workout_templates (
  id                text        not null,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  name              text        not null,
  type              text        not null default 'strength',
  icon              text        not null default '💪',
  duration_minutes  int         not null default 0,
  exercises         jsonb       not null default '[]',
  created_at        timestamptz not null default now(),
  primary key (id, user_id)
);

alter table workout_templates enable row level security;
create policy "workout_templates: user owns" on workout_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── workout_programs ────────────────────────────────────────────────────────
create table if not exists workout_programs (
  id                    text        not null,
  user_id               uuid        not null references auth.users(id) on delete cascade,
  name                  text        not null,
  start_date            text        not null,
  end_date              text        not null,
  schedule              jsonb       not null default '[]',
  generated_workout_ids jsonb       not null default '[]',
  created_at            timestamptz not null default now(),
  primary key (id, user_id)
);

alter table workout_programs enable row level security;
create policy "workout_programs: user owns" on workout_programs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

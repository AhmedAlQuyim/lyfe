-- LYFE App — initial schema
-- Run this in the Supabase SQL editor (Dashboard → SQL editor → New query)

-- ─── tasks ───────────────────────────────────────────────────────────────────
create table if not exists tasks (
  id                    text      not null,
  user_id               uuid      not null references auth.users(id) on delete cascade,
  title                 text      not null,
  icon                  text      not null default '📋',
  color                 text      not null default '#7C6EF8',
  priority              text      not null default 'medium',
  due_date              text      not null,
  start_time            text,
  end_time              text,
  completed             boolean   not null default false,
  recurring             boolean   not null default false,
  recurrence_frequency  text,
  goal_id               text,
  notes                 text,
  created_at            timestamptz not null default now(),
  primary key (id, user_id)
);

alter table tasks enable row level security;
create policy "tasks: user owns" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── goals ───────────────────────────────────────────────────────────────────
create table if not exists goals (
  id              text      not null,
  user_id         uuid      not null references auth.users(id) on delete cascade,
  title           text      not null,
  icon            text      not null default '🎯',
  color           text      not null default '#7C6EF8',
  description     text      not null default '',
  target_date     text      not null,
  status          text      not null default 'active',
  streak_current  int       not null default 0,
  streak_longest  int       not null default 0,
  created_at      timestamptz not null default now(),
  primary key (id, user_id)
);

alter table goals enable row level security;
create policy "goals: user owns" on goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── milestones ──────────────────────────────────────────────────────────────
-- id is unique within a goal, not globally unique
create table if not exists milestones (
  id            text    not null,
  goal_id       text    not null,
  user_id       uuid    not null references auth.users(id) on delete cascade,
  title         text    not null,
  completed     boolean not null default false,
  completed_at  text,
  due_by        text,
  sort_order    int     not null default 0,
  primary key (id, goal_id, user_id)
);

alter table milestones enable row level security;
create policy "milestones: user owns" on milestones
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── workouts ────────────────────────────────────────────────────────────────
create table if not exists workouts (
  id                text      not null,
  user_id           uuid      not null references auth.users(id) on delete cascade,
  title             text      not null,
  date              text      not null,
  start_time        text,
  duration_minutes  int       not null default 0,
  notes             text,
  type              text      not null default 'strength',
  icon              text      not null default '💪',
  program_id        text,
  completed         boolean,
  skipped           boolean,
  pushed_from       text,
  created_at        timestamptz not null default now(),
  primary key (id, user_id)
);

alter table workouts enable row level security;
create policy "workouts: user owns" on workouts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── exercises ───────────────────────────────────────────────────────────────
-- id is unique within a workout, not globally unique
create table if not exists exercises (
  id                text    not null,
  workout_id        text    not null,
  user_id           uuid    not null references auth.users(id) on delete cascade,
  name              text    not null,
  sets              int,
  reps              int,
  weight_kg         numeric,
  duration_seconds  int,
  sort_order        int     not null default 0,
  primary key (id, workout_id, user_id)
);

alter table exercises enable row level security;
create policy "exercises: user owns" on exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── ideas ───────────────────────────────────────────────────────────────────
create table if not exists ideas (
  id            text      not null,
  user_id       uuid      not null references auth.users(id) on delete cascade,
  title         text      not null,
  description   text,
  icon          text      not null default '💡',
  color         text      not null default '#7C6EF8',
  category      text      not null default 'other',
  created_at    timestamptz not null default now(),
  converted_to  text,
  converted_id  text,
  primary key (id, user_id)
);

alter table ideas enable row level security;
create policy "ideas: user owns" on ideas
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── supplies ────────────────────────────────────────────────────────────────
create table if not exists supplies (
  id                    text      not null,
  user_id               uuid      not null references auth.users(id) on delete cascade,
  title                 text      not null,
  icon                  text      not null default '📦',
  color                 text      not null default '#7C6EF8',
  category              text      not null default 'other',
  period                text,
  last_refilled         text,
  needed                boolean   not null default false,
  notes                 text,
  converted_to_task_id  text,
  created_at            timestamptz not null default now(),
  primary key (id, user_id)
);

alter table supplies enable row level security;
create policy "supplies: user owns" on supplies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── task_streak ─────────────────────────────────────────────────────────────
create table if not exists task_streak (
  user_id              uuid  primary key references auth.users(id) on delete cascade,
  current_streak       int   not null default 0,
  longest_streak       int   not null default 0,
  last_completed_date  text
);

alter table task_streak enable row level security;
create policy "task_streak: user owns" on task_streak
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

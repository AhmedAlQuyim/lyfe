/**
 * Supabase data access layer.
 * All functions are fire-and-forget from the store's perspective —
 * local state is updated optimistically before these resolve.
 */
import { createClient } from '../supabase/client';
import type {
  Task, Goal, Milestone, Workout, Exercise,
  Idea, SupplyItem, TaskStreakState,
  WorkoutTemplate, WorkoutProgram,
} from '../mock-data';

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function getUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// ─── Row ↔ App mappers ────────────────────────────────────────────────────────

function taskToRow(t: Task, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    title: t.title,
    icon: t.icon,
    color: t.color,
    priority: t.priority,
    due_date: t.dueDate,
    start_time: t.startTime ?? null,
    end_time: t.endTime ?? null,
    completed: t.completed,
    recurring: t.recurring,
    recurrence_frequency: t.recurrenceFrequency ?? null,
    goal_id: t.goalId ?? null,
    notes: t.notes ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    icon: r.icon,
    color: r.color,
    priority: r.priority,
    dueDate: r.due_date,
    startTime: r.start_time ?? undefined,
    endTime: r.end_time ?? undefined,
    completed: r.completed,
    recurring: r.recurring,
    recurrenceFrequency: r.recurrence_frequency ?? undefined,
    goalId: r.goal_id ?? undefined,
    notes: r.notes ?? undefined,
  };
}

function goalToRow(g: Goal, userId: string) {
  return {
    id: g.id,
    user_id: userId,
    title: g.title,
    icon: g.icon,
    color: g.color,
    description: g.description,
    target_date: g.targetDate,
    status: g.status,
    streak_current: g.streak.current,
    streak_longest: g.streak.longest,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToGoal(r: any, milestones: Milestone[]): Goal {
  return {
    id: r.id,
    title: r.title,
    icon: r.icon,
    color: r.color,
    description: r.description,
    targetDate: r.target_date,
    status: r.status,
    streak: { current: r.streak_current, longest: r.streak_longest },
    milestones,
  };
}

function milestoneToRow(m: Milestone, goalId: string, userId: string, sortOrder: number) {
  return {
    id: m.id,
    goal_id: goalId,
    user_id: userId,
    title: m.title,
    completed: m.completed,
    completed_at: m.completedAt ?? null,
    due_by: m.dueBy ?? null,
    sort_order: sortOrder,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToMilestone(r: any): Milestone {
  return {
    id: r.id,
    title: r.title,
    completed: r.completed,
    completedAt: r.completed_at ?? undefined,
    dueBy: r.due_by ?? undefined,
  };
}

function workoutToRow(w: Workout, userId: string) {
  return {
    id: w.id,
    user_id: userId,
    title: w.title,
    date: w.date,
    start_time: w.startTime ?? null,
    duration_minutes: w.durationMinutes,
    notes: w.notes ?? null,
    type: w.type,
    icon: w.icon,
    program_id: w.programId ?? null,
    completed: w.completed ?? null,
    skipped: w.skipped ?? null,
    pushed_from: w.pushedFrom ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToWorkout(r: any, exercises: Exercise[]): Workout {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    startTime: r.start_time ?? undefined,
    durationMinutes: r.duration_minutes,
    notes: r.notes ?? undefined,
    type: r.type,
    icon: r.icon,
    programId: r.program_id ?? undefined,
    completed: r.completed ?? undefined,
    skipped: r.skipped ?? undefined,
    pushedFrom: r.pushed_from ?? undefined,
    exercises,
  };
}

function exerciseToRow(e: Exercise, workoutId: string, userId: string, sortOrder: number) {
  return {
    id: e.id,
    workout_id: workoutId,
    user_id: userId,
    name: e.name,
    sets: e.sets ?? null,
    reps: e.reps ?? null,
    weight_kg: e.weightKg ?? null,
    duration_seconds: e.durationSeconds ?? null,
    sort_order: sortOrder,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToExercise(r: any): Exercise {
  return {
    id: r.id,
    name: r.name,
    sets: r.sets ?? undefined,
    reps: r.reps ?? undefined,
    weightKg: r.weight_kg ?? undefined,
    durationSeconds: r.duration_seconds ?? undefined,
  };
}

function ideaToRow(i: Idea, userId: string) {
  return {
    id: i.id,
    user_id: userId,
    title: i.title,
    description: i.description ?? null,
    icon: i.icon,
    color: i.color,
    category: i.category,
    created_at: i.createdAt,
    converted_to: i.convertedTo ?? null,
    converted_id: i.convertedId ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToIdea(r: any): Idea {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    icon: r.icon,
    color: r.color,
    category: r.category,
    createdAt: r.created_at,
    convertedTo: r.converted_to ?? undefined,
    convertedId: r.converted_id ?? undefined,
  };
}

function supplyToRow(s: SupplyItem, userId: string) {
  return {
    id: s.id,
    user_id: userId,
    title: s.title,
    icon: s.icon,
    color: s.color,
    category: s.category,
    period: s.period ?? null,
    last_refilled: s.lastRefilled ?? null,
    needed: s.needed,
    notes: s.notes ?? null,
    converted_to_task_id: s.convertedToTaskId ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToSupply(r: any): SupplyItem {
  return {
    id: r.id,
    title: r.title,
    icon: r.icon,
    color: r.color,
    category: r.category,
    period: r.period ?? null,
    lastRefilled: r.last_refilled ?? null,
    needed: r.needed,
    notes: r.notes ?? undefined,
    convertedToTaskId: r.converted_to_task_id ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToStreak(r: any): TaskStreakState {
  return {
    current: r.current_streak,
    longest: r.longest_streak,
    lastCompletedDate: r.last_completed_date ?? null,
  };
}

// ─── WorkoutTemplate mappers ─────────────────────────────────────────────────

function templateToRow(t: WorkoutTemplate, userId: string) {
  return {
    id: t.id,
    user_id: userId,
    name: t.name,
    type: t.type,
    icon: t.icon,
    duration_minutes: t.durationMinutes,
    exercises: t.exercises,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToTemplate(r: any): WorkoutTemplate {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    icon: r.icon,
    durationMinutes: r.duration_minutes,
    exercises: r.exercises ?? [],
  };
}

// ─── WorkoutProgram mappers ───────────────────────────────────────────────────

function programToRow(p: WorkoutProgram, userId: string) {
  return {
    id: p.id,
    user_id: userId,
    name: p.name,
    start_date: p.startDate,
    end_date: p.endDate,
    schedule: p.schedule,
    generated_workout_ids: p.generatedWorkoutIds,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToProgram(r: any): WorkoutProgram {
  return {
    id: r.id,
    name: r.name,
    startDate: r.start_date,
    endDate: r.end_date,
    schedule: r.schedule ?? [],
    generatedWorkoutIds: r.generated_workout_ids ?? [],
  };
}

// ─── Fetch all ───────────────────────────────────────────────────────────────

export async function fetchAllData() {
  const user = await getUser();
  if (!user) return null;

  const supabase = createClient();
  const uid = user.id;

  const [
    { data: tasksRows },
    { data: goalsRows },
    { data: milestonesRows },
    { data: workoutsRows },
    { data: exercisesRows },
    { data: ideasRows },
    { data: suppliesRows },
    { data: streakRow },
    { data: templatesRows, error: templatesError },
    { data: programsRows,  error: programsError  },
  ] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('goals').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('milestones').select('*').eq('user_id', uid).order('sort_order'),
    supabase.from('workouts').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('exercises').select('*').eq('user_id', uid).order('sort_order'),
    supabase.from('ideas').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('supplies').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    supabase.from('task_streak').select('*').eq('user_id', uid).maybeSingle(),
    supabase.from('workout_templates').select('*').eq('user_id', uid).order('created_at'),
    supabase.from('workout_programs').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
  ]);

  if (templatesError) console.error('[LYFE] workout_templates fetch error:', templatesError);
  if (programsError)  console.error('[LYFE] workout_programs fetch error:',  programsError);

  const goals: Goal[] = (goalsRows ?? []).map(g =>
    rowToGoal(
      g,
      (milestonesRows ?? [])
        .filter(m => m.goal_id === g.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(rowToMilestone),
    )
  );

  const workouts: Workout[] = (workoutsRows ?? []).map(w =>
    rowToWorkout(
      w,
      (exercisesRows ?? [])
        .filter(e => e.workout_id === w.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(rowToExercise),
    )
  );

  return {
    tasks: (tasksRows ?? []).map(rowToTask),
    goals,
    workouts,
    ideas: (ideasRows ?? []).map(rowToIdea),
    supplies: (suppliesRows ?? []).map(rowToSupply),
    taskStreak: streakRow ? rowToStreak(streakRow) : null,
    templates: (templatesRows ?? []).map(rowToTemplate),
    programs: (programsRows ?? []).map(rowToProgram),
  };
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function dbUpsertTask(task: Task) {
  const user = await getUser();
  if (!user) return;
  await createClient().from('tasks').upsert(taskToRow(task, user.id));
}

export async function dbDeleteTask(id: string) {
  await createClient().from('tasks').delete().eq('id', id);
}

export async function dbUpsertTaskStreak(streak: TaskStreakState) {
  const user = await getUser();
  if (!user) return;
  await createClient().from('task_streak').upsert({
    user_id: user.id,
    current_streak: streak.current,
    longest_streak: streak.longest,
    last_completed_date: streak.lastCompletedDate,
  });
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export async function dbUpsertGoal(goal: Goal) {
  const user = await getUser();
  if (!user) return;
  const supabase = createClient();

  await supabase.from('goals').upsert(goalToRow(goal, user.id));

  // Replace milestones: delete all for this goal, then reinsert
  await supabase.from('milestones').delete().eq('goal_id', goal.id).eq('user_id', user.id);
  if (goal.milestones.length > 0) {
    await supabase.from('milestones').insert(
      goal.milestones.map((m, i) => milestoneToRow(m, goal.id, user.id, i))
    );
  }
}

export async function dbDeleteGoal(id: string) {
  // milestones cascade-delete via FK on user_id
  await createClient().from('goals').delete().eq('id', id);
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export async function dbUpsertWorkout(workout: Workout) {
  const user = await getUser();
  if (!user) return;
  const supabase = createClient();

  await supabase.from('workouts').upsert(workoutToRow(workout, user.id));

  // Replace exercises: delete all for this workout, then reinsert
  await supabase.from('exercises').delete().eq('workout_id', workout.id).eq('user_id', user.id);
  if (workout.exercises.length > 0) {
    await supabase.from('exercises').insert(
      workout.exercises.map((e, i) => exerciseToRow(e, workout.id, user.id, i))
    );
  }
}

export async function dbDeleteWorkout(id: string) {
  await createClient().from('workouts').delete().eq('id', id);
}

// ─── Ideas ───────────────────────────────────────────────────────────────────

export async function dbUpsertIdea(idea: Idea) {
  const user = await getUser();
  if (!user) return;
  await createClient().from('ideas').upsert(ideaToRow(idea, user.id));
}

export async function dbDeleteIdea(id: string) {
  await createClient().from('ideas').delete().eq('id', id);
}

// ─── Supplies ────────────────────────────────────────────────────────────────

export async function dbUpsertSupply(supply: SupplyItem) {
  const user = await getUser();
  if (!user) return;
  await createClient().from('supplies').upsert(supplyToRow(supply, user.id));
}

export async function dbDeleteSupply(id: string) {
  await createClient().from('supplies').delete().eq('id', id);
}

// ─── Templates ───────────────────────────────────────────────────────────────

export async function dbUpsertTemplate(t: WorkoutTemplate) {
  const user = await getUser();
  if (!user) return;
  await createClient().from('workout_templates').upsert(templateToRow(t, user.id));
}

export async function dbDeleteTemplate(id: string) {
  await createClient().from('workout_templates').delete().eq('id', id);
}

export async function dbUpsertTemplates(ts: WorkoutTemplate[]) {
  const user = await getUser();
  if (!user) return;
  await createClient()
    .from('workout_templates')
    .upsert(ts.map(t => templateToRow(t, user.id)));
}

// ─── Programs ────────────────────────────────────────────────────────────────

export async function dbUpsertProgram(p: WorkoutProgram) {
  const user = await getUser();
  if (!user) { console.error('[LYFE] dbUpsertProgram: no authenticated user'); return; }
  const { error } = await createClient().from('workout_programs').upsert(programToRow(p, user.id));
  if (error) console.error('[LYFE] dbUpsertProgram error:', error);
  else console.log('[LYFE] program saved to DB:', p.id, p.name);
}

export async function dbDeleteProgram(id: string) {
  await createClient().from('workout_programs').delete().eq('id', id);
}

'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import {
  mockTasks, mockWorkouts, mockGoals, mockIdeas, WORKOUT_TEMPLATES, mockTaskStreak, mockSupplies,
  type Task, type Workout, type WorkoutTemplate, type WorkoutProgram, type Goal, type Idea,
  type TaskStreakState, type SupplyItem,
} from './mock-data';
import { updateTaskStreak } from './streak';
import {
  fetchAllData,
  dbUpsertTask, dbDeleteTask, dbUpsertTaskStreak,
  dbUpsertGoal, dbDeleteGoal,
  dbUpsertWorkout, dbDeleteWorkout,
  dbUpsertIdea, dbDeleteIdea,
  dbUpsertSupply, dbDeleteSupply,
} from './db';

interface AppStore {
  /* ── Loading ── */
  isLoading: boolean;
  /* ── Tasks ── */
  tasks:       Task[];
  taskStreak:  TaskStreakState;
  addTask:     (task: Task)    => void;
  addTasks:    (tasks: Task[]) => void;
  updateTask:  (task: Task)    => void;
  deleteTask:  (id: string)   => void;
  toggleTask:  (id: string)   => void;
  /* ── Workouts ── */
  workouts:              Workout[];
  addWorkout:            (workout: Workout)    => void;
  addWorkouts:           (workouts: Workout[]) => void;
  updateWorkout:         (w: Workout)          => void;
  toggleWorkoutCompleted:(id: string)          => void;
  /** Toggle skipped flag; also marks/unmarks the linked task as completed */
  skipWorkout:           (id: string)          => void;
  /**
   * Push a workout forward by `days` days.
   * If the workout belongs to a program, all subsequent sessions in
   * the same program are shifted by the same amount.
   * The linked task(s) are updated to match.
   */
  pushWorkout:           (id: string, days: number) => void;
  /* ── Templates ── */
  templates:      WorkoutTemplate[];
  addTemplate:    (t: WorkoutTemplate) => void;
  updateTemplate: (t: WorkoutTemplate) => void;
  deleteTemplate: (id: string)         => void;
  /* ── Programs ── */
  programs:   WorkoutProgram[];
  addProgram: (p: WorkoutProgram) => void;
  /* ── Goals ── */
  goals:      Goal[];
  addGoal:    (goal: Goal)   => void;
  updateGoal: (goal: Goal)   => void;
  deleteGoal: (id: string)   => void;
  /* ── Ideas ── */
  ideas:      Idea[];
  addIdea:    (idea: Idea)   => void;
  updateIdea: (idea: Idea)   => void;
  deleteIdea: (id: string)   => void;
  /* ── Supplies ── */
  supplies:      SupplyItem[];
  addSupply:     (supply: SupplyItem) => void;
  updateSupply:  (supply: SupplyItem) => void;
  deleteSupply:  (id: string)         => void;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [tasks,       setTasks]       = useState<Task[]>(mockTasks);
  const [taskStreak,  setTaskStreak]  = useState<TaskStreakState>(mockTaskStreak);
  const [workouts,  setWorkouts]  = useState<Workout[]>(mockWorkouts);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(WORKOUT_TEMPLATES);
  const [programs,  setPrograms]  = useState<WorkoutProgram[]>([]);
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplies);

  // ── Load from Supabase on mount ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchAllData().then(data => {
      if (cancelled) return;
      setIsLoading(false);
      if (!data) return; // not logged in — keep mock data for preview
      setTasks(data.tasks);
      setGoals(data.goals);
      setWorkouts(data.workouts);
      setIdeas(data.ideas);
      setSupplies(data.supplies);
      if (data.taskStreak) setTaskStreak(data.taskStreak);
    });
    return () => { cancelled = true; };
  }, []);

  // ── Goals ──────────────────────────────────────────────────────────────────
  const addGoal    = (g: Goal) => { setGoals(prev => [g, ...prev]); dbUpsertGoal(g); };
  const updateGoal = (g: Goal) => { setGoals(prev => prev.map(x => x.id === g.id ? g : x)); dbUpsertGoal(g); };
  const deleteGoal = (id: string) => { setGoals(prev => prev.filter(g => g.id !== id)); dbDeleteGoal(id); };

  // ── Ideas ──────────────────────────────────────────────────────────────────
  const addIdea    = (i: Idea)   => { setIdeas(prev => [i, ...prev]); dbUpsertIdea(i); };
  const updateIdea = (i: Idea)   => { setIdeas(prev => prev.map(x => x.id === i.id ? i : x)); dbUpsertIdea(i); };
  const deleteIdea = (id: string) => { setIdeas(prev => prev.filter(x => x.id !== id)); dbDeleteIdea(id); };

  // ── Supplies ───────────────────────────────────────────────────────────────
  const addSupply    = (s: SupplyItem) => { setSupplies(prev => [s, ...prev]); dbUpsertSupply(s); };
  const updateSupply = (s: SupplyItem) => { setSupplies(prev => prev.map(x => x.id === s.id ? s : x)); dbUpsertSupply(s); };
  const deleteSupply = (id: string)    => { setSupplies(prev => prev.filter(x => x.id !== id)); dbDeleteSupply(id); };

  // ── Tasks ──────────────────────────────────────────────────────────────────
  const addTask    = (t: Task)     => { setTasks(prev => [t, ...prev]); dbUpsertTask(t); };
  const addTasks   = (ts: Task[])  => { setTasks(prev => [...ts, ...prev]); ts.forEach(t => dbUpsertTask(t)); };
  const updateTask = (t: Task)     => { setTasks(prev => prev.map(x => x.id === t.id ? t : x)); dbUpsertTask(t); };
  const deleteTask = (id: string)  => { setTasks(prev => prev.filter(x => x.id !== id)); dbDeleteTask(id); };

  const toggleTask = (id: string) => {
    const updated = tasks.map(x => x.id === id ? { ...x, completed: !x.completed } : x);
    const today = new Date().toISOString().split('T')[0];
    const newStreak = updateTaskStreak(updated, taskStreak, today);
    setTasks(updated);
    setTaskStreak(newStreak);
    const toggled = updated.find(t => t.id === id);
    if (toggled) dbUpsertTask(toggled);
    dbUpsertTaskStreak(newStreak);
  };

  // ── Workouts ───────────────────────────────────────────────────────────────
  const addWorkout  = (w: Workout)    => { setWorkouts(prev => [w, ...prev]); dbUpsertWorkout(w); };
  const addWorkouts = (ws: Workout[]) => { setWorkouts(prev => [...ws, ...prev]); ws.forEach(w => dbUpsertWorkout(w)); };

  const updateWorkout = (w: Workout) => {
    setWorkouts(prev => prev.map(x => x.id === w.id ? w : x));
    setTasks(prev => prev.map(t =>
      t.id === `workout-task-${w.id}`
        ? { ...t, title: w.title, dueDate: w.date, startTime: w.startTime, icon: w.icon }
        : t
    ));
    dbUpsertWorkout(w);
    // Sync linked task
    const linkedTask = tasks.find(t => t.id === `workout-task-${w.id}`);
    if (linkedTask) {
      dbUpsertTask({ ...linkedTask, title: w.title, dueDate: w.date, startTime: w.startTime, icon: w.icon });
    }
  };

  const toggleWorkoutCompleted = (id: string) => {
    const updated = workouts.find(w => w.id === id);
    if (!updated) return;
    const next = { ...updated, completed: !updated.completed };
    setWorkouts(prev => prev.map(x => x.id === id ? next : x));
    dbUpsertWorkout(next);
  };

  const skipWorkout = (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;
    const willBeSkipped = !workout.skipped;
    const next = { ...workout, skipped: willBeSkipped };
    setWorkouts(prev => prev.map(x => x.id === id ? next : x));
    setTasks(prev => prev.map(t =>
      t.id === `workout-task-${id}` ? { ...t, completed: willBeSkipped } : t
    ));
    dbUpsertWorkout(next);
    const linkedTask = tasks.find(t => t.id === `workout-task-${id}`);
    if (linkedTask) dbUpsertTask({ ...linkedTask, completed: willBeSkipped });
  };

  const pushWorkout = (id: string, days: number) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    const oldDate = workout.date;
    const newDate = format(addDays(parseISO(oldDate), days), 'yyyy-MM-dd');
    const progId  = workout.programId;

    const dateMap: Record<string, string> = { [id]: newDate };

    if (progId) {
      workouts
        .filter(w => w.programId === progId && w.date > oldDate)
        .forEach(w => {
          dateMap[w.id] = format(addDays(parseISO(w.date), days), 'yyyy-MM-dd');
        });
    }

    setWorkouts(prev => prev.map(x => {
      if (!dateMap[x.id]) return x;
      return {
        ...x,
        date: dateMap[x.id],
        ...(x.id === id ? { pushedFrom: oldDate } : {}),
      };
    }));

    setTasks(prev => prev.map(t => {
      const matchedId = Object.keys(dateMap).find(wId => t.id === `workout-task-${wId}`);
      if (!matchedId) return t;
      return { ...t, dueDate: dateMap[matchedId] };
    }));

    // Sync affected workouts + tasks to DB
    workouts
      .filter(w => dateMap[w.id])
      .forEach(w => {
        dbUpsertWorkout({ ...w, date: dateMap[w.id], ...(w.id === id ? { pushedFrom: oldDate } : {}) });
      });
    tasks
      .filter(t => Object.keys(dateMap).some(wId => t.id === `workout-task-${wId}`))
      .forEach(t => {
        const wId = Object.keys(dateMap).find(wId => t.id === `workout-task-${wId}`)!;
        dbUpsertTask({ ...t, dueDate: dateMap[wId] });
      });
  };

  // ── Templates ──────────────────────────────────────────────────────────────
  // Templates are app-local (not user data), no DB sync needed
  const addTemplate    = (t: WorkoutTemplate) => setTemplates(prev => [...prev, t]);
  const updateTemplate = (t: WorkoutTemplate) => setTemplates(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTemplate = (id: string)         => setTemplates(prev => prev.filter(x => x.id !== id));

  // ── Programs ───────────────────────────────────────────────────────────────
  const addProgram = (p: WorkoutProgram) => setPrograms(prev => [p, ...prev]);

  return (
    <AppContext.Provider value={{
      isLoading,
      tasks, taskStreak, addTask, addTasks, updateTask, deleteTask, toggleTask,
      workouts, addWorkout, addWorkouts, updateWorkout, toggleWorkoutCompleted, skipWorkout, pushWorkout,
      templates, addTemplate, updateTemplate, deleteTemplate,
      programs, addProgram,
      goals, addGoal, updateGoal, deleteGoal,
      ideas, addIdea, updateIdea, deleteIdea,
      supplies, addSupply, updateSupply, deleteSupply,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppProvider>');
  return ctx;
}

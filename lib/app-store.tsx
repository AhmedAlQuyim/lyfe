'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import {
  mockTasks, mockWorkouts, mockGoals, mockIdeas, WORKOUT_TEMPLATES, mockTaskStreak, mockSupplies,
  type Task, type Workout, type WorkoutTemplate, type WorkoutProgram, type Goal, type Idea,
  type TaskStreakState, type SupplyItem,
} from './mock-data';
import { updateTaskStreak } from './streak';

interface AppStore {
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
  const [tasks,       setTasks]       = useState<Task[]>(mockTasks);
  const [taskStreak,  setTaskStreak]  = useState<TaskStreakState>(mockTaskStreak);
  const [workouts,  setWorkouts]  = useState<Workout[]>(mockWorkouts);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>(WORKOUT_TEMPLATES);
  const [programs,  setPrograms]  = useState<WorkoutProgram[]>([]);
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
  const [supplies, setSupplies] = useState<SupplyItem[]>(mockSupplies);

  /* Goals */
  const addGoal    = (g: Goal) => setGoals(prev => [g, ...prev]);
  const updateGoal = (g: Goal) => setGoals(prev => prev.map(x => x.id === g.id ? g : x));
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(g => g.id !== id));

  /* Ideas */
  const addIdea    = (i: Idea)   => setIdeas(prev => [i, ...prev]);
  const updateIdea = (i: Idea)   => setIdeas(prev => prev.map(x => x.id === i.id ? i : x));
  const deleteIdea = (id: string) => setIdeas(prev => prev.filter(x => x.id !== id));

  /* Supplies */
  const addSupply    = (s: SupplyItem) => setSupplies(prev => [s, ...prev]);
  const updateSupply = (s: SupplyItem) => setSupplies(prev => prev.map(x => x.id === s.id ? s : x));
  const deleteSupply = (id: string)    => setSupplies(prev => prev.filter(x => x.id !== id));

  /* Tasks */
  const addTask    = (t: Task)     => setTasks(prev => [t, ...prev]);
  const addTasks   = (ts: Task[])  => setTasks(prev => [...ts, ...prev]);
  const updateTask = (t: Task)     => setTasks(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTask = (id: string)  => setTasks(prev => prev.filter(x => x.id !== id));
  const toggleTask = (id: string) => {
    const updated = tasks.map(x => x.id === id ? { ...x, completed: !x.completed } : x);
    const today = new Date().toISOString().split('T')[0];
    setTasks(updated);
    setTaskStreak(s => updateTaskStreak(updated, s, today));
  };

  /* Workouts */
  const addWorkout  = (w: Workout)    => setWorkouts(prev => [w, ...prev]);
  const addWorkouts = (ws: Workout[]) => setWorkouts(prev => [...ws, ...prev]);

  const updateWorkout = (w: Workout) => {
    setWorkouts(prev => prev.map(x => x.id === w.id ? w : x));
    // Sync the linked task's title, date, time, and icon
    setTasks(prev => prev.map(t =>
      t.id === `workout-task-${w.id}`
        ? { ...t, title: w.title, dueDate: w.date, startTime: w.startTime, icon: w.icon }
        : t
    ));
  };

  const toggleWorkoutCompleted = (id: string) => setWorkouts(prev =>
    prev.map(x => x.id === id ? { ...x, completed: !x.completed } : x)
  );

  const skipWorkout = (id: string) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;
    const willBeSkipped = !workout.skipped;
    setWorkouts(prev => prev.map(x => x.id === id ? { ...x, skipped: willBeSkipped } : x));
    // Mirror on the linked task so it disappears from / reappears in the tasks list
    setTasks(prev => prev.map(t =>
      t.id === `workout-task-${id}` ? { ...t, completed: willBeSkipped } : t
    ));
  };

  const pushWorkout = (id: string, days: number) => {
    const workout = workouts.find(w => w.id === id);
    if (!workout) return;

    const oldDate = workout.date;
    const newDate = format(addDays(parseISO(oldDate), days), 'yyyy-MM-dd');
    const progId  = workout.programId;

    // Build a map of workoutId → new date for every workout that needs shifting
    const dateMap: Record<string, string> = { [id]: newDate };

    if (progId) {
      // Shift all subsequent sessions in the same program
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

    // Sync the date change to every linked task
    setTasks(prev => prev.map(t => {
      const matchedId = Object.keys(dateMap).find(wId => t.id === `workout-task-${wId}`);
      if (!matchedId) return t;
      return { ...t, dueDate: dateMap[matchedId] };
    }));
  };

  /* Templates */
  const addTemplate    = (t: WorkoutTemplate) => setTemplates(prev => [...prev, t]);
  const updateTemplate = (t: WorkoutTemplate) => setTemplates(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTemplate = (id: string)         => setTemplates(prev => prev.filter(x => x.id !== id));

  /* Programs */
  const addProgram = (p: WorkoutProgram) => setPrograms(prev => [p, ...prev]);

  return (
    <AppContext.Provider value={{
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

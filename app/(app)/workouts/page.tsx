'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, ChevronRight, Timer, Minus, ChevronDown,
  Calendar, Clock, Pencil, Trash2, Check, BarChart3, Ban, ChevronsRight,
} from 'lucide-react';
import {
  type Workout, type Exercise, type WorkoutTemplate,
  type WorkoutProgram, type ProgramScheduleDay,
} from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { cn, formatRelativeDate, formatWeekLabel, formatDuration, formatDisplayTime } from '@/lib/utils';
import { parseISO, isSameWeek, format, addDays, differenceInDays } from 'date-fns';

/* ─── Type/colour config ─── */
const typeConfig = {
  strength:    { label: 'Strength',    icon: '💪', color: '#7C6EF8' },
  cardio:      { label: 'Cardio',      icon: '🏃', color: '#3EC99A' },
  flexibility: { label: 'Flexibility', icon: '🧘', color: '#F5A524' },
  sports:      { label: 'Sports',      icon: '⚽', color: '#5BAFEF' },
};

const todayStr = () => new Date().toISOString().split('T')[0];

/* ══════════════════════════════════════════════
   Exercise helpers
══════════════════════════════════════════════ */
interface ExerciseState {
  key: string; name: string;
  sets: string; reps: string; weightKg: string; durationSeconds: string;
}

function blankExercise(): ExerciseState {
  return { key: `${Date.now()}-${Math.random()}`, name: '', sets: '', reps: '', weightKg: '', durationSeconds: '' };
}
function templateToState(ex: Omit<Exercise, 'id'>, idx: number): ExerciseState {
  return {
    key: `${idx}-${Date.now()}`,
    name: ex.name,
    sets:            ex.sets            != null ? String(ex.sets)            : '',
    reps:            ex.reps            != null ? String(ex.reps)            : '',
    weightKg:        ex.weightKg        != null ? String(ex.weightKg)        : '',
    durationSeconds: ex.durationSeconds != null ? String(ex.durationSeconds) : '',
  };
}
function stateToExercise(e: ExerciseState, idx: number): Exercise {
  return {
    id: String(idx), name: e.name,
    sets:            e.sets            !== '' ? Number(e.sets)            : undefined,
    reps:            e.reps            !== '' ? Number(e.reps)            : undefined,
    weightKg:        e.weightKg        !== '' ? Number(e.weightKg)        : undefined,
    durationSeconds: e.durationSeconds !== '' ? Number(e.durationSeconds) : undefined,
  };
}

/* ─── ExerciseRow ─── */
function ExerciseRow({ ex, onChange, onDelete }: {
  ex: ExerciseState;
  onChange: (key: string, field: keyof ExerciseState, val: string) => void;
  onDelete: (key: string) => void;
}) {
  return (
    <div className="bg-surface-2 dark:bg-surface-2-dark rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input value={ex.name} onChange={e => onChange(ex.key, 'name', e.target.value)}
          placeholder="Exercise name"
          className="flex-1 bg-transparent text-[13px] font-medium text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none" />
        <button onClick={() => onDelete(ex.key)} className="shrink-0 text-muted dark:text-muted-dark hover:text-coral transition-colors p-1">
          <Minus size={16} />
        </button>
      </div>
      <div className="flex gap-2">
        {(['sets', 'reps', 'weightKg'] as const).map(field => (
          <div key={field} className="flex-1">
            <label className="text-[10px] text-muted dark:text-muted-dark uppercase tracking-wider block mb-1">
              {field === 'weightKg' ? 'kg' : field === 'sets' ? 'Sets' : 'Reps'}
            </label>
            <input type="number" inputMode="decimal" value={ex[field]}
              onChange={e => onChange(ex.key, field, e.target.value)}
              placeholder="—"
              className="w-full bg-surface dark:bg-surface-dark rounded-lg px-2 py-1.5 text-[13px] text-text dark:text-text-dark outline-none text-center border border-border dark:border-border-dark focus:border-accent dark:focus:border-violet transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Template Editor Sheet  (add / edit a template)
══════════════════════════════════════════════ */
function TemplateEditorSheet({ initial, onClose, onSave }: {
  initial?: WorkoutTemplate;
  onClose: () => void;
  onSave: (t: WorkoutTemplate) => void;
}) {
  const isEdit = !!initial;
  const [name,      setName]      = useState(initial?.name            ?? '');
  const [type,      setType]      = useState<Workout['type']>(initial?.type ?? 'strength');
  const [duration,  setDuration]  = useState(initial?.durationMinutes != null ? String(initial.durationMinutes) : '');
  const [exercises, setExercises] = useState<ExerciseState[]>(
    initial?.exercises.length ? initial.exercises.map(templateToState) : [blankExercise()]
  );

  const addEx    = () => setExercises(p => [...p, blankExercise()]);
  const updateEx = (key: string, field: keyof ExerciseState, val: string) =>
    setExercises(p => p.map(e => e.key === key ? { ...e, [field]: val } : e));
  const deleteEx = (key: string) => setExercises(p => p.filter(e => e.key !== key));

  const save = () => {
    if (!name.trim()) return;
    onSave({
      id:              initial?.id ?? `tpl-${Date.now()}`,
      name:            name.trim(),
      type,
      icon:            typeConfig[type].icon,
      durationMinutes: duration !== '' ? Number(duration) : 0,
      exercises:       exercises.filter(e => e.name.trim()).map((e, i) => stateToExercise(e, i)),
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-[60] flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-accent dark:border-violet no-scrollbar"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}>

        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5">
          <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">
              {isEdit ? 'Edit Template' : 'New Template'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[88px] space-y-4">
          {/* Type */}
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(typeConfig) as [Workout['type'], typeof typeConfig[keyof typeof typeConfig]][]).map(([k, cfg]) => (
              <button key={k} onClick={() => setType(k)}
                className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                  type === k ? 'border-accent bg-accent/10 dark:border-violet dark:bg-violet/10'
                             : 'border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark')}>
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-[9px] font-semibold text-muted dark:text-muted-dark">{cfg.label}</span>
              </button>
            ))}
          </div>

          {/* Name */}
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Template name"
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[15px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors" />

          {/* Duration */}
          <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
            <Timer size={16} className="text-muted dark:text-muted-dark shrink-0" />
            <input type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="Duration"
              className="flex-1 bg-transparent text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none" />
            <span className="text-[12px] text-muted dark:text-muted-dark">min</span>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-text dark:text-text-dark font-display">
                Exercises <span className="text-muted dark:text-muted-dark font-normal">({exercises.length})</span>
              </p>
              <button onClick={addEx} className="text-[11px] font-semibold text-accent dark:text-violet flex items-center gap-1">
                <Plus size={12} /> Add
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map(ex => (
                <ExerciseRow key={ex.key} ex={ex} onChange={updateEx} onDelete={deleteEx} />
              ))}
            </div>
          </div>

          <motion.button onClick={save} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-accent dark:bg-violet text-white font-semibold text-[15px]">
            {isEdit ? 'Save Changes' : 'Create Template'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Manage Templates Sheet
══════════════════════════════════════════════ */
function ManageTemplatesSheet({ onClose }: { onClose: () => void }) {
  const { templates, addTemplate, updateTemplate, deleteTemplate } = useAppStore();
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <>
      <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl no-scrollbar"
          style={{ maxHeight: '85vh', overflowY: 'auto' }}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}>

          <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5 border-b border-border dark:border-border-dark">
            <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">Workout Templates</h2>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                <X size={14} className="text-muted dark:text-muted-dark" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-[88px] pt-3 space-y-2.5">
            {templates.map(t => {
              const cfg = typeConfig[t.type];
              return (
                <div key={t.id}
                  className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-3.5 flex items-center gap-3"
                  style={{ borderLeft: `3px solid ${cfg.color}` }}>
                  <span className="text-2xl shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-text dark:text-text-dark">{t.name}</p>
                    <p className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                      {t.exercises.length} exercises · {t.durationMinutes} min
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ color: cfg.color, backgroundColor: cfg.color + '20' }}>
                        {cfg.label}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setEditingTemplate(t)}
                      className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center">
                      <Pencil size={13} className="text-muted dark:text-muted-dark" />
                    </button>
                    {confirmDelete === t.id ? (
                      <div className="flex gap-1">
                        <button onClick={() => { deleteTemplate(t.id); setConfirmDelete(null); }}
                          className="px-2 py-1 rounded-lg bg-coral text-white text-[11px] font-semibold">
                          Delete
                        </button>
                        <button onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded-lg bg-surface dark:bg-surface-dark text-[11px] font-semibold text-muted dark:text-muted-dark">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmDelete(t.id)}
                        className="w-8 h-8 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center">
                        <Trash2 size={13} className="text-muted dark:text-muted-dark" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add new */}
            <motion.button onClick={() => setShowNew(true)} whileTap={{ scale: 0.97 }}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-border dark:border-border-dark text-[13px] font-semibold text-muted dark:text-muted-dark flex items-center justify-center gap-2 mt-2">
              <Plus size={15} /> New Template
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Template editor overlaid on top */}
      <AnimatePresence>
        {editingTemplate && (
          <TemplateEditorSheet
            initial={editingTemplate}
            onClose={() => setEditingTemplate(null)}
            onSave={t => { updateTemplate(t); setEditingTemplate(null); }}
          />
        )}
        {showNew && (
          <TemplateEditorSheet
            onClose={() => setShowNew(false)}
            onSave={t => { addTemplate(t); setShowNew(false); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════
   Template Picker  (used in Log sheet)
══════════════════════════════════════════════ */
function TemplatePicker({ templates, onSelect }: {
  templates: WorkoutTemplate[];
  onSelect: (t: WorkoutTemplate) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-violet/10 dark:bg-violet/15 border-2 border-violet/30 rounded-xl px-4 py-3 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-lg">📋</span>
          <span className="text-[13px] font-semibold text-violet">Load a template</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-violet" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute left-0 right-0 top-full mt-1 bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark shadow-xl z-20 overflow-hidden"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}>
            {templates.map(t => {
              const cfg = typeConfig[t.type];
              return (
                <button key={t.id} onClick={() => { onSelect(t); setOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-2 dark:hover:bg-surface-2-dark transition-colors border-b border-border/40 dark:border-border-dark/40 last:border-0">
                  <span className="text-xl shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-text dark:text-text-dark">{t.name}</p>
                    <p className="text-[11px] text-muted dark:text-muted-dark">
                      {t.exercises.length} exercises · {t.durationMinutes} min
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: cfg.color, backgroundColor: cfg.color + '20' }}>
                    {cfg.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════════
   Log Workout Sheet
══════════════════════════════════════════════ */
function LogWorkoutSheet({ onClose }: { onClose: () => void }) {
  const { addWorkout, addTask, templates } = useAppStore();
  const today = todayStr();

  const [title,          setTitle]          = useState('');
  const [type,           setType]           = useState<Workout['type']>('strength');
  const [date,           setDate]           = useState(today);
  const [startTime,      setStartTime]      = useState('');
  const [duration,       setDuration]       = useState('');
  const [notes,          setNotes]          = useState('');
  const [exercises,      setExercises]      = useState<ExerciseState[]>([blankExercise()]);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  /* Keep title in sync with date while a template is active */
  useEffect(() => {
    if (!activeTemplate || !date) return;
    setTitle(`${activeTemplate} (${format(parseISO(date), 'MMMM d, yyyy')})`);
  }, [date, activeTemplate]);

  const loadTemplate = (t: WorkoutTemplate) => {
    setActiveTemplate(t.name);
    setType(t.type);
    setDuration(String(t.durationMinutes));
    setExercises(t.exercises.map(templateToState));
    setTitle(`${t.name} (${format(date ? parseISO(date) : new Date(), 'MMMM d, yyyy')})`);
  };

  const handleTitleChange = (val: string) => { setTitle(val); setActiveTemplate(null); };

  const addEx    = () => setExercises(p => [...p, blankExercise()]);
  const updateEx = (key: string, field: keyof ExerciseState, val: string) =>
    setExercises(p => p.map(e => e.key === key ? { ...e, [field]: val } : e));
  const deleteEx = (key: string) => setExercises(p => p.filter(e => e.key !== key));

  const save = () => {
    if (!title.trim()) return;
    const cfg = typeConfig[type];
    const durationMin = duration !== '' ? Number(duration) : 0;
    const workout: Workout = {
      id: Date.now().toString(), title: title.trim(), date,
      startTime: startTime || undefined,
      durationMinutes: durationMin, type, icon: cfg.icon,
      notes: notes.trim() || undefined,
      exercises: exercises.filter(e => e.name.trim()).map(stateToExercise),
    };
    addWorkout(workout);
    addTask({
      id: `workout-task-${workout.id}`, title: workout.title,
      icon: workout.icon, color: cfg.color, priority: 'high', dueDate: workout.date,
      startTime: workout.startTime, completed: false, recurring: false,
      notes: ['Workout session', durationMin > 0 ? formatDuration(durationMin) : '',
        workout.exercises.length > 0 ? `${workout.exercises.length} exercises` : '']
        .filter(Boolean).join(' · '),
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-orange no-scrollbar"
        style={{ maxHeight: '93vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}>

        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5">
          <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">Log Workout</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[88px] space-y-4">
          <TemplatePicker templates={templates} onSelect={loadTemplate} />

          {/* Type */}
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(typeConfig) as [Workout['type'], typeof typeConfig[keyof typeof typeConfig]][]).map(([k, cfg]) => (
              <button key={k} onClick={() => setType(k)}
                className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                  type === k ? 'border-orange bg-orange/10' : 'border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark')}>
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-[9px] font-semibold text-muted dark:text-muted-dark">{cfg.label}</span>
              </button>
            ))}
          </div>

          {/* Title */}
          <input value={title} onChange={e => handleTitleChange(e.target.value)} placeholder="Workout name"
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[15px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none border-2 border-transparent focus:border-orange transition-colors" />

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={10} /> Date
              </p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-orange transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> Start time
              </p>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-orange transition-colors" />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
            <Timer size={16} className="text-muted dark:text-muted-dark shrink-0" />
            <input type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="Duration"
              className="flex-1 bg-transparent text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none" />
            <span className="text-[12px] text-muted dark:text-muted-dark">min</span>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-text dark:text-text-dark font-display">
                Exercises <span className="text-muted dark:text-muted-dark font-normal">({exercises.length})</span>
              </p>
              <button onClick={addEx} className="text-[11px] font-semibold text-accent dark:text-violet flex items-center gap-1">
                <Plus size={12} /> Add exercise
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map(ex => <ExerciseRow key={ex.key} ex={ex} onChange={updateEx} onDelete={deleteEx} />)}
            </div>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[13px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none resize-none border-2 border-transparent focus:border-orange transition-colors" />

          <motion.button onClick={save} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-orange text-white font-semibold text-[15px]">
            Save Workout
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Workout Program Sheet
══════════════════════════════════════════════ */

/* Compact inline template selector for schedule rows */
function InlineTemplatePicker({ templates, value, onChange }: {
  templates: WorkoutTemplate[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = templates.find(t => t.id === value);
  return (
    <div className="relative flex-1 min-w-0">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-3 py-2 gap-1">
        <span className="text-[12px] font-medium text-text dark:text-text-dark truncate">
          {selected ? `${selected.icon} ${selected.name}` : 'Select workout'}
        </span>
        <ChevronDown size={12} className="text-muted dark:text-muted-dark shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="absolute left-0 right-0 top-full mt-1 bg-surface dark:bg-surface-dark rounded-xl border border-border dark:border-border-dark shadow-2xl z-40 overflow-hidden"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            style={{ maxHeight: 220, overflowY: 'auto' }}>
            {templates.map(t => (
              <button key={t.id} onClick={() => { onChange(t.id); setOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-3 py-2.5 text-left text-[12px] transition-colors border-b border-border/30 dark:border-border-dark/30 last:border-0',
                  value === t.id ? 'bg-accent/10 dark:bg-violet/10 text-accent dark:text-violet font-semibold'
                                 : 'hover:bg-surface-2 dark:hover:bg-surface-2-dark text-text dark:text-text-dark')}>
                <span>{t.icon}</span>
                <span className="truncate">{t.name}</span>
                {value === t.id && <Check size={12} className="ml-auto shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Single schedule day row */
function ScheduleDayRow({ day, templates, onChange, onDelete, index }: {
  day: ProgramScheduleDay;
  templates: WorkoutTemplate[];
  onChange: (id: string, field: keyof ProgramScheduleDay, val: string) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface-2 dark:bg-surface-2-dark rounded-xl p-2.5">
      <span className="text-[11px] font-bold text-muted dark:text-muted-dark w-9 shrink-0 text-center">
        Day {index + 1}
      </span>
      <InlineTemplatePicker
        templates={templates}
        value={day.templateId}
        onChange={val => onChange(day.id, 'templateId', val)}
      />
      <input type="time" value={day.startTime ?? ''}
        onChange={e => onChange(day.id, 'startTime', e.target.value)}
        className="w-20 shrink-0 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-lg px-2 py-1.5 text-[11px] text-text dark:text-text-dark outline-none focus:border-accent dark:focus:border-violet transition-colors" />
      <button onClick={() => onDelete(day.id)}
        className="w-7 h-7 rounded-full bg-surface dark:bg-surface-dark flex items-center justify-center shrink-0">
        <Minus size={13} className="text-muted dark:text-muted-dark" />
      </button>
    </div>
  );
}

function ProgramSheet({ onClose }: { onClose: () => void }) {
  const { templates, addProgram, addWorkouts, addTasks } = useAppStore();
  const today = todayStr();

  const [name,      setName]      = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate,   setEndDate]   = useState('');
  const [schedule,  setSchedule]  = useState<ProgramScheduleDay[]>([]);

  const addDay = () => setSchedule(p => [
    ...p,
    { id: `day-${Date.now()}`, dayLabel: `Day ${p.length + 1}`, templateId: templates[0]?.id ?? '', startTime: '' },
  ]);
  const updateDay = (id: string, field: keyof ProgramScheduleDay, val: string) =>
    setSchedule(p => p.map(d => d.id === id ? { ...d, [field]: val } : d));
  const deleteDay = (id: string) => setSchedule(p => p.filter(d => d.id !== id));

  /* How many sessions will be generated */
  const sessionCount = (() => {
    if (!startDate || !endDate || schedule.length === 0) return 0;
    try {
      const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
      return days > 0 ? days : 0;
    } catch { return 0; }
  })();

  const canGenerate = name.trim() && startDate && endDate && schedule.length > 0 &&
    schedule.every(d => d.templateId) && sessionCount > 0;

  const generate = () => {
    if (!canGenerate) return;
    const start = parseISO(startDate);
    const progId = `prog-${Date.now()}`;
    const workoutsToAdd: Workout[] = [];
    const tasksToAdd: ReturnType<typeof buildTask>[] = [];

    for (let i = 0; i < sessionCount; i++) {
      const sDay = schedule[i % schedule.length];
      const tpl  = templates.find(t => t.id === sDay.templateId);
      if (!tpl) continue;

      const dayDate    = addDays(start, i);
      const dateStr    = format(dayDate, 'yyyy-MM-dd');
      const dateLabel  = format(dayDate, 'MMMM d, yyyy');
      const title      = `${tpl.name} (${dateLabel})`;
      const workoutId  = `prog-${progId}-${i}`;
      const cfg        = typeConfig[tpl.type];

      workoutsToAdd.push({
        id: workoutId, title, date: dateStr,
        startTime: sDay.startTime || undefined,
        durationMinutes: tpl.durationMinutes, type: tpl.type,
        icon: tpl.icon, programId: progId, completed: false,
        exercises: tpl.exercises.map((e, idx) => ({ ...e, id: String(idx) })),
      });

      tasksToAdd.push({
        id: `workout-task-${workoutId}`, title,
        icon: tpl.icon, color: cfg.color, priority: 'high' as const,
        dueDate: dateStr, startTime: sDay.startTime || undefined,
        completed: false, recurring: false,
        notes: `Program: ${name.trim()} · ${formatDuration(tpl.durationMinutes)}`,
      });
    }

    const program: WorkoutProgram = {
      id: progId, name: name.trim(), startDate, endDate,
      schedule,
      generatedWorkoutIds: workoutsToAdd.map(w => w.id),
    };

    addWorkouts(workoutsToAdd);
    addTasks(tasksToAdd);
    addProgram(program);
    onClose();
  };

  function buildTask(t: Parameters<typeof addTasks>[0][number]) { return t; }

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-violet no-scrollbar"
        style={{ maxHeight: '93vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}>

        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5">
          <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">Workout Program</h2>
              <p className="text-[11px] text-muted dark:text-muted-dark">Build a schedule that repeats over a period</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[88px] space-y-5">
          {/* Program name */}
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Program name (e.g. Strength Block)"
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[15px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none border-2 border-transparent focus:border-violet transition-colors" />

          {/* Date range */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Calendar size={11} /> Program period
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-muted dark:text-muted-dark mb-1">Start date</p>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-violet transition-colors" />
              </div>
              <div>
                <p className="text-[10px] text-muted dark:text-muted-dark mb-1">End date</p>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-violet transition-colors" />
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[13px] font-bold font-display text-text dark:text-text-dark">Workout Schedule</p>
                <p className="text-[11px] text-muted dark:text-muted-dark">This cycle repeats daily over the period</p>
              </div>
              <button onClick={addDay}
                className="text-[11px] font-semibold text-violet flex items-center gap-1 px-3 py-1.5 rounded-full bg-violet/10">
                <Plus size={11} /> Add Day
              </button>
            </div>

            {schedule.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-border dark:border-border-dark rounded-2xl">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-[13px] text-muted dark:text-muted-dark">Add workout days to your schedule</p>
              </div>
            ) : (
              <div className="space-y-2">
                {schedule.map((day, i) => (
                  <ScheduleDayRow key={day.id} day={day} templates={templates}
                    onChange={updateDay} onDelete={deleteDay} index={i} />
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          {sessionCount > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-violet/10 dark:bg-violet/15 border border-violet/30 rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <BarChart3 size={20} className="text-violet shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-violet">
                  {sessionCount} sessions will be generated
                </p>
                <p className="text-[11px] text-violet/70 mt-0.5">
                  {format(parseISO(startDate), 'MMM d')} → {format(parseISO(endDate), 'MMM d, yyyy')}
                  {schedule.length > 0 && ` · ${schedule.length}-day cycle`}
                </p>
              </div>
            </motion.div>
          )}

          <motion.button onClick={generate} whileTap={{ scale: 0.97 }}
            disabled={!canGenerate}
            className={cn('w-full py-3.5 rounded-2xl font-semibold text-[15px] transition-opacity',
              canGenerate ? 'bg-violet text-white' : 'bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark opacity-60')}>
            Generate Program
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Program Card  (shown on workouts page)
══════════════════════════════════════════════ */
function ProgramCard({ program, onClick }: { program: WorkoutProgram; onClick: () => void }) {
  const { workouts } = useAppStore();
  const today = todayStr();
  const sessions = workouts.filter(w => w.programId === program.id);
  const doneCount = sessions.filter(w => w.date <= today || w.completed).length;
  const pct = sessions.length > 0 ? doneCount / sessions.length : 0;

  const isActive = program.startDate <= today && program.endDate >= today;
  const isPast   = program.endDate < today;
  const statusColor = isPast ? '#3EC99A' : isActive ? '#7C6EF8' : '#5BAFEF';
  const statusLabel = isPast ? 'Completed' : isActive ? 'Active' : 'Upcoming';

  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.98 }}
      className="w-full text-left bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-4"
      style={{ borderLeftColor: statusColor, borderLeftWidth: 3 }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-[15px] font-bold font-display text-text dark:text-text-dark truncate">{program.name}</p>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
              style={{ color: statusColor, backgroundColor: statusColor + '18' }}>
              {statusLabel}
            </span>
          </div>
          <p className="text-[11px] text-muted dark:text-muted-dark">
            {format(parseISO(program.startDate), 'MMM d')} → {format(parseISO(program.endDate), 'MMM d, yyyy')}
          </p>
        </div>
        <ChevronRight size={16} className="text-muted dark:text-muted-dark shrink-0 mt-1 ml-2" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted dark:text-muted-dark">{doneCount}/{sessions.length} sessions</span>
          <span className="text-[11px] font-bold" style={{ color: statusColor }}>{Math.round(pct * 100)}%</span>
        </div>
        <div className="h-1.5 bg-surface-2 dark:bg-surface-2-dark rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ backgroundColor: statusColor }}
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }} />
        </div>
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════
   Program Detail Sheet
══════════════════════════════════════════════ */
function ProgramDetailSheet({ program, onClose }: {
  program: WorkoutProgram;
  onClose: () => void;
}) {
  const { workouts, toggleWorkoutCompleted, skipWorkout, pushWorkout } = useAppStore();
  const today = todayStr();

  // Always read live state — sessions will reflect skip/push immediately
  const sessions = workouts
    .filter(w => w.programId === program.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const doneCount = sessions.filter(w => (w.date < today || w.completed) && !w.skipped).length;

  // Which session row is currently expanded to show skip/push actions
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Workout detail opened from inside this sheet (z-[60] so it layers on top)
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);

  return (
    <>
      <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-violet no-scrollbar"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}>

          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>

          <div className="px-5 pb-[88px]">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold font-display text-text dark:text-text-dark">{program.name}</h2>
                <p className="text-[12px] text-muted dark:text-muted-dark">
                  {format(parseISO(program.startDate), 'MMM d')} → {format(parseISO(program.endDate), 'MMM d, yyyy')}
                  {' · '}{program.schedule.length}-day cycle
                </p>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center shrink-0 ml-2">
                <X size={14} className="text-muted dark:text-muted-dark" />
              </button>
            </div>

            {/* Progress */}
            <div className="bg-violet/10 dark:bg-violet/15 rounded-2xl px-4 py-3 mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-semibold text-violet">{doneCount}/{sessions.length} completed</span>
                <span className="text-[12px] font-bold text-violet">
                  {sessions.length > 0 ? Math.round((doneCount / sessions.length) * 100) : 0}%
                </span>
              </div>
              <div className="h-2 bg-violet/20 rounded-full overflow-hidden">
                <motion.div className="h-full bg-violet rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${sessions.length > 0 ? (doneCount / sessions.length) * 100 : 0}%` }}
                  transition={{ duration: 0.6 }} />
              </div>
            </div>

            {/* Session list */}
            <p className="text-[12px] font-semibold text-text dark:text-text-dark font-display mb-1">
              Sessions ({sessions.length})
            </p>
            <p className="text-[10px] text-muted dark:text-muted-dark mb-3">Tap a session to skip or reschedule it</p>

            <div className="space-y-2">
              {sessions.map(w => {
                const isToday    = w.date === today;
                const isPast     = w.date < today;
                const isDone     = (isPast || w.completed) && !w.skipped;
                const isSkipped  = !!w.skipped;
                const isExpanded = expandedId === w.id;
                const cfg        = typeConfig[w.type];

                return (
                  <div key={w.id}
                    className={cn('rounded-xl border overflow-hidden transition-opacity',
                      isToday  ? 'bg-violet/10 dark:bg-violet/15 border-violet/30'
                      : isSkipped ? 'bg-surface-2 dark:bg-surface-2-dark border-border dark:border-border-dark opacity-60'
                      : isDone ? 'bg-surface-2 dark:bg-surface-2-dark border-border dark:border-border-dark opacity-70'
                                : 'bg-surface dark:bg-surface-dark border-border dark:border-border-dark'
                    )}>
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      {/* Done / skipped indicator */}
                      {isSkipped ? (
                        <div className="w-6 h-6 rounded-full bg-coral/20 flex items-center justify-center shrink-0">
                          <Ban size={11} className="text-coral" />
                        </div>
                      ) : (
                        <button onClick={() => toggleWorkoutCompleted(w.id)}
                          className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                          style={{
                            borderColor: isDone ? cfg.color : cfg.color + '50',
                            backgroundColor: isDone ? cfg.color : 'transparent',
                          }}>
                          {isDone && <Check size={11} className="text-white" strokeWidth={3} />}
                        </button>
                      )}

                      {/* Info — tap to expand actions */}
                      <button className="flex-1 min-w-0 text-left"
                        onClick={() => setExpandedId(isExpanded ? null : w.id)}>
                        <p className={cn('text-[13px] font-medium truncate',
                          isSkipped ? 'line-through text-muted dark:text-muted-dark'
                          : isDone && !isToday ? 'text-muted dark:text-muted-dark'
                          : 'text-text dark:text-text-dark')}>
                          {w.icon} {w.title}
                        </p>
                        <p className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                          {format(parseISO(w.date), 'EEE, MMM d')}
                          {w.startTime && ` · ${formatDisplayTime(w.startTime)}`}
                          {` · ${formatDuration(w.durationMinutes)}`}
                          {w.pushedFrom && <span style={{ color: '#5BAFEF' }}> · rescheduled</span>}
                        </p>
                      </button>

                      {/* Right badges */}
                      {isSkipped && (
                        <span className="text-[10px] font-bold text-coral bg-coral/15 px-2 py-0.5 rounded-full shrink-0">Skipped</span>
                      )}
                      {!isSkipped && isToday && (
                        <span className="text-[10px] font-bold text-violet bg-violet/15 px-2 py-0.5 rounded-full shrink-0">Today</span>
                      )}
                      {!isSkipped && !isDone && !isToday && (
                        <Clock size={13} className="text-muted dark:text-muted-dark shrink-0" />
                      )}
                    </div>

                    {/* Expandable skip / push actions */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="overflow-hidden">
                          <div className="px-3 pb-3 pt-1 flex gap-2 border-t border-border/40 dark:border-border-dark/40">
                            {!isSkipped ? (
                              <>
                                {/* Skip */}
                                <button
                                  onClick={() => { skipWorkout(w.id); setExpandedId(null); }}
                                  className="flex-1 py-2.5 rounded-xl bg-coral/10 text-coral text-[12px] font-semibold flex items-center justify-center gap-1.5">
                                  <Ban size={13} /> Skip
                                </button>
                                {/* Push +1 */}
                                <button
                                  onClick={() => { pushWorkout(w.id, 1); setExpandedId(null); }}
                                  className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1"
                                  style={{ backgroundColor: '#5BAFEF18', color: '#5BAFEF' }}>
                                  <ChevronsRight size={13} /> +1 Day
                                </button>
                                {/* Push +2 */}
                                <button
                                  onClick={() => { pushWorkout(w.id, 2); setExpandedId(null); }}
                                  className="flex-1 py-2.5 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1"
                                  style={{ backgroundColor: '#5BAFEF18', color: '#5BAFEF' }}>
                                  <ChevronsRight size={13} /> +2 Days
                                </button>
                              </>
                            ) : (
                              /* Undo skip */
                              <button
                                onClick={() => { skipWorkout(w.id); setExpandedId(null); }}
                                className="flex-1 py-2.5 rounded-xl bg-surface dark:bg-surface-dark text-[12px] font-semibold text-text dark:text-text-dark flex items-center justify-center gap-1.5">
                                Undo Skip
                              </button>
                            )}
                            {/* View detail */}
                            <button
                              onClick={() => { setViewingWorkout(w); setExpandedId(null); }}
                              className="px-3 py-2.5 rounded-xl bg-surface dark:bg-surface-dark text-[12px] font-semibold text-muted dark:text-muted-dark flex items-center justify-center">
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Workout detail layered on top of the program detail */}
      <AnimatePresence>
        {viewingWorkout && (
          <WorkoutDetail
            workout={viewingWorkout}
            onClose={() => setViewingWorkout(null)}
            zIndex={60}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════
   Workout Card
══════════════════════════════════════════════ */
function WorkoutCard({ workout, onClick }: { workout: Workout; onClick: () => void }) {
  const cfg      = typeConfig[workout.type];
  const skipped  = !!workout.skipped;
  const rescheduled = !!workout.pushedFrom;

  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.98 }}
      className={cn(
        'w-full text-left bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-4 flex items-center gap-3',
        skipped && 'opacity-50',
      )}
      style={{ borderLeftColor: skipped ? '#888' : cfg.color, borderLeftWidth: 3 }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
        style={{ backgroundColor: (skipped ? '#888' : cfg.color) + '18' }}>
        {workout.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[14px] font-semibold font-display',
          skipped ? 'line-through text-muted dark:text-muted-dark' : 'text-text dark:text-text-dark')}>
          {workout.title}
        </p>
        <p className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
          {formatRelativeDate(workout.date)}
          {workout.startTime && ` · ${formatDisplayTime(workout.startTime)}`}
          {` · ${formatDuration(workout.durationMinutes)}`}
          {workout.exercises.length > 0 && ` · ${workout.exercises.length} exercise${workout.exercises.length > 1 ? 's' : ''}`}
          {rescheduled && ` · rescheduled from ${formatRelativeDate(workout.pushedFrom!)}`}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {skipped ? (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-coral bg-coral/15">
            Skipped
          </span>
        ) : (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ color: cfg.color, backgroundColor: cfg.color + '18' }}>
            {cfg.label}
          </span>
        )}
        <ChevronRight size={14} className="text-muted dark:text-muted-dark" />
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════
   Edit Workout Sheet
══════════════════════════════════════════════ */
function EditWorkoutSheet({ initial, onClose, zIndex = 60 }: {
  initial: Workout;
  onClose: () => void;
  zIndex?: number;
}) {
  const { updateWorkout } = useAppStore();

  const [title,     setTitle]     = useState(initial.title);
  const [type,      setType]      = useState<Workout['type']>(initial.type);
  const [date,      setDate]      = useState(initial.date);
  const [startTime, setStartTime] = useState(initial.startTime ?? '');
  const [duration,  setDuration]  = useState(
    initial.durationMinutes != null ? String(initial.durationMinutes) : ''
  );
  const [notes,     setNotes]     = useState(initial.notes ?? '');
  const [exercises, setExercises] = useState<ExerciseState[]>(
    initial.exercises.length
      ? initial.exercises.map(templateToState)
      : [blankExercise()]
  );

  const addEx    = () => setExercises(p => [...p, blankExercise()]);
  const updateEx = (key: string, field: keyof ExerciseState, val: string) =>
    setExercises(p => p.map(e => e.key === key ? { ...e, [field]: val } : e));
  const deleteEx = (key: string) => setExercises(p => p.filter(e => e.key !== key));

  const save = () => {
    if (!title.trim()) return;
    const cfg = typeConfig[type];
    updateWorkout({
      ...initial,
      title: title.trim(),
      type,
      icon: cfg.icon,
      date,
      startTime: startTime || undefined,
      durationMinutes: duration !== '' ? Number(duration) : initial.durationMinutes,
      notes: notes.trim() || undefined,
      exercises: exercises.filter(e => e.name.trim()).map(stateToExercise),
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-orange no-scrollbar"
        style={{ maxHeight: '93vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}>

        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5">
          <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">Edit Workout</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[88px] space-y-4">
          {/* Type */}
          <div className="grid grid-cols-4 gap-2">
            {(Object.entries(typeConfig) as [Workout['type'], typeof typeConfig[keyof typeof typeConfig]][]).map(([k, cfg]) => (
              <button key={k} onClick={() => setType(k)}
                className={cn('flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all',
                  type === k ? 'border-orange bg-orange/10' : 'border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark')}>
                <span className="text-xl">{cfg.icon}</span>
                <span className="text-[9px] font-semibold text-muted dark:text-muted-dark">{cfg.label}</span>
              </button>
            ))}
          </div>

          {/* Title */}
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Workout name"
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[15px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none border-2 border-transparent focus:border-orange transition-colors" />

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Calendar size={10} /> Date
              </p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-orange transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-1.5 uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> Start time
              </p>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-orange transition-colors" />
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
            <Timer size={16} className="text-muted dark:text-muted-dark shrink-0" />
            <input type="number" inputMode="numeric" value={duration} onChange={e => setDuration(e.target.value)}
              placeholder="Duration"
              className="flex-1 bg-transparent text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none" />
            <span className="text-[12px] text-muted dark:text-muted-dark">min</span>
          </div>

          {/* Exercises */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] font-semibold text-text dark:text-text-dark font-display">
                Exercises <span className="text-muted dark:text-muted-dark font-normal">({exercises.length})</span>
              </p>
              <button onClick={addEx} className="text-[11px] font-semibold text-accent dark:text-violet flex items-center gap-1">
                <Plus size={12} /> Add exercise
              </button>
            </div>
            <div className="space-y-2">
              {exercises.map(ex => <ExerciseRow key={ex.key} ex={ex} onChange={updateEx} onDelete={deleteEx} />)}
            </div>
          </div>

          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" rows={2}
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[13px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none resize-none border-2 border-transparent focus:border-orange transition-colors" />

          <motion.button onClick={save} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-orange text-white font-semibold text-[15px]">
            Save Changes
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Workout Detail Sheet
══════════════════════════════════════════════ */
function WorkoutDetail({ workout: initialWorkout, onClose, zIndex = 50 }: {
  workout: Workout;
  onClose: () => void;
  zIndex?: number;
}) {
  const { workouts, skipWorkout, pushWorkout } = useAppStore();
  const [showEdit, setShowEdit] = useState(false);
  // Always read the latest state so skip/push reflect immediately
  const workout = workouts.find(w => w.id === initialWorkout.id) ?? initialWorkout;
  const cfg     = typeConfig[workout.type];

  return (
    <>
      <motion.div className="fixed inset-0 flex flex-col justify-end"
        style={{ zIndex }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <motion.div className="relative bg-surface dark:bg-surface-dark rounded-t-3xl no-scrollbar"
          style={{ maxHeight: '88vh', overflowY: 'auto', borderTop: `4px solid ${workout.skipped ? '#888' : cfg.color}` }}
          initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 380, damping: 40 }}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
          <div className="px-5 pb-[88px]">

            {/* Skipped banner */}
            {workout.skipped && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2.5 bg-coral/10 rounded-2xl px-4 py-3 mb-4">
                <Ban size={16} className="text-coral shrink-0" />
                <span className="text-[13px] font-semibold text-coral flex-1">This workout was skipped</span>
                <button onClick={() => skipWorkout(workout.id)}
                  className="text-[12px] font-semibold text-text dark:text-text-dark">
                  Undo
                </button>
              </motion.div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ backgroundColor: (workout.skipped ? '#888' : cfg.color) + '20' }}>
                  {workout.icon}
                </div>
                <div>
                  <h2 className={cn('text-xl font-bold font-display',
                    workout.skipped ? 'line-through text-muted dark:text-muted-dark' : 'text-text dark:text-text-dark')}>
                    {workout.title}
                  </h2>
                  <p className="text-[12px] text-muted dark:text-muted-dark">
                    {formatRelativeDate(workout.date)}
                    {workout.startTime && ` · ${formatDisplayTime(workout.startTime)}`}
                    {` · ${formatDuration(workout.durationMinutes)}`}
                  </p>
                  {workout.pushedFrom && (
                    <p className="text-[11px] mt-0.5" style={{ color: '#5BAFEF' }}>
                      Rescheduled from {formatRelativeDate(workout.pushedFrom)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setShowEdit(true)}
                  className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                  <Pencil size={13} className="text-muted dark:text-muted-dark" />
                </button>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                  <X size={14} className="text-muted dark:text-muted-dark" />
                </button>
              </div>
            </div>

          {workout.notes && (
            <p className="text-[13px] text-muted dark:text-muted-dark italic mb-4 px-1">"{workout.notes}"</p>
          )}

          {workout.exercises.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-text dark:text-text-dark font-display mb-3">
                Exercises ({workout.exercises.length})
              </p>
              <div className="space-y-2">
                {workout.exercises.map((ex, i) => (
                  <div key={ex.id ?? i}
                    className="flex items-center justify-between bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[12px] font-bold text-muted dark:text-muted-dark w-5 text-center">{i + 1}</span>
                      <p className="text-[13px] font-medium text-text dark:text-text-dark">{ex.name}</p>
                    </div>
                    <p className="text-[12px] text-muted dark:text-muted-dark ml-2">
                      {ex.sets && ex.reps
                        ? `${ex.sets}×${ex.reps}${ex.weightKg ? ` @ ${ex.weightKg}kg` : ''}`
                        : ex.durationSeconds
                        ? `${Math.floor(ex.durationSeconds / 60)}min`
                        : '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Skip / Push actions ── */}
          {!workout.skipped && (
            <div className="mt-5 pt-4 border-t border-border dark:border-border-dark">
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-3 flex items-center gap-1.5">
                Can't make it?
              </p>
              <div className="flex gap-2">
                {/* Skip */}
                <motion.button
                  onClick={() => { skipWorkout(workout.id); onClose(); }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl bg-coral/10 text-coral text-[13px] font-semibold flex items-center justify-center gap-2">
                  <Ban size={15} /> Skip
                </motion.button>

                {/* Push +1 */}
                <motion.button
                  onClick={() => { pushWorkout(workout.id, 1); onClose(); }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#5BAFEF18', color: '#5BAFEF' }}>
                  <ChevronsRight size={15} /> +1 Day
                </motion.button>

                {/* Push +2 */}
                <motion.button
                  onClick={() => { pushWorkout(workout.id, 2); onClose(); }}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#5BAFEF18', color: '#5BAFEF' }}>
                  <ChevronsRight size={15} /> +2 Days
                </motion.button>
              </div>

              {workout.programId && (
                <p className="text-[10px] text-muted dark:text-muted-dark text-center mt-2">
                  Pushing will reschedule all remaining sessions in this program
                </p>
              )}
            </div>
          )}
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showEdit && (
          <EditWorkoutSheet
            initial={workout}
            onClose={() => setShowEdit(false)}
            zIndex={zIndex + 10}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ══════════════════════════════════════════════
   Workouts Page
══════════════════════════════════════════════ */
export default function WorkoutsPage() {
  const { workouts, programs } = useAppStore();
  const today = todayStr();

  const [showLog,             setShowLog]             = useState(false);
  const [showProgram,         setShowProgram]         = useState(false);
  const [showManageTemplates, setShowManageTemplates] = useState(false);
  const [selectedWorkout,     setSelectedWorkout]     = useState<Workout | null>(null);
  const [selectedProgram,     setSelectedProgram]     = useState<WorkoutProgram | null>(null);

  /* History = workouts not from a future program session */
  const historyWorkouts = workouts.filter(w => !w.programId || w.date <= today);

  const weeks: { label: string; workouts: Workout[] }[] = [];
  historyWorkouts.forEach(w => {
    const label = formatWeekLabel(w.date);
    const existing = weeks.find(wk => wk.label === label);
    if (existing) existing.workouts.push(w);
    else weeks.push({ label, workouts: [w] });
  });

  const thisWeekCount = workouts.filter(w =>
    isSameWeek(parseISO(w.date), new Date(), { weekStartsOn: 1 }) && !w.programId
  ).length + workouts.filter(w =>
    isSameWeek(parseISO(w.date), new Date(), { weekStartsOn: 1 }) && !!w.programId && w.date <= today
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">Workouts</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <p className="text-[13px] text-muted dark:text-muted-dark">{thisWeekCount} sessions this week</p>
              <button onClick={() => setShowManageTemplates(true)}
                className="text-[11px] text-accent dark:text-violet font-medium flex items-center gap-1">
                <Pencil size={10} /> Manage templates
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button onClick={() => setShowProgram(true)} whileTap={{ scale: 0.92 }}
              className="px-3.5 py-2.5 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-[13px] font-semibold text-text dark:text-text-dark">
              Program
            </motion.button>
            <motion.button onClick={() => setShowLog(true)} whileTap={{ scale: 0.92 }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-orange text-white font-semibold text-[13px]"
              style={{ boxShadow: '0 4px 12px rgba(249,115,22,0.35)' }}>
              <Plus size={16} strokeWidth={2.5} /> Log
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div className="grid grid-cols-3 gap-2.5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        {[
          { icon: '💪', label: 'Sessions',   value: thisWeekCount },
          { icon: '⏱️', label: 'Total time', value: `${historyWorkouts.slice(0, Math.max(thisWeekCount, 1)).reduce((a, w) => a + w.durationMinutes, 0)}m` },
          { icon: '🔥', label: 'Exercises',  value: historyWorkouts.slice(0, Math.max(thisWeekCount, 1)).reduce((a, w) => a + w.exercises.length, 0) },
        ].map(s => (
          <div key={s.label} className="bg-surface dark:bg-surface-dark rounded-2xl p-3 border border-border dark:border-border-dark text-center">
            <span className="text-xl">{s.icon}</span>
            <p className="text-xl font-bold font-display text-orange mt-1">{s.value}</p>
            <p className="text-[10px] text-muted dark:text-muted-dark font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Active Programs */}
      {programs.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-[12px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider">Programs</h2>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>
          <div className="space-y-2.5">
            {programs.map(p => (
              <ProgramCard key={p.id} program={p} onClick={() => setSelectedProgram(p)} />
            ))}
          </div>
        </motion.div>
      )}

      {/* History */}
      <div className="space-y-5">
        {weeks.length > 0 && (
          <div className="flex items-center gap-3">
            <h2 className="text-[12px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider">History</h2>
            <div className="flex-1 h-px bg-border dark:bg-border-dark" />
          </div>
        )}
        {weeks.map((week, wi) => (
          <motion.div key={week.label}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + wi * 0.04 }}>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark">{week.label}</p>
              <div className="flex-1 h-px bg-border/50 dark:bg-border-dark/50" />
            </div>
            <div className="space-y-2.5">
              {week.workouts.map(w => (
                <WorkoutCard key={w.id} workout={w} onClick={() => setSelectedWorkout(w)} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showLog              && <LogWorkoutSheet             onClose={() => setShowLog(false)} />}
        {showProgram          && <ProgramSheet                onClose={() => setShowProgram(false)} />}
        {showManageTemplates  && <ManageTemplatesSheet        onClose={() => setShowManageTemplates(false)} />}
        {selectedWorkout      && <WorkoutDetail               workout={selectedWorkout}  onClose={() => setSelectedWorkout(null)} />}
        {selectedProgram      && (
          <ProgramDetailSheet
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Plus, Check, Trash2, Pencil, X, Clock, Calendar, RotateCcw, ChevronRight, Flag } from 'lucide-react';
import { type Task } from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { cn, formatRelativeDate, priorityConfig, formatDisplayTime } from '@/lib/utils';

/* ─── Confetti ─── */
const CONFETTI_COLORS = ['#7C6EF8', '#3EC99A', '#FF7B72', '#F5A524', '#5BAFEF'];
function Confetti({ active, x, y }: { active: boolean; x: number; y: number }) {
  if (!active) return null;
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    id: i, dx: (Math.random() - 0.5) * 250, dy: -(Math.random() * 160 + 40),
    rotate: Math.random() * 720, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
  return (
    <div className="fixed pointer-events-none z-[100]" style={{ left: x, top: y }}>
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute w-2 h-2 rounded-[2px]"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.dx, y: p.dy, rotate: p.rotate, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

type Filter = 'all' | 'today' | 'upcoming' | 'done';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All'      },
  { key: 'today',    label: 'Today'    },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'done',     label: 'Done'     },
];

const FREQ_OPTIONS: { key: Task['recurrenceFrequency']; label: string; icon: string }[] = [
  { key: 'daily',    label: 'Daily',    icon: '📅' },
  { key: 'weekdays', label: 'Weekdays', icon: '🗓️' },
  { key: 'weekly',   label: 'Weekly',   icon: '📆' },
  { key: 'monthly',  label: 'Monthly',  icon: '🗒️' },
];

/* ─── Task Detail Sheet ─── */
function TaskDetailSheet({ task, onClose, onEdit, onToggle }: {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const priorityHex = priorityConfig[task.priority].hex;
  const priorityLabel = priorityConfig[task.priority].label;

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl"
        style={{ borderTop: `4px solid ${task.color}`, maxHeight: '75vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        <div className="px-5 pb-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                style={{ backgroundColor: task.color + '20' }}>
                {task.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={cn('text-lg font-bold font-display text-text dark:text-text-dark leading-snug',
                  task.completed && 'line-through text-muted dark:text-muted-dark')}>
                  {task.title}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
              <button onClick={onEdit}
                className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                <Pencil size={13} className="text-muted dark:text-muted-dark" />
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                <X size={14} className="text-muted dark:text-muted-dark" />
              </button>
            </div>
          </div>

          {/* Detail rows */}
          <div className="space-y-2.5 mb-5">
            <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
              <Flag size={15} className="text-muted dark:text-muted-dark shrink-0" />
              <span className="text-[13px] text-muted dark:text-muted-dark">Priority</span>
              <span className="ml-auto text-[12px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ color: priorityHex, backgroundColor: priorityHex + '20' }}>
                {priorityLabel}
              </span>
            </div>

            <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
              <Calendar size={15} className="text-muted dark:text-muted-dark shrink-0" />
              <span className="text-[13px] text-muted dark:text-muted-dark">Due date</span>
              <span className="ml-auto text-[13px] font-medium text-text dark:text-text-dark">
                {formatRelativeDate(task.dueDate)}
              </span>
            </div>

            {task.startTime && (
              <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
                <Clock size={15} className="text-muted dark:text-muted-dark shrink-0" />
                <span className="text-[13px] text-muted dark:text-muted-dark">Time</span>
                <span className="ml-auto text-[13px] font-medium text-text dark:text-text-dark">
                  {formatDisplayTime(task.startTime)}
                  {task.endTime && ` – ${formatDisplayTime(task.endTime)}`}
                </span>
              </div>
            )}

            {task.recurring && (
              <div className="flex items-center gap-3 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
                <RotateCcw size={15} className="text-muted dark:text-muted-dark shrink-0" />
                <span className="text-[13px] text-muted dark:text-muted-dark">Repeats</span>
                <span className="ml-auto text-[13px] font-medium text-text dark:text-text-dark capitalize">
                  {task.recurrenceFrequency ?? 'Daily'}
                </span>
              </div>
            )}

            {task.notes && (
              <div className="bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
                <p className="text-[12px] text-muted dark:text-muted-dark mb-1">Notes</p>
                <p className="text-[13px] text-text dark:text-text-dark">{task.notes}</p>
              </div>
            )}
          </div>

          {/* Complete / Uncomplete */}
          <motion.button
            onClick={() => { onToggle(); onClose(); }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl font-semibold text-[15px] transition-colors"
            style={task.completed
              ? { backgroundColor: '#88888820', color: '#888' }
              : { backgroundColor: task.color, color: '#fff' }}
          >
            {task.completed ? 'Mark as Incomplete' : '✓ Mark as Complete'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Task Form Sheet (Add / Edit) ─── */
function TaskFormSheet({ initial, onClose, onSave }: {
  initial?: Task;
  onClose: () => void;
  onSave: (task: Task) => void;
}) {
  const isEdit = !!initial;
  const [title,      setTitle]      = useState(initial?.title      ?? '');
  const [selectedIcon, setSelectedIcon] = useState(initial?.icon   ?? '📋');
  const [priority,   setPriority]   = useState<Task['priority']>(initial?.priority ?? 'medium');
  const [dueDate,    setDueDate]    = useState(initial?.dueDate     ?? '2025-04-06');
  const [startTime,  setStartTime]  = useState(initial?.startTime  ?? '');
  const [endTime,    setEndTime]    = useState(initial?.endTime     ?? '');
  const [recurring,  setRecurring]  = useState(initial?.recurring  ?? false);
  const [frequency,  setFrequency]  = useState<Task['recurrenceFrequency']>(initial?.recurrenceFrequency ?? 'daily');
  const [notes,      setNotes]      = useState(initial?.notes      ?? '');

  const icons = ['📋', '🎯', '💪', '📚', '🧘', '💼', '🛒', '📞', '🎨', '🔧', '🏃', '🥗', '⚡', '🌿', '🎵'];

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id ?? Date.now().toString(),
      title: title.trim(),
      icon: selectedIcon,
      color: priorityConfig[priority].hex,
      priority,
      dueDate,
      startTime: startTime || undefined,
      endTime:   endTime   || undefined,
      completed: initial?.completed ?? false,
      recurring,
      recurrenceFrequency: recurring ? frequency : undefined,
      notes: notes.trim() || undefined,
      goalId: initial?.goalId,
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-accent dark:border-violet no-scrollbar"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-surface dark:bg-surface-dark z-10">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        <div className="px-5 pb-10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">
              {isEdit ? 'Edit Task' : 'New Task'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>

          {/* Icon picker */}
          <div className="flex gap-2 flex-wrap">
            {icons.map(icon => (
              <button key={icon} onClick={() => setSelectedIcon(icon)}
                className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                  selectedIcon === icon ? 'scale-110' : 'bg-surface-2 dark:bg-surface-2-dark'
                )}
                style={selectedIcon === icon ? { backgroundColor: priorityConfig[priority].hex + '25' } : {}}>
                {icon}
              </button>
            ))}
          </div>

          {/* Title */}
          <input autoFocus={!isEdit} value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && submit()}
            placeholder="What do you want to do?"
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[15px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors" />

          {/* Priority */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Priority</p>
            <div className="flex gap-2">
              {(Object.keys(priorityConfig) as Task['priority'][]).map(p => {
                const cfg = priorityConfig[p];
                const isActive = priority === p;
                return (
                  <button key={p} onClick={() => setPriority(p)}
                    className="flex-1 py-2 rounded-xl text-[12px] font-semibold transition-all bg-surface-2 dark:bg-surface-2-dark"
                    style={isActive ? { color: cfg.hex, backgroundColor: cfg.hex + '22', outline: `2px solid ${cfg.hex}40` } : {}}>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar size={11} /> Date
            </p>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[14px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors" />
          </div>

          {/* Time */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider flex items-center gap-1.5">
              <Clock size={11} /> Time (optional)
            </p>
            <div className="flex gap-2">
              <div className="flex-1">
                <p className="text-[10px] text-muted dark:text-muted-dark mb-1">Start</p>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[14px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-muted dark:text-muted-dark mb-1">End</p>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5 text-[14px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors" />
              </div>
            </div>
          </div>

          {/* Recurring toggle */}
          <div>
            <button onClick={() => setRecurring(r => !r)}
              className="w-full flex items-center justify-between bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <RotateCcw size={16} className="text-muted dark:text-muted-dark" />
                <span className="text-[14px] font-medium text-text dark:text-text-dark">Recurring task</span>
              </div>
              {/* Toggle pill */}
              <div className={cn('w-11 h-6 rounded-full transition-colors flex items-center px-0.5',
                recurring ? 'bg-accent dark:bg-violet' : 'bg-border dark:bg-border-dark')}>
                <motion.div className="w-5 h-5 rounded-full bg-white shadow-sm"
                  animate={{ x: recurring ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
              </div>
            </button>

            <AnimatePresence>
              {recurring && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                  className="overflow-hidden">
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {FREQ_OPTIONS.map(f => (
                      <button key={f.key} onClick={() => setFrequency(f.key)}
                        className={cn('flex items-center gap-2 px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all border-2',
                          frequency === f.key
                            ? 'border-accent dark:border-violet bg-accent/10 dark:bg-violet/10 text-accent dark:text-violet'
                            : 'border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark'
                        )}>
                        <span>{f.icon}</span> {f.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Notes (optional)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add any details..."
              rows={2}
              className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[13px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none resize-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors" />
          </div>

          {/* Submit */}
          <motion.button onClick={submit} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl bg-accent dark:bg-violet text-white font-semibold text-[15px]">
            {isEdit ? 'Save Changes' : 'Add Task'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Swipeable Task Card ─── */
function TaskCard({ task, onToggle, onDelete, onView, onEdit }: {
  task: Task;
  onToggle: (id: string, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  onView:   (task: Task) => void;
  onEdit:   (task: Task) => void;
}) {
  const x = useMotionValue(0);
  const deleteOpacity = useTransform(x, [-110, -50], [1, 0]);
  const editOpacity   = useTransform(x, [50, 110],  [0, 1]);
  const cardOpacity   = useTransform(x, [-110, 0, 110], [0.6, 1, 0.85]);
  const priorityHex   = priorityConfig[task.priority].hex;
  const priorityLabel = priorityConfig[task.priority].label;

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Delete bg (swipe left) */}
      <motion.div className="absolute right-0 top-0 bottom-0 w-20 bg-coral rounded-2xl flex items-center justify-center"
        style={{ opacity: deleteOpacity }}>
        <Trash2 size={20} className="text-white" />
      </motion.div>

      {/* Edit bg (swipe right) */}
      <motion.div className="absolute left-0 top-0 bottom-0 w-20 bg-violet rounded-2xl flex items-center justify-center"
        style={{ opacity: editOpacity }}>
        <Pencil size={20} className="text-white" />
      </motion.div>

      {/* Draggable card — completion button is NOT inside so drag never swallows its tap */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -110, right: 110 }}
        dragElastic={0.05}
        style={{ x, opacity: cardOpacity }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -90) { onDelete(task.id); return; }
          if (info.offset.x >  80) { onEdit(task); }
        }}
        className={cn(
          'bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark',
          'cursor-grab active:cursor-grabbing touch-pan-y',
        )}
      >
        {/* pl-[50px] reserves space for the absolutely-positioned completion button */}
        <div className="flex items-start gap-2 p-3.5 pl-[50px]">
          {/* Tappable area → detail sheet */}
          <button className="flex items-start gap-2 flex-1 min-w-0 text-left" onClick={() => onView(task)}>
            <span className="text-[18px] shrink-0 mt-0.5 leading-none">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <p className={cn('text-[14px] font-medium text-text dark:text-text-dark leading-snug',
                task.completed && 'line-through text-muted dark:text-muted-dark')}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: priorityHex, backgroundColor: priorityHex + '20' }}>
                  {priorityLabel}
                </span>
                <span className="text-[11px] text-muted dark:text-muted-dark">{formatRelativeDate(task.dueDate)}</span>
                {task.startTime && (
                  <span className="text-[11px] text-muted dark:text-muted-dark">· {formatDisplayTime(task.startTime)}</span>
                )}
                {task.recurring && (
                  <span className="text-[11px] text-muted dark:text-muted-dark">· 🔁 {task.recurrenceFrequency ?? ''}</span>
                )}
              </div>
            </div>
            <ChevronRight size={14} className="text-muted dark:text-muted-dark shrink-0 mt-1" />
          </button>
        </div>
      </motion.div>

      {/* Completion button — sits OUTSIDE the draggable motion.div so Framer Motion
          never intercepts its pointer events, regardless of capture/bubble order */}
      <button
        onClick={e => onToggle(task.id, e)}
        className="absolute left-3.5 top-4 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center transition-all duration-200 z-10"
        style={{
          borderColor: task.completed ? task.color : task.color + '70',
          backgroundColor: task.completed ? task.color : 'transparent',
        }}
      >
        <AnimatePresence>
          {task.completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}>
              <Check size={11} className="text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

/* ─── Tasks Page ─── */
export default function TasksPage() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useAppStore();

  const [filter,          setFilter]         = useState<Filter>('today');
  const [priorityFilter,  setPriorityFilter] = useState<Task['priority'] | 'all'>('all');
  const [sortBy,          setSortBy]         = useState<'due' | 'time' | 'priority'>('due');
  const [showAdd,         setShowAdd]        = useState(false);
  const [editingTask,     setEditingTask]    = useState<Task | null>(null);
  const [viewingTask,     setViewingTask]    = useState<Task | null>(null);
  const [confetti,        setConfetti]       = useState<{ x: number; y: number } | null>(null);

  const today = new Date().toISOString().split('T')[0];

  const filteredTasks = tasks
    .filter(t => {
      const passTime = (() => {
        if (filter === 'today')    return t.dueDate === today;
        if (filter === 'upcoming') return t.dueDate > today && !t.completed;
        if (filter === 'done')     return t.completed;
        return true;
      })();
      const passPriority = priorityFilter === 'all' || t.priority === priorityFilter;
      return passTime && passPriority;
    })
    .sort((a, b) => {
      if (sortBy === 'priority') {
        const order: Record<Task['priority'], number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === 'time') {
        const ta = a.startTime ?? '99:99';
        const tb = b.startTime ?? '99:99';
        return ta.localeCompare(tb);
      }
      return a.dueDate.localeCompare(b.dueDate);
    });

  const handleToggle = (id: string, e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const justCompleted = !tasks.find(t => t.id === id)?.completed;
    if (justCompleted) {
      setConfetti({ x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 });
      setTimeout(() => setConfetti(null), 1500);
    }
    toggleTask(id);
  };

  const handleToggleFromDetail = (id: string) => {
    const isCompleting = !tasks.find(t => t.id === id)?.completed;
    toggleTask(id);
    if (isCompleting) {
      setTimeout(() => {
        setConfetti({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
        setTimeout(() => setConfetti(null), 1500);
      }, 200);
    }
  };

  const handleDelete = (id: string) => deleteTask(id);

  const handleSave = (task: Task) => {
    const exists = tasks.find(t => t.id === task.id);
    if (exists) updateTask(task);
    else addTask(task);
  };

  const doneCount  = tasks.filter(t => t.dueDate === today && t.completed).length;
  const totalToday = tasks.filter(t => t.dueDate === today).length;

  return (
    <div className="space-y-5">
      {confetti && <Confetti active={true} x={confetti.x} y={confetti.y} />}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">Tasks</h1>
            <p className="text-[13px] text-muted dark:text-muted-dark mt-0.5">{doneCount}/{totalToday} done today</p>
          </div>
          <motion.button onClick={() => setShowAdd(true)} whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-full bg-accent dark:bg-violet text-white flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(124,110,248,0.35)' }}>
            <Plus size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>

      {/* Filter chips */}
      <motion.div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn('shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200',
              filter === f.key
                ? 'bg-accent dark:bg-violet text-white'
                : 'bg-surface dark:bg-surface-dark text-muted dark:text-muted-dark border border-border dark:border-border-dark'
            )}>
            {f.label}
            {f.key === 'today' && <span className="ml-1.5 text-[10px] opacity-70">{totalToday}</span>}
          </button>
        ))}
      </motion.div>

      {/* Priority filter chips */}
      <motion.div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}>
        {(['all', 'urgent', 'high', 'medium', 'low'] as const).map(p => {
          const isAll    = p === 'all';
          const isActive = priorityFilter === p;
          const hex      = isAll ? '' : priorityConfig[p].hex;
          const label    = isAll ? 'All priorities' : priorityConfig[p].label;
          return (
            <button key={p} onClick={() => setPriorityFilter(p)}
              className={cn('shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200',
                !isActive && 'bg-surface dark:bg-surface-dark text-muted dark:text-muted-dark border border-border dark:border-border-dark'
              )}
              style={isActive
                ? isAll
                  ? { backgroundColor: 'rgba(124,110,248,0.15)', color: '#7C6EF8', outline: '1.5px solid rgba(124,110,248,0.4)' }
                  : { backgroundColor: hex + '22', color: hex, outline: `1.5px solid ${hex}60` }
                : {}
              }>
              {label}
            </button>
          );
        })}
      </motion.div>

      {/* Sort chips */}
      <motion.div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-4 px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.07 }}>
        <span className="shrink-0 text-[10px] font-medium text-muted dark:text-muted-dark self-center pr-1">Sort:</span>
        {([
          { key: 'due',      label: 'Due date' },
          { key: 'time',     label: 'Time'     },
          { key: 'priority', label: 'Priority' },
        ] as const).map(s => (
          <button key={s.key} onClick={() => setSortBy(s.key)}
            className={cn('shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all duration-200',
              sortBy === s.key
                ? 'bg-accent/15 dark:bg-violet/15 text-accent dark:text-violet'
                : 'bg-surface dark:bg-surface-dark text-muted dark:text-muted-dark border border-border dark:border-border-dark'
            )}>
            {s.label}
          </button>
        ))}
      </motion.div>

      {/* Progress bar (today) */}
      {filter === 'today' && totalToday > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted dark:text-muted-dark font-medium">Daily progress</span>
            <span className="text-[11px] font-bold text-accent dark:text-violet">{Math.round((doneCount / totalToday) * 100)}%</span>
          </div>
          <div className="h-2 bg-surface-2 dark:bg-surface-2-dark rounded-full overflow-hidden">
            <motion.div className="h-full rounded-full bg-accent dark:bg-violet"
              initial={{ width: 0 }}
              animate={{ width: `${(doneCount / totalToday) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }} />
          </div>
        </motion.div>
      )}

      {/* Swipe hint */}
      {filteredTasks.length > 0 && (
        <p className="text-[11px] text-muted dark:text-muted-dark text-center">
          ← swipe to delete &nbsp;·&nbsp; swipe to edit →
        </p>
      )}

      {/* Task list */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16">
              <p className="text-4xl mb-3">✨</p>
              <p className="text-[15px] font-semibold text-text dark:text-text-dark font-display">All clear!</p>
              <p className="text-[13px] text-muted dark:text-muted-dark mt-1">
                {filter === 'done' ? 'No completed tasks yet' : 'No tasks here. Add one!'}
              </p>
            </motion.div>
          ) : (
            filteredTasks.map((task, i) => (
              <motion.div key={task.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -60, scale: 0.95 }}
                transition={{ delay: i * 0.03 }} layout>
                <TaskCard
                  task={task}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onView={t => setViewingTask(t)}
                  onEdit={t => setEditingTask(t)}
                />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {showAdd && (
          <TaskFormSheet onClose={() => setShowAdd(false)} onSave={handleSave} />
        )}
        {editingTask && (
          <TaskFormSheet
            key={editingTask.id}
            initial={editingTask}
            onClose={() => setEditingTask(null)}
            onSave={t => { handleSave(t); setEditingTask(null); }}
          />
        )}
        {viewingTask && !editingTask && (
          <TaskDetailSheet
            task={tasks.find(t => t.id === viewingTask.id) ?? viewingTask}
            onClose={() => setViewingTask(null)}
            onEdit={() => { setEditingTask(viewingTask); setViewingTask(null); }}
            onToggle={() => handleToggleFromDetail(viewingTask.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

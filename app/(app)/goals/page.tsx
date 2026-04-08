'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Check, ChevronRight, X, Flame, Pencil } from 'lucide-react';
import { type Goal, type Milestone } from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { computeGoalStreak } from '@/lib/streak';
import { cn } from '@/lib/utils';

const PRESET_COLORS = ['#7C6EF8', '#3EC99A', '#FF7B72', '#F5A524', '#5BAFEF', '#F07FC6', '#94A3B8'];
const PRESET_ICONS  = ['🎯', '🏃', '📚', '💪', '🧘', '🚀', '💰', '🎨', '🌱', '❤️', '🏋️', '🎵', '🌍', '🔥', '⚡', '🏆', '🛡️', '📖', '✈️', '🧠'];

/* ─── Progress Ring ─── */
function ProgressRing({ progress, size = 52, color }: { progress: number; size?: number; color: string }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(progress, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-surface-2 dark:text-surface-2-dark" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

/* ─── Confetti ─── */
const CONFETTI_COLORS = ['#7C6EF8', '#3EC99A', '#FF7B72', '#F5A524', '#5BAFEF'];
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 24 }, (_, i) => ({
    id: i, x: (Math.random() - 0.5) * 280, y: -(Math.random() * 180 + 50),
    rotate: Math.random() * 720, color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute w-2.5 h-2.5 rounded-[2px]"
          style={{ backgroundColor: p.color }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0 }}
          transition={{ duration: 1.3, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ─── Goal Form Sheet (Add / Edit) ─── */
function GoalFormSheet({ initial, onClose, zIndex = 50 }: {
  initial?: Goal;
  onClose: () => void;
  zIndex?: number;
}) {
  const { addGoal, updateGoal } = useAppStore();
  const isEdit = !!initial;

  const [title,       setTitle]       = useState(initial?.title       ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [icon,        setIcon]        = useState(initial?.icon        ?? '🎯');
  const [color,       setColor]       = useState(initial?.color       ?? PRESET_COLORS[0]);
  const [targetDate,  setTargetDate]  = useState(initial?.targetDate  ?? '');
  const [status,      setStatus]      = useState<Goal['status']>(initial?.status ?? 'active');
  const [milestones,  setMilestones]  = useState<Milestone[]>(initial?.milestones ?? []);
  const [newMilestone, setNewMilestone] = useState('');
  const milestoneInputRef = useRef<HTMLInputElement>(null);

  const addMilestone = () => {
    const title = newMilestone.trim();
    if (!title) return;
    setMilestones(prev => [...prev, {
      id: `m-${Date.now()}-${Math.random()}`,
      title,
      completed: false,
    }]);
    setNewMilestone('');
    milestoneInputRef.current?.focus();
  };

  const deleteMilestone = (id: string) => setMilestones(prev => prev.filter(m => m.id !== id));

  const save = () => {
    if (!title.trim()) return;
    if (isEdit && initial) {
      updateGoal({
        ...initial,
        title: title.trim(),
        description: description.trim(),
        icon,
        color,
        targetDate,
        status,
        milestones: milestones.map(m => ({
          ...m,
          // preserve completedAt from original if milestone still exists
          completedAt: initial.milestones.find(om => om.id === m.id)?.completedAt ?? m.completedAt,
        })),
      });
    } else {
      addGoal({
        id: `goal-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        icon,
        color,
        targetDate,
        status,
        milestones,
        streak: { current: 0, longest: 0 },
      });
    }
    onClose();
  };

  const inputCls = 'w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[14px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors placeholder:text-muted dark:placeholder:text-muted-dark';

  return (
    <motion.div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[92vh] overflow-y-auto no-scrollbar"
        style={{ borderTop: `4px solid ${color}` }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">
              {isEdit ? 'Edit Goal' : 'New Goal'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-10 space-y-4">
          {/* Color palette */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Color</p>
            <div className="flex gap-2.5 flex-wrap">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-all flex items-center justify-center"
                  style={{ backgroundColor: c }}>
                  {color === c && <Check size={14} className="text-white" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Icon</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map(em => (
                <button key={em} onClick={() => setIcon(em)}
                  className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                    icon === em ? 'scale-110' : 'bg-surface-2 dark:bg-surface-2-dark'
                  )}
                  style={icon === em ? { backgroundColor: color + '25' } : {}}>
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <input
            autoFocus={!isEdit}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="Goal title"
            className={inputCls}
          />

          {/* Description */}
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={cn(inputCls, 'resize-none')}
          />

          {/* Target date */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Target date</p>
            <input
              type="date"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Status */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Status</p>
            <div className="flex gap-2">
              {(['active', 'paused', 'completed'] as Goal['status'][]).map(s => (
                <button key={s} onClick={() => setStatus(s)}
                  className={cn('flex-1 py-2 rounded-xl text-[12px] font-semibold capitalize transition-all bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark')}
                  style={status === s ? { color: color, backgroundColor: color + '22', outline: `1.5px solid ${color}60` } : {}}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark mb-2 uppercase tracking-wider">Milestones</p>

            {milestones.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {milestones.map(m => (
                  <div key={m.id}
                    className="flex items-center gap-2.5 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-3 py-2.5">
                    <div className="w-4 h-4 rounded-full border-2 shrink-0"
                      style={{ borderColor: color, backgroundColor: m.completed ? color : 'transparent' }} />
                    <span className={cn('text-[13px] font-medium flex-1 text-text dark:text-text-dark', m.completed && 'line-through text-muted dark:text-muted-dark')}>
                      {m.title}
                    </span>
                    <button onClick={() => deleteMilestone(m.id)}
                      className="text-muted dark:text-muted-dark hover:text-coral transition-colors p-0.5">
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add milestone input */}
            <div className="flex gap-2">
              <input
                ref={milestoneInputRef}
                value={newMilestone}
                onChange={e => setNewMilestone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addMilestone()}
                placeholder="Add a milestone..."
                className="flex-1 bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-2.5 text-[13px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors placeholder:text-muted dark:placeholder:text-muted-dark"
              />
              <button onClick={addMilestone}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg font-bold shrink-0"
                style={{ backgroundColor: color }}>
                +
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button onClick={save} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px]"
            style={{ backgroundColor: color }}>
            {isEdit ? 'Save Changes' : 'Add Goal'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Goal Detail Sheet ─── */
function GoalSheet({ goal, onClose, onMilestoneToggle, onEdit }: {
  goal: Goal;
  onClose: () => void;
  onMilestoneToggle: (goalId: string, milestoneId: string) => void;
  onEdit: () => void;
}) {
  const { deleteGoal } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const progress = goal.milestones.length > 0
    ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100)
    : 0;

  const handleDelete = () => {
    deleteGoal(goal.id);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

      {/* Sheet */}
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t border-border dark:border-border-dark max-h-[85vh] overflow-y-auto no-scrollbar"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        style={{ borderTopColor: goal.color, borderTopWidth: 4 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        <div className="px-5 pb-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: goal.color + '20' }}>
                {goal.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold font-display text-text dark:text-text-dark">{goal.title}</h2>
                <p className="text-[12px] text-muted dark:text-muted-dark">{goal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
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

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-3 text-center">
              <div className="flex justify-center mb-1">
                <ProgressRing progress={progress} size={44} color={goal.color} />
              </div>
              <p className="text-[13px] font-bold text-text dark:text-text-dark">{progress}%</p>
              <p className="text-[10px] text-muted dark:text-muted-dark">Progress</p>
            </div>
            <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-3 text-center flex flex-col items-center justify-center">
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2.5, repeat: Infinity }} className="text-2xl">🔥</motion.span>
              <p className="text-[15px] font-bold mt-1" style={{ color: goal.color }}>{goal.streak.current}</p>
              <p className="text-[10px] text-muted dark:text-muted-dark">Current</p>
            </div>
            <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-3 text-center flex flex-col items-center justify-center">
              <span className="text-2xl">🏆</span>
              <p className="text-[15px] font-bold mt-1 text-text dark:text-text-dark">{goal.streak.longest}</p>
              <p className="text-[10px] text-muted dark:text-muted-dark">Best</p>
            </div>
          </div>

          {/* Milestones */}
          {goal.milestones.length > 0 && (
            <>
              <h3 className="text-[13px] font-semibold text-text dark:text-text-dark mb-3 font-display">Milestones</h3>
              <div className="space-y-2">
                {goal.milestones.map(m => (
                  <motion.button
                    key={m.id}
                    onClick={() => onMilestoneToggle(goal.id, m.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-surface-2 dark:bg-surface-2-dark text-left transition-all"
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-300"
                      style={{
                        borderColor: m.completed ? goal.color : goal.color + '50',
                        backgroundColor: m.completed ? goal.color : 'transparent',
                      }}
                    >
                      <AnimatePresence>
                        {m.completed && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <span className={cn('text-[13px] font-medium text-text dark:text-text-dark flex-1', m.completed && 'line-through text-muted dark:text-muted-dark')}>
                      {m.title}
                    </span>
                    {m.completedAt && (
                      <span className="text-[10px] text-muted dark:text-muted-dark">{m.completedAt}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            </>
          )}

          {/* Delete section */}
          <div className="mt-6">
            {confirmDelete ? (
              <div className="flex gap-2">
                <motion.button
                  onClick={handleDelete}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl bg-coral text-white font-semibold text-[14px]">
                  Confirm Delete
                </motion.button>
                <motion.button
                  onClick={() => setConfirmDelete(false)}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark font-semibold text-[14px]">
                  Cancel
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={() => setConfirmDelete(true)}
                whileTap={{ scale: 0.97 }}
                className="w-full py-3 rounded-2xl bg-coral/10 text-coral font-semibold text-[14px]">
                Delete Goal
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Goal Card ─── */
function GoalCard({ goal, onClick }: { goal: Goal; onClick: () => void }) {
  const progress = goal.milestones.length > 0
    ? Math.round((goal.milestones.filter(m => m.completed).length / goal.milestones.length) * 100)
    : 0;
  const completed = goal.milestones.filter(m => m.completed).length;

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden"
      style={{ borderTopColor: goal.color, borderTopWidth: 3 }}
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: goal.color + '18' }}>
              {goal.icon}
            </div>
            <div>
              <h3 className="text-[14px] font-semibold font-display text-text dark:text-text-dark leading-tight">{goal.title}</h3>
              <p className="text-[11px] text-muted dark:text-muted-dark mt-0.5">
                {goal.milestones.length > 0
                  ? `${completed}/${goal.milestones.length} milestones`
                  : 'No milestones yet'}
              </p>
            </div>
          </div>
          <ProgressRing progress={progress} size={44} color={goal.color} />
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-surface-2 dark:bg-surface-2-dark rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: goal.color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <motion.span
              animate={goal.streak.current > 0 ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-sm"
            >
              🔥
            </motion.span>
            <span className="text-[12px] font-bold" style={{ color: goal.color }}>{goal.streak.current}</span>
            <span className="text-[11px] text-muted dark:text-muted-dark">day streak</span>
            {goal.streak.current > 0 && goal.streak.current === goal.streak.longest && (
              <span className="text-[10px] bg-amber/15 text-amber px-1.5 py-0.5 rounded-full font-semibold">Best!</span>
            )}
          </div>
          <ChevronRight size={14} className="text-muted dark:text-muted-dark" />
        </div>
      </div>
    </motion.button>
  );
}

/* ─── Goals Page ─── */
export default function GoalsPage() {
  const { goals, updateGoal } = useAppStore();
  const [selectedGoal,  setSelectedGoal]  = useState<Goal | null>(null);
  const [editingGoal,   setEditingGoal]   = useState<Goal | null>(null);
  const [showAdd,       setShowAdd]       = useState(false);
  const [showConfetti,  setShowConfetti]  = useState(false);

  const handleMilestoneToggle = (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const today = new Date().toISOString().split('T')[0];
    const justCompleted = !goal.milestones.find(m => m.id === milestoneId)!.completed;
    const milestones = goal.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: justCompleted ? today : undefined }
        : m
    );
    if (justCompleted) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1600);
    }
    const computed = computeGoalStreak(milestones, today);
    const newLongest = Math.max(computed.longest, goal.streak.longest);
    const updated = { ...goal, milestones, streak: { current: computed.current, longest: newLongest } };
    updateGoal(updated);
    setSelectedGoal(updated);
  };

  const totalStreak = goals.reduce((acc, g) => acc + g.streak.current, 0);

  return (
    <div className="space-y-5">
      <Confetti active={showConfetti} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">My Goals</h1>
            <p className="text-[13px] text-muted dark:text-muted-dark mt-0.5">{goals.filter(g => g.status === 'active').length} active • {totalStreak} combined streak days</p>
          </div>
          <motion.button
            onClick={() => setShowAdd(true)}
            whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-full bg-accent dark:bg-violet text-white flex items-center justify-center shadow-lg"
            style={{ boxShadow: '0 4px 12px rgba(124,110,248,0.35)' }}
          >
            <Plus size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>

      {/* Overall progress banner */}
      <motion.div
        className="rounded-2xl p-4 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, #7C6EF815, #3EC99A15)' }}
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
      >
        <div className="text-3xl">🏆</div>
        <div>
          <p className="text-[13px] font-bold text-text dark:text-text-dark font-display">
            {goals.filter(g => g.status === 'active').length} goals in progress
          </p>
          <p className="text-[11px] text-muted dark:text-muted-dark">
            Keep pushing — you're on a {goals.length > 0 ? Math.max(...goals.map(g => g.streak.current)) : 0}-day best streak!
          </p>
        </div>
      </motion.div>

      {/* Goal cards */}
      <div className="space-y-3">
        {goals.map((goal, i) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
          >
            <GoalCard goal={goal} onClick={() => setSelectedGoal(goal)} />
          </motion.div>
        ))}
      </div>

      {/* Goal detail sheet */}
      <AnimatePresence>
        {selectedGoal && !editingGoal && (
          <GoalSheet
            goal={goals.find(g => g.id === selectedGoal.id) ?? selectedGoal}
            onClose={() => setSelectedGoal(null)}
            onMilestoneToggle={handleMilestoneToggle}
            onEdit={() => {
              const live = goals.find(g => g.id === selectedGoal.id) ?? selectedGoal;
              setEditingGoal(live);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add goal form */}
      <AnimatePresence>
        {showAdd && (
          <GoalFormSheet
            onClose={() => setShowAdd(false)}
            zIndex={50}
          />
        )}
      </AnimatePresence>

      {/* Edit goal form — z-[60] so it layers above the detail sheet */}
      <AnimatePresence>
        {editingGoal && (
          <GoalFormSheet
            initial={editingGoal}
            onClose={() => {
              setEditingGoal(null);
              // Keep detail sheet open, update it with fresh data
              const live = goals.find(g => g.id === editingGoal.id);
              if (live) setSelectedGoal(live);
            }}
            zIndex={60}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

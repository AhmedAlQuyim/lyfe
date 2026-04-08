'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, ChevronRight, CheckCircle2, Target, Sparkles } from 'lucide-react';
import { type Idea, type IdeaCategory, type Goal, type Task } from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { cn } from '@/lib/utils';

/* ─── Category config ─── */
const categoryConfig: Record<IdeaCategory, { label: string; icon: string; color: string }> = {
  personal:  { label: 'Personal',  icon: '✨', color: '#7C6EF8' },
  work:      { label: 'Work',      icon: '💼', color: '#5BAFEF' },
  business:  { label: 'Business',  icon: '🚀', color: '#F5A524' },
  creative:  { label: 'Creative',  icon: '🎨', color: '#3EC99A' },
  health:    { label: 'Health',    icon: '💪', color: '#FF7B72' },
  other:     { label: 'Other',     icon: '💡', color: '#94A3B8' },
};

const IDEA_ICONS = ['💡', '🚀', '🎯', '✨', '💭', '🌟', '💎', '🔮', '🎨', '📝', '🔬', '🌱', '⚡', '🎵', '🏗️'];

type Filter = 'all' | 'today' | 'converted';

/* ─── helpers ─── */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 60)  return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days  = Math.floor(hours / 24);
  return `${days}d ago`;
}
function isToday(iso: string) {
  return new Date(iso).toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
}

/* ══════════════════════════════════════════════
   Idea Capture Sheet  (add / edit)
══════════════════════════════════════════════ */
function IdeaCaptureSheet({ initial, onClose, onSave }: {
  initial?: Idea;
  onClose: () => void;
  onSave: (idea: Idea) => void;
}) {
  const isEdit = !!initial;
  const [icon,     setIcon]     = useState(initial?.icon        ?? '💡');
  const [title,    setTitle]    = useState(initial?.title       ?? '');
  const [desc,     setDesc]     = useState(initial?.description ?? '');
  const [category, setCategory] = useState<IdeaCategory>(initial?.category ?? 'personal');

  const selectedCat = categoryConfig[category];

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id:          initial?.id    ?? `idea-${Date.now()}`,
      title:       title.trim(),
      description: desc.trim()    || undefined,
      icon,
      color:       categoryConfig[category].color,
      category,
      createdAt:   initial?.createdAt ?? new Date().toISOString(),
      convertedTo: initial?.convertedTo,
      convertedId: initial?.convertedId,
    });
    onClose();
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl no-scrollbar"
        style={{ maxHeight: '88vh', overflowY: 'auto', borderTop: `4px solid ${selectedCat.color}` }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}>

        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-3 pb-2 px-5">
          <div className="flex justify-center mb-2"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">
              {isEdit ? 'Edit Idea' : 'Capture Idea'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
        </div>

        <div className="px-5 pb-[88px] space-y-4">
          {/* Icon picker */}
          <div className="flex gap-2 flex-wrap">
            {IDEA_ICONS.map(i => (
              <button key={i} onClick={() => setIcon(i)}
                className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all',
                  icon === i ? 'scale-110' : 'bg-surface-2 dark:bg-surface-2-dark')}
                style={icon === i ? { backgroundColor: selectedCat.color + '25' } : {}}>
                {i}
              </button>
            ))}
          </div>

          {/* Title */}
          <input autoFocus={!isEdit} value={title} onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && save()}
            placeholder="What's the idea?"
            className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[15px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none border-2 border-transparent transition-colors"
            style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
            onFocus={e => e.currentTarget.style.borderColor = selectedCat.color + '80'}
            onBlur={e => e.currentTarget.style.borderColor = 'transparent'} />

          {/* Category */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Category</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(categoryConfig) as [IdeaCategory, typeof categoryConfig[IdeaCategory]][]).map(([key, cfg]) => (
                <button key={key} onClick={() => setCategory(key)}
                  className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-semibold transition-all border-2',
                    category === key
                      ? 'border-transparent text-white'
                      : 'border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark')}
                  style={category === key ? { backgroundColor: cfg.color } : {}}>
                  <span>{cfg.icon}</span> {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Details (optional)</p>
            <textarea value={desc} onChange={e => setDesc(e.target.value)}
              placeholder="Add more context, notes, or next steps..."
              rows={3}
              className="w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[13px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark outline-none resize-none border-2 border-transparent transition-colors"
              onFocus={e => e.currentTarget.style.borderColor = selectedCat.color + '80'}
              onBlur={e => e.currentTarget.style.borderColor = 'transparent'} />
          </div>

          <motion.button onClick={save} whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2"
            style={{ backgroundColor: selectedCat.color }}>
            <Sparkles size={16} />
            {isEdit ? 'Save Changes' : 'Capture Idea'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Idea Detail Sheet  (view + convert)
══════════════════════════════════════════════ */
function IdeaDetailSheet({ idea, onClose, onEdit }: {
  idea: Idea;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { addTask, addGoal, updateIdea } = useAppStore();
  const cfg = categoryConfig[idea.category];

  const [converting, setConverting] = useState<'task' | 'goal' | null>(null);
  const [done, setDone] = useState<'task' | 'goal' | null>(idea.convertedTo ?? null);

  const convertToTask = () => {
    if (done) return;
    const taskId = `idea-task-${idea.id}`;
    const today  = new Date().toISOString().split('T')[0];
    addTask({
      id:        taskId,
      title:     idea.title,
      icon:      idea.icon,
      color:     idea.color,
      priority:  'medium',
      dueDate:   today,
      completed: false,
      recurring: false,
      notes:     idea.description,
    } as Task);
    const updated: Idea = { ...idea, convertedTo: 'task', convertedId: taskId };
    updateIdea(updated);
    setConverting('task');
    setTimeout(() => { setDone('task'); setConverting(null); }, 800);
  };

  const convertToGoal = () => {
    if (done) return;
    const goalId = `idea-goal-${idea.id}`;
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    const targetDate = threeMonths.toISOString().split('T')[0];
    addGoal({
      id:          goalId,
      title:       idea.title,
      icon:        idea.icon,
      color:       idea.color,
      description: idea.description ?? '',
      targetDate,
      status:      'active',
      milestones:  [],
      streak:      { current: 0, longest: 0 },
    } as Goal);
    const updated: Idea = { ...idea, convertedTo: 'goal', convertedId: goalId };
    updateIdea(updated);
    setConverting('goal');
    setTimeout(() => { setDone('goal'); setConverting(null); }, 800);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl no-scrollbar"
        style={{ maxHeight: '80vh', overflowY: 'auto', borderTop: `4px solid ${idea.color}` }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}>

        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" /></div>

        <div className="px-5 pb-[88px]">
          {/* Header */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: idea.color + '20' }}>
              {idea.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold font-display text-text dark:text-text-dark leading-snug">{idea.title}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ color: cfg.color, backgroundColor: cfg.color + '20' }}>
                  {cfg.icon} {cfg.label}
                </span>
                <span className="text-[11px] text-muted dark:text-muted-dark">{relativeTime(idea.createdAt)}</span>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={onEdit}
                className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                <Sparkles size={13} className="text-muted dark:text-muted-dark" />
              </button>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                <X size={14} className="text-muted dark:text-muted-dark" />
              </button>
            </div>
          </div>

          {/* Description */}
          {idea.description && (
            <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl px-4 py-3.5 mb-5">
              <p className="text-[14px] text-text dark:text-text-dark leading-relaxed">{idea.description}</p>
            </div>
          )}

          {/* Converted badge */}
          {(done || idea.convertedTo) && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2.5 rounded-2xl px-4 py-3 mb-5"
              style={{ backgroundColor: idea.color + '15', border: `1px solid ${idea.color}40` }}>
              <CheckCircle2 size={18} style={{ color: idea.color }} className="shrink-0" />
              <div>
                <p className="text-[13px] font-semibold" style={{ color: idea.color }}>
                  Converted to {(done ?? idea.convertedTo) === 'task' ? 'Task' : 'Goal'}
                </p>
                <p className="text-[11px] text-muted dark:text-muted-dark">
                  You can view it in the {(done ?? idea.convertedTo) === 'task' ? 'Tasks' : 'Goals'} page
                </p>
              </div>
            </motion.div>
          )}

          {/* Convert actions */}
          {!done && !idea.convertedTo && (
            <div>
              <p className="text-[11px] font-medium text-muted dark:text-muted-dark uppercase tracking-wider mb-3">
                Turn this idea into →
              </p>
              <div className="grid grid-cols-2 gap-3">
                {/* To Task */}
                <motion.button onClick={convertToTask} whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark transition-all">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 dark:bg-violet/15 flex items-center justify-center">
                    {converting === 'task'
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5 }}><CheckCircle2 size={20} className="text-accent dark:text-violet" /></motion.div>
                      : <CheckCircle2 size={20} className="text-accent dark:text-violet" />}
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-bold text-text dark:text-text-dark">Task</p>
                    <p className="text-[10px] text-muted dark:text-muted-dark">Add to your to-do list</p>
                  </div>
                </motion.button>

                {/* To Goal */}
                <motion.button onClick={convertToGoal} whileTap={{ scale: 0.97 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-border dark:border-border-dark bg-surface-2 dark:bg-surface-2-dark transition-all">
                  <div className="w-10 h-10 rounded-xl bg-amber/10 flex items-center justify-center"
                    style={{ backgroundColor: '#F5A52420' }}>
                    {converting === 'goal'
                      ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.5 }}><Target size={20} style={{ color: '#F5A524' }} /></motion.div>
                      : <Target size={20} style={{ color: '#F5A524' }} />}
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-bold text-text dark:text-text-dark">Goal</p>
                    <p className="text-[10px] text-muted dark:text-muted-dark">Track long-term progress</p>
                  </div>
                </motion.button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════
   Idea Card
══════════════════════════════════════════════ */
function IdeaCard({ idea, onClick }: { idea: Idea; onClick: () => void }) {
  const cfg       = categoryConfig[idea.category];
  const converted = !!idea.convertedTo;

  return (
    <motion.button onClick={onClick} whileTap={{ scale: 0.98 }}
      className={cn('w-full text-left bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-4',
        converted && 'opacity-70')}
      style={{ borderLeftColor: converted ? '#888' : idea.color, borderLeftWidth: 3 }}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: (converted ? '#888' : idea.color) + '18' }}>
          {idea.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn('text-[14px] font-semibold font-display leading-snug',
            converted ? 'text-muted dark:text-muted-dark' : 'text-text dark:text-text-dark')}>
            {idea.title}
          </p>
          {idea.description && (
            <p className="text-[12px] text-muted dark:text-muted-dark mt-0.5 line-clamp-2 leading-relaxed">
              {idea.description}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ color: converted ? '#888' : cfg.color, backgroundColor: (converted ? '#888' : cfg.color) + '18' }}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-[10px] text-muted dark:text-muted-dark">{relativeTime(idea.createdAt)}</span>
            {converted && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark flex items-center gap-1">
                <CheckCircle2 size={9} />
                → {idea.convertedTo === 'task' ? 'Task' : 'Goal'}
              </span>
            )}
          </div>
        </div>

        <ChevronRight size={15} className="text-muted dark:text-muted-dark shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════
   Ideas Page
══════════════════════════════════════════════ */
export default function IdeasPage() {
  const { ideas, addIdea, updateIdea, deleteIdea } = useAppStore();

  const [filter,       setFilter]       = useState<Filter>('all');
  const [showCapture,  setShowCapture]  = useState(false);
  const [editingIdea,  setEditingIdea]  = useState<Idea | null>(null);
  const [viewingIdea,  setViewingIdea]  = useState<Idea | null>(null);

  const filtered = ideas.filter(i => {
    if (filter === 'today')     return isToday(i.createdAt);
    if (filter === 'converted') return !!i.convertedTo;
    return true;
  });

  const convertedCount = ideas.filter(i => !!i.convertedTo).length;
  const todayCount     = ideas.filter(i => isToday(i.createdAt)).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">Ideas</h1>
            <p className="text-[13px] text-muted dark:text-muted-dark mt-0.5">
              {ideas.length} captured · {convertedCount} converted
            </p>
          </div>
          <motion.button onClick={() => setShowCapture(true)} whileTap={{ scale: 0.92 }}
            className="w-10 h-10 rounded-full text-white flex items-center justify-center"
            style={{ backgroundColor: '#F5A524', boxShadow: '0 4px 12px rgba(245,165,36,0.4)' }}>
            <Plus size={20} strokeWidth={2.5} />
          </motion.button>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div className="grid grid-cols-3 gap-2.5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
        {[
          { icon: '💡', label: 'Total',     value: ideas.length,   color: '#F5A524' },
          { icon: '📅', label: 'Today',     value: todayCount,     color: '#3EC99A' },
          { icon: '✅', label: 'Converted', value: convertedCount, color: '#7C6EF8' },
        ].map(s => (
          <div key={s.label} className="bg-surface dark:bg-surface-dark rounded-2xl p-3 border border-border dark:border-border-dark text-center">
            <span className="text-xl">{s.icon}</span>
            <p className="text-xl font-bold font-display mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-muted dark:text-muted-dark font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Filter chips */}
      <motion.div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.06 }}>
        {([
          { key: 'all' as Filter,       label: 'All',       count: ideas.length    },
          { key: 'today' as Filter,     label: 'Today',     count: todayCount      },
          { key: 'converted' as Filter, label: 'Converted', count: convertedCount  },
        ]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={cn('shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5',
              filter === f.key
                ? 'text-white'
                : 'bg-surface dark:bg-surface-dark text-muted dark:text-muted-dark border border-border dark:border-border-dark')}
            style={filter === f.key ? { backgroundColor: '#F5A524' } : {}}>
            {f.label}
            <span className={cn('text-[10px] opacity-70', filter === f.key ? 'opacity-90' : '')}>
              {f.count}
            </span>
          </button>
        ))}
      </motion.div>

      {/* List */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center py-16">
              <p className="text-5xl mb-3">💡</p>
              <p className="text-[15px] font-semibold text-text dark:text-text-dark font-display">
                {filter === 'converted' ? 'No converted ideas yet' : filter === 'today' ? 'No ideas today yet' : 'No ideas yet'}
              </p>
              <p className="text-[13px] text-muted dark:text-muted-dark mt-1">
                {filter === 'all' ? 'Tap + to capture your first idea' : 'Check back later or capture a new one'}
              </p>
            </motion.div>
          ) : (
            filtered.map((idea, i) => (
              <motion.div key={idea.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, scale: 0.96 }}
                transition={{ delay: i * 0.03 }} layout>
                <IdeaCard idea={idea} onClick={() => setViewingIdea(idea)} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Sheets */}
      <AnimatePresence>
        {showCapture && (
          <IdeaCaptureSheet
            onClose={() => setShowCapture(false)}
            onSave={idea => addIdea(idea)}
          />
        )}
        {editingIdea && (
          <IdeaCaptureSheet
            key={editingIdea.id}
            initial={editingIdea}
            onClose={() => setEditingIdea(null)}
            onSave={idea => { updateIdea(idea); setEditingIdea(null); setViewingIdea(idea); }}
          />
        )}
        {viewingIdea && !editingIdea && (
          <IdeaDetailSheet
            key={viewingIdea.id}
            idea={ideas.find(i => i.id === viewingIdea.id) ?? viewingIdea}
            onClose={() => setViewingIdea(null)}
            onEdit={() => { setEditingIdea(viewingIdea); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

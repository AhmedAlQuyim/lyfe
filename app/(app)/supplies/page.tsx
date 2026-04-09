'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, ShoppingCart, RefreshCcw, CheckCheck, Trash2, ChevronRight } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';
import {
  type SupplyItem, type SupplyPeriod, type SupplyCategory,
} from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { cn } from '@/lib/utils';

// ─── Constants ──────────────────────────────────────────────────────────────

const PRESET_COLORS = ['#7C6EF8', '#3EC99A', '#FF7B72', '#F5A524', '#5BAFEF', '#F07FC6', '#94A3B8'];

const SUPPLY_ICONS = [
  '🧴', '☕', '🌸', '🫧', '🦷', '🧼', '🧻', '🍳',
  '🧹', '💊', '🥤', '🧃', '🌿', '🔧', '🕯️', '🧽',
  '🪴', '🥛', '🍵', '⚡', '🥩', '🧀', '🍗', '🐟',
];

const PERIOD_DAYS: Record<NonNullable<SupplyPeriod>, number> = {
  weekly:    7,
  biweekly:  14,
  monthly:   30,
  quarterly: 90,
};

type SupplyStatus = 'ok' | 'low' | 'needed';

const STATUS_CONFIG: Record<SupplyStatus, { label: string; color: string }> = {
  ok:     { label: 'OK',     color: '#3EC99A' },
  low:    { label: 'Low',    color: '#F5A524' },
  needed: { label: 'Needed', color: '#FF7B72' },
};

type Filter = 'all' | 'low' | 'shopping';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All'           },
  { key: 'low',      label: 'Running Low'   },
  { key: 'shopping', label: 'Shopping List' },
];

const CATEGORY_OPTIONS: { key: SupplyCategory; label: string; icon: string }[] = [
  { key: 'household', label: 'Household', icon: '🏠' },
  { key: 'personal',  label: 'Personal',  icon: '🧴' },
  { key: 'food',      label: 'Food',      icon: '🍽️' },
  { key: 'other',     label: 'Other',     icon: '📦' },
];

const PERIOD_OPTIONS: { key: SupplyPeriod | null; label: string }[] = [
  { key: 'weekly',    label: 'Weekly'    },
  { key: 'biweekly',  label: 'Bi-weekly' },
  { key: 'monthly',   label: 'Monthly'   },
  { key: 'quarterly', label: 'Quarterly' },
  { key: null,        label: 'One-off'   },
];

const inputCls = 'w-full bg-surface-2 dark:bg-surface-2-dark rounded-xl px-4 py-3 text-[14px] text-text dark:text-text-dark outline-none border-2 border-transparent focus:border-accent dark:focus:border-violet transition-colors placeholder:text-muted dark:placeholder:text-muted-dark';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getProgress(item: SupplyItem, today: string): number {
  if (item.period === null) return 0;
  if (item.lastRefilled === null) return 200;
  const daysSince = differenceInDays(parseISO(today), parseISO(item.lastRefilled));
  return Math.round((daysSince / PERIOD_DAYS[item.period]) * 100);
}

function getStatus(progress: number, needed: boolean): SupplyStatus {
  if (needed || progress >= 100) return 'needed';
  if (progress >= 70) return 'low';
  return 'ok';
}

function getDaysLeftText(item: SupplyItem, today: string): string {
  if (item.period === null) return 'One-off item';
  if (item.lastRefilled === null) return 'Never refilled — add to list';
  const periodDays = PERIOD_DAYS[item.period];
  const daysSince = differenceInDays(parseISO(today), parseISO(item.lastRefilled));
  const daysLeft = periodDays - daysSince;
  if (daysLeft <= 0) return `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue`;
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

function getNextRefillDate(item: SupplyItem): string | null {
  if (item.period === null || item.lastRefilled === null) return null;
  return format(addDays(parseISO(item.lastRefilled), PERIOD_DAYS[item.period]), 'MMM d, yyyy');
}

function getPeriodLabel(period: SupplyPeriod | null): string {
  if (period === null) return 'One-off';
  const map: Record<SupplyPeriod, string> = {
    weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly', quarterly: 'Quarterly',
  };
  return map[period];
}

// ─── Progress Ring ────────────────────────────────────────────────────────────

function ProgressRing({ progress, size = 52, color }: { progress: number; size?: number; color: string }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(progress, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4"
        className="text-surface-2 dark:text-surface-2-dark" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

// ─── Supply Card ─────────────────────────────────────────────────────────────

function SupplyCard({ item, today, onClick }: {
  item:    SupplyItem;
  today:   string;
  onClick: () => void;
}) {
  const progress    = getProgress(item, today);
  const status      = getStatus(progress, item.needed);
  const statusColor = STATUS_CONFIG[status].color;
  const daysLeft    = getDaysLeftText(item, today);

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className="w-full text-left bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden"
      style={{ borderTopColor: item.color, borderTopWidth: 3 }}
    >
      <div className="p-3">
        <div className="flex items-start justify-between mb-2">
          <span className="text-[26px] leading-none">{item.icon}</span>
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 mt-0.5"
            style={{ color: statusColor, backgroundColor: statusColor + '22' }}
          >
            {STATUS_CONFIG[status].label}
          </span>
        </div>
        <p className="text-[12px] font-semibold font-display text-text dark:text-text-dark leading-tight mb-0.5 line-clamp-2">
          {item.title}
        </p>
        <p className="text-[10px] text-muted dark:text-muted-dark mb-2.5">
          {getPeriodLabel(item.period)}
        </p>
        {item.period !== null && (
          <div className="h-1.5 bg-surface-2 dark:bg-surface-2-dark rounded-full overflow-hidden mb-1.5">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: statusColor }}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        )}
        <p className="text-[10px] font-semibold" style={{ color: statusColor }}>
          {daysLeft}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Supply Detail Sheet ───────────────────────────────────────────────────────

function SupplyDetailSheet({ item, today, onClose, onEdit }: {
  item:    SupplyItem;
  today:   string;
  onClose: () => void;
  onEdit:  () => void;
}) {
  const { updateSupply, deleteSupply } = useAppStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const progress      = getProgress(item, today);
  const status        = getStatus(progress, item.needed);
  const statusColor   = STATUS_CONFIG[status].color;
  const daysLeftText  = getDaysLeftText(item, today);
  const nextRefill    = getNextRefillDate(item);
  const categoryLabel = CATEGORY_OPTIONS.find(c => c.key === item.category)?.label ?? item.category;

  const handleMarkRefilled = () => {
    updateSupply({ ...item, lastRefilled: today, needed: false, convertedToTaskId: undefined });
  };

  const handleToggleNeeded = () => {
    updateSupply({ ...item, needed: !item.needed });
  };

  const handleDelete = () => {
    deleteSupply(item.id);
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex: 50 }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{ borderTop: `4px solid ${item.color}` }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        <div className="px-5 pb-[88px]">
          {/* Header */}
          <div className="flex items-start gap-3 mb-6 sticky top-0 bg-surface dark:bg-surface-dark z-10 pt-2 pb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
              style={{ backgroundColor: item.color + '20' }}
            >
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold font-display text-text dark:text-text-dark leading-tight">
                {item.title}
              </h2>
              <p className="text-[12px] text-muted dark:text-muted-dark mt-0.5">
                {categoryLabel} · {getPeriodLabel(item.period)}
              </p>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button onClick={onEdit}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark transition-colors">
                <Pencil size={15} />
              </button>
              <button onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark hover:text-text dark:hover:text-text-dark transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Progress ring */}
          {item.period !== null && (
            <div className="flex flex-col items-center py-4 mb-5">
              <div className="relative flex items-center justify-center">
                <ProgressRing progress={progress} size={100} color={statusColor} />
                <div className="absolute flex flex-col items-center">
                  <span className="text-[20px] font-bold font-display" style={{ color: statusColor }}>
                    {Math.min(progress, 100)}%
                  </span>
                </div>
              </div>
              <p className="text-[12px] font-medium mt-2" style={{ color: statusColor }}>
                {daysLeftText}
              </p>
            </div>
          )}

          {/* Stats grid */}
          {item.period !== null && (
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-3 text-center">
                <p className="text-[10px] text-muted dark:text-muted-dark mb-1">Last Refilled</p>
                <p className="text-[13px] font-bold text-text dark:text-text-dark">
                  {item.lastRefilled
                    ? format(parseISO(item.lastRefilled), 'MMM d, yyyy')
                    : 'Never'}
                </p>
              </div>
              <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-3 text-center">
                <p className="text-[10px] text-muted dark:text-muted-dark mb-1">Next Refill By</p>
                <p className="text-[13px] font-bold text-text dark:text-text-dark">
                  {nextRefill ?? '—'}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {item.notes && (
            <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl p-4 mb-5">
              <p className="text-[12px] text-muted dark:text-muted-dark mb-1">Notes</p>
              <p className="text-[13px] text-text dark:text-text-dark leading-relaxed">{item.notes}</p>
            </div>
          )}

          {/* Mark as Refilled */}
          <motion.button
            onClick={handleMarkRefilled}
            whileTap={{ scale: 0.97 }}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-[15px] flex items-center justify-center gap-2 mb-3"
            style={{ backgroundColor: item.color }}
          >
            <RefreshCcw size={16} strokeWidth={2.5} />
            Mark as Refilled
          </motion.button>

          {/* Shopping list toggle */}
          <button
            onClick={handleToggleNeeded}
            className="w-full flex items-center justify-between bg-surface-2 dark:bg-surface-2-dark rounded-2xl px-4 py-3.5 mb-3 transition-colors hover:bg-surface-2/80 dark:hover:bg-surface-2-dark/80"
          >
            <div className="flex items-center gap-3">
              <ShoppingCart size={16} className="text-muted dark:text-muted-dark" />
              <div className="text-left">
                <p className="text-[14px] font-medium text-text dark:text-text-dark">Shopping List</p>
                <p className="text-[11px] text-muted dark:text-muted-dark">
                  {item.needed ? 'On your list' : 'Not on your list'}
                </p>
              </div>
            </div>
            {/* Toggle pill */}
            <div className={cn(
              'w-11 h-6 rounded-full transition-colors duration-300 flex items-center px-0.5 shrink-0',
              item.needed ? 'bg-coral' : 'bg-border dark:bg-border-dark'
            )}>
              <motion.div
                className="w-5 h-5 rounded-full bg-white shadow-sm"
                animate={{ x: item.needed ? 20 : 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </div>
          </button>

          {/* Delete */}
          <AnimatePresence mode="wait">
            {!confirmDelete ? (
              <motion.button
                key="del"
                onClick={() => setConfirmDelete(true)}
                className="w-full flex items-center justify-center gap-2 text-coral text-[13px] font-medium py-2.5 rounded-2xl transition-colors hover:bg-coral/10"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              >
                <Trash2 size={14} />
                Delete Supply
              </motion.button>
            ) : (
              <motion.div
                key="confirm"
                className="flex gap-2"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              >
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-3 rounded-2xl bg-surface-2 dark:bg-surface-2-dark text-text dark:text-text-dark text-[13px] font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-3 rounded-2xl bg-coral text-white text-[13px] font-semibold"
                >
                  Delete
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Supply Form Sheet ─────────────────────────────────────────────────────────

function SupplyFormSheet({ initial, onClose, zIndex = 50 }: {
  initial?: SupplyItem;
  onClose:  () => void;
  zIndex?:  number;
}) {
  const { addSupply, updateSupply } = useAppStore();
  const isEdit = !!initial;

  const [color,        setColor]        = useState(initial?.color        ?? PRESET_COLORS[2]);
  const [icon,         setIcon]         = useState(initial?.icon         ?? '🧴');
  const [title,        setTitle]        = useState(initial?.title        ?? '');
  const [category,     setCategory]     = useState<SupplyCategory>(initial?.category ?? 'household');
  const [period,       setPeriod]       = useState<SupplyPeriod | null>(initial?.period ?? 'monthly');
  const [lastRefilled, setLastRefilled] = useState(initial?.lastRefilled ?? '');
  const [notes,        setNotes]        = useState(initial?.notes        ?? '');

  const save = () => {
    if (!title.trim()) return;
    const data = {
      title:        title.trim(),
      icon,
      color,
      category,
      period,
      lastRefilled: lastRefilled || null,
      notes:        notes.trim() || undefined,
      needed:       initial?.needed ?? false,
      convertedToTaskId: initial?.convertedToTaskId,
    };
    if (isEdit && initial) {
      updateSupply({ ...initial, ...data });
    } else {
      addSupply({ id: `supply-${Date.now()}`, ...data, needed: false });
    }
    onClose();
  };

  return (
    <motion.div
      className="fixed inset-0 flex flex-col justify-end"
      style={{ zIndex }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[92vh] overflow-y-auto no-scrollbar"
        style={{ borderTop: `4px solid ${color}` }}
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        {/* Sticky header */}
        <div className="sticky top-0 bg-surface dark:bg-surface-dark z-10 flex items-center justify-between px-5 py-3 border-b border-border/50 dark:border-border-dark/50">
          <h2 className="text-[17px] font-bold font-display text-text dark:text-text-dark">
            {isEdit ? 'Edit Supply' : 'New Supply'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-[88px] space-y-5 pt-5">
          {/* Color picker */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Color</p>
            <div className="flex gap-2.5">
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && (
                    <div className="w-3 h-3 rounded-full bg-white/80" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Icon</p>
            <div className="grid grid-cols-10 gap-1">
              {SUPPLY_ICONS.map(em => (
                <button
                  key={em}
                  onClick={() => setIcon(em)}
                  className="w-full aspect-square flex items-center justify-center text-[20px] rounded-xl transition-all"
                  style={icon === em
                    ? { backgroundColor: color + '25', transform: 'scale(1.1)', outline: `1.5px solid ${color}60` }
                    : {}}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Name</p>
            <input
              autoFocus={!isEdit}
              className={inputCls}
              placeholder="e.g. Coffee, Shampoo…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Category */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Category</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setCategory(opt.key)}
                  className="flex items-center gap-2 py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark"
                  style={category === opt.key
                    ? { color, backgroundColor: color + '18', outline: `1.5px solid ${color}50` }
                    : {}}
                >
                  <span>{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">Restock Period</p>
            <div className="grid grid-cols-2 gap-2">
              {PERIOD_OPTIONS.map(opt => (
                <button
                  key={String(opt.key)}
                  onClick={() => setPeriod(opt.key)}
                  className="py-2.5 px-3 rounded-xl text-[13px] font-medium transition-all bg-surface-2 dark:bg-surface-2-dark text-muted dark:text-muted-dark"
                  style={period === opt.key
                    ? { color, backgroundColor: color + '18', outline: `1.5px solid ${color}50` }
                    : {}}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Last Refilled date */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
              Last Refilled <span className="text-muted dark:text-muted-dark font-normal normal-case">(optional)</span>
            </p>
            <input
              type="date"
              className={inputCls}
              value={lastRefilled}
              onChange={e => setLastRefilled(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <p className="text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
              Notes <span className="font-normal normal-case">(optional)</span>
            </p>
            <textarea
              className={cn(inputCls, 'resize-none')}
              rows={2}
              placeholder="Brand preference, quantity, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Save */}
          <motion.button
            onClick={save}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 rounded-2xl text-white font-semibold text-[16px]"
            style={{ backgroundColor: color }}
          >
            {isEdit ? 'Save Changes' : 'Add Supply'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Supplies Page ─────────────────────────────────────────────────────────────

export default function SuppliesPage() {
  const { supplies, updateSupply, addTask } = useAppStore();
  const [filter,         setFilter]         = useState<Filter>('all');
  const [selectedSupply, setSelectedSupply] = useState<SupplyItem | null>(null);
  const [editingSupply,  setEditingSupply]  = useState<SupplyItem | null>(null);
  const [showAdd,        setShowAdd]        = useState(false);
  const [listTaskPushed, setListTaskPushed] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const handleMarkRefilled = (item: SupplyItem) => {
    updateSupply({ ...item, lastRefilled: today, needed: false });
  };

  const handlePushAsTask = () => {
    const dateLabel = format(parseISO(today), 'MMMM d, yyyy');
    const shoppingItems = suppliesWithMeta.filter(m => m.status === 'needed').map(m => m.item);
    const notes = shoppingItems.map(i => `• ${i.title}`).join('\n');
    addTask({
      id:        `shopping-list-${today}`,
      title:     `Shopping List (${dateLabel})`,
      icon:      '🛒',
      color:     '#FF7B72',
      priority:  'medium',
      dueDate:   today,
      completed: false,
      recurring: false,
      notes,
    });
    setListTaskPushed(true);
  };

  const suppliesWithMeta = supplies.map(item => ({
    item,
    progress: getProgress(item, today),
    status:   getStatus(getProgress(item, today), item.needed),
  }));

  const shoppingCount = suppliesWithMeta.filter(m => m.status === 'needed').length;
  const lowCount      = suppliesWithMeta.filter(m => m.status === 'low').length;

  const filteredSupplies = suppliesWithMeta
    .filter(m => {
      if (filter === 'low')      return m.status === 'low';
      if (filter === 'shopping') return m.status === 'needed';
      return true;
    })
    .map(m => m.item);

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">Supplies</h1>
          <p className="text-[13px] text-muted dark:text-muted-dark mt-0.5">
            {shoppingCount > 0
              ? `${shoppingCount} on shopping list${lowCount > 0 ? ` · ${lowCount} running low` : ''}`
              : lowCount > 0
                ? `${lowCount} running low — order soon`
                : 'All stocked up 🎉'}
          </p>
        </div>
        <motion.button
          onClick={() => setShowAdd(true)}
          whileTap={{ scale: 0.9 }}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0"
          style={{ backgroundColor: '#FF7B72' }}
        >
          <Plus size={20} strokeWidth={2.5} />
        </motion.button>
      </motion.div>

      {/* ─── Shopping list banner ─── */}
      <AnimatePresence>
        {shoppingCount > 0 && (
          <motion.button
            onClick={() => setFilter('shopping')}
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-2xl p-4 flex items-center gap-4 overflow-hidden text-left"
            style={{ background: 'linear-gradient(135deg, #FF7B7215, #F5A52410)' }}
          >
            <ShoppingCart size={28} style={{ color: '#FF7B72' }} className="shrink-0" />
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-text dark:text-text-dark font-display">
                {shoppingCount} item{shoppingCount !== 1 ? 's' : ''} to pick up
              </p>
              <p className="text-[11px] text-muted dark:text-muted-dark">
                Tap circles to mark refilled · Push all as one task
              </p>
            </div>
            <ChevronRight size={16} className="text-muted dark:text-muted-dark shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Filter tabs ─── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4"
      >
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-[12px] font-semibold transition-all duration-200',
              filter === f.key
                ? 'bg-accent dark:bg-violet text-white'
                : 'bg-surface dark:bg-surface-dark text-muted dark:text-muted-dark border border-border dark:border-border-dark'
            )}
          >
            {f.label}
            {f.key === 'shopping' && shoppingCount > 0 && (
              <span className="ml-1.5 text-[10px] opacity-80">{shoppingCount}</span>
            )}
            {f.key === 'low' && lowCount > 0 && (
              <span className="ml-1.5 text-[10px] opacity-80">{lowCount}</span>
            )}
          </button>
        ))}
      </motion.div>

      {/* ─── Content ─── */}
      {filteredSupplies.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <p className="text-4xl mb-3">
            {filter === 'shopping' ? '🛒' : filter === 'low' ? '✅' : '🧺'}
          </p>
          <p className="text-[15px] font-semibold text-text dark:text-text-dark mb-1">
            {filter === 'shopping'
              ? 'Shopping list is empty'
              : filter === 'low'
                ? 'All well stocked'
                : 'No supplies yet'}
          </p>
          <p className="text-[13px] text-muted dark:text-muted-dark">
            {filter === 'all' ? 'Tap + to track your first supply.' : 'Check back later.'}
          </p>
        </motion.div>
      ) : filter === 'shopping' ? (
        <div className="space-y-3">
          {/* Push all as single task */}
          <AnimatePresence mode="wait">
            {listTaskPushed ? (
              <motion.div
                key="pushed"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center gap-2 bg-mint/10 rounded-2xl px-4 py-3.5"
              >
                <CheckCheck size={16} className="text-mint" strokeWidth={2.5} />
                <span className="text-[14px] font-semibold text-mint">Shopping task added to today</span>
              </motion.div>
            ) : (
              <motion.button
                key="push"
                onClick={handlePushAsTask}
                whileTap={{ scale: 0.97 }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-semibold text-[14px]"
                style={{ backgroundColor: '#FF7B72' }}
              >
                <ShoppingCart size={16} strokeWidth={2.5} />
                Push as Task — {format(parseISO(today), 'MMMM d, yyyy')}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Item rows with circle checkboxes */}
          <AnimatePresence>
            {filteredSupplies.map((item, i) => {
              const statusColor = STATUS_CONFIG[getStatus(getProgress(item, today), item.needed)].color;
              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 bg-surface dark:bg-surface-dark rounded-2xl px-4 py-3 border border-border dark:border-border-dark"
                >
                  {/* Circle — tap to mark refilled */}
                  <motion.button
                    onClick={() => handleMarkRefilled(item)}
                    whileTap={{ scale: 0.82 }}
                    className="w-7 h-7 rounded-full border-2 shrink-0"
                    style={{ borderColor: statusColor }}
                  />
                  {/* Icon */}
                  <span className="text-[22px] shrink-0">{item.icon}</span>
                  {/* Title + status */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => setSelectedSupply(item)}
                  >
                    <p className="text-[14px] font-semibold text-text dark:text-text-dark truncate">{item.title}</p>
                    <p className="text-[11px] font-medium" style={{ color: statusColor }}>
                      {getDaysLeftText(item, today)}
                    </p>
                  </button>
                  {/* Arrow to detail */}
                  <ChevronRight size={15} className="text-muted dark:text-muted-dark shrink-0 pointer-events-none" />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filteredSupplies.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.04 }}
            >
              <SupplyCard
                item={item}
                today={today}
                onClick={() => setSelectedSupply(item)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Sheets ─── */}

      {/* Detail sheet */}
      <AnimatePresence>
        {selectedSupply && !editingSupply && (
          <SupplyDetailSheet
            item={supplies.find(s => s.id === selectedSupply.id) ?? selectedSupply}
            today={today}
            onClose={() => setSelectedSupply(null)}
            onEdit={() => {
              const live = supplies.find(s => s.id === selectedSupply.id) ?? selectedSupply;
              setEditingSupply(live);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add form */}
      <AnimatePresence>
        {showAdd && (
          <SupplyFormSheet onClose={() => setShowAdd(false)} />
        )}
      </AnimatePresence>

      {/* Edit form — z-60 stacks above detail sheet */}
      <AnimatePresence>
        {editingSupply && (
          <SupplyFormSheet
            initial={editingSupply}
            onClose={() => {
              setEditingSupply(null);
              const live = supplies.find(s => s.id === editingSupply.id);
              if (live) setSelectedSupply(live);
            }}
            zIndex={60}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

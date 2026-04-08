'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronRight, Flame, Zap, Trophy, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';
import { mockStats, type Task } from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { cn, timeToMinutes, durationPx, getCurrentMinutes, formatDisplayTime, formatDuration, minutesToPx } from '@/lib/utils';

/* ─── Progress Ring ─── */
function ProgressRing({ progress, size = 44, color }: { progress: number; size?: number; color: string }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(progress, 100) / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="3.5" className="text-surface-2 dark:text-surface-2-dark" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3.5"
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
    </svg>
  );
}

/* ─── Confetti burst ─── */
const CONFETTI_COLORS = ['#7C6EF8', '#3EC99A', '#FF7B72', '#F5A524', '#5BAFEF', '#F07FC6'];
function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const pieces = Array.from({ length: 28 }, (_, i) => ({
    id: i,
    x: (Math.random() - 0.5) * 320,
    y: -(Math.random() * 220 + 60),
    rotate: Math.random() * 720 - 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w: Math.random() * 6 + 6,
    h: Math.random() * 4 + 4,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
      {pieces.map(p => (
        <motion.div key={p.id} className="absolute rounded-[2px]"
          style={{ backgroundColor: p.color, width: p.w, height: p.h }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0 }}
          transition={{ duration: 1.4, ease: [0.25, 0.1, 0.25, 1] }}
        />
      ))}
    </div>
  );
}

/* ─── Mini Timeline Block ─── */
function TimelineBlock({ task, visibleStart }: { task: Task; visibleStart: number }) {
  if (!task.startTime || !task.endTime) return null;
  const PX = 64; // px per hour — visibleStart is in minutes
  const top = ((timeToMinutes(task.startTime) - visibleStart) / 60) * PX;
  const height = Math.max(durationPx(task.startTime, task.endTime, PX), 24);
  // Don't render if block is outside visible area
  if (top + height < 0 || top > 5 * PX) return null;

  return (
    <div
      className="absolute left-14 right-2 rounded-xl flex items-start gap-1.5 px-2.5 py-1.5 overflow-hidden"
      style={{ top, height, backgroundColor: task.color + '22', borderLeft: `3px solid ${task.color}` }}
    >
      <span className="text-xs leading-tight mt-0.5">{task.icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-text dark:text-text-dark truncate leading-tight" style={{ color: task.color }}>
          {task.title}
        </p>
        {height >= 36 && (
          <p className="text-[10px] text-muted dark:text-muted-dark">
            {formatDisplayTime(task.startTime)} – {formatDisplayTime(task.endTime)}
          </p>
        )}
      </div>
      {task.completed && <CheckCircle2 size={12} className="shrink-0 mt-0.5 ml-auto text-mint" />}
    </div>
  );
}

/* ─── Today's Tasks List ─── */
function TaskItem({ task, onToggle }: { task: Task; onToggle: (id: string) => void }) {
  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-3 py-3 px-1 border-b border-border/50 dark:border-border-dark/50 last:border-0',
        task.completed && 'opacity-50'
      )}
    >
      <button
        onClick={() => onToggle(task.id)}
        className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200"
        style={{ borderColor: task.completed ? task.color : task.color + '80', backgroundColor: task.completed ? task.color : 'transparent' }}
      >
        <AnimatePresence>
          {task.completed && (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}>
              <Check size={12} className="text-white" strokeWidth={3} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
      <span className="text-sm">{task.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn('text-[14px] font-medium text-text dark:text-text-dark truncate', task.completed && 'line-through text-muted dark:text-muted-dark')}>
          {task.title}
        </p>
        {task.startTime && (
          <p className="text-[11px] text-muted dark:text-muted-dark">{formatDisplayTime(task.startTime)}</p>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Dashboard Page ─── */
export default function DashboardPage() {
  const { tasks: allTasks, goals, taskStreak, toggleTask } = useAppStore();
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentMins, setCurrentMins] = useState(getCurrentMinutes());
  const timelineRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().split('T')[0];
  const tasks = allTasks.filter(t => t.dueDate === today);

  const PX_PER_HOUR = 64;
  const now = new Date();
  const nowH = now.getHours();
  // Show timeline from (nowH - 1) to (nowH + 4)
  const visibleStartH = Math.max(0, nowH - 1);
  const visibleEndH = Math.min(24, visibleStartH + 5);
  const visibleStartMins = visibleStartH * 60;
  const timelineHeight = (visibleEndH - visibleStartH) * PX_PER_HOUR;

  const currentTop = minutesToPx(currentMins - visibleStartMins, PX_PER_HOUR);

  const scheduledTasks = tasks.filter(t => t.startTime && t.endTime);
  const completedToday = tasks.filter(t => t.completed).length;

  useEffect(() => {
    const interval = setInterval(() => setCurrentMins(getCurrentMinutes()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = (id: string) => {
    const t = allTasks.find(x => x.id === id);
    if (t && !t.completed) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1600);
    }
    toggleTask(id);
  };

  const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
  const hour = now.getHours();
  const greeting = hour < 12 ? greetings[0] : hour < 17 ? greetings[1] : greetings[2];

  return (
    <div className="space-y-5">
      <Confetti active={showConfetti} />

      {/* ─── Greeting ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">{greeting} 👋</h1>
        <p className="text-sm text-muted dark:text-muted-dark mt-0.5">
          {completedToday}/{tasks.length} tasks done today
        </p>
      </motion.div>

      {/* ─── Stats strip ─── */}
      <motion.div
        className="grid grid-cols-3 gap-2.5"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}
      >
        {[
          { icon: '🔥', label: 'Day Streak', value: taskStreak.current, color: '#F5A524' },
          { icon: '✅', label: 'Done today', value: `${completedToday}/${tasks.length}`, color: '#3EC99A' },
          { icon: '🎯', label: 'Active Goals', value: goals.filter(g => g.status === 'active').length, color: '#7C6EF8' },
        ].map(s => (
          <div key={s.label} className="bg-surface dark:bg-surface-dark rounded-2xl p-3 border border-border dark:border-border-dark">
            <span className="text-lg">{s.icon}</span>
            <p className="text-xl font-bold font-display mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-muted dark:text-muted-dark font-medium leading-tight">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ─── Mini Timeline ─── */}
      <motion.div
        className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-[13px] font-semibold text-text dark:text-text-dark font-display">Today's Schedule</h2>
          <Link href="/schedule" className="text-[11px] font-medium text-accent dark:text-violet flex items-center gap-0.5">
            Full view <ChevronRight size={12} />
          </Link>
        </div>

        <div
          ref={timelineRef}
          className="relative mx-4 mb-4"
          style={{ height: timelineHeight }}
        >
          {/* Hour labels + grid lines */}
          {Array.from({ length: visibleEndH - visibleStartH + 1 }, (_, i) => {
            const h = visibleStartH + i;
            const y = i * PX_PER_HOUR;
            return (
              <div key={h} className="absolute left-0 right-0 flex items-center gap-2" style={{ top: y }}>
                <span className="text-[10px] text-muted dark:text-muted-dark w-10 text-right shrink-0 leading-none">
                  {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                </span>
                <div className="flex-1 border-t border-border/40 dark:border-border-dark/40" />
              </div>
            );
          })}

          {/* Task blocks */}
          {scheduledTasks.map(t => (
            <TimelineBlock key={t.id} task={t} visibleStart={visibleStartMins} />
          ))}

          {/* Current time indicator */}
          {currentTop >= 0 && currentTop <= timelineHeight && (
            <div className="absolute left-14 right-2 flex items-center gap-1 z-10 pointer-events-none" style={{ top: currentTop - 1 }}>
              <div className="w-2 h-2 rounded-full bg-coral shrink-0" />
              <div className="flex-1 h-[1.5px] bg-coral" />
            </div>
          )}
        </div>
      </motion.div>

      {/* ─── Active Goals ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-semibold text-text dark:text-text-dark font-display">Active Goals</h2>
          <Link href="/goals" className="text-[11px] font-medium text-accent dark:text-violet flex items-center gap-0.5">
            See all <ChevronRight size={12} />
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-1">
          {goals.slice(0, 4).map(g => {
            const progress = Math.round((g.milestones.filter(m => m.completed).length / g.milestones.length) * 100);
            return (
              <Link key={g.id} href={`/goals`}>
                <motion.div
                  whileTap={{ scale: 0.97 }}
                  className="shrink-0 w-[140px] bg-surface dark:bg-surface-dark rounded-2xl p-3.5 border border-border dark:border-border-dark"
                  style={{ borderTopColor: g.color, borderTopWidth: 3 }}
                >
                  <div className="flex items-start justify-between mb-2.5">
                    <span className="text-2xl">{g.icon}</span>
                    <ProgressRing progress={progress} size={36} color={g.color} />
                  </div>
                  <p className="text-[12px] font-semibold text-text dark:text-text-dark leading-tight line-clamp-2 mb-2">{g.title}</p>
                  <div className="flex items-center gap-1">
                    <motion.span
                      animate={g.streak.current > 0 ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-xs"
                    >
                      🔥
                    </motion.span>
                    <span className="text-[11px] font-bold" style={{ color: g.color }}>{g.streak.current}</span>
                    <span className="text-[10px] text-muted dark:text-muted-dark">day streak</span>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Today's Tasks ─── */}
      <motion.div
        className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-1">
          <h2 className="text-[13px] font-semibold text-text dark:text-text-dark font-display">Today's Tasks</h2>
          <Link href="/tasks" className="text-[11px] font-medium text-accent dark:text-violet flex items-center gap-0.5">
            All tasks <ChevronRight size={12} />
          </Link>
        </div>

        <div className="px-4 pb-2">
          <AnimatePresence>
            {tasks.slice(0, 6).map(task => (
              <motion.div key={task.id} layout>
                <TaskItem task={task} onToggle={handleToggle} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {tasks.length > 6 && (
          <Link href="/tasks" className="block text-center text-[12px] text-muted dark:text-muted-dark py-3 border-t border-border/40 dark:border-border-dark/40 hover:text-text dark:hover:text-text-dark transition-colors">
            +{tasks.length - 6} more tasks
          </Link>
        )}
      </motion.div>

      {/* ─── Workout shortcut ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Link href="/workouts">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-xl">💪</div>
              <div>
                <p className="text-[13px] font-semibold text-text dark:text-text-dark">Workouts</p>
                <p className="text-[11px] text-muted dark:text-muted-dark">{mockStats.workoutsThisWeek} sessions this week</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-muted dark:text-muted-dark" />
          </motion.div>
        </Link>
      </motion.div>
    </div>
  );
}

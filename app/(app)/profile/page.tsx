'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Bell, Volume2, CalendarDays, LogOut, ChevronRight, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAppStore } from '@/lib/app-store';
import { mockUser } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

/* ─── Reusable toggle switch ─── */
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      className={cn(
        'relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none',
        enabled ? 'bg-accent dark:bg-violet' : 'bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark',
      )}
    >
      <motion.span
        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

/* ─── Settings row ─── */
function SettingRow({
  icon,
  label,
  description,
  right,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  right: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-t border-border dark:border-border-dark">
      <div className="flex items-center gap-3 min-w-0">
        <div className="shrink-0 w-8 h-8 rounded-xl bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-medium text-text dark:text-text-dark">{label}</p>
          {description && <p className="text-[11px] text-muted dark:text-muted-dark leading-tight">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 ml-3">{right}</div>
    </div>
  );
}

/* ─── Section card ─── */
function Section({ title, children, delay = 0 }: { title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark overflow-hidden"
    >
      <p className="px-4 pt-4 pb-2 text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider">
        {title}
      </p>
      {children}
    </motion.div>
  );
}

/* ─── Profile Page ─── */
export default function ProfilePage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { taskStreak, goals, tasks } = useAppStore();

  const [notifications, setNotifications] = useState(false);
  const [sound,         setSound]         = useState(true);
  const [weekMon,       setWeekMon]       = useState(true);

  useEffect(() => {
    const stored = (key: string, def: boolean) => {
      const v = localStorage.getItem(key);
      return v === null ? def : v === 'true';
    };
    setNotifications(stored('lyfe-notifications', false));
    setSound(stored('lyfe-sound', true));
    setWeekMon(stored('lyfe-week-start', true));
  }, []);

  const set = (key: string, setter: (v: boolean) => void) => (next: boolean) => {
    setter(next);
    localStorage.setItem(key, String(next));
  };

  const today          = new Date().toISOString().split('T')[0];
  const activeGoals    = goals.filter(g => g.status === 'active').length;
  const doneTodayCount = tasks.filter(t => t.dueDate === today && t.completed).length;
  const totalToday     = tasks.filter(t => t.dueDate === today).length;

  const joinedFormatted = new Date(mockUser.joinedDate).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-5">

      {/* ─── Avatar + Identity ─── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col items-center pt-4 pb-2"
      >
        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-[28px] font-bold text-white mb-4 shadow-lg"
          style={{ background: 'linear-gradient(135deg, #7C6EF8 0%, #3EC99A 100%)' }}
        >
          {mockUser.avatarInitials}
        </div>

        <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">{mockUser.name}</h1>
        <p className="text-[14px] text-muted dark:text-muted-dark mt-1">{mockUser.email}</p>
        <p className="text-[11px] text-muted dark:text-muted-dark mt-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark px-3 py-1 rounded-full">
          Member since {joinedFormatted}
        </p>
      </motion.div>

      {/* ─── Quick Stats ─── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.06 }}
        className="grid grid-cols-3 gap-2.5"
      >
        {[
          { icon: '🔥', label: 'Day Streak',   value: taskStreak.current,  color: '#F5A524' },
          { icon: '🏆', label: 'Best Streak',  value: taskStreak.longest,  color: '#3EC99A' },
          { icon: '🎯', label: 'Active Goals', value: activeGoals,          color: '#7C6EF8' },
        ].map(s => (
          <div
            key={s.label}
            className="bg-surface dark:bg-surface-dark rounded-2xl p-3 border border-border dark:border-border-dark text-center"
          >
            <span className="text-xl">{s.icon}</span>
            <p className="text-2xl font-bold font-display mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-muted dark:text-muted-dark font-medium leading-tight mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* ─── Today's Progress bar ─── */}
      {totalToday > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="bg-surface dark:bg-surface-dark rounded-2xl border border-border dark:border-border-dark p-4"
        >
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[13px] font-semibold text-text dark:text-text-dark">Today's Tasks</p>
            <p className="text-[12px] font-bold text-accent dark:text-violet">
              {doneTodayCount}/{totalToday}
            </p>
          </div>
          <div className="h-2 bg-surface-2 dark:bg-surface-2-dark rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent dark:bg-violet"
              initial={{ width: 0 }}
              animate={{ width: `${Math.round((doneTodayCount / totalToday) * 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
          <p className="text-[11px] text-muted dark:text-muted-dark mt-2">
            {doneTodayCount === totalToday
              ? '🎉 All done for today!'
              : `${totalToday - doneTodayCount} task${totalToday - doneTodayCount !== 1 ? 's' : ''} remaining`}
          </p>
        </motion.div>
      )}

      {/* ─── Appearance ─── */}
      <Section title="Appearance" delay={0.14}>
        <SettingRow
          icon={theme === 'dark'
            ? <Moon size={15} className="text-violet" />
            : <Sun size={15} className="text-amber" />}
          label="Dark Mode"
          description={theme === 'dark' ? 'Enabled' : 'Disabled'}
          right={<Toggle enabled={theme === 'dark'} onToggle={toggleTheme} />}
        />
      </Section>

      {/* ─── App Settings ─── */}
      <Section title="App Settings" delay={0.18}>
        <SettingRow
          icon={<Bell size={15} className="text-accent dark:text-violet" />}
          label="Notifications"
          description="Task reminders & goal updates"
          right={
            <Toggle
              enabled={notifications}
              onToggle={() => set('lyfe-notifications', setNotifications)(!notifications)}
            />
          }
        />
        <SettingRow
          icon={<Volume2 size={15} className="text-mint" />}
          label="Sound Effects"
          description="Completion sounds & feedback"
          right={
            <Toggle
              enabled={sound}
              onToggle={() => set('lyfe-sound', setSound)(!sound)}
            />
          }
        />
        <SettingRow
          icon={<CalendarDays size={15} className="text-amber" />}
          label="Week Starts Monday"
          description={weekMon ? 'Mon – Sun' : 'Sun – Sat'}
          right={
            <Toggle
              enabled={weekMon}
              onToggle={() => set('lyfe-week-start', setWeekMon)(!weekMon)}
            />
          }
        />
      </Section>

      {/* ─── Account ─── */}
      <Section title="Account" delay={0.22}>
        {([
          {
            icon: <ShieldCheck size={15} className="text-mint" />,
            label: 'Privacy & Security',
            onClick: () => {},
          },
          {
            icon: <LogOut size={15} className="text-coral" />,
            label: 'Sign Out',
            onClick: () => {},
          },
        ] as const).map(item => (
          <button
            key={item.label}
            onClick={item.onClick}
            className="w-full flex items-center justify-between px-4 py-3.5 border-t border-border dark:border-border-dark hover:bg-surface-2/50 dark:hover:bg-surface-2-dark/50 active:bg-surface-2 dark:active:bg-surface-2-dark transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                {item.icon}
              </div>
              <p className="text-[14px] font-medium text-text dark:text-text-dark">{item.label}</p>
            </div>
            <ChevronRight size={15} className="text-muted dark:text-muted-dark" />
          </button>
        ))}
      </Section>

      {/* ─── Footer ─── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-[11px] text-muted dark:text-muted-dark pb-2"
      >
        LYFE v0.1.0 · Made with ♥
      </motion.p>
    </div>
  );
}

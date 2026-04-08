'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon, Sun, Bell, Volume2, CalendarDays, LogOut, ChevronRight,
  ShieldCheck, Download, Trash2, KeyRound, Eye, EyeOff, X, Loader2,
  BellOff, BellRing,
} from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAppStore } from '@/lib/app-store';
import { mockUser } from '@/lib/mock-data';
import { createClient } from '@/lib/supabase/client';
import { playCompletionSound } from '@/lib/sounds';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
function initials(name: string) {
  return name
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function scheduleTodayNotifications(tasks: import('@/lib/mock-data').Task[]) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  if (localStorage.getItem('lyfe-notifications') !== 'true') return;

  const today = new Date().toISOString().split('T')[0];
  const now   = Date.now();

  tasks
    .filter(t => t.dueDate === today && !t.completed && t.startTime)
    .forEach(task => {
      const [h, m] = task.startTime!.split(':').map(Number);
      const fire   = new Date();
      fire.setHours(h, m - 5, 0, 0); // 5 min earlier
      const delay  = fire.getTime() - now;
      if (delay > 0) {
        setTimeout(() => {
          if (
            Notification.permission === 'granted' &&
            localStorage.getItem('lyfe-notifications') === 'true'
          ) {
            new Notification(`${task.icon} ${task.title}`, {
              body: 'Starting in 5 minutes',
              icon: '/favicon.ico',
              tag: `lyfe-task-${task.id}`,
            });
          }
        }, delay);
      }
    });
}

/* ─── Toggle switch ───────────────────────────────────────────────────────── */
function Toggle({
  enabled,
  disabled,
  onToggle,
}: {
  enabled: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={enabled}
      className={cn(
        'relative shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none',
        disabled && 'opacity-40 cursor-not-allowed',
        enabled
          ? 'bg-accent dark:bg-violet'
          : 'bg-surface-2 dark:bg-surface-2-dark border border-border dark:border-border-dark',
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

/* ─── Settings row ─────────────────────────────────────────────────────────── */
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
          {description && (
            <p className="text-[11px] text-muted dark:text-muted-dark leading-tight">{description}</p>
          )}
        </div>
      </div>
      <div className="shrink-0 ml-3">{right}</div>
    </div>
  );
}

/* ─── Section card ─────────────────────────────────────────────────────────── */
function Section({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
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

/* ─── Privacy & Security sheet ─────────────────────────────────────────────── */
function PrivacySheet({
  onClose,
  authUser,
}: {
  onClose: () => void;
  authUser: User | null;
}) {
  const { tasks, goals, workouts, ideas, supplies } = useAppStore();
  const router = useRouter();

  const isEmailUser = authUser?.app_metadata?.provider === 'email';

  // Change password
  const [showPwdForm,   setShowPwdForm]   = useState(false);
  const [newPwd,        setNewPwd]        = useState('');
  const [confirmPwd,    setConfirmPwd]    = useState('');
  const [showPwdText,   setShowPwdText]   = useState(false);
  const [pwdWorking,    setPwdWorking]    = useState(false);

  // Delete account
  const [deleteStep,    setDeleteStep]    = useState(false);
  const [deleteInput,   setDeleteInput]   = useState('');
  const [deleteWorking, setDeleteWorking] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    const payload = JSON.stringify(
      { exportedAt: new Date().toISOString(), tasks, goals, workouts, ideas, supplies },
      null,
      2,
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `lyfe-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleChangePwd = async () => {
    if (newPwd.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }
    setPwdWorking(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPwd });
    setPwdWorking(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setNewPwd(''); setConfirmPwd(''); setShowPwdForm(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') return;
    setDeleteWorking(true);
    const supabase = createClient();
    const { error } = await supabase.rpc('delete_user');
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setDeleteWorking(false);
      return;
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl overflow-y-auto"
        style={{ maxHeight: '85vh' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        <div className="px-5 pb-[88px] space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between pt-1">
            <h2 className="text-xl font-bold font-display text-text dark:text-text-dark">
              Privacy &amp; Security
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center"
            >
              <X size={14} className="text-text dark:text-text-dark" />
            </button>
          </div>

          {/* Message banner */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  'px-4 py-3 rounded-xl text-[13px] font-medium',
                  message.type === 'success'
                    ? 'bg-mint/15 text-mint'
                    : 'bg-coral/15 text-coral',
                )}
              >
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Export Data ── */}
          <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl overflow-hidden">
            <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider">
              Your Data
            </p>
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-border dark:border-border-dark hover:bg-surface dark:hover:bg-surface-dark active:scale-[0.98] transition-all text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-surface dark:bg-surface-dark flex items-center justify-center shrink-0">
                <Download size={15} className="text-accent dark:text-violet" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-text dark:text-text-dark">Export My Data</p>
                <p className="text-[11px] text-muted dark:text-muted-dark">
                  Download all tasks, goals, workouts &amp; more as JSON
                </p>
              </div>
              <ChevronRight size={14} className="text-muted dark:text-muted-dark shrink-0" />
            </button>
          </div>

          {/* ── Change Password (email accounts only) ── */}
          {isEmailUser && (
            <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl overflow-hidden">
              <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider">
                Account Security
              </p>
              <div className="border-t border-border dark:border-border-dark">
                {!showPwdForm ? (
                  <button
                    onClick={() => { setShowPwdForm(true); setMessage(null); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface dark:hover:bg-surface-dark active:scale-[0.98] transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-xl bg-surface dark:bg-surface-dark flex items-center justify-center shrink-0">
                      <KeyRound size={15} className="text-amber" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-text dark:text-text-dark">Change Password</p>
                      <p className="text-[11px] text-muted dark:text-muted-dark">
                        Update your account password
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-muted dark:text-muted-dark shrink-0" />
                  </button>
                ) : (
                  <div className="px-4 py-4 space-y-3">
                    <p className="text-[13px] font-semibold text-text dark:text-text-dark">Change Password</p>

                    {/* New password */}
                    <div className="relative">
                      <input
                        type={showPwdText ? 'text' : 'password'}
                        value={newPwd}
                        onChange={e => setNewPwd(e.target.value)}
                        placeholder="New password (min 8 chars)"
                        className="w-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 pr-12 text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark focus:outline-none focus:border-accent dark:focus:border-violet transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwdText(p => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted dark:text-muted-dark"
                      >
                        {showPwdText ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>

                    {/* Confirm password */}
                    <div className="relative">
                      <input
                        type={showPwdText ? 'text' : 'password'}
                        value={confirmPwd}
                        onChange={e => setConfirmPwd(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-xl px-4 py-3 pr-12 text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark focus:outline-none focus:border-accent dark:focus:border-violet transition-colors"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => { setShowPwdForm(false); setNewPwd(''); setConfirmPwd(''); }}
                        className="flex-1 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-[13px] font-medium text-muted dark:text-muted-dark"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleChangePwd}
                        disabled={pwdWorking || !newPwd || !confirmPwd}
                        className="flex-1 py-2.5 rounded-xl bg-accent dark:bg-violet text-white text-[13px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {pwdWorking && <Loader2 size={13} className="animate-spin" />}
                        {pwdWorking ? 'Saving…' : 'Save Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Delete Account ── */}
          <div className="bg-surface-2 dark:bg-surface-2-dark rounded-2xl overflow-hidden">
            <p className="px-4 pt-4 pb-1 text-[11px] font-semibold text-muted dark:text-muted-dark uppercase tracking-wider">
              Danger Zone
            </p>
            <div className="border-t border-border dark:border-border-dark">
              {!deleteStep ? (
                <button
                  onClick={() => { setDeleteStep(true); setMessage(null); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-coral/5 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center shrink-0">
                    <Trash2 size={15} className="text-coral" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-coral">Delete Account</p>
                    <p className="text-[11px] text-muted dark:text-muted-dark">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-muted dark:text-muted-dark shrink-0" />
                </button>
              ) : (
                <div className="px-4 py-4 space-y-3">
                  <div className="bg-coral/10 rounded-xl px-4 py-3">
                    <p className="text-[13px] font-semibold text-coral mb-1">This cannot be undone</p>
                    <p className="text-[11px] text-muted dark:text-muted-dark leading-snug">
                      All your tasks, goals, workouts, ideas, and supplies will be permanently deleted.
                    </p>
                  </div>
                  <p className="text-[12px] text-muted dark:text-muted-dark">
                    Type <span className="font-mono font-bold text-text dark:text-text-dark">DELETE</span> to confirm
                  </p>
                  <input
                    type="text"
                    value={deleteInput}
                    onChange={e => setDeleteInput(e.target.value)}
                    placeholder="DELETE"
                    className="w-full bg-surface dark:bg-surface-dark border border-coral/40 rounded-xl px-4 py-3 text-[14px] text-text dark:text-text-dark placeholder:text-muted dark:placeholder:text-muted-dark focus:outline-none focus:border-coral transition-colors font-mono"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => { setDeleteStep(false); setDeleteInput(''); }}
                      className="flex-1 py-2.5 rounded-xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark text-[13px] font-medium text-muted dark:text-muted-dark"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteInput !== 'DELETE' || deleteWorking}
                      className="flex-1 py-2.5 rounded-xl bg-coral text-white text-[13px] font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {deleteWorking && <Loader2 size={13} className="animate-spin" />}
                      {deleteWorking ? 'Deleting…' : 'Delete Account'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Profile Page ──────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { taskStreak, goals, tasks } = useAppStore();
  const router = useRouter();

  // Auth user
  const [authUser, setAuthUser] = useState<User | null>(null);

  // Settings toggles
  const [notifications, setNotifications] = useState(false);
  const [sound,         setSound]         = useState(true);
  const [weekMon,       setWeekMon]       = useState(true);

  // Notification permission
  const [notifPerm, setNotifPerm] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('unsupported');

  // UI states
  const [signingOut,   setSigningOut]   = useState(false);
  const [showPrivacy,  setShowPrivacy]  = useState(false);
  const [soundFlash,   setSoundFlash]   = useState(false);

  // Load auth user + preferences
  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setAuthUser(user));

    const stored = (key: string, def: boolean) => {
      const v = localStorage.getItem(key);
      return v === null ? def : v === 'true';
    };
    setNotifications(stored('lyfe-notifications', false));
    setSound(stored('lyfe-sound', true));
    setWeekMon(stored('lyfe-week-start', true));

    if (!('Notification' in window)) {
      setNotifPerm('unsupported');
    } else {
      setNotifPerm(Notification.permission as 'default' | 'granted' | 'denied');
    }
  }, []);

  // Derived user display info
  const displayName  = authUser?.user_metadata?.full_name
    ?? authUser?.user_metadata?.name
    ?? authUser?.email?.split('@')[0]
    ?? mockUser.name;
  const displayEmail = authUser?.email ?? mockUser.email;
  const displayInit  = initials(displayName);
  const joinedDate   = authUser?.created_at
    ? new Date(authUser.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : new Date(mockUser.joinedDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const today          = new Date().toISOString().split('T')[0];
  const activeGoals    = goals.filter(g => g.status === 'active').length;
  const doneTodayCount = tasks.filter(t => t.dueDate === today && t.completed).length;
  const totalToday     = tasks.filter(t => t.dueDate === today).length;

  // ── Settings helpers ─────────────────────────────────────────────────────
  const persist = (key: string, setter: (v: boolean) => void) => (next: boolean) => {
    setter(next);
    localStorage.setItem(key, String(next));
  };

  const handleNotifToggle = async () => {
    if (notifPerm === 'unsupported') return;

    if (notifPerm === 'denied') {
      // Can't re-request after deny — user must enable in browser settings
      return;
    }

    if (!notifications) {
      // Request permission if not yet decided
      if (notifPerm === 'default') {
        const result = await Notification.requestPermission();
        setNotifPerm(result as 'granted' | 'denied' | 'default');
        if (result !== 'granted') return;
      }
      persist('lyfe-notifications', setNotifications)(true);
      // Schedule reminders for today's remaining tasks
      scheduleTodayNotifications(tasks);
    } else {
      persist('lyfe-notifications', setNotifications)(false);
    }
  };

  const handleSoundToggle = () => {
    const next = !sound;
    persist('lyfe-sound', setSound)(next);
    if (next) {
      // Preview the sound when enabling
      localStorage.setItem('lyfe-sound', 'true');
      setSoundFlash(true);
      setTimeout(() => setSoundFlash(false), 600);
      playCompletionSound();
    }
  };

  // ── Sign Out ─────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // ── Notification status description ──────────────────────────────────────
  const notifDescription = () => {
    if (notifPerm === 'unsupported') return 'Not supported on this device';
    if (notifPerm === 'denied')      return 'Blocked — enable in browser settings';
    if (notifications)               return '5-min reminders before tasks';
    return 'Task reminders & goal updates';
  };

  return (
    <>
      <div className="space-y-5">

        {/* ─── Avatar + Identity ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex flex-col items-center pt-4 pb-2"
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-[28px] font-bold text-white mb-4 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #7C6EF8 0%, #3EC99A 100%)' }}
          >
            {displayInit}
          </div>

          <h1 className="text-2xl font-bold font-display text-text dark:text-text-dark">{displayName}</h1>
          <p className="text-[14px] text-muted dark:text-muted-dark mt-1">{displayEmail}</p>
          <p className="text-[11px] text-muted dark:text-muted-dark mt-1.5 bg-surface dark:bg-surface-dark border border-border dark:border-border-dark px-3 py-1 rounded-full">
            Member since {joinedDate}
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
            { icon: '🔥', label: 'Day Streak',   value: taskStreak.current, color: '#F5A524' },
            { icon: '🏆', label: 'Best Streak',  value: taskStreak.longest, color: '#3EC99A' },
            { icon: '🎯', label: 'Active Goals', value: activeGoals,         color: '#7C6EF8' },
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
              <p className="text-[13px] font-semibold text-text dark:text-text-dark">Today&apos;s Tasks</p>
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
            icon={
              theme === 'dark'
                ? <Moon size={15} className="text-violet" />
                : <Sun size={15} className="text-amber" />
            }
            label="Dark Mode"
            description={theme === 'dark' ? 'Enabled' : 'Disabled'}
            right={<Toggle enabled={theme === 'dark'} onToggle={toggleTheme} />}
          />
        </Section>

        {/* ─── App Settings ─── */}
        <Section title="App Settings" delay={0.18}>
          {/* Notifications */}
          <SettingRow
            icon={
              notifPerm === 'denied'
                ? <BellOff size={15} className="text-muted dark:text-muted-dark" />
                : notifications
                  ? <BellRing size={15} className="text-accent dark:text-violet" />
                  : <Bell size={15} className="text-accent dark:text-violet" />
            }
            label="Notifications"
            description={notifDescription()}
            right={
              notifPerm === 'denied' ? (
                <span className="text-[10px] font-semibold text-coral bg-coral/10 px-2 py-1 rounded-full">
                  Blocked
                </span>
              ) : notifPerm === 'unsupported' ? (
                <span className="text-[10px] font-semibold text-muted dark:text-muted-dark bg-surface-2 dark:bg-surface-2-dark px-2 py-1 rounded-full">
                  N/A
                </span>
              ) : (
                <Toggle
                  enabled={notifications}
                  onToggle={handleNotifToggle}
                />
              )
            }
          />

          {/* Sound Effects */}
          <SettingRow
            icon={
              <Volume2
                size={15}
                className={cn(
                  'transition-colors',
                  soundFlash ? 'text-mint' : 'text-mint',
                )}
              />
            }
            label="Sound Effects"
            description={sound ? 'Plays a chime on task completion' : 'Completion sounds & feedback'}
            right={<Toggle enabled={sound} onToggle={handleSoundToggle} />}
          />

          {/* Week start */}
          <SettingRow
            icon={<CalendarDays size={15} className="text-amber" />}
            label="Week Starts Monday"
            description={weekMon ? 'Mon – Sun' : 'Sun – Sat'}
            right={
              <Toggle
                enabled={weekMon}
                onToggle={() => persist('lyfe-week-start', setWeekMon)(!weekMon)}
              />
            }
          />
        </Section>

        {/* ─── Account ─── */}
        <Section title="Account" delay={0.22}>
          {/* Privacy & Security */}
          <button
            onClick={() => setShowPrivacy(true)}
            className="w-full flex items-center justify-between px-4 py-3.5 border-t border-border dark:border-border-dark hover:bg-surface-2/50 dark:hover:bg-surface-2-dark/50 active:bg-surface-2 dark:active:bg-surface-2-dark transition-colors text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
                <ShieldCheck size={15} className="text-mint" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-text dark:text-text-dark">Privacy &amp; Security</p>
                <p className="text-[11px] text-muted dark:text-muted-dark">Export data, change password</p>
              </div>
            </div>
            <ChevronRight size={15} className="text-muted dark:text-muted-dark" />
          </button>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-between px-4 py-3.5 border-t border-border dark:border-border-dark hover:bg-coral/5 active:bg-coral/10 transition-colors text-left disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-coral/10 flex items-center justify-center">
                {signingOut
                  ? <Loader2 size={15} className="text-coral animate-spin" />
                  : <LogOut size={15} className="text-coral" />}
              </div>
              <p className="text-[14px] font-medium text-coral">
                {signingOut ? 'Signing out…' : 'Sign Out'}
              </p>
            </div>
            {!signingOut && <ChevronRight size={15} className="text-muted dark:text-muted-dark" />}
          </button>
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

      {/* ─── Privacy & Security Sheet ─── */}
      <AnimatePresence>
        {showPrivacy && (
          <PrivacySheet onClose={() => setShowPrivacy(false)} authUser={authUser} />
        )}
      </AnimatePresence>
    </>
  );
}

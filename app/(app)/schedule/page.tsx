'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Clock, CalendarPlus, CalendarCheck, X, Copy, Check, RefreshCw, Smartphone, Globe } from 'lucide-react';
import { format, addDays, subDays, parseISO, isToday as checkIsToday } from 'date-fns';
import { type Task } from '@/lib/mock-data';
import { useAppStore } from '@/lib/app-store';
import { dbGetOrCreateCalendarToken, dbRegenerateCalendarToken } from '@/lib/db';
import { cn, timeToPx, durationPx, getCurrentMinutes, formatDisplayTime } from '@/lib/utils';

const PX_PER_HOUR = 80;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const LABEL_W = 64; // px — matches w-16
const RIGHT_GAP = 12; // px — matches right-3
const COL_GAP = 3; // px gap between side-by-side blocks

function addMins(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total  = h * 60 + m + mins;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function timeToMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/* ─── Overlap Layout ─── */
type LayoutInfo = { columnIndex: number; totalColumns: number };

function computeOverlaps(tasks: Task[]): Map<string, LayoutInfo> {
  const result = new Map<string, LayoutInfo>();
  if (!tasks.length) return result;

  const intervals = tasks.map(t => ({
    id:    t.id,
    start: timeToMins(t.startTime!),
    end:   t.endTime ? timeToMins(t.endTime) : timeToMins(t.startTime!) + 30,
  })).sort((a, b) => a.start - b.start);

  // Greedy column assignment — place each task in the first column it fits
  const colEnds: number[] = []; // end-time of the last task placed in each column
  const colOf = new Map<string, number>();

  for (const iv of intervals) {
    let col = colEnds.findIndex(end => end <= iv.start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = iv.end;
    colOf.set(iv.id, col);
  }

  // For each task, the "total columns" is the max column index of any task it overlaps + 1
  for (const iv of intervals) {
    let maxCol = colOf.get(iv.id)!;
    for (const other of intervals) {
      if (other.id !== iv.id && other.start < iv.end && other.end > iv.start) {
        maxCol = Math.max(maxCol, colOf.get(other.id)!);
      }
    }
    result.set(iv.id, { columnIndex: colOf.get(iv.id)!, totalColumns: maxCol + 1 });
  }

  return result;
}

/* ─── Schedule Block ─── */
function ScheduleBlock({ task, layout }: { task: Task; layout: LayoutInfo }) {
  if (!task.startTime) return null;

  const effectiveEnd = task.endTime ?? addMins(task.startTime, 30);
  const top    = timeToPx(task.startTime, PX_PER_HOUR);
  const height = Math.max(durationPx(task.startTime, effectiveEnd, PX_PER_HOUR), 28);
  const isShort = height < 44;

  const { columnIndex, totalColumns } = layout;
  // Divide the available content area into equal columns with a small gap
  const leftPx  = `calc(${LABEL_W}px + ${columnIndex / totalColumns} * (100% - ${LABEL_W + RIGHT_GAP}px) + ${columnIndex > 0 ? COL_GAP / 2 : 0}px)`;
  const rightPx = `calc(${RIGHT_GAP}px + ${(totalColumns - columnIndex - 1) / totalColumns} * (100% - ${LABEL_W + RIGHT_GAP}px) + ${columnIndex < totalColumns - 1 ? COL_GAP / 2 : 0}px)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute rounded-2xl overflow-hidden cursor-pointer select-none"
      style={{ top, height, left: leftPx, right: rightPx, backgroundColor: task.color + '20', borderLeft: `4px solid ${task.color}` }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-1.5 px-2.5 py-1.5 h-full">
        <span className={cn('text-sm leading-none shrink-0', isShort ? 'mt-0' : 'mt-0.5')}>{task.icon}</span>
        {!isShort ? (
          <div className="min-w-0">
            <p className="text-[12px] font-semibold leading-snug truncate" style={{ color: task.color }}>
              {task.title}
            </p>
            <p className="text-[10px] opacity-70" style={{ color: task.color }}>
              {formatDisplayTime(task.startTime)}{task.endTime ? ` – ${formatDisplayTime(task.endTime)}` : ''}
            </p>
          </div>
        ) : (
          <p className="text-[11px] font-semibold truncate leading-tight mt-0.5" style={{ color: task.color }}>
            {task.title}
          </p>
        )}
      </div>

      {task.completed && (
        <div className="absolute inset-0 bg-white/30 dark:bg-black/30 flex items-center justify-center">
          <div className="text-white text-xs font-bold bg-black/20 px-2 py-0.5 rounded-full">Done</div>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Current Time Indicator ─── */
function CurrentTimeIndicator({ currentMins }: { currentMins: number }) {
  const top = (currentMins / 60) * PX_PER_HOUR;
  const h = Math.floor(currentMins / 60);
  const m = currentMins % 60;
  const label = `${h === 0 ? 12 : h > 12 ? h - 12 : h}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;

  return (
    <div className="absolute left-0 right-3 flex items-center z-10 pointer-events-none" style={{ top: top - 1 }}>
      <div className="w-16 flex items-center justify-end pr-2">
        <span className="text-[9px] font-bold text-coral">{label}</span>
      </div>
      <div className="w-2 h-2 rounded-full bg-coral shrink-0" />
      <div className="flex-1 h-[1.5px] bg-coral" />
    </div>
  );
}

/* ─── Hour Grid ─── */
function HourGrid() {
  return (
    <>
      {HOURS.map(h => (
        <div key={h} className="absolute left-0 right-3" style={{ top: h * PX_PER_HOUR }}>
          <div className="flex items-center">
            <div className="w-16 text-right pr-3">
              <span className="text-[10px] text-muted dark:text-muted-dark leading-none">
                {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
              </span>
            </div>
            <div className="flex-1 border-t border-border/40 dark:border-border-dark/40" />
          </div>
        </div>
      ))}
    </>
  );
}

/* ─── ICS Export ─── */
function toICSDateTime(dateStr: string, timeStr: string): string {
  // Produces floating local-time stamp: YYYYMMDDTHHmmss
  const [y, m, d] = dateStr.split('-');
  const [hh, mm]  = timeStr.split(':');
  return `${y}${m}${d}T${hh}${mm}00`;
}

function buildICS(tasks: Task[], dateStr: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LYFE//LYFE Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const t of tasks) {
    if (!t.startTime) continue;
    const end = t.endTime ?? addMins(t.startTime, 30);
    lines.push(
      'BEGIN:VEVENT',
      `UID:${t.id}-${dateStr}@lyfe`,
      `DTSTART:${toICSDateTime(dateStr, t.startTime)}`,
      `DTEND:${toICSDateTime(dateStr, end)}`,
      `SUMMARY:${t.icon} ${t.title}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

async function exportToCalendar(tasks: Task[], dateStr: string, displayDate: string) {
  const content  = buildICS(tasks, dateStr);
  const filename = `lyfe-${dateStr}.ics`;
  const blob     = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const file     = new File([blob], filename, { type: 'text/calendar' });

  // Web Share API (iOS share sheet / Android intent — includes native Calendar)
  if (typeof navigator.share === 'function' && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ title: `LYFE — ${displayDate}`, files: [file] });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return; // user cancelled
    }
  }

  // Fallback: trigger .ics download (iOS Calendar opens it on tap; Android prompts calendar app)
  const url = URL.createObjectURL(blob);
  const a   = Object.assign(document.createElement('a'), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Calendar Sync Sheet ─── */
function CalendarSyncSheet({ onClose }: { onClose: () => void }) {
  const [token,   setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);
  const [busy,    setBusy]    = useState(false);

  useEffect(() => {
    let cancelled = false;
    dbGetOrCreateCalendarToken().then(t => {
      if (!cancelled) { setToken(t); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const host   = typeof window !== 'undefined' ? window.location.host : '';
  const feedUrl   = token ? `${origin}/api/calendar/${token}` : '';
  const appleUrl  = token ? `webcal://${host}/api/calendar/${token}` : '';
  const googleUrl = token ? `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(feedUrl)}` : '';

  const copy = async () => {
    if (!feedUrl) return;
    try { await navigator.clipboard.writeText(feedUrl); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };

  const regenerate = async () => {
    setBusy(true);
    const t = await dbRegenerateCalendarToken();
    if (t) setToken(t);
    setBusy(false);
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col justify-end"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative bg-surface dark:bg-surface-dark rounded-t-3xl border-t-4 border-violet max-h-[90vh] overflow-y-auto no-scrollbar"
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 380, damping: 40 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border dark:bg-border-dark" />
        </div>

        <div className="px-5 pb-[88px] pt-2">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold font-display text-text dark:text-text-dark">Sync calendar</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surface-2 dark:bg-surface-2-dark flex items-center justify-center">
              <X size={14} className="text-muted dark:text-muted-dark" />
            </button>
          </div>
          <p className="text-[12px] text-muted dark:text-muted-dark mb-4">
            Subscribe your phone or Google account to keep your LYFE schedule in your calendar. Updates flow one way (LYFE → calendar) and refresh automatically.
          </p>

          {loading ? (
            <div className="py-10 text-center text-[13px] text-muted dark:text-muted-dark">Preparing your feed…</div>
          ) : !token ? (
            <div className="py-10 text-center text-[13px] text-coral">Couldn’t create your feed. Please sign in again and retry.</div>
          ) : (
            <div className="space-y-2.5">
              <a
                href={appleUrl}
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-surface-2 dark:bg-surface-2-dark"
              >
                <div className="w-9 h-9 rounded-xl bg-violet/15 flex items-center justify-center shrink-0">
                  <Smartphone size={17} className="text-violet" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text dark:text-text-dark">Add to Apple Calendar</p>
                  <p className="text-[11px] text-muted dark:text-muted-dark">iPhone / iPad · refreshes every ~15 min–few hrs</p>
                </div>
                <CalendarCheck size={16} className="text-muted dark:text-muted-dark shrink-0" />
              </a>

              <a
                href={googleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-surface-2 dark:bg-surface-2-dark"
              >
                <div className="w-9 h-9 rounded-xl bg-mint/15 flex items-center justify-center shrink-0">
                  <Globe size={17} className="text-mint" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text dark:text-text-dark">Add to Google Calendar</p>
                  <p className="text-[11px] text-muted dark:text-muted-dark">Opens Google · note: Google refreshes slowly (hrs)</p>
                </div>
                <CalendarCheck size={16} className="text-muted dark:text-muted-dark shrink-0" />
              </a>

              <button
                onClick={copy}
                className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-surface-2 dark:bg-surface-2-dark text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-surface dark:bg-surface-dark flex items-center justify-center shrink-0">
                  {copied ? <Check size={17} className="text-mint" /> : <Copy size={16} className="text-muted dark:text-muted-dark" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-text dark:text-text-dark">{copied ? 'Copied!' : 'Copy feed URL'}</p>
                  <p className="text-[11px] text-muted dark:text-muted-dark truncate">{feedUrl}</p>
                </div>
              </button>

              <button
                onClick={regenerate}
                disabled={busy}
                className="flex items-center gap-2 justify-center w-full p-3 rounded-2xl text-coral text-[13px] font-medium disabled:opacity-50"
              >
                <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
                {busy ? 'Regenerating…' : 'Regenerate link (revokes the old one)'}
              </button>

              <p className="text-[11px] text-muted dark:text-muted-dark text-center pt-1">
                Keep this link private — anyone with it can see your schedule.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Schedule Page ─── */
export default function SchedulePage() {
  const { tasks: allTasks } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMins, setCurrentMins] = useState(getCurrentMinutes());
  const [showSync, setShowSync] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const dateStr = format(currentDate, 'yyyy-MM-dd');
  const isToday = checkIsToday(currentDate);
  const dayTasks = allTasks.filter(t => t.dueDate === dateStr && t.startTime);
  const layoutMap = computeOverlaps(dayTasks);

  // Scroll to current time on mount (if today)
  useEffect(() => {
    if (isToday && scrollRef.current) {
      const scrollTop = Math.max(0, currentMins * (PX_PER_HOUR / 60) - 120);
      scrollRef.current.scrollTop = scrollTop;
    }
  }, [isToday, currentMins]);

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentMins(getCurrentMinutes()), 60_000);
    return () => clearInterval(interval);
  }, []);

  const scrollToCurrent = () => {
    if (scrollRef.current) {
      const scrollTop = Math.max(0, currentMins * (PX_PER_HOUR / 60) - 120);
      scrollRef.current.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      {/* Date nav */}
      <motion.div
        className="flex items-center justify-between mb-4 shrink-0"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          onClick={() => setCurrentDate(d => subDays(d, 1))}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark flex items-center justify-center text-muted dark:text-muted-dark"
        >
          <ChevronLeft size={18} />
        </motion.button>

        <div className="text-center">
          <p className="text-[16px] font-bold font-display text-text dark:text-text-dark">
            {isToday ? 'Today' : format(currentDate, 'EEEE')}
          </p>
          <p className="text-[12px] text-muted dark:text-muted-dark">{format(currentDate, 'MMMM d, yyyy')}</p>
        </div>

        <motion.button
          onClick={() => setCurrentDate(d => addDays(d, 1))}
          whileTap={{ scale: 0.9 }}
          className="w-9 h-9 rounded-full bg-surface dark:bg-surface-dark border border-border dark:border-border-dark flex items-center justify-center text-muted dark:text-muted-dark"
        >
          <ChevronRight size={18} />
        </motion.button>
      </motion.div>

      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-4 shrink-0">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-surface dark:bg-surface-dark rounded-full border border-border dark:border-border-dark">
          <span className="text-xs">📅</span>
          <span className="text-[11px] font-medium text-text dark:text-text-dark">{dayTasks.length} events</span>
        </div>
        {isToday && (
          <motion.button
            onClick={scrollToCurrent}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-coral/15 rounded-full border border-coral/30"
          >
            <Clock size={11} className="text-coral" />
            <span className="text-[11px] font-medium text-coral">Now</span>
          </motion.button>
        )}
        {dayTasks.length === 0 && (
          <span className="text-[11px] text-muted dark:text-muted-dark">— free day!</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {dayTasks.length > 0 && (
            <motion.button
              onClick={() => exportToCalendar(dayTasks, dateStr, format(currentDate, 'MMMM d, yyyy'))}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet/10 rounded-full border border-violet/30"
            >
              <CalendarPlus size={11} className="text-violet" />
              <span className="text-[11px] font-medium text-violet">Add day</span>
            </motion.button>
          )}
          <motion.button
            onClick={() => setShowSync(true)}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-mint/10 rounded-full border border-mint/30"
          >
            <CalendarCheck size={11} className="text-mint" />
            <span className="text-[11px] font-medium text-mint">Sync</span>
          </motion.button>
        </div>
      </div>

      {/* Timeline scroll container */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar rounded-2xl bg-surface dark:bg-surface-dark border border-border dark:border-border-dark"
      >
        {/* The 24h grid */}
        <div className="relative" style={{ height: 24 * PX_PER_HOUR + 20 }}>
          <HourGrid />

          {/* Task blocks */}
          {dayTasks.map(task => (
            <ScheduleBlock key={task.id} task={task} layout={layoutMap.get(task.id)!} />
          ))}

          {/* Current time indicator (today only) */}
          {isToday && <CurrentTimeIndicator currentMins={currentMins} />}
        </div>
      </div>

      {/* Empty state */}
      {dayTasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '40%' }}>
          <div className="text-center">
            <p className="text-4xl mb-2">🌿</p>
            <p className="text-[14px] font-semibold text-text dark:text-text-dark font-display">Free day</p>
            <p className="text-[12px] text-muted dark:text-muted-dark">No events scheduled</p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showSync && <CalendarSyncSheet onClose={() => setShowSync(false)} />}
      </AnimatePresence>
    </div>
  );
}

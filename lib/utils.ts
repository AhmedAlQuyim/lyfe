import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isTomorrow, isYesterday, parseISO, startOfWeek, isSameWeek } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

export function formatWeekLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  if (isSameWeek(date, now, { weekStartsOn: 1 })) return 'This Week';
  return `Week of ${format(startOfWeek(date, { weekStartsOn: 1 }), 'MMM d')}`;
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToPx(minutes: number, pxPerHour = 80): number {
  return (minutes / 60) * pxPerHour;
}

export function timeToPx(time: string, pxPerHour = 80): number {
  return minutesToPx(timeToMinutes(time), pxPerHour);
}

export function durationPx(startTime: string, endTime: string, pxPerHour = 80): number {
  return minutesToPx(timeToMinutes(endTime) - timeToMinutes(startTime), pxPerHour);
}

export function getCurrentMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

export function formatDisplayTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export const priorityConfig = {
  urgent: { label: 'Urgent', hex: '#FF6B6B' },
  high:   { label: 'High',   hex: '#F5A524' },
  medium: { label: 'Medium', hex: '#5BAFEF' },
  low:    { label: 'Low',    hex: '#3EC99A' },
};

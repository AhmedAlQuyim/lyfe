import { createClient } from '@supabase/supabase-js';

// Always fresh — this is a per-user feed; never cache it at the framework layer.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type FeedRow = {
  id: string;
  title: string;
  icon: string | null;
  due_date: string;                 // YYYY-MM-DD
  start_time: string | null;        // HH:MM
  end_time: string | null;          // HH:MM
  notes: string | null;
  priority: string | null;
  recurring: boolean;
  recurrence_frequency: string | null;
};

const pad = (n: number) => String(n).padStart(2, '0');

/** RFC 5545 text escaping for property values. */
function esc(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** Fold a content line to <=75 octets per RFC 5545, splitting on code-point
 *  boundaries (so emoji aren't corrupted). Continuation lines start with a space. */
function fold(line: string): string {
  const out: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch, 'utf8');
    const limit = out.length === 0 ? 75 : 74; // continuation line's leading space costs 1 octet
    if (bytes + b > limit) {
      out.push(cur);
      cur = ch;
      bytes = b;
    } else {
      cur += ch;
      bytes += b;
    }
  }
  out.push(cur);
  return out.map((s, i) => (i === 0 ? s : ' ' + s)).join('\r\n');
}

const compactDate = (due: string) => due.replace(/-/g, ''); // YYYYMMDD

/** Floating local date-time, e.g. 2026-06-10 + 09:00 -> 20260610T090000 (no TZ). */
function floating(due: string, time: string): string {
  return `${compactDate(due)}T${time.replace(':', '')}00`;
}

/** Add minutes to a date+time and return a floating compact stamp (for default end). */
function plusMinutes(due: string, time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const [Y, Mo, D] = due.split('-').map(Number);
  const d = new Date(Date.UTC(Y, Mo - 1, D, h, m + mins));
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`;
}

/** Next calendar day as YYYYMMDD (all-day DTEND is exclusive). */
function nextDay(due: string): string {
  const [Y, Mo, D] = due.split('-').map(Number);
  const d = new Date(Date.UTC(Y, Mo - 1, D + 1));
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function rrule(freq: string | null): string {
  switch (freq) {
    case 'weekdays': return 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR';
    case 'weekly':   return 'RRULE:FREQ=WEEKLY';
    case 'monthly':  return 'RRULE:FREQ=MONTHLY';
    case 'daily':
    default:         return 'RRULE:FREQ=DAILY';
  }
}

function utcStamp(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS(rows: FeedRow[]): string {
  const stamp = utcStamp(new Date());
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LYFE//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:LYFE',
    'NAME:LYFE',
    'X-PUBLISHED-TTL:PT1H',
    'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
  ];

  for (const r of rows) {
    lines.push('BEGIN:VEVENT', `UID:${r.id}@lyfe`, `DTSTAMP:${stamp}`);

    if (r.start_time) {
      lines.push(`DTSTART:${floating(r.due_date, r.start_time)}`);
      const end = r.end_time
        ? floating(r.due_date, r.end_time)
        : plusMinutes(r.due_date, r.start_time, 30);
      lines.push(`DTEND:${end}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${compactDate(r.due_date)}`);
      lines.push(`DTEND;VALUE=DATE:${nextDay(r.due_date)}`);
    }

    if (r.recurring) lines.push(rrule(r.recurrence_frequency));

    const summary = `${r.icon ?? ''} ${r.title}`.trim();
    lines.push(`SUMMARY:${esc(summary)}`);

    const desc = [r.notes ?? '', r.priority ? `Priority: ${r.priority}` : '']
      .filter(Boolean)
      .join('\n');
    if (desc) lines.push(`DESCRIPTION:${esc(desc)}`);

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

function icsResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="lyfe.ics"',
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}

const EMPTY_ICS = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//LYFE//Calendar//EN\r\nEND:VCALENDAR\r\n';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  // Tokens are hex from the client; strip any accidental ".ics" suffix.
  const clean = token.replace(/\.ics$/i, '');
  if (!clean) return icsResponse(EMPTY_ICS);

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.rpc('calendar_feed', { p_token: clean });
    if (error) {
      console.error('[LYFE] calendar_feed rpc error:', error);
      return icsResponse(EMPTY_ICS);
    }
    return icsResponse(buildICS((data ?? []) as FeedRow[]));
  } catch (e) {
    console.error('[LYFE] calendar feed handler error:', e);
    return icsResponse(EMPTY_ICS);
  }
}

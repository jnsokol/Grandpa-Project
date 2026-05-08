import { useEffect, useState } from 'react';
import { useAuthStore, isTokenValid } from '../../lib/google/auth';
import type { GCalTile } from '../../lib/store/tiles';

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_HEIGHT = 44;
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

type CalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
};

type Props = { tile: GCalTile };

function toMins(dateTime: string): number {
  const d = new Date(dateTime);
  return d.getHours() * 60 + d.getMinutes();
}

function fmtTime(dateTime: string): string {
  return new Date(dateTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function fmtHour(h: number): string {
  return h === 12 ? '12' : h > 12 ? `${h - 12}` : `${h}`;
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

async function createCalendarEvent(
  accessToken: string,
  summary: string,
  dateStr: string,
  timeStr: string,
  allDay: boolean,
): Promise<void> {
  let start: Record<string, string>;
  let end: Record<string, string>;
  if (allDay) {
    const nextDay = new Date(dateStr);
    nextDay.setDate(nextDay.getDate() + 1);
    start = { date: dateStr };
    end = { date: nextDay.toISOString().slice(0, 10) };
  } else {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const startDT = `${dateStr}T${timeStr}:00`;
    const endDT = new Date(new Date(`${dateStr}T${timeStr}:00`).getTime() + 60 * 60 * 1000)
      .toLocaleString('sv-SE', { timeZone: tz })
      .replace(' ', 'T');
    start = { dateTime: startDT, timeZone: tz };
    end = { dateTime: endDT, timeZone: tz };
  }
  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ summary, start, end }),
  });
  if (!res.ok) throw new Error(`Calendar API error ${res.status}`);
}

export function GoogleCalendarTile({ tile: _tile }: Props) {
  const token = useAuthStore((s) => s.token);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [newTime, setNewTime] = useState('09:00');
  const [allDay, setAllDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(new Date());

  const connected = isTokenValid(token);

  // Tick the current-time indicator every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  function loadEvents(accessToken: string) {
    setLoading(true);
    setError(null);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=25&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(todayStart.toISOString())}`,
      { headers: { Authorization: `Bearer ${accessToken}` } },
    )
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() as Promise<{ items: CalendarEvent[] }>; })
      .then((data) => setEvents(data.items ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (connected && token) loadEvents(token.access_token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token]);

  async function handleAddEvent(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !newTitle.trim()) return;
    setSaving(true);
    try {
      await createCalendarEvent(token.access_token, newTitle.trim(), newDate, newTime, allDay);
      setShowAdd(false);
      setNewTitle('');
      loadEvents(token.access_token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  // Split events
  const todayTimedEvents = events.filter(
    (ev) => ev.start.dateTime && isToday(ev.start.dateTime),
  );
  const todayAllDay = events.filter(
    (ev) => !ev.start.dateTime && ev.start.date && isToday(ev.start.date),
  );
  const upcoming = events.filter((ev) => {
    const raw = ev.start.dateTime ?? ev.start.date;
    if (!raw) return false;
    const d = new Date(raw);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    return d > todayEnd;
  }).slice(0, 4);

  // Current time offset
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const nowTop = ((nowMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
  const nowVisible = nowMins >= START_HOUR * 60 && nowMins <= END_HOUR * 60;

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div>
          <p className="text-base font-bold">📅 Calendar</p>
          <p className="text-zinc-400 text-xs">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => token && loadEvents(token.access_token)}
            className="text-zinc-400 hover:text-white text-base transition-colors" aria-label="Refresh">↻</button>
          <button onClick={() => setShowAdd((v) => !v)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-colors" aria-label="Add event">+</button>
        </div>
      </div>

      {/* Add event form */}
      {showAdd && (
        <form onSubmit={handleAddEvent} className="mx-3 mb-2 bg-white/10 rounded-xl p-3 flex flex-col gap-2 shrink-0">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Event title…" required
            className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
          <div className="flex gap-2">
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required
              className="flex-1 bg-white/15 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-white/50" />
            {!allDay && (
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="w-24 bg-white/15 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-white/50" />
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
            All day
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={saving}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors">
              {saving ? '…' : 'Add event'}
            </button>
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {error && <p className="text-red-300 text-xs text-center mx-3 mb-2 shrink-0">{error}</p>}

      <div className="flex-1 overflow-auto min-h-0 px-3 pb-3">
        {loading && <p className="text-zinc-400 text-sm text-center mt-4">Loading…</p>}

        {!loading && (
          <>
            {/* All-day events */}
            {todayAllDay.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {todayAllDay.map((ev) => (
                  <span key={ev.id} className="bg-indigo-500/30 text-indigo-200 text-[10px] font-medium px-2 py-0.5 rounded-full truncate max-w-full">
                    {ev.summary ?? '(no title)'}
                  </span>
                ))}
              </div>
            )}

            {/* Timeline */}
            <div className="relative" style={{ height: `${HOURS.length * HOUR_HEIGHT}px` }}>

              {/* Hour grid */}
              {HOURS.map((h) => (
                <div key={h} className="absolute left-0 right-0 flex items-start pointer-events-none"
                  style={{ top: `${(h - START_HOUR) * HOUR_HEIGHT}px` }}>
                  <span className="text-[10px] text-zinc-600 w-6 shrink-0 leading-none -mt-[6px]">{fmtHour(h)}</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
              ))}

              {/* Current time indicator */}
              {nowVisible && (
                <div className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                  style={{ top: `${nowTop}px` }}>
                  <div className="w-6 flex justify-end pr-1 shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  </div>
                  <div className="flex-1 h-px bg-red-400/70" />
                </div>
              )}

              {/* Timed events */}
              {todayTimedEvents.map((ev) => {
                const startMins = toMins(ev.start.dateTime!);
                const endMins = ev.end?.dateTime ? toMins(ev.end.dateTime) : startMins + 60;
                const top = ((startMins - START_HOUR * 60) / 60) * HOUR_HEIGHT;
                const height = Math.max(((endMins - startMins) / 60) * HOUR_HEIGHT, 22);
                return (
                  <div key={ev.id}
                    className="absolute left-7 right-0 bg-indigo-500/35 border border-indigo-400/40 rounded-lg px-2 py-0.5 overflow-hidden"
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <p className="text-white text-[11px] font-semibold truncate leading-snug">{ev.summary ?? '(no title)'}</p>
                    {height >= 32 && (
                      <p className="text-white/50 text-[10px] leading-none">{fmtTime(ev.start.dateTime!)}</p>
                    )}
                  </div>
                );
              })}

              {/* No events today message */}
              {todayTimedEvents.length === 0 && todayAllDay.length === 0 && (
                <p className="absolute left-7 right-0 text-zinc-600 text-xs text-center mt-8">
                  No events today
                </p>
              )}
            </div>

            {/* Upcoming events */}
            {upcoming.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/[0.06] flex flex-col gap-1.5">
                <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wide mb-1">Upcoming</p>
                {upcoming.map((ev) => {
                  const raw = ev.start.dateTime ?? ev.start.date ?? '';
                  const d = new Date(raw);
                  const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                  const time = ev.start.dateTime
                    ? ` · ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
                    : '';
                  return (
                    <div key={ev.id} className="flex items-center gap-2">
                      <div className="w-1 h-1 rounded-full bg-indigo-400/60 shrink-0" />
                      <p className="text-white/80 text-xs truncate flex-1">{ev.summary ?? '(no title)'}</p>
                      <p className="text-zinc-500 text-[10px] shrink-0">{label}{time}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

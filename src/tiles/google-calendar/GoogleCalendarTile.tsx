import { useEffect, useState } from 'react';
import { useAuthStore, isTokenValid } from '../../lib/google/auth';
import type { GCalTile } from '../../lib/store/tiles';

type CalendarEvent = {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
};

type Props = { tile: GCalTile };

function formatEventTime(start: CalendarEvent['start']): string {
  const raw = start.dateTime ?? start.date;
  if (!raw) return '';
  const d = new Date(raw);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const eventDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((eventDay.getTime() - today.getTime()) / 86_400_000);
  const dayLabel = diff === 0 ? 'Today' : diff === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  if (!start.dateTime) return dayLabel;
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dayLabel} · ${time}`;
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
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary, start, end }),
    },
  );
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

  const connected = isTokenValid(token);

  function loadEvents(accessToken: string) {
    setLoading(true);
    setError(null);
    const timeMin = new Date().toISOString();
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`,
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

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden text-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div>
          <p className="text-base font-bold">📅 Calendar</p>
          <p className="text-zinc-400 text-xs">Upcoming events</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => token && loadEvents(token.access_token)}
            className="text-zinc-400 hover:text-white text-base transition-colors"
            aria-label="Refresh"
          >↻</button>
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-colors"
            aria-label="Add event"
          >+</button>
        </div>
      </div>

      {/* Add event form */}
      {showAdd && (
        <form onSubmit={handleAddEvent} className="mx-3 mb-2 bg-white/10 rounded-xl p-3 flex flex-col gap-2 shrink-0">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Event title…"
            required
            className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
              className="flex-1 bg-white/15 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-white/50"
            />
            {!allDay && (
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-24 bg-white/15 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-white/50"
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded" />
            All day
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white disabled:opacity-50 transition-colors"
            >{saving ? '…' : 'Add event'}</button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 text-zinc-400 hover:text-white text-sm transition-colors"
            >Cancel</button>
          </div>
        </form>
      )}

      {/* Events list */}
      <div className="flex-1 overflow-auto px-3 pb-3 min-h-0 flex flex-col gap-1.5">
        {loading && <p className="text-zinc-400 text-sm text-center mt-4">Loading…</p>}
        {error && <p className="text-red-300 text-xs text-center mt-2">{error}</p>}
        {!loading && !error && events.length === 0 && (
          <p className="text-zinc-400 text-sm text-center mt-4">No upcoming events</p>
        )}
        {!loading && events.map((ev) => (
          <div key={ev.id} className="bg-white/10 rounded-xl px-3 py-2">
            <p className="text-white text-sm font-medium truncate">{ev.summary ?? '(no title)'}</p>
            <p className="text-zinc-400 text-xs mt-0.5">{formatEventTime(ev.start)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

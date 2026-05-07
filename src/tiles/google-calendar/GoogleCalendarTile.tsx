import { useEffect, useState } from 'react';
import { useAuthStore, requestToken, signOut, isTokenValid, tokenHasScope } from '../../lib/google/auth';
import { googleScopes } from '../../lib/google/scopes';
import type { GCalTile } from '../../lib/store/tiles';

const SCOPE = googleScopes.calendarReadonly;

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
  let dayLabel: string;
  if (diff === 0) dayLabel = 'Today';
  else if (diff === 1) dayLabel = 'Tomorrow';
  else dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' });
  if (!start.dateTime) return dayLabel;
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dayLabel} ${time}`;
}

export function GoogleCalendarTile({ tile: _tile }: Props) {
  const token = useAuthStore((s) => s.token);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connected = isTokenValid(token) && tokenHasScope(token, SCOPE);

  useEffect(() => {
    if (!connected || !token) return;
    setLoading(true);
    setError(null);
    const timeMin = new Date().toISOString();
    fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=3&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(timeMin)}`,
      { headers: { Authorization: `Bearer ${token.access_token}` } },
    )
      .then((r) => {
        if (!r.ok) throw new Error(`Calendar API error ${r.status}`);
        return r.json() as Promise<{ items: CalendarEvent[] }>;
      })
      .then((data) => setEvents(data.items ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load events'))
      .finally(() => setLoading(false));
  }, [connected, token]);

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <p className="text-sm text-slate-500">Connect your Google account to see upcoming events.</p>
        <button
          onClick={() => requestToken(SCOPE).catch(() => {})}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Connect Google Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700">Upcoming</span>
        <button
          onClick={signOut}
          className="text-xs text-slate-400 hover:text-red-500 transition-colors"
        >
          Disconnect
        </button>
      </div>

      {loading && (
        <p className="text-sm text-slate-400 text-center mt-4">Loading events…</p>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center mt-4">{error}</p>
      )}

      {!loading && !error && events.length === 0 && (
        <p className="text-sm text-slate-400 text-center mt-4">No upcoming events.</p>
      )}

      {!loading && !error && events.length > 0 && (
        <ul className="flex flex-col gap-2 overflow-auto">
          {events.map((ev) => (
            <li key={ev.id} className="flex flex-col rounded-lg bg-slate-50 border border-slate-200 px-3 py-2">
              <span className="text-sm font-medium text-slate-800 truncate">{ev.summary ?? '(no title)'}</span>
              <span className="text-xs text-slate-500">{formatEventTime(ev.start)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

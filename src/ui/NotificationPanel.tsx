import { useEffect, useState } from 'react';
import { useAuthStore, isTokenValid } from '../lib/google/auth';

type GmailMsg = { id: string; from: string; subject: string; snippet: string };
type CalEvent = { id: string; summary: string; start: string; allDay: boolean };

type State = {
  loading: boolean;
  unreadCount: number;
  emails: GmailMsg[];
  events: CalEvent[];
  error: string;
};

function shortFrom(from: string) {
  const m = from.match(/^"?([^"<]+)"?\s*<?/);
  return m ? m[1].trim() : from.split('@')[0];
}

function fmtEventTime(start: string, allDay: boolean) {
  if (allDay) return 'All day';
  const d = new Date(start);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return isToday ? time : `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${time}`;
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const token = useAuthStore((s) => s.token);
  const [state, setState] = useState<State>({ loading: true, unreadCount: 0, emails: [], events: [], error: '' });

  useEffect(() => {
    if (!isTokenValid(token) || !token) {
      setState((s) => ({ ...s, loading: false, error: 'Not signed in' }));
      return;
    }
    const at = token.access_token;
    const headers = { Authorization: `Bearer ${at}` };
    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    Promise.all([
      fetch(`https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=5&q=is:unread in:inbox`, { headers })
        .then((r) => r.ok ? r.json() as Promise<{ messages?: { id: string }[]; resultSizeEstimate?: number }> : Promise.reject())
        .then(async (list) => {
          const ids = list.messages?.slice(0, 5) ?? [];
          const msgs = await Promise.all(
            ids.map((m) =>
              fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, { headers })
                .then((r) => r.json() as Promise<{ id: string; snippet: string; payload: { headers: { name: string; value: string }[] } }>)
            )
          );
          return {
            count: list.resultSizeEstimate ?? ids.length,
            emails: msgs.map((msg) => ({
              id: msg.id,
              from: shortFrom(msg.payload.headers.find((h) => h.name === 'From')?.value ?? ''),
              subject: msg.payload.headers.find((h) => h.name === 'Subject')?.value ?? '(no subject)',
              snippet: msg.snippet ?? '',
            })),
          };
        })
        .catch(() => ({ count: 0, emails: [] as GmailMsg[] })),

      fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=5&orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(now.toISOString())}&timeMax=${encodeURIComponent(in48h.toISOString())}`,
        { headers }
      )
        .then((r) => r.ok ? r.json() as Promise<{ items?: { id: string; summary?: string; start: { dateTime?: string; date?: string } }[] }> : Promise.reject())
        .then((data) => (data.items ?? []).map((ev) => ({
          id: ev.id,
          summary: ev.summary ?? '(no title)',
          start: ev.start.dateTime ?? ev.start.date ?? '',
          allDay: !ev.start.dateTime,
        })))
        .catch(() => [] as CalEvent[]),
    ]).then(([gmail, events]) => {
      setState({ loading: false, unreadCount: gmail.count, emails: gmail.emails, events, error: '' });
    });
  }, [token]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute top-[72px] right-4 w-84 max-w-[calc(100vw-2rem)] bg-[#111116] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.04)] overflow-hidden"
        style={{ width: '340px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-white text-sm font-semibold">Notifications</p>
          <button onClick={onClose} className="text-zinc-600 hover:text-zinc-300 text-lg leading-none transition-colors">×</button>
        </div>

        {state.loading ? (
          <div className="p-6 text-center text-zinc-600 text-sm">Loading…</div>
        ) : state.error ? (
          <div className="p-6 text-center text-zinc-600 text-sm">{state.error}</div>
        ) : (
          <>
            {/* Gmail */}
            <div className="px-4 pt-4 pb-3">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Gmail</p>
                {state.unreadCount > 0 && (
                  <span className="text-xs text-zinc-500 bg-white/[0.07] px-2 py-0.5 rounded-full">{state.unreadCount} unread</span>
                )}
              </div>
              {state.emails.length === 0 ? (
                <p className="text-zinc-700 text-sm py-1">No unread emails</p>
              ) : (
                <div className="space-y-1">
                  {state.emails.map((e) => (
                    <div key={e.id} className="bg-white/[0.04] rounded-xl px-3 py-2.5">
                      <p className="text-white text-sm font-medium truncate">{e.from}</p>
                      <p className="text-zinc-500 text-xs truncate mt-0.5">{e.subject}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-white/[0.06] mx-4" />

            {/* Calendar */}
            <div className="px-4 pt-3 pb-4">
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest mb-2.5">Next 48 hours</p>
              {state.events.length === 0 ? (
                <p className="text-zinc-700 text-sm py-1">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {state.events.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                      <p className="text-zinc-300 text-sm truncate flex-1">{ev.summary}</p>
                      <p className="text-zinc-600 text-xs shrink-0">{fmtEventTime(ev.start, ev.allDay)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

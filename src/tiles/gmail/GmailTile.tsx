import { useEffect, useState } from 'react';
import { useAuthStore, isTokenValid, signOut } from '../../lib/google/auth';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';
const BASE = 'https://www.googleapis.com/gmail/v1/users/me';

type EmailHeader = { name: string; value: string };

type Email = {
  id: string;
  from: string;
  fromFull: string;
  subject: string;
  date: string;
  snippet: string;
  unread: boolean;
};

type EmailDetail = Email & { body: string };

type MimePart = {
  mimeType: string;
  body?: { data?: string };
  parts?: MimePart[];
};

function hdr(headers: EmailHeader[], name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function shortFrom(from: string): string {
  const m = from.match(/^"?([^"<]+)"?\s*<?/);
  return m ? m[1].trim() : from.split('@')[0];
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function decodeB64(data: string): string {
  try {
    return decodeURIComponent(
      atob(data.replace(/-/g, '+').replace(/_/g, '/'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
  } catch {
    return '';
  }
}

function extractText(part: MimePart): string {
  if (part.mimeType === 'text/plain' && part.body?.data) return decodeB64(part.body.data);
  if (part.parts) {
    const plain = part.parts.find((p) => p.mimeType === 'text/plain');
    if (plain?.body?.data) return decodeB64(plain.body.data);
    for (const p of part.parts) {
      const t = extractText(p);
      if (t) return t;
    }
  }
  return part.body?.data ? decodeB64(part.body.data) : '';
}

function makeRawEmail(to: string, subject: string, body: string, fromEmail: string): string {
  const msg = [`From: ${fromEmail}`, `To: ${to}`, `Subject: ${subject}`, 'Content-Type: text/plain; charset=UTF-8', '', body].join('\r\n');
  return btoa(unescape(encodeURIComponent(msg))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function GmailTile() {
  const token = useAuthStore((s) => s.token);
  const profile = useAuthStore((s) => s.profile);
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Open message
  const [openEmail, setOpenEmail] = useState<EmailDetail | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);

  // Compose
  const [composing, setComposing] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sent, setSent] = useState(false);

  const connected = isTokenValid(token);
  const hasGmailScope = token?.scope?.includes(GMAIL_SCOPE) ?? false;
  const unreadCount = emails.filter((e) => e.unread).length;

  async function loadInbox(accessToken: string) {
    setLoading(true);
    setError('');
    try {
      const listRes = await fetch(`${BASE}/messages?maxResults=10&q=in:inbox`, { headers: { Authorization: `Bearer ${accessToken}` } });
      if (listRes.status === 403) throw new Error('Gmail API not enabled. Go to console.cloud.google.com → APIs & Services → enable Gmail API.');
      if (!listRes.ok) throw new Error(`Error ${listRes.status}`);
      const list = await listRes.json() as { messages?: { id: string }[] };
      const ids = list.messages?.slice(0, 8) ?? [];
      const fetched = await Promise.all(
        ids.map((m) =>
          fetch(`${BASE}/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`, { headers: { Authorization: `Bearer ${accessToken}` } })
            .then((r) => r.json() as Promise<{ id: string; snippet: string; labelIds: string[]; payload: { headers: EmailHeader[] } }>),
        ),
      );
      setEmails(fetched.map((msg) => ({
        id: msg.id,
        from: shortFrom(hdr(msg.payload.headers, 'From')),
        fromFull: hdr(msg.payload.headers, 'From'),
        subject: hdr(msg.payload.headers, 'Subject') || '(no subject)',
        date: hdr(msg.payload.headers, 'Date'),
        snippet: msg.snippet ?? '',
        unread: msg.labelIds?.includes('UNREAD') ?? false,
      })));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }

  async function openMessage(email: Email) {
    if (!token) return;
    setLoadingMsg(true);
    setOpenEmail({ ...email, body: '' });
    try {
      const res = await fetch(`${BASE}/messages/${email.id}?format=full`, { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (!res.ok) throw new Error(`${res.status}`);
      const msg = await res.json() as { payload: MimePart };
      setOpenEmail({ ...email, body: extractText(msg.payload) });
    } catch {
      setOpenEmail({ ...email, body: '(Could not load message body)' });
    } finally {
      setLoadingMsg(false);
    }
  }

  useEffect(() => {
    if (connected && token && hasGmailScope) loadInbox(token.access_token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, token?.access_token, hasGmailScope]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !to.trim() || !body.trim()) return;
    setSending(true); setSendError('');
    try {
      const raw = makeRawEmail(to.trim(), subject.trim() || '(no subject)', body.trim(), profile?.email ?? 'me');
      const res = await fetch(`${BASE}/messages/send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw }),
      });
      if (!res.ok) throw new Error(`Send failed: ${res.status}`);
      setSent(true);
      setTimeout(() => { setSent(false); setComposing(false); setTo(''); setSubject(''); setBody(''); }, 1500);
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Failed to send');
    } finally {
      setSending(false);
    }
  }

  if (!hasGmailScope) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 bg-gradient-to-br from-red-600 via-red-700 to-rose-800 rounded-xl p-6 text-white text-center">
        <p className="text-4xl">✉️</p>
        <p className="text-sm font-semibold">Gmail access not granted</p>
        <p className="text-xs text-red-200">Sign out and sign back in to grant Gmail access.</p>
        <button onClick={signOut} className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-semibold transition-colors">
          Sign out &amp; re-authorize
        </button>
      </div>
    );
  }

  // ── Open message view ──────────────────────────────────────────────────────
  if (openEmail) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-red-600 via-red-700 to-rose-800 rounded-xl overflow-hidden text-white">
        {/* Message header */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2 shrink-0">
          <button onClick={() => setOpenEmail(null)} className="text-red-200 hover:text-white text-lg font-bold transition-colors shrink-0">←</button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{openEmail.subject}</p>
            <p className="text-xs text-red-200 truncate">{openEmail.fromFull}</p>
          </div>
          <span className="text-xs text-red-300 shrink-0">{relativeTime(openEmail.date)}</span>
        </div>
        <div className="h-px bg-white/10 mx-3 shrink-0" />
        {/* Message body */}
        <div className="flex-1 overflow-auto px-4 py-3 min-h-0">
          {loadingMsg ? (
            <p className="text-red-200 text-sm animate-pulse">Loading…</p>
          ) : (
            <pre className="text-xs text-white/85 whitespace-pre-wrap break-words leading-relaxed font-sans">
              {openEmail.body || '(empty message)'}
            </pre>
          )}
        </div>
      </div>
    );
  }

  // ── Inbox list ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-red-600 via-red-700 to-rose-800 rounded-xl overflow-hidden text-white">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold">✉️ Gmail</p>
          {unreadCount > 0 && <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => token && loadInbox(token.access_token)} className="text-red-200 hover:text-white text-base transition-colors" aria-label="Refresh">↻</button>
          <button onClick={() => { setComposing(true); setSent(false); setSendError(''); }}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-colors" aria-label="Compose">✏</button>
        </div>
      </div>

      {composing && (
        <form onSubmit={handleSend} className="mx-3 mb-2 bg-white/10 rounded-xl p-3 flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">New email</span>
            <button type="button" onClick={() => setComposing(false)} className="text-red-200 hover:text-white text-lg leading-none">×</button>
          </div>
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To…" required className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject…" className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" rows={3} required className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50 resize-none" />
          {sendError && <p className="text-red-200 text-xs">{sendError}</p>}
          <button type="submit" disabled={sending || sent}
            className={`py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${sent ? 'bg-green-500/40 text-green-200' : 'bg-white/20 hover:bg-white/30 text-white'}`}>
            {sent ? '✓ Sent!' : sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-auto px-3 pb-3 min-h-0 flex flex-col gap-1.5">
        {loading && <p className="text-red-200 text-sm text-center mt-6">Loading inbox…</p>}
        {error && <p className="text-red-200 text-xs text-center mt-4">{error}</p>}
        {!loading && !error && emails.length === 0 && <p className="text-red-200 text-sm text-center mt-6">Inbox is empty</p>}
        {emails.map((email) => (
          <button key={email.id} onClick={() => openMessage(email)} className={`w-full text-left rounded-xl px-3 py-2 transition-colors cursor-pointer ${email.unread ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/15'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className={`text-sm truncate ${email.unread ? 'font-bold text-white' : 'font-medium text-white/80'}`}>{email.from}</span>
              <span className="text-xs text-red-200 shrink-0">{relativeTime(email.date)}</span>
            </div>
            <p className={`text-xs truncate mt-0.5 ${email.unread ? 'text-white/90' : 'text-white/60'}`}>{email.subject}</p>
            <p className="text-xs text-white/40 truncate mt-0.5">{email.snippet}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

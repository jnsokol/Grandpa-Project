// Cloudflare Worker — RSS proxy + AI proxy
//
// Secrets (set once with wrangler):
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler secret put OPENAI_API_KEY
//
// RSS:  GET  /?url=https://example.com/feed.xml
// AI:   POST /ai   body: { provider, model, system, messages }

export interface Env {
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? '*';
    const cors = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);

    // ── AI proxy ─────────────────────────────────────────────────────────────
    if (url.pathname === '/ai' && request.method === 'POST') {
      type AiBody = {
        provider: 'openai' | 'anthropic';
        model?: string;
        system?: string;
        messages: { role: string; content: string }[];
      };
      const body = await request.json() as AiBody;
      const { provider, model, system, messages } = body;

      if (provider === 'anthropic') {
        const key = env.ANTHROPIC_API_KEY;
        if (!key) return json({ error: 'ANTHROPIC_API_KEY not configured on the worker.' }, 500, cors);
        const upstream = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model ?? 'claude-opus-4-7', max_tokens: 1024, system: system ?? 'You are a helpful assistant.', messages }),
        });
        const data = await upstream.json();
        return json(data, upstream.status, cors);
      }

      if (provider === 'openai') {
        const key = env.OPENAI_API_KEY;
        if (!key) return json({ error: 'OPENAI_API_KEY not configured on the worker.' }, 500, cors);
        const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: model ?? 'gpt-4o-mini', messages: [{ role: 'system', content: system ?? 'You are a helpful assistant.' }, ...messages] }),
        });
        const data = await upstream.json();
        return json(data, upstream.status, cors);
      }

      return json({ error: 'Unknown provider' }, 400, cors);
    }

    // ── RSS proxy ─────────────────────────────────────────────────────────────
    const feedUrl = url.searchParams.get('url');
    if (!feedUrl) return json({ error: 'Missing ?url= parameter' }, 400, cors);

    let feedParsed: URL;
    try { feedParsed = new URL(feedUrl); } catch { return json({ error: 'Invalid URL' }, 400, cors); }
    if (!['http:', 'https:'].includes(feedParsed.protocol)) return json({ error: 'Only http/https allowed' }, 400, cors);

    const upstream = await fetch(feedUrl, { headers: { 'User-Agent': 'DashboardRSSProxy/1.0' } });
    const xml = await upstream.text();
    return json({ items: parseRss(xml) }, 200, { ...cors, 'Cache-Control': 'public, max-age=300' });
  },
};

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}

type RssItem = { title: string; link: string; pubDate: string; description: string };

function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const re = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const b = m[1];
    items.push({ title: tag(b, 'title'), link: tag(b, 'link') || attr(b, 'link', 'href'), pubDate: tag(b, 'pubDate') || tag(b, 'published'), description: stripHtml(tag(b, 'description') || tag(b, 'summary')) });
    if (items.length >= 20) break;
  }
  return items;
}
function tag(xml: string, t: string): string { const m = xml.match(new RegExp(`<${t}(?:[^>]*)>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${t}>`, 'i')); return m ? m[1].trim() : ''; }
function attr(xml: string, t: string, a: string): string { const m = xml.match(new RegExp(`<${t}[^>]+${a}="([^"]+)"`, 'i')); return m ? m[1].trim() : ''; }
function stripHtml(h: string): string { return h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim(); }

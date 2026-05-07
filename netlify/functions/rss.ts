import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };

  const feedUrl = event.queryStringParameters?.url;
  if (!feedUrl) return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Missing ?url= parameter' }) };

  try { new URL(feedUrl); } catch { return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'Invalid URL' }) }; }

  const upstream = await fetch(feedUrl, { headers: { 'User-Agent': 'DashboardRSSProxy/1.0' } });
  const xml = await upstream.text();
  return {
    statusCode: 200,
    headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
    body: JSON.stringify({ items: parseRss(xml) }),
  };
};

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

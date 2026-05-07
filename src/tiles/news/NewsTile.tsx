import { useEffect, useRef, useState } from 'react';
import { useTileStore } from '../../lib/store/tile-store';
import type { RssTile } from '../../lib/store/tiles';

type RssItem = { title: string; link: string; pubDate: string; description: string };
type Props = { tile: RssTile };

const PROXY_URL = import.meta.env.VITE_RSS_PROXY_URL ?? '';

function formatDate(raw: string): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function NewsTile({ tile }: Props) {
  const updateTile = useTileStore((s) => s.updateTile);
  const [items, setItems] = useState<RssItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!tile.feedUrl);
  const [draftUrl, setDraftUrl] = useState(tile.feedUrl ?? '');
  const [draftLabel, setDraftLabel] = useState(tile.label ?? '');
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!tile.feedUrl || !PROXY_URL || editing) return;
    setLoading(true);
    setError(null);
    fetch(`${PROXY_URL}?url=${encodeURIComponent(tile.feedUrl)}`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json() as Promise<{ items: RssItem[] }>; })
      .then((data) => setItems(data.items ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [tile.feedUrl, editing]);

  function saveConfig() {
    if (!draftUrl.trim()) return;
    updateTile({ ...tile, feedUrl: draftUrl.trim(), label: draftLabel.trim() || draftUrl.trim() });
    setEditing(false);
  }

  if (editing || !tile.feedUrl) {
    return (
      <div className="flex flex-col gap-3 h-full bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 rounded-xl p-3 text-white">
        <p className="text-sm font-semibold">📰 Configure RSS</p>
        <input ref={urlRef} value={draftUrl} onChange={(e) => setDraftUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveConfig(); }}
          placeholder="https://example.com/feed.xml"
          className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
        <input value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') saveConfig(); }}
          placeholder="Label (optional)"
          className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
        {!PROXY_URL && (
          <p className="text-xs text-red-200">Set VITE_RSS_PROXY_URL to enable fetching.</p>
        )}
        <div className="flex gap-2">
          <button onClick={saveConfig} disabled={!draftUrl.trim()}
            className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white disabled:opacity-40 transition-colors">
            Save
          </button>
          {tile.feedUrl && (
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-rose-300 hover:text-white text-sm transition-colors">Cancel</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 rounded-xl overflow-hidden text-white">
      <div className="flex items-center justify-between px-4 pt-3 pb-2 shrink-0">
        <div>
          <p className="text-base font-bold">📰 {tile.label || 'News'}</p>
          {!PROXY_URL && <p className="text-red-200 text-xs">Proxy not configured</p>}
        </div>
        <button onClick={() => setEditing(true)} className="text-rose-300 hover:text-white text-sm transition-colors" aria-label="Edit feed">✎</button>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-3 min-h-0 flex flex-col gap-1.5">
        {loading && <p className="text-rose-200 text-sm text-center mt-4">Loading feed…</p>}
        {error && <p className="text-red-200 text-xs text-center mt-2">{error}</p>}
        {!loading && !error && PROXY_URL && items.length === 0 && (
          <p className="text-rose-200 text-sm text-center mt-4">No items found.</p>
        )}
        {items.slice(0, 10).map((item, i) => (
          <a key={i} href={item.link} target="_blank" rel="noopener noreferrer"
            className="flex flex-col bg-white/10 hover:bg-white/20 rounded-xl px-3 py-2 transition-colors group">
            <span className="text-sm text-white line-clamp-2 leading-snug">{item.title}</span>
            <span className="text-xs text-rose-200 mt-0.5">{formatDate(item.pubDate)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { useTileStore } from '../../lib/store/tile-store';
import type { RssTile } from '../../lib/store/tiles';

type RssItem = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
};

type Props = { tile: RssTile };

// Set this to your deployed Worker URL, e.g. https://rss-proxy.<subdomain>.workers.dev
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
      .then((r) => {
        if (!r.ok) throw new Error(`Proxy error ${r.status}`);
        return r.json() as Promise<{ items: RssItem[] }>;
      })
      .then((data) => setItems(data.items ?? []))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load feed'))
      .finally(() => setLoading(false));
  }, [tile.feedUrl, editing]);

  function saveConfig() {
    if (!draftUrl.trim()) return;
    updateTile({ ...tile, feedUrl: draftUrl.trim(), label: draftLabel.trim() || draftUrl.trim() });
    setEditing(false);
  }

  if (editing || !tile.feedUrl) {
    return (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-semibold text-slate-700">Configure RSS feed</p>
        <div className="flex flex-col gap-2">
          <input
            ref={urlRef}
            value={draftUrl}
            onChange={(e) => setDraftUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveConfig(); }}
            placeholder="https://example.com/feed.xml"
            className="text-sm border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full"
          />
          <input
            value={draftLabel}
            onChange={(e) => setDraftLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveConfig(); }}
            placeholder="Label (optional)"
            className="text-sm border border-slate-300 rounded px-2 py-1.5 outline-none focus:border-blue-400 w-full"
          />
        </div>
        {!PROXY_URL && (
          <p className="text-xs text-amber-600">
            Set <code>VITE_RSS_PROXY_URL</code> in <code>.env.local</code> to enable fetching.
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={saveConfig}
            disabled={!draftUrl.trim()}
            className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
          >
            Save
          </button>
          {tile.feedUrl && (
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700 truncate">{tile.label || 'News'}</span>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors shrink-0 ml-1"
          aria-label="Edit feed"
        >
          ✎
        </button>
      </div>

      {loading && <p className="text-sm text-slate-400 text-center mt-4">Loading feed…</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {!PROXY_URL && !loading && (
        <p className="text-xs text-amber-600">Proxy URL not configured — set <code>VITE_RSS_PROXY_URL</code>.</p>
      )}

      {!loading && !error && PROXY_URL && items.length === 0 && (
        <p className="text-sm text-slate-400 text-center mt-4">No items found.</p>
      )}

      {!loading && !error && items.length > 0 && (
        <ul className="flex flex-col gap-1.5 overflow-auto flex-1 min-h-0">
          {items.slice(0, 10).map((item, i) => (
            <li key={i}>
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors group"
              >
                <span className="text-sm text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </span>
                <span className="text-xs text-slate-400 mt-0.5">{formatDate(item.pubDate)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

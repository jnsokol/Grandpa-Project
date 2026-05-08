import { useEffect, useRef, useState } from 'react';
import { useTileStore } from '../lib/store/tile-store';
import { TILE_LABELS } from '../lib/tile-registry';
import type { Tile } from '../lib/store/tiles';

const EMOJI: Record<Tile['kind'], string> = {
  launcher: '🔗', bookmarks: '🔖', calculator: '🔢', weather: '🌤️',
  gcal: '📅', todo: '✅', gdrive: '📁', rss: '📰', gmail: '✉️',
  notes: '📝', countdown: '⏳', spotify: '🎵',
};

function tileDisplayName(tile: Tile): string {
  if ('title' in tile) return (tile as { title: string }).title;
  if ('label' in tile) return (tile as { label: string }).label;
  return '';
}

export function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const pages = useTileStore((s) => s.pages);
  const setCurrentPage = useTileStore((s) => s.setCurrentPage);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const all = pages.flatMap((page) =>
    page.tiles.map((tile) => ({ tile, page, label: TILE_LABELS[tile.kind], name: tileDisplayName(tile) }))
  );

  const q = query.trim().toLowerCase();
  const results = q
    ? all.filter((r) =>
        r.label.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.page.name.toLowerCase().includes(q)
      )
    : all.slice(0, 10);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0d0d14]/98 border border-white/[0.08] rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.9)] overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <span className="text-zinc-500">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tiles across all pages…"
            className="flex-1 bg-transparent text-white text-sm placeholder-zinc-600 outline-none"
          />
          <kbd className="text-zinc-700 text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] rounded px-1.5 py-0.5">Esc</kbd>
        </div>

        <div className="max-h-72 overflow-auto py-1.5">
          {results.length === 0 ? (
            <p className="text-zinc-600 text-sm text-center py-8">No tiles found</p>
          ) : (
            results.map(({ tile, page, label, name }) => (
              <button
                key={tile.id}
                onClick={() => { setCurrentPage(page.id); onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors text-left"
              >
                <span className="text-base w-5 text-center shrink-0">{EMOJI[tile.kind]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{name || label}</p>
                  <p className="text-zinc-600 text-xs">{label} · {page.name}</p>
                </div>
              </button>
            ))
          )}
          {!q && all.length === 0 && (
            <p className="text-zinc-700 text-xs text-center py-6">No tiles on any page yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

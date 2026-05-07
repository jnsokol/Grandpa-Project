import { useEffect, useRef, useState } from 'react';
import { useTileStore } from '../lib/store/tile-store';

type MenuItem = { label: string; emoji: string; shortcut: string; action: () => void };

export function AddTileFab() {
  const addTile = useTileStore((s) => s.addTile);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const items: MenuItem[] = [
    { label: 'Bookmarks', emoji: '🔖', shortcut: 'B', action: () => addTile({ kind: 'bookmarks', id: crypto.randomUUID(), title: 'Links', links: [] }) },
    { label: 'Launcher',  emoji: '🔗', shortcut: 'L', action: () => addTile({ kind: 'launcher',  id: crypto.randomUUID(), label: 'New Link', url: '' }) },
    { label: 'Calculator',emoji: '🔢', shortcut: 'C', action: () => addTile({ kind: 'calculator',id: crypto.randomUUID() }) },
    { label: 'Weather',   emoji: '🌤️', shortcut: 'W', action: () => addTile({ kind: 'weather',   id: crypto.randomUUID(), locationMode: 'geolocation' }) },
    { label: 'Calendar',  emoji: '📅', shortcut: 'G', action: () => addTile({ kind: 'gcal',       id: crypto.randomUUID() }) },
    { label: 'Tasks',     emoji: '✅', shortcut: 'T', action: () => addTile({ kind: 'todo',       id: crypto.randomUUID(), provider: 'google-tasks' }) },
    { label: 'Drive',     emoji: '📁', shortcut: 'D', action: () => addTile({ kind: 'gdrive',     id: crypto.randomUUID() }) },
    { label: 'News',      emoji: '📰', shortcut: 'N', action: () => addTile({ kind: 'rss',        id: crypto.randomUUID(), feedUrl: '', label: 'News' }) },
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') { setOpen(false); return; }
      if (!e.altKey) return;
      const item = items.find((m) => m.shortcut.toLowerCase() === e.key.toLowerCase());
      if (item) { e.preventDefault(); item.action(); setOpen(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-6 left-6 z-50 flex flex-col-reverse items-start gap-2">
      {/* Slide-up menu */}
      <div
        className={`flex flex-col-reverse gap-1.5 transition-all duration-300 origin-bottom ${
          open ? 'opacity-100 scale-y-100 translate-y-0' : 'opacity-0 scale-y-75 translate-y-4 pointer-events-none'
        }`}
      >
        {items.map((item) => (
          <button
            key={item.label}
            onClick={() => { item.action(); setOpen(false); }}
            className="flex items-center gap-3 pl-3 pr-4 py-2.5 bg-slate-900 text-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.4)] hover:bg-slate-700 active:scale-95 transition-all text-sm font-semibold w-48"
          >
            <span className="text-lg w-6 text-center">{item.emoji}</span>
            <span className="flex-1 text-left">{item.label}</span>
            <kbd className="text-xs text-slate-400 font-mono bg-slate-800 rounded px-1.5 py-0.5">Alt+{item.shortcut}</kbd>
          </button>
        ))}
      </div>

      {/* FAB */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close menu' : 'Add tile'}
        aria-expanded={open}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-[0_6px_24px_rgba(37,99,235,0.6)] flex items-center justify-center transition-all duration-200"
      >
        <span
          className={`text-3xl font-light leading-none transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}
        >
          +
        </span>
      </button>
    </div>
  );
}

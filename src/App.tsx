import { useEffect, useRef, useState } from 'react';
import { TileGrid } from './ui/TileGrid';
import { Clock } from './ui/Clock';
import { useTileStore } from './lib/store/tile-store';

type MenuItem = { label: string; emoji: string; shortcut: string; action: () => void };

export function App() {
  const addTile = useTileStore((s) => s.addTile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = [
    { label: 'Launcher', emoji: '🔗', shortcut: 'L', action: () => addTile({ kind: 'launcher', id: crypto.randomUUID(), label: 'New Link', url: '' }) },
    { label: 'Calculator', emoji: '🔢', shortcut: 'C', action: () => addTile({ kind: 'calculator', id: crypto.randomUUID() }) },
    { label: 'Weather', emoji: '🌤️', shortcut: 'W', action: () => addTile({ kind: 'weather', id: crypto.randomUUID(), locationMode: 'geolocation' }) },
    { label: 'Calendar', emoji: '📅', shortcut: 'G', action: () => addTile({ kind: 'gcal', id: crypto.randomUUID() }) },
    { label: 'Tasks', emoji: '✅', shortcut: 'T', action: () => addTile({ kind: 'todo', id: crypto.randomUUID(), provider: 'google-tasks' }) },
    { label: 'Drive', emoji: '📁', shortcut: 'D', action: () => addTile({ kind: 'gdrive', id: crypto.randomUUID() }) },
    { label: 'News', emoji: '📰', shortcut: 'N', action: () => addTile({ kind: 'rss', id: crypto.randomUUID(), feedUrl: '', label: 'News' }) },
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'Escape') { setMenuOpen(false); return; }
      if (!e.altKey) return;
      const item = menuItems.find((m) => m.shortcut.toLowerCase() === e.key.toLowerCase());
      if (item) { e.preventDefault(); item.action(); setMenuOpen(false); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 to-slate-300">
      <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <Clock />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Add tile"
            className="flex items-center gap-2 text-sm px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all font-semibold shadow-sm"
          >
            <span aria-hidden="true" className="text-base leading-none">+</span> Add tile
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white shadow-xl py-2 z-20"
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => { item.action(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className="text-base">{item.emoji}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <kbd className="text-xs text-slate-400 bg-slate-100 rounded-md px-1.5 py-0.5 font-mono">Alt+{item.shortcut}</kbd>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="p-4">
        <TileGrid />
      </div>
    </div>
  );
}

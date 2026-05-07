import { useEffect, useRef, useState } from 'react';
import { TileGrid } from './ui/TileGrid';
import { useTileStore } from './lib/store/tile-store';

type MenuItem = { label: string; shortcut: string; action: () => void };

export function App() {
  const addTile = useTileStore((s) => s.addTile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = [
    { label: 'Launcher', shortcut: 'L', action: () => addTile({ kind: 'launcher', id: crypto.randomUUID(), label: 'New Link', url: '' }) },
    { label: 'Calculator', shortcut: 'C', action: () => addTile({ kind: 'calculator', id: crypto.randomUUID() }) },
    { label: 'Weather', shortcut: 'W', action: () => addTile({ kind: 'weather', id: crypto.randomUUID(), locationMode: 'geolocation' }) },
    { label: 'Calendar', shortcut: 'G', action: () => addTile({ kind: 'gcal', id: crypto.randomUUID() }) },
    { label: 'Tasks', shortcut: 'T', action: () => addTile({ kind: 'todo', id: crypto.randomUUID(), provider: 'google-tasks' }) },
    { label: 'Drive', shortcut: 'D', action: () => addTile({ kind: 'gdrive', id: crypto.randomUUID() }) },
    { label: 'News', shortcut: 'N', action: () => addTile({ kind: 'rss', id: crypto.randomUUID(), feedUrl: '', label: 'News' }) },
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
    <main className="min-h-screen bg-slate-200">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Today</h1>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Add tile"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <span aria-hidden="true">+</span> Add tile
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white shadow-lg py-1 z-20"
            >
              {menuItems.map((item) => (
                <button
                  key={item.label}
                  role="menuitem"
                  onClick={() => { item.action(); setMenuOpen(false); }}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span>{item.label}</span>
                  <kbd className="text-xs text-slate-400 bg-slate-100 rounded px-1.5 py-0.5">Alt+{item.shortcut}</kbd>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="p-4">
        <TileGrid />
      </div>
    </main>
  );
}

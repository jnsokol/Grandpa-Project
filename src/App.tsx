import { useEffect, useRef, useState } from 'react';
import { TileGrid } from './ui/TileGrid';
import { Clock } from './ui/Clock';
import { GoogleSignInGate } from './ui/GoogleSignInGate';
import { useAuthStore, signOut } from './lib/google/auth';
import { useTileStore } from './lib/store/tile-store';

type MenuItem = { label: string; emoji: string; shortcut: string; action: () => void };

export function App() {
  const addTile = useTileStore((s) => s.addTile);
  const profile = useAuthStore((s) => s.profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const menuItems: MenuItem[] = [
    { label: 'Bookmarks', emoji: '🔖', shortcut: 'B', action: () => addTile({ kind: 'bookmarks',  id: crypto.randomUUID(), title: 'Links', links: [] }) },
    { label: 'Launcher',  emoji: '🔗', shortcut: 'L', action: () => addTile({ kind: 'launcher',   id: crypto.randomUUID(), label: 'New Link', url: '' }) },
    { label: 'Calculator',emoji: '🔢', shortcut: 'C', action: () => addTile({ kind: 'calculator', id: crypto.randomUUID() }) },
    { label: 'Weather',   emoji: '🌤️', shortcut: 'W', action: () => addTile({ kind: 'weather',    id: crypto.randomUUID(), locationMode: 'geolocation' }) },
    { label: 'Calendar',  emoji: '📅', shortcut: 'G', action: () => addTile({ kind: 'gcal',        id: crypto.randomUUID() }) },
    { label: 'Tasks',     emoji: '✅', shortcut: 'T', action: () => addTile({ kind: 'todo',        id: crypto.randomUUID(), provider: 'google-tasks' }) },
    { label: 'Drive',     emoji: '📁', shortcut: 'D', action: () => addTile({ kind: 'gdrive',      id: crypto.randomUUID() }) },
    { label: 'News',      emoji: '📰', shortcut: 'N', action: () => addTile({ kind: 'rss',         id: crypto.randomUUID(), feedUrl: '', label: 'News' }) },
    { label: 'AI Chat',   emoji: '🤖', shortcut: 'A', action: () => addTile({ kind: 'ai',          id: crypto.randomUUID(), provider: 'openai' }) },
    { label: 'Gmail',     emoji: '✉️', shortcut: 'M', action: () => addTile({ kind: 'gmail',       id: crypto.randomUUID() }) },
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
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen]);

  return (
    <GoogleSignInGate>
      <div className="min-h-screen bg-zinc-950">

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 bg-zinc-900 border-b border-zinc-800 shadow-[0_4px_32px_rgba(0,0,0,0.6)]">

          {/* Left — clock */}
          <Clock />

          {/* Center — title */}
          <h1
            className="absolute left-1/2 -translate-x-1/2 text-3xl text-white select-none whitespace-nowrap tracking-tight"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900 }}
          >
            Grandpa Project
          </h1>

          {/* Right — profile + add */}
          <div className="flex items-center gap-3 ml-auto" ref={menuRef}>

            {profile && (
              <div className="flex items-center gap-2.5">
                {profile.picture ? (
                  <img src={profile.picture} alt={profile.name} title={profile.name}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full ring-2 ring-zinc-700 hover:ring-zinc-500 transition-all" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-zinc-600" title={profile.name}>
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button onClick={signOut}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-white text-xs font-medium transition-all">
                  Sign out
                </button>
              </div>
            )}

            {/* Divider */}
            {profile && <div className="w-px h-5 bg-zinc-700" />}

            {/* Add tile */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label="Add tile"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg ${
                  menuOpen
                    ? 'bg-blue-500 text-white shadow-blue-500/25'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 hover:shadow-blue-500/30'
                }`}
              >
                <span className={`text-base leading-none transition-transform duration-200 ${menuOpen ? 'rotate-45' : ''}`}>+</span>
                Add tile
              </button>

              {menuOpen && (
                <div role="menu"
                  className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-[0_16px_48px_rgba(0,0,0,0.7)] py-1.5 z-50 overflow-hidden">
                  {/* Grid split into 2 columns for visual density */}
                  {menuItems.map((item) => (
                    <button key={item.label} role="menuitem"
                      onClick={() => { item.action(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors">
                      <span className="text-base w-5 text-center shrink-0">{item.emoji}</span>
                      <span className="flex-1 font-medium text-left">{item.label}</span>
                      <kbd className="text-[10px] text-zinc-600 font-mono bg-zinc-800/80 border border-zinc-700 rounded px-1.5 py-0.5">⌥{item.shortcut}</kbd>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Grid ── */}
        <div className="p-6">
          <TileGrid />
        </div>
      </div>
    </GoogleSignInGate>
  );
}

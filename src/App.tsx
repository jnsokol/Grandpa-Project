import { useEffect, useRef, useState } from 'react';
import { TileGrid } from './ui/TileGrid';
import { Clock } from './ui/Clock';
import { GoogleSignInGate } from './ui/GoogleSignInGate';
import { useAuthStore, signOut } from './lib/google/auth';
import { useTileStore } from './lib/store/tile-store';

type MenuItem = { label: string; emoji: string; shortcut: string; action: () => void };

export function App() {
  const addTile = useTileStore((s) => s.addTile);
  const pages = useTileStore((s) => s.pages);
  const currentPageId = useTileStore((s) => s.currentPageId);
  const addPage = useTileStore((s) => s.addPage);
  const removePage = useTileStore((s) => s.removePage);
  const renamePage = useTileStore((s) => s.renamePage);
  const setCurrentPage = useTileStore((s) => s.setCurrentPage);

  const profile = useAuthStore((s) => s.profile);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const menuItems: MenuItem[] = [
    { label: 'Bookmarks', emoji: '🔖', shortcut: 'B', action: () => addTile({ kind: 'bookmarks',  id: crypto.randomUUID(), title: 'Links', links: [] }) },
    { label: 'Launcher',  emoji: '🔗', shortcut: 'L', action: () => addTile({ kind: 'launcher',   id: crypto.randomUUID(), label: 'New Link', url: '' }) },
    { label: 'Notes',     emoji: '📝', shortcut: 'O', action: () => addTile({ kind: 'notes',      id: crypto.randomUUID(), title: 'Note', content: '' }) },
    { label: 'Calculator',emoji: '🔢', shortcut: 'C', action: () => addTile({ kind: 'calculator', id: crypto.randomUUID() }) },
    { label: 'Weather',   emoji: '🌤️', shortcut: 'W', action: () => addTile({ kind: 'weather',    id: crypto.randomUUID(), locationMode: 'geolocation' }) },
    { label: 'Calendar',  emoji: '📅', shortcut: 'G', action: () => addTile({ kind: 'gcal',        id: crypto.randomUUID() }) },
    { label: 'Tasks',     emoji: '✅', shortcut: 'T', action: () => addTile({ kind: 'todo',        id: crypto.randomUUID(), provider: 'google-tasks' }) },
    { label: 'Drive',     emoji: '📁', shortcut: 'D', action: () => addTile({ kind: 'gdrive',      id: crypto.randomUUID() }) },
    { label: 'News',      emoji: '📰', shortcut: 'N', action: () => addTile({ kind: 'rss',         id: crypto.randomUUID(), feedUrl: '', label: 'News' }) },
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

  function commitRename(id: string) {
    renamePage(id, renameValue.trim() || 'Page');
    setRenamingPageId(null);
  }

  return (
    <GoogleSignInGate>
      <div className="min-h-screen bg-[#080810]" style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.08) 0%, transparent 60%)' }}>

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-[#0d0d14]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04),0_4px_32px_rgba(0,0,0,0.5)]">

          {/* Top row */}
          <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">

            {/* Left — clock */}
            <Clock />

            {/* Center — title */}
            <h1
              className="absolute left-1/2 -translate-x-1/2 text-xl sm:text-3xl text-white select-none whitespace-nowrap tracking-tight"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900 }}
            >
              Grandpa Project
            </h1>

            {/* Right — profile + add */}
            <div className="flex items-center gap-2 sm:gap-3 ml-auto" ref={menuRef}>

              {profile && (
                <div className="flex items-center gap-2">
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
                    className="hidden sm:block px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] hover:border-white/[0.15] text-zinc-400 hover:text-white text-xs font-medium transition-all">
                    Sign out
                  </button>
                </div>
              )}

              {profile && <div className="hidden sm:block w-px h-5 bg-white/[0.08]" />}

              {/* Add tile */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label="Add tile"
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    menuOpen
                      ? 'bg-indigo-500/90 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]'
                      : 'bg-indigo-600/80 hover:bg-indigo-500/90 text-white border border-indigo-400/20 hover:border-indigo-400/40 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  }`}
                >
                  <span className={`text-base leading-none transition-transform duration-200 ${menuOpen ? 'rotate-45' : ''}`}>+</span>
                  <span className="hidden sm:inline">Add tile</span>
                </button>

                {menuOpen && (
                  <div role="menu"
                    className="absolute right-0 top-full mt-2 w-52 sm:w-56 rounded-2xl bg-[#0d0d14]/95 backdrop-blur-xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.8)] py-1.5 z-50 overflow-hidden">
                    {menuItems.map((item) => (
                      <button key={item.label} role="menuitem"
                        onClick={() => { item.action(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                        <span className="text-base w-5 text-center shrink-0">{item.emoji}</span>
                        <span className="flex-1 font-medium text-left">{item.label}</span>
                        <kbd className="hidden sm:block text-[10px] text-zinc-600 font-mono bg-white/[0.05] border border-white/[0.08] rounded px-1.5 py-0.5">⌥{item.shortcut}</kbd>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page tabs row */}
          <div className="flex items-center gap-1 px-4 sm:px-6 pb-2 overflow-x-auto scrollbar-hide">
            {pages.map((page) => (
              <div key={page.id} className="relative group flex items-center shrink-0">
                {renamingPageId === page.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(page.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(page.id);
                      if (e.key === 'Escape') setRenamingPageId(null);
                    }}
                    className="px-2 py-1 rounded-lg bg-white/[0.10] text-white text-xs font-medium outline-none border border-white/[0.20] w-24"
                  />
                ) : (
                  <button
                    onClick={() => setCurrentPage(page.id)}
                    onDoubleClick={() => { setRenamingPageId(page.id); setRenameValue(page.name); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${pages.length > 1 ? 'pr-6' : ''} ${
                      currentPageId === page.id
                        ? 'bg-white/[0.12] text-white'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    {page.name}
                  </button>
                )}
                {pages.length > 1 && renamingPageId !== page.id && (
                  <button
                    onClick={() => removePage(page.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-red-400 text-xs opacity-0 group-hover:opacity-100 transition-all leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addPage}
              className="px-2 py-1 rounded-lg text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] text-xs transition-all shrink-0"
              title="Add new page"
            >
              +
            </button>
          </div>
        </header>

        {/* ── Grid ── */}
        <div className="p-2 sm:p-6">
          <TileGrid />
        </div>
      </div>
    </GoogleSignInGate>
  );
}

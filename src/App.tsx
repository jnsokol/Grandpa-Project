import { useEffect, useRef, useState } from 'react';
import { TileGrid } from './ui/TileGrid';
import { Clock } from './ui/Clock';
import { GoogleSignInGate } from './ui/GoogleSignInGate';
import { NotificationPanel } from './ui/NotificationPanel';
import { BackgroundPicker } from './ui/BackgroundPicker';
import { QuickNotePopover } from './ui/QuickNotePopover';
import { SearchPanel } from './ui/SearchPanel';
import { OnboardingFlow } from './ui/OnboardingFlow';
import { useAuthStore, signOut } from './lib/google/auth';
import { useTileStore } from './lib/store/tile-store';
import { handleSpotifyCallback } from './lib/spotify/auth';
import { bgStyle } from './lib/background';
import type { Page } from './lib/store/tile-store';

type MenuItem = { label: string; emoji: string; shortcut: string; action: () => void };

export function App() {
  const addTile = useTileStore((s) => s.addTile);
  const pages = useTileStore((s) => s.pages);
  const currentPageId = useTileStore((s) => s.currentPageId);
  const locked = useTileStore((s) => s.locked);
  const bg = useTileStore((s) => s.bg);
  const onboardingDone = useTileStore((s) => s.onboardingDone);
  const addPage = useTileStore((s) => s.addPage);
  const removePage = useTileStore((s) => s.removePage);
  const renamePage = useTileStore((s) => s.renamePage);
  const setCurrentPage = useTileStore((s) => s.setCurrentPage);
  const toggleLock = useTileStore((s) => s.toggleLock);
  const setBg = useTileStore((s) => s.setBg);
  const replaceDashboard = useTileStore((s) => s.replaceDashboard);

  const profile = useAuthStore((s) => s.profile);

  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [bgOpen, setBgOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const [renamingPageId, setRenamingPageId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const allEmpty = pages.every((p) => p.tiles.length === 0);
  const showOnboarding = !onboardingDone && allEmpty;

  // Handle Spotify OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      window.history.replaceState({}, '', '/');
      handleSpotifyCallback(code).catch(console.error);
    }
  }, []);

  // ⌘K / Ctrl+K to open search
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const menuItems: MenuItem[] = [
    { label: 'Bookmarks', emoji: '🔖', shortcut: 'B', action: () => addTile({ kind: 'bookmarks',  id: crypto.randomUUID(), title: 'Links', links: [] }) },
    { label: 'Launcher',  emoji: '🔗', shortcut: 'L', action: () => addTile({ kind: 'launcher',   id: crypto.randomUUID(), label: 'New Link', url: '' }) },
    { label: 'Notes',     emoji: '📝', shortcut: 'O', action: () => addTile({ kind: 'notes',      id: crypto.randomUUID(), title: 'Note', content: '' }) },
    { label: 'Countdown', emoji: '⏳', shortcut: 'K', action: () => addTile({ kind: 'countdown',  id: crypto.randomUUID(), label: '', targetDate: '', emoji: '🎯' }) },
    { label: 'Spotify',   emoji: '🎵', shortcut: 'S', action: () => addTile({ kind: 'spotify',    id: crypto.randomUUID() }) },
    { label: 'YouTube',   emoji: '▶️', shortcut: 'Y', action: () => addTile({ kind: 'youtube',    id: crypto.randomUUID() }) },
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
      if (e.key === 'Escape') { setMenuOpen(false); setMoreOpen(false); return; }
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
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
    }
    if (menuOpen || moreOpen) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [menuOpen, moreOpen]);

  function commitRename(id: string) {
    renamePage(id, renameValue.trim() || 'Page');
    setRenamingPageId(null);
  }

  function handleExport() {
    const data = { version: 5, pages, currentPageId };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'grandpa-dashboard.json'; a.click();
    URL.revokeObjectURL(url);
    setMoreOpen(false);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as { version?: number; pages?: Page[]; currentPageId?: string };
        if (!Array.isArray(data.pages) || !data.currentPageId) throw new Error('Invalid format');
        replaceDashboard(data.pages, data.currentPageId);
      } catch {
        alert('Could not import — file format is invalid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setMoreOpen(false);
  }

  // Suppress unused setBg warning — it's used by BackgroundPicker through the store
  void setBg;

  const iconBtn = (active: boolean, activeClass: string) =>
    `w-8 h-8 rounded-xl flex items-center justify-center text-sm border transition-all duration-150 ${
      active ? activeClass : 'bg-white/[0.05] hover:bg-white/[0.09] text-zinc-500 hover:text-zinc-200 border-white/[0.06] hover:border-white/[0.12]'
    }`;

  return (
    <GoogleSignInGate>
      <div className="min-h-screen transition-colors duration-700 relative" style={bgStyle(bg)}>

        {/* ── Ambient background orbs ── */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/[0.06] blur-[120px]" />
          <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-violet-600/[0.05] blur-[100px]" />
          <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-cyan-600/[0.04] blur-[100px]" />
        </div>

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-black/40 backdrop-blur-3xl border-b border-white/[0.05] shadow-[0_1px_0_rgba(255,255,255,0.03),0_4px_24px_rgba(0,0,0,0.4)]">

          {/* Top row */}
          <div className="flex items-center px-4 sm:px-8 py-3 gap-3">

            <Clock />

            {/* Logo — centred absolutely so it doesn't push buttons */}
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none">
              <h1
                className="text-xl sm:text-2xl whitespace-nowrap tracking-tight leading-tight gradient-text"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900 }}
              >
                Grandpa Project
              </h1>
              <p className="text-zinc-700 text-[9px] font-medium tracking-[0.2em] uppercase whitespace-nowrap mt-px">
                Everything you need
              </p>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">

              {profile && (
                <>
                  {profile.picture ? (
                    <img src={profile.picture} alt={profile.name} title={profile.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full ring-1 ring-white/[0.12] hover:ring-indigo-400/50 transition-all cursor-pointer"
                      onClick={signOut} />
                  ) : (
                    <div
                      onClick={signOut}
                      className="w-7 h-7 rounded-full bg-indigo-600/40 flex items-center justify-center text-white text-xs font-bold ring-1 ring-indigo-400/20 cursor-pointer hover:ring-indigo-400/40 transition-all">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="hidden sm:block w-px h-4 bg-white/[0.06] mx-0.5" />
                </>
              )}

              <button onClick={() => setSearchOpen(true)} title="Search (⌘K)" className={iconBtn(false, '')}>🔍</button>
              <button onClick={() => setNoteOpen((v) => !v)} title="Quick note" className={iconBtn(noteOpen, 'bg-amber-500/15 text-amber-300 border-amber-500/25')}>✏️</button>
              <button onClick={() => setNotifOpen((v) => !v)} title="Notifications" className={iconBtn(notifOpen, 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25')}>🔔</button>
              <button onClick={() => setBgOpen((v) => !v)} title="Background" className={iconBtn(bgOpen, 'bg-violet-500/15 text-violet-300 border-violet-500/25')}>🎨</button>
              <button onClick={toggleLock} title={locked ? 'Unlock' : 'Lock'}
                className={iconBtn(locked, 'bg-amber-500/15 text-amber-400 border-amber-500/25 hover:bg-amber-500/25')}>
                {locked ? '🔒' : '🔓'}
              </button>

              {/* More */}
              <div className="relative" ref={moreRef}>
                <button onClick={() => setMoreOpen((v) => !v)} title="More" className={iconBtn(moreOpen, 'bg-white/[0.10] text-white border-white/[0.15]')}>
                  <span className="text-zinc-400 font-bold text-base leading-none">⋯</span>
                </button>
                {moreOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-2xl bg-[#0a0a12]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.8)] py-1.5 z-50 animate-fade-in">
                    <div className="px-4 py-1.5 mb-1 border-b border-white/[0.05]">
                      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Dashboard</p>
                    </div>
                    <button onClick={handleExport} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors rounded-lg mx-auto">
                      <span className="text-xs">⬇</span> Export
                    </button>
                    <button onClick={() => importRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors rounded-lg mx-auto">
                      <span className="text-xs">⬆</span> Import
                    </button>
                    <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                  </div>
                )}
              </div>

              {!locked && <div className="hidden sm:block w-px h-4 bg-white/[0.06] mx-0.5" />}

              {/* Add tile */}
              {!locked && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    aria-label="Add tile"
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      menuOpen
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-[0_0_24px_rgba(99,102,241,0.5)]'
                        : 'bg-gradient-to-r from-indigo-600/70 to-violet-600/70 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-400/20 hover:border-indigo-400/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                    }`}
                  >
                    <span className={`text-base leading-none transition-transform duration-200 ${menuOpen ? 'rotate-45' : ''}`}>+</span>
                    <span className="hidden sm:inline">Add tile</span>
                  </button>

                  {menuOpen && (
                    <div role="menu"
                      className="absolute right-0 top-full mt-2 w-52 sm:w-56 rounded-2xl bg-[#0a0a12]/90 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.8)] py-1.5 z-50 overflow-hidden animate-fade-in">
                      <div className="px-4 py-1.5 mb-1 border-b border-white/[0.05]">
                        <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Add widget</p>
                      </div>
                      {menuItems.map((item) => (
                        <button key={item.label} role="menuitem"
                          onClick={() => { item.action(); setMenuOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.05] transition-colors">
                          <span className="text-base w-5 text-center shrink-0">{item.emoji}</span>
                          <span className="flex-1 font-medium text-left">{item.label}</span>
                          <kbd className="hidden sm:block text-[10px] text-zinc-700 font-mono bg-white/[0.04] border border-white/[0.07] rounded px-1.5 py-0.5">⌥{item.shortcut}</kbd>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Page tabs */}
          <div className="flex items-center gap-1 px-4 sm:px-8 pb-2 overflow-x-auto">
            {pages.map((page) => (
              <div key={page.id} className="relative group/tab flex items-center shrink-0">
                {renamingPageId === page.id ? (
                  <input autoFocus value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(page.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter') commitRename(page.id); if (e.key === 'Escape') setRenamingPageId(null); }}
                    className="px-3 py-1 rounded-lg bg-white/[0.08] text-white text-xs font-medium outline-none border border-indigo-400/30 w-24" />
                ) : (
                  <button
                    onClick={() => setCurrentPage(page.id)}
                    onDoubleClick={() => { setRenamingPageId(page.id); setRenameValue(page.name); }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${pages.length > 1 ? 'pr-6' : ''} ${
                      currentPageId === page.id
                        ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-400/20'
                        : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    {page.name}
                  </button>
                )}
                {pages.length > 1 && renamingPageId !== page.id && (
                  <button onClick={() => removePage(page.id)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-700 hover:text-red-400 text-xs opacity-0 group-hover/tab:opacity-100 transition-all leading-none">
                    ×
                  </button>
                )}
              </div>
            ))}
            {!locked && (
              <button onClick={addPage}
                className="px-2 py-1 rounded-lg text-zinc-700 hover:text-zinc-400 hover:bg-white/[0.05] text-xs transition-all shrink-0" title="Add page">
                +
              </button>
            )}
          </div>
        </header>

        {/* ── Main content ── */}
        <div className="relative z-10 p-2 sm:p-6">
          {showOnboarding ? <OnboardingFlow /> : <TileGrid />}
        </div>

        {/* ── Overlays ── */}
        {notifOpen  && <NotificationPanel  onClose={() => setNotifOpen(false)} />}
        {bgOpen     && <BackgroundPicker   onClose={() => setBgOpen(false)} />}
        {noteOpen   && <QuickNotePopover   onClose={() => setNoteOpen(false)} />}
        {searchOpen && <SearchPanel        onClose={() => setSearchOpen(false)} />}
      </div>
    </GoogleSignInGate>
  );
}

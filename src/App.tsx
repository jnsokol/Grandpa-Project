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

  void setBg;

  const sideBtn = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
      active
        ? 'bg-zinc-800 text-white'
        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
    }`;

  return (
    <GoogleSignInGate>
      <div className="flex h-screen overflow-hidden">

        {/* ════ SIDEBAR ════ */}
        <aside className="w-56 shrink-0 flex flex-col bg-[#0c0c0c] border-r border-white/[0.05] h-screen sticky top-0 z-30">

          {/* Logo */}
          <div className="px-5 pt-6 pb-5">
            <h1 className="text-white text-base font-bold tracking-tight select-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Grandpa Project
            </h1>
            <p className="text-zinc-700 text-[10px] tracking-widest uppercase mt-0.5 select-none">Dashboard</p>
          </div>

          {/* Clock */}
          <div className="px-5 pb-4">
            <Clock />
          </div>

          <div className="mx-4 h-px bg-white/[0.05]" />

          {/* Pages */}
          <div className="px-3 pt-4 pb-2">
            <p className="px-3 mb-2 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Pages</p>
            <div className="space-y-0.5">
              {pages.map((page) => (
                <div key={page.id} className="relative group/tab">
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
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-white text-sm outline-none border border-zinc-600"
                    />
                  ) : (
                    <button
                      onClick={() => setCurrentPage(page.id)}
                      onDoubleClick={() => { setRenamingPageId(page.id); setRenameValue(page.name); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-150 text-left ${
                        currentPageId === page.id
                          ? 'bg-zinc-800 text-white'
                          : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <span className="truncate">{page.name}</span>
                      {pages.length > 1 && (
                        <span
                          onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                          className="text-zinc-700 hover:text-zinc-300 text-xs opacity-0 group-hover/tab:opacity-100 transition-all ml-1 cursor-pointer leading-none"
                        >×</span>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!locked && (
              <button
                onClick={addPage}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-900 transition-all"
              >
                <span className="text-base leading-none">+</span> Add page
              </button>
            )}
          </div>

          <div className="mx-4 h-px bg-white/[0.05] mt-2" />

          {/* Add tile */}
          {!locked && (
            <div className="px-3 pt-3 relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-zinc-200 transition-all"
              >
                <span className={`text-base leading-none transition-transform duration-200 ${menuOpen ? 'rotate-45' : ''}`}>+</span>
                Add widget
              </button>

              {menuOpen && (
                <div role="menu"
                  className="absolute left-3 right-3 top-full mt-1 rounded-xl bg-[#111] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.9)] py-1 z-50 overflow-hidden animate-fade-in">
                  {menuItems.map((item) => (
                    <button key={item.label} role="menuitem"
                      onClick={() => { item.action(); setMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                      <span className="text-sm w-4 text-center shrink-0">{item.emoji}</span>
                      <span className="flex-1 font-medium text-left">{item.label}</span>
                      <kbd className="text-[10px] text-zinc-700 font-mono">⌥{item.shortcut}</kbd>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          <div className="mx-4 h-px bg-white/[0.05]" />

          {/* Tools */}
          <div className="px-3 py-3 space-y-0.5">
            <button onClick={() => setSearchOpen(true)} className={sideBtn(false)}>
              <span className="text-base">🔍</span> Search
              <kbd className="ml-auto text-[10px] text-zinc-700 font-mono">⌘K</kbd>
            </button>
            <button onClick={() => setNoteOpen((v) => !v)} className={sideBtn(noteOpen)}>
              <span className="text-base">✏️</span> Quick note
            </button>
            <button onClick={() => setNotifOpen((v) => !v)} className={sideBtn(notifOpen)}>
              <span className="text-base">🔔</span> Notifications
            </button>
            <button onClick={() => setBgOpen((v) => !v)} className={sideBtn(bgOpen)}>
              <span className="text-base">🎨</span> Background
            </button>
            <button onClick={toggleLock} className={sideBtn(locked)}>
              <span className="text-base">{locked ? '🔒' : '🔓'}</span>
              {locked ? 'Locked' : 'Lock layout'}
            </button>

            <div className="relative" ref={moreRef}>
              <button onClick={() => setMoreOpen((v) => !v)} className={sideBtn(moreOpen)}>
                <span className="text-base">⋯</span> More
              </button>
              {moreOpen && (
                <div className="absolute left-0 right-0 bottom-full mb-1 rounded-xl bg-[#111] border border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.9)] py-1 z-50 animate-fade-in">
                  <button onClick={handleExport} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                    ⬇ Export dashboard
                  </button>
                  <button onClick={() => importRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors">
                    ⬆ Import dashboard
                  </button>
                  <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                </div>
              )}
            </div>
          </div>

          <div className="mx-4 h-px bg-white/[0.05]" />

          {/* Profile */}
          {profile && (
            <div className="px-4 py-4 flex items-center gap-3">
              {profile.picture ? (
                <img src={profile.picture} alt={profile.name} referrerPolicy="no-referrer"
                  className="w-7 h-7 rounded-full shrink-0" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-zinc-300 text-xs font-medium truncate">{profile.name}</p>
                <button onClick={signOut} className="text-zinc-600 hover:text-zinc-400 text-[10px] transition-colors">Sign out</button>
              </div>
            </div>
          )}
        </aside>

        {/* ════ MAIN CONTENT ════ */}
        <main className="flex-1 overflow-y-auto transition-colors duration-700" style={bgStyle(bg)}>
          <div className="p-4 sm:p-6">
            {showOnboarding ? <OnboardingFlow /> : <TileGrid />}
          </div>
        </main>

        {/* ── Overlays ── */}
        {notifOpen  && <NotificationPanel  onClose={() => setNotifOpen(false)} />}
        {bgOpen     && <BackgroundPicker   onClose={() => setBgOpen(false)} />}
        {noteOpen   && <QuickNotePopover   onClose={() => setNoteOpen(false)} />}
        {searchOpen && <SearchPanel        onClose={() => setSearchOpen(false)} />}
      </div>
    </GoogleSignInGate>
  );
}

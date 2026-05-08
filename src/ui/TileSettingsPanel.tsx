import { useEffect, useState } from 'react';
import { useTileStore } from '../lib/store/tile-store';
import type { Tile } from '../lib/store/tiles';
import { TILE_LABELS } from '../lib/tile-registry';

type Props = { tileId: string; onClose: () => void };

export function TileSettingsPanel({ tileId, onClose }: Props) {
  const pages = useTileStore((s) => s.pages);
  const currentPageId = useTileStore((s) => s.currentPageId);
  const updateTile = useTileStore((s) => s.updateTile);

  const tile = pages.find((p) => p.id === currentPageId)?.tiles.find((t) => t.id === tileId);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!tile) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-80 max-w-[92vw] h-full bg-[#0d0d14] border-l border-white/[0.08] shadow-[−8px_0_40px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div>
            <p className="text-white font-semibold text-sm">{TILE_LABELS[tile.kind]} Settings</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        {/* Settings content */}
        <div className="flex-1 overflow-auto p-5">
          <SettingsBody tile={tile} updateTile={updateTile} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}

function SettingsBody({ tile, updateTile, onClose }: { tile: Tile; updateTile: (t: Tile) => void; onClose: () => void }) {
  switch (tile.kind) {
    case 'countdown':
      return <CountdownSettings tile={tile} updateTile={updateTile} onClose={onClose} />;
    case 'rss':
      return <RssSettings tile={tile} updateTile={updateTile} onClose={onClose} />;
    case 'launcher':
      return <LauncherSettings tile={tile} updateTile={updateTile} onClose={onClose} />;
    case 'notes':
      return <NotesSettings tile={tile} updateTile={updateTile} onClose={onClose} />;
    case 'bookmarks':
      return <BookmarksSettings tile={tile} updateTile={updateTile} onClose={onClose} />;
    case 'weather':
      return <WeatherSettings tile={tile} updateTile={updateTile} onClose={onClose} />;
    default:
      return <p className="text-zinc-500 text-sm">No settings available for this tile.</p>;
  }
}

// ── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = 'bg-white/[0.07] border border-white/[0.12] rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-indigo-400/60 transition-colors w-full';

function SaveButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2 bg-indigo-600/80 hover:bg-indigo-500/90 disabled:opacity-40 text-white rounded-xl text-sm font-semibold transition-colors mt-2"
    >
      Save
    </button>
  );
}

// ── Per-tile settings ────────────────────────────────────────────────────────

function CountdownSettings({ tile, updateTile, onClose }: { tile: Extract<Tile, { kind: 'countdown' }>; updateTile: (t: Tile) => void; onClose: () => void }) {
  const [emoji, setEmoji] = useState(tile.emoji || '🎯');
  const [label, setLabel] = useState(tile.label);
  const [date, setDate] = useState(tile.targetDate);

  function save() {
    updateTile({ ...tile, emoji: emoji || '🎯', label: label.trim() || tile.label, targetDate: date });
    onClose();
  }

  return (
    <>
      <Field label="Emoji"><input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className={inputCls} /></Field>
      <Field label="Label"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Summer holiday" className={inputCls} /></Field>
      <Field label="Target date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} /></Field>
      <SaveButton onClick={save} disabled={!label.trim() || !date} />
    </>
  );
}

function RssSettings({ tile, updateTile, onClose }: { tile: Extract<Tile, { kind: 'rss' }>; updateTile: (t: Tile) => void; onClose: () => void }) {
  const [feedUrl, setFeedUrl] = useState(tile.feedUrl);
  const [label, setLabel] = useState(tile.label);

  function save() {
    updateTile({ ...tile, feedUrl: feedUrl.trim(), label: label.trim() || feedUrl.trim() });
    onClose();
  }

  return (
    <>
      <Field label="Feed URL"><input value={feedUrl} onChange={(e) => setFeedUrl(e.target.value)} placeholder="https://example.com/feed.xml" className={inputCls} /></Field>
      <Field label="Label"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="News" className={inputCls} /></Field>
      <SaveButton onClick={save} disabled={!feedUrl.trim()} />
    </>
  );
}

function LauncherSettings({ tile, updateTile, onClose }: { tile: Extract<Tile, { kind: 'launcher' }>; updateTile: (t: Tile) => void; onClose: () => void }) {
  const [label, setLabel] = useState(tile.label);
  const [url, setUrl] = useState(tile.url);

  function save() {
    updateTile({ ...tile, label: label.trim() || tile.label, url: url.trim() });
    onClose();
  }

  return (
    <>
      <Field label="Label"><input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. YouTube" className={inputCls} /></Field>
      <Field label="URL"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className={inputCls} /></Field>
      <SaveButton onClick={save} disabled={!label.trim()} />
    </>
  );
}

function NotesSettings({ tile, updateTile, onClose }: { tile: Extract<Tile, { kind: 'notes' }>; updateTile: (t: Tile) => void; onClose: () => void }) {
  const [title, setTitle] = useState(tile.title);

  function save() {
    updateTile({ ...tile, title: title.trim() || 'Note' });
    onClose();
  }

  return (
    <>
      <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note" className={inputCls} /></Field>
      <SaveButton onClick={save} />
    </>
  );
}

function BookmarksSettings({ tile, updateTile, onClose }: { tile: Extract<Tile, { kind: 'bookmarks' }>; updateTile: (t: Tile) => void; onClose: () => void }) {
  const [title, setTitle] = useState(tile.title);

  function save() {
    updateTile({ ...tile, title: title.trim() || 'Links' });
    onClose();
  }

  return (
    <>
      <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Links" className={inputCls} /></Field>
      <SaveButton onClick={save} />
    </>
  );
}

function WeatherSettings({ tile, updateTile, onClose }: { tile: Extract<Tile, { kind: 'weather' }>; updateTile: (t: Tile) => void; onClose: () => void }) {
  const [city, setCity] = useState(tile.label ?? '');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  async function searchCity() {
    if (!city.trim()) return;
    setSearching(true); setError('');
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city.trim())}&count=1&language=en&format=json`);
      const data = await res.json() as { results?: { latitude: number; longitude: number; name: string; admin1?: string }[] };
      const r = data.results?.[0];
      if (!r) { setError('City not found'); return; }
      updateTile({ ...tile, locationMode: 'saved', lat: r.latitude, lon: r.longitude, label: r.name + (r.admin1 ? `, ${r.admin1}` : '') });
      onClose();
    } catch { setError('Search failed'); }
    setSearching(false);
  }

  function useGeo() {
    updateTile({ ...tile, locationMode: 'geolocation', lat: undefined, lon: undefined, label: undefined });
    onClose();
  }

  return (
    <>
      {tile.label && <p className="text-zinc-400 text-xs mb-4">Current: 📍 {tile.label}</p>}
      <Field label="Search city">
        <div className="flex gap-2">
          <input value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchCity()} placeholder="City name…" className={inputCls} />
          <button onClick={searchCity} disabled={searching} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-colors shrink-0 disabled:opacity-50">
            {searching ? '…' : '→'}
          </button>
        </div>
      </Field>
      {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
      <button onClick={useGeo} className="text-xs text-zinc-400 hover:text-white transition-colors">📡 Use my current location</button>
    </>
  );
}

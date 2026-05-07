import { useState } from 'react';
import type { LauncherTile as LauncherTileType } from '../../lib/store/tiles';
import { useTileStore } from '../../lib/store/tile-store';

type Props = { tile: LauncherTileType };

export function LauncherTile({ tile }: Props) {
  const [editing, setEditing] = useState(!tile.url);
  const [label, setLabel] = useState(tile.label);
  const [url, setUrl] = useState(tile.url);
  const [icon, setIcon] = useState(tile.icon ?? '');
  const updateTile = useTileStore((s) => s.updateTile);

  function save(e: React.FormEvent) {
    e.preventDefault();
    updateTile({ ...tile, label, url, icon: icon || undefined });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col h-full bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 rounded-xl p-3 text-white">
        <p className="text-sm font-semibold mb-3">🔗 Set link</p>
        <form onSubmit={save} className="flex flex-col gap-2">
          <div className="flex gap-1">
            <input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="🔗" maxLength={2}
              className="w-10 bg-white/15 border border-white/20 rounded-lg px-1 py-1.5 text-sm text-center outline-none focus:border-white/50 text-white" />
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" required
              className="flex-1 bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
          </div>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" required
            className="bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/40 outline-none focus:border-white/50" />
          <div className="flex gap-2 mt-1">
            <button type="submit" className="flex-1 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold text-white transition-colors">Save</button>
            {tile.url && (
              <button type="button" onClick={() => { setLabel(tile.label); setUrl(tile.url); setIcon(tile.icon ?? ''); setEditing(false); }}
                className="px-3 py-1.5 text-sky-300 hover:text-white text-sm transition-colors">Cancel</button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 rounded-xl text-white gap-2">
      <a href={tile.url} target="_blank" rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 hover:scale-105 transition-transform">
        {tile.icon ? (
          <span className="text-4xl drop-shadow-lg">{tile.icon}</span>
        ) : (
          <span className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {tile.label[0]?.toUpperCase()}
          </span>
        )}
        <span className="text-sm font-semibold text-center">{tile.label}</span>
      </a>
      <button onClick={() => setEditing(true)} className="text-xs text-sky-300 hover:text-white transition-colors">Edit</button>
    </div>
  );
}

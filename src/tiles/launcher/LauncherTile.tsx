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

  function cancel() {
    setLabel(tile.label);
    setUrl(tile.url);
    setIcon(tile.icon ?? '');
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex flex-col gap-2 h-full justify-center">
        <div className="flex flex-col gap-1">
          <label htmlFor={`${tile.id}-label`} className="text-xs font-medium text-slate-500">
            Label
          </label>
          <input
            id={`${tile.id}-label`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
            placeholder="Google"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${tile.id}-url`} className="text-xs font-medium text-slate-500">
            URL
          </label>
          <input
            id={`${tile.id}-url`}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
            placeholder="https://example.com"
            required
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor={`${tile.id}-icon`} className="text-xs font-medium text-slate-500">
            Icon (emoji)
          </label>
          <input
            id={`${tile.id}-icon`}
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="border border-slate-300 rounded px-2 py-1 text-sm"
            placeholder="🔍"
            maxLength={2}
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit"
            className="flex-1 bg-blue-500 text-white rounded py-1 text-sm hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
          {tile.url && (
            <button
              type="button"
              onClick={cancel}
              className="flex-1 border border-slate-300 text-slate-600 rounded py-1 text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2 h-full">
      <a
        href={tile.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center gap-2 text-slate-800 hover:text-blue-600 transition-colors"
      >
        {tile.icon ? (
          <span className="text-3xl">{tile.icon}</span>
        ) : (
          <span className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-semibold text-slate-600">
            {tile.label[0]?.toUpperCase()}
          </span>
        )}
        <span className="text-sm font-medium text-center leading-tight">{tile.label}</span>
      </a>
      <button
        onClick={() => setEditing(true)}
        className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Edit launcher tile"
      >
        Edit
      </button>
    </div>
  );
}

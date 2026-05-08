import { useCallback } from 'react';
import { useState } from 'react';
import { useTileStore } from '../../lib/store/tile-store';
import type { NotesTile as NotesTileType } from '../../lib/store/tiles';

type Props = { tile: NotesTileType };

export function NotesTile({ tile }: Props) {
  const updateTile = useTileStore((s) => s.updateTile);
  const [editingTitle, setEditingTitle] = useState(false);

  const handleContent = useCallback(
    (content: string) => updateTile({ ...tile, content }),
    [tile, updateTile],
  );

  const handleTitle = useCallback(
    (title: string) => updateTile({ ...tile, title }),
    [tile, updateTile],
  );

  return (
    <div className="flex flex-col h-full">
      <div className="absolute inset-0 bg-amber-400/[0.05] pointer-events-none rounded-2xl" />
      <div className="relative flex flex-col h-full p-3 gap-1.5">
        {editingTitle ? (
          <input
            autoFocus
            value={tile.title}
            onChange={(e) => handleTitle(e.target.value)}
            onBlur={() => setEditingTitle(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
            className="shrink-0 w-full bg-transparent text-amber-300 font-semibold text-sm outline-none border-b border-amber-400/30 pb-0.5"
          />
        ) : (
          <p
            onDoubleClick={() => setEditingTitle(true)}
            className="shrink-0 text-amber-300 font-semibold text-sm truncate cursor-text select-none hover:text-amber-200 transition-colors"
            title="Double-click to rename"
          >
            {tile.title || 'Note'}
          </p>
        )}
        <div className="shrink-0 h-px bg-amber-400/[0.12]" />
        <textarea
          value={tile.content}
          onChange={(e) => handleContent(e.target.value)}
          placeholder="Write something…"
          className="flex-1 bg-transparent text-amber-100/75 text-xs leading-relaxed resize-none outline-none placeholder-amber-400/25 min-h-0"
        />
      </div>
    </div>
  );
}

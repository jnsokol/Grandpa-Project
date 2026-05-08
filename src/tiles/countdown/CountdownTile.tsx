import { useState } from 'react';
import { useTileStore } from '../../lib/store/tile-store';
import type { CountdownTile as CountdownTileType } from '../../lib/store/tiles';

type Props = { tile: CountdownTileType };

function getDaysRemaining(targetDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(targetDate + 'T00:00:00');
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

export function CountdownTile({ tile }: Props) {
  const updateTile = useTileStore((s) => s.updateTile);
  const [editing, setEditing] = useState(!tile.label || !tile.targetDate);
  const [draftLabel, setDraftLabel] = useState(tile.label);
  const [draftDate, setDraftDate] = useState(tile.targetDate || new Date().toISOString().slice(0, 10));
  const [draftEmoji, setDraftEmoji] = useState(tile.emoji || '🎯');

  function save() {
    if (!draftLabel.trim() || !draftDate) return;
    updateTile({ ...tile, label: draftLabel.trim(), targetDate: draftDate, emoji: draftEmoji || '🎯' });
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-3 h-full justify-center p-4 text-white">
        <p className="text-sm font-semibold text-zinc-300">⏳ New countdown</p>
        <input
          value={draftEmoji}
          onChange={(e) => setDraftEmoji(e.target.value)}
          placeholder="Emoji"
          maxLength={4}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm placeholder-white/40 outline-none focus:border-white/50"
        />
        <input
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          placeholder="Label (e.g. Summer holiday)"
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm placeholder-white/40 outline-none focus:border-white/50"
        />
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-white/50"
        />
        <button
          onClick={save}
          disabled={!draftLabel.trim() || !draftDate}
          className="py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold disabled:opacity-40 transition-colors"
        >
          Save
        </button>
      </div>
    );
  }

  const days = getDaysRemaining(tile.targetDate);
  const isToday = days === 0;
  const isPast = days < 0;

  return (
    <div className="flex flex-col items-center justify-center h-full gap-1 p-4 text-center select-none">
      <span className="text-4xl leading-none">{tile.emoji || '🎯'}</span>

      {isToday ? (
        <p className="text-3xl font-black text-white mt-1">Today! 🎉</p>
      ) : (
        <>
          <p className="text-5xl font-black tabular-nums text-white mt-1 leading-none">
            {Math.abs(days)}
          </p>
          <p className="text-zinc-500 text-xs">
            {isPast ? 'days ago' : 'days to go'}
          </p>
        </>
      )}

      <p className="text-zinc-300 font-semibold text-sm mt-1 truncate max-w-full">{tile.label}</p>
      <p className="text-zinc-600 text-[10px]">
        {new Date(tile.targetDate + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
}

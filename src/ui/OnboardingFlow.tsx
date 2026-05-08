import { useTileStore } from '../lib/store/tile-store';
import type { Tile } from '../lib/store/tiles';

type Starter = { title: string; description: string; emoji: string; tiles: Tile[] };

export function OnboardingFlow() {
  const addTile = useTileStore((s) => s.addTile);
  const dismissOnboarding = useTileStore((s) => s.dismissOnboarding);

  const starters: Starter[] = [
    {
      title: 'Daily essentials',
      description: 'Calendar · Gmail · Tasks',
      emoji: '☀️',
      tiles: [
        { kind: 'gcal',  id: crypto.randomUUID() },
        { kind: 'gmail', id: crypto.randomUUID() },
        { kind: 'todo',  id: crypto.randomUUID(), provider: 'google-tasks' },
      ],
    },
    {
      title: 'Stay informed',
      description: 'Weather · News · Countdown',
      emoji: '🌍',
      tiles: [
        { kind: 'weather',    id: crypto.randomUUID(), locationMode: 'geolocation' },
        { kind: 'rss',        id: crypto.randomUUID(), feedUrl: '', label: 'News' },
        { kind: 'countdown',  id: crypto.randomUUID(), label: '', targetDate: '', emoji: '🎯' },
      ],
    },
    {
      title: 'Personal space',
      description: 'Notes · Bookmarks · Spotify',
      emoji: '🏡',
      tiles: [
        { kind: 'notes',     id: crypto.randomUUID(), title: 'Note', content: '' },
        { kind: 'bookmarks', id: crypto.randomUUID(), title: 'Links', links: [] },
        { kind: 'spotify',   id: crypto.randomUUID() },
      ],
    },
  ];

  function pickStarter(starter: Starter) {
    starter.tiles.forEach((tile) => addTile(tile));
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 gap-12 text-center animate-fade-in">
      <div className="flex flex-col items-center gap-3">
        <p className="text-5xl">👴</p>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Welcome to Grandpa Project
        </h2>
        <p className="text-zinc-500 text-sm max-w-sm">Your personal family dashboard. Pick a starting point or build from scratch.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        {starters.map((s) => (
          <button
            key={s.title}
            onClick={() => pickStarter(s)}
            className="group bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-6 flex flex-col items-center gap-3 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{s.emoji}</span>
            <p className="text-white font-semibold text-sm">{s.title}</p>
            <p className="text-zinc-500 text-xs leading-relaxed">{s.description}</p>
          </button>
        ))}
      </div>

      <button
        onClick={dismissOnboarding}
        className="text-zinc-600 hover:text-zinc-400 text-sm transition-colors"
      >
        Start with empty dashboard →
      </button>
    </div>
  );
}

import { TileCard } from './ui/TileCard';
import { initialTiles } from './lib/store/initial-tiles';

export function App() {
  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Today</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initialTiles.map((tile) => (
          <TileCard key={tile.id} title={tile.title} eyebrow={tile.eyebrow}>
            <p className="text-sm text-slate-600">{tile.description}</p>
          </TileCard>
        ))}
      </div>
    </main>
  );
}

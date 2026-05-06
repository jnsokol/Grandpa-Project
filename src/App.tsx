import { initialTiles } from './lib/store/initial-tiles';
import { TileCard } from './ui/TileCard';

export function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
              Personal / Family Dashboard
            </p>
            <h1 className="text-3xl font-semibold text-slate-950">Today</h1>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Phase 0 foundation. Tile grid, Google integration, and live data come next.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {initialTiles.map((tile) => (
            <TileCard key={tile.id} title={tile.title} eyebrow={tile.eyebrow}>
              <p className="text-sm leading-6 text-slate-600">{tile.description}</p>
            </TileCard>
          ))}
        </div>
      </section>
    </main>
  );
}

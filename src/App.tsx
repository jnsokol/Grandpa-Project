import { TileGrid } from './ui/TileGrid';
import { useTileStore } from './lib/store/tile-store';

export function App() {
  const addTile = useTileStore((s) => s.addTile);

  function addLauncher() {
    addTile({ kind: 'launcher', id: crypto.randomUUID(), label: 'New Link', url: '' });
  }

  function addCalculator() {
    addTile({ kind: 'calculator', id: crypto.randomUUID() });
  }

  function addWeather() {
    addTile({ kind: 'weather', id: crypto.randomUUID(), locationMode: 'geolocation' });
  }

  function addCalendar() {
    addTile({ kind: 'gcal', id: crypto.randomUUID() });
  }

  function addTasks() {
    addTile({ kind: 'todo', id: crypto.randomUUID(), provider: 'google-tasks' });
  }

  return (
    <main className="min-h-screen bg-slate-200">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Today</h1>
        <div className="flex gap-2">
          <button
            onClick={addLauncher}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors"
          >
            + Launcher
          </button>
          <button
            onClick={addCalculator}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors"
          >
            + Calculator
          </button>
          <button
            onClick={addWeather}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors"
          >
            + Weather
          </button>
          <button
            onClick={addCalendar}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors"
          >
            + Calendar
          </button>
          <button
            onClick={addTasks}
            className="text-sm px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 transition-colors"
          >
            + Tasks
          </button>
        </div>
      </header>
      <div className="p-4">
        <TileGrid />
      </div>
    </main>
  );
}

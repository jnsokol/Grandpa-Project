import { TileGrid } from './ui/TileGrid';
import { Clock } from './ui/Clock';
import { AddTileFab } from './ui/AddTileFab';

export function App() {
  return (
    <div className="min-h-screen bg-slate-400">
      <header className="sticky top-0 z-10 grid grid-cols-3 items-center px-6 py-4 bg-slate-900 border-b-4 border-blue-500 shadow-2xl">
        <Clock />
        <h1 className="text-center text-xl font-bold text-white tracking-widest font-mono">
          &lt;Grandpa Project /&gt;
        </h1>
        <div />
      </header>
      <div className="p-4 pb-28">
        <TileGrid />
      </div>
      <AddTileFab />
    </div>
  );
}

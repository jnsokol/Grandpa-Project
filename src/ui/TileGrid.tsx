import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTileStore } from '../lib/store/tile-store';
import { renderTile } from '../lib/tile-registry';
import { TileShell } from './TileShell';

const ResponsiveGridLayout = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

// Custom resize handle — visible dark grip in the bottom-right corner
const ResizeHandle = (
  <div className="react-resizable-handle absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-end justify-end pb-1 pr-1 group z-10">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M11 1L1 11" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <path d="M11 6L6 11" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

export function TileGrid() {
  const { tiles, layouts, removeTile, updateLayouts } = useTileStore();

  function handleLayoutChange(_current: unknown, allLayouts: Layouts) {
    updateLayouts(allLayouts);
  }

  if (tiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3 text-center">
        <span className="text-5xl">🧩</span>
        <p className="text-slate-600 font-medium">Your dashboard is empty</p>
        <p className="text-slate-500 text-sm">Click the <strong>+</strong> button in the bottom-left to add a tile.</p>
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={90}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
      margin={[16, 16]}
      resizeHandle={ResizeHandle}
    >
      {tiles.map((tile) => (
        <div key={tile.id} className="relative">
          <TileShell onRemove={() => removeTile(tile.id)}>
            {renderTile(tile)}
          </TileShell>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

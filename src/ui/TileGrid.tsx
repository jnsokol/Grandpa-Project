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

// Custom resize handle — sits inside the rounded tile, bottom-right corner
const ResizeHandle = (
  <div className="react-resizable-handle absolute bottom-2 right-2 w-5 h-5 cursor-se-resize flex items-center justify-center z-10 opacity-60 hover:opacity-100 transition-opacity">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <circle cx="8" cy="8" r="1.2" fill="#64748b" />
      <circle cx="4.5" cy="8" r="1.2" fill="#64748b" />
      <circle cx="8" cy="4.5" r="1.2" fill="#64748b" />
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
        <div key={tile.id} className="relative rounded-2xl overflow-hidden">
          <TileShell onRemove={() => removeTile(tile.id)}>
            {renderTile(tile)}
          </TileShell>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

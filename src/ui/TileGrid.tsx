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

export function TileGrid() {
  const { tiles, layouts, removeTile, updateLayouts } = useTileStore();

  function handleLayoutChange(_current: unknown, allLayouts: Layouts) {
    updateLayouts(allLayouts);
  }

  if (tiles.length === 0) {
    return (
      <div className="text-center py-20 text-slate-400 text-sm">
        No tiles yet — add one using the buttons above.
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={80}
      draggableHandle=".drag-handle"
      onLayoutChange={handleLayoutChange}
      margin={[12, 12]}
    >
      {tiles.map((tile) => (
        <div key={tile.id}>
          <TileShell onRemove={() => removeTile(tile.id)}>
            {renderTile(tile)}
          </TileShell>
        </div>
      ))}
    </ResponsiveGridLayout>
  );
}

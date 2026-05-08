import { useEffect, useRef, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTileStore } from '../lib/store/tile-store';
import { renderTile } from '../lib/tile-registry';
import { TileShell } from './TileShell';

const ResponsiveGridLayout = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 };

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
  const prevCount = useRef(tiles.length);
  useEffect(() => {
    if (tiles.length > prevCount.current) {
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
    }
    prevCount.current = tiles.length;
  }, [tiles.length]);

  const [dragging, setDragging] = useState(false);
  const [overTrash, setOverTrash] = useState(false);
  const trashRef = useRef<HTMLDivElement>(null);

  function handleLayoutChange(_current: unknown, allLayouts: Layouts) {
    updateLayouts(allLayouts);
  }

  function handleDragStart() {
    setDragging(true);
  }

  function handleDragStop(
    _layout: Layout[],
    oldItem: Layout,
    _newItem: Layout,
    _placeholder: Layout,
    e: MouseEvent,
  ) {
    setDragging(false);
    setOverTrash(false);
    if (trashRef.current) {
      const rect = trashRef.current.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        removeTile(oldItem.i);
      }
    }
  }

  function handleDrag(
    _layout: Layout[],
    _oldItem: Layout,
    _newItem: Layout,
    _placeholder: Layout,
    e: MouseEvent,
  ) {
    if (trashRef.current) {
      const rect = trashRef.current.getBoundingClientRect();
      setOverTrash(
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom,
      );
    }
  }

  if (tiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
        <span className="text-6xl opacity-40">🧩</span>
        <p className="text-zinc-400 font-semibold text-lg">Your dashboard is empty</p>
        <p className="text-zinc-600 text-sm">Click <strong className="text-zinc-400">+ Add tile</strong> in the top-right to get started.</p>
      </div>
    );
  }

  return (
    <>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={90}
        draggableHandle=".drag-handle"
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        margin={[16, 16]}
        resizeHandle={ResizeHandle}
        compactType={null}
        preventCollision
      >
        {tiles.map((tile) => (
          <div key={tile.id} className="relative rounded-2xl overflow-hidden">
            <TileShell>
              {renderTile(tile)}
            </TileShell>
          </div>
        ))}
      </ResponsiveGridLayout>

      {/* Drag-to-remove trash zone */}
      {dragging && (
        <div
          ref={trashRef}
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-8 py-4 rounded-2xl border-2 transition-all duration-150 pointer-events-none select-none ${
            overTrash
              ? 'bg-red-600 border-red-400 scale-110'
              : 'bg-slate-800/90 border-slate-600'
          }`}
        >
          <span className="text-2xl">{overTrash ? '🗑️' : '🗑'}</span>
          <span className={`text-sm font-semibold ${overTrash ? 'text-white' : 'text-slate-300'}`}>
            {overTrash ? 'Release to remove' : 'Drag here to remove tile'}
          </span>
        </div>
      )}
    </>
  );
}

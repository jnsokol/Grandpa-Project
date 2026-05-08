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
  const pages = useTileStore((s) => s.pages);
  const currentPageId = useTileStore((s) => s.currentPageId);
  const removeTile = useTileStore((s) => s.removeTile);
  const updateLayouts = useTileStore((s) => s.updateLayouts);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const tiles = currentPage?.tiles ?? [];
  const layouts = currentPage?.layouts ?? {};

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

  function getClientPos(e: MouseEvent | TouchEvent): { x: number; y: number } {
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
  }

  function isOverTrash(e: MouseEvent | TouchEvent): boolean {
    if (!trashRef.current) return false;
    const { x, y } = getClientPos(e);
    const rect = trashRef.current.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

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
    if (isOverTrash(e as unknown as MouseEvent | TouchEvent)) {
      removeTile(oldItem.i);
    }
  }

  function handleDrag(
    _layout: Layout[],
    _oldItem: Layout,
    _newItem: Layout,
    _placeholder: Layout,
    e: MouseEvent,
  ) {
    setOverTrash(isOverTrash(e as unknown as MouseEvent | TouchEvent));
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

import { useEffect, useMemo, useRef, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import type { Layout, Layouts } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useTileStore } from '../lib/store/tile-store';
import { renderTile } from '../lib/tile-registry';
import { TileShell } from './TileShell';
import { TileSettingsPanel } from './TileSettingsPanel';

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

function hasOverlaps(layout: Layout[]): boolean {
  for (let i = 0; i < layout.length; i++) {
    for (let j = i + 1; j < layout.length; j++) {
      const a = layout[i];
      const b = layout[j];
      if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
        return true;
      }
    }
  }
  return false;
}

function buildStackedLayout(tiles: { id: string }[], existing: Layout[]): Layout[] {
  let y = 0;
  return tiles.map((tile) => {
    const e = existing.find((l) => l.i === tile.id);
    const item: Layout = { i: tile.id, x: 0, y, w: e?.w ?? 3, h: e?.h ?? 3 };
    y += item.h;
    return item;
  });
}

export function TileGrid() {
  const pages = useTileStore((s) => s.pages);
  const currentPageId = useTileStore((s) => s.currentPageId);
  const locked = useTileStore((s) => s.locked);
  const removeTile = useTileStore((s) => s.removeTile);
  const updateLayouts = useTileStore((s) => s.updateLayouts);

  const currentPage = pages.find((p) => p.id === currentPageId);
  const tiles = currentPage?.tiles ?? [];
  const layouts = currentPage?.layouts ?? {};

  // Validate layout BEFORE passing to RGL — RGL does not re-process layouts prop after mount,
  // so bad data must be caught here synchronously.
  const safeLayouts = useMemo<Layouts>(() => {
    const lg = layouts.lg ?? [];
    const needsFix =
      tiles.length > 0 &&
      (lg.length !== tiles.length || (lg.length > 1 && hasOverlaps(lg)));
    if (needsFix) {
      return { lg: buildStackedLayout(tiles, lg) };
    }
    return layouts;
  }, [layouts, tiles]);

  // Persist the fixed layout so it's correct on next load
  useEffect(() => {
    if (safeLayouts !== layouts) {
      updateLayouts(safeLayouts);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeLayouts]);

  const prevCount = useRef(tiles.length);
  useEffect(() => {
    if (tiles.length > prevCount.current) {
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    }
    prevCount.current = tiles.length;
  }, [tiles.length]);

  const [settingsTileId, setSettingsTileId] = useState<string | null>(null);
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

  // Only persist the lg layout — other breakpoints are auto-derived by RGL
  function handleLayoutChange(_current: unknown, allLayouts: Layouts) {
    if (allLayouts.lg) {
      updateLayouts({ lg: allLayouts.lg });
    }
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
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-center animate-fade-in">
        <span className="text-6xl opacity-40">🧩</span>
        <p className="text-zinc-400 font-semibold text-lg">This page is empty</p>
        <p className="text-zinc-600 text-sm">Click <strong className="text-zinc-400">+ Add tile</strong> to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div key={currentPageId} className="page-switch">
      <ResponsiveGridLayout
        className="layout"
        layouts={safeLayouts}
        breakpoints={BREAKPOINTS}
        cols={COLS}
        rowHeight={90}
        draggableHandle=".drag-handle"
        isDraggable={!locked}
        isResizable={!locked}
        onLayoutChange={handleLayoutChange}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragStop={handleDragStop}
        margin={[16, 16]}
        resizeHandle={ResizeHandle}
        compactType={null}
        preventCollision
      >
        {tiles.map((tile, i) => (
          <div key={tile.id} className="relative rounded-2xl overflow-hidden tile-enter" style={{ animationDelay: `${i * 25}ms` }}>
            <TileShell locked={locked} onSettings={() => setSettingsTileId(tile.id)}>
              {renderTile(tile)}
            </TileShell>
          </div>
        ))}
      </ResponsiveGridLayout>
      </div>

      {settingsTileId && (
        <TileSettingsPanel tileId={settingsTileId} onClose={() => setSettingsTileId(null)} />
      )}

      {/* Drag-to-remove trash zone */}
      {dragging && !locked && (
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

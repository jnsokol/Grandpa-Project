import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layouts } from 'react-grid-layout';
import type { Tile } from './tiles';

const DEFAULT_SIZES: Record<Tile['kind'], { w: number; h: number }> = {
  launcher:   { w: 2, h: 3 },
  bookmarks:  { w: 3, h: 3 },
  calculator: { w: 3, h: 5 },
  todo:       { w: 3, h: 4 },
  weather:    { w: 3, h: 4 },
  gcal:       { w: 4, h: 4 },
  gdrive:     { w: 3, h: 3 },
  rss:        { w: 4, h: 4 },
  gmail:      { w: 4, h: 5 },
};

const DEFAULT_TILES: Tile[] = [];

const DEFAULT_LAYOUTS: Layouts = {};

type TileStore = {
  tiles: Tile[];
  layouts: Layouts;
  addTile: (tile: Tile) => void;
  removeTile: (id: string) => void;
  updateTile: (tile: Tile) => void;
  updateLayouts: (layouts: Layouts) => void;
};

export const useTileStore = create<TileStore>()(
  persist(
    (set) => ({
      tiles: DEFAULT_TILES,
      layouts: DEFAULT_LAYOUTS,
      addTile: (tile) =>
        set((state) => {
          const lgLayout = state.layouts.lg ?? [];
          const maxY = lgLayout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
          const size = DEFAULT_SIZES[tile.kind];
          return {
            tiles: [...state.tiles, tile],
            layouts: {
              ...state.layouts,
              lg: [...lgLayout, { i: tile.id, x: 0, y: maxY, w: size.w, h: size.h }],
            },
          };
        }),
      removeTile: (id) =>
        set((state) => {
          const newLayouts: Layouts = {};
          for (const bp of Object.keys(state.layouts)) {
            newLayouts[bp] = state.layouts[bp].filter((l) => l.i !== id);
          }
          return { tiles: state.tiles.filter((t) => t.id !== id), layouts: newLayouts };
        }),
      updateTile: (tile) =>
        set((state) => ({
          tiles: state.tiles.map((t) => (t.id === tile.id ? tile : t)),
        })),
      updateLayouts: (layouts) => set({ layouts }),
    }),
    {
      name: 'dashboard-tiles',
      version: 4,
      migrate: () => ({ tiles: DEFAULT_TILES, layouts: DEFAULT_LAYOUTS }),
    }
  )
);

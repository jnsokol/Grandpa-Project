import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layouts } from 'react-grid-layout';
import type { Tile } from './tiles';

export type Page = {
  id: string;
  name: string;
  tiles: Tile[];
  layouts: Layouts;
};

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
  notes:      { w: 3, h: 4 },
};

function makePage(name: string): Page {
  return { id: crypto.randomUUID(), name, tiles: [], layouts: {} };
}

type TileStore = {
  pages: Page[];
  currentPageId: string;
  addPage: () => void;
  removePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  setCurrentPage: (id: string) => void;
  addTile: (tile: Tile) => void;
  removeTile: (id: string) => void;
  updateTile: (tile: Tile) => void;
  updateLayouts: (layouts: Layouts) => void;
};

const initialPage = makePage('Home');

export const useTileStore = create<TileStore>()(
  persist(
    (set) => ({
      pages: [initialPage],
      currentPageId: initialPage.id,

      addPage: () =>
        set((state) => {
          const page = makePage(`Page ${state.pages.length + 1}`);
          return { pages: [...state.pages, page], currentPageId: page.id };
        }),

      removePage: (id) =>
        set((state) => {
          if (state.pages.length <= 1) return state;
          const newPages = state.pages.filter((p) => p.id !== id);
          const newCurrentId =
            state.currentPageId === id ? newPages[0].id : state.currentPageId;
          return { pages: newPages, currentPageId: newCurrentId };
        }),

      renamePage: (id, name) =>
        set((state) => ({
          pages: state.pages.map((p) => (p.id === id ? { ...p, name } : p)),
        })),

      setCurrentPage: (id) => set({ currentPageId: id }),

      addTile: (tile) =>
        set((state) => {
          const idx = state.pages.findIndex((p) => p.id === state.currentPageId);
          if (idx === -1) return state;
          const page = state.pages[idx];
          const lgLayout = page.layouts.lg ?? [];
          const maxY = lgLayout.reduce((m, l) => Math.max(m, l.y + l.h), 0);
          const size = DEFAULT_SIZES[tile.kind];
          const newPage: Page = {
            ...page,
            tiles: [...page.tiles, tile],
            layouts: {
              ...page.layouts,
              lg: [...lgLayout, { i: tile.id, x: 0, y: maxY, w: size.w, h: size.h }],
            },
          };
          const newPages = [...state.pages];
          newPages[idx] = newPage;
          return { pages: newPages };
        }),

      removeTile: (id) =>
        set((state) => {
          const idx = state.pages.findIndex((p) => p.id === state.currentPageId);
          if (idx === -1) return state;
          const page = state.pages[idx];
          const newLayouts: Layouts = {};
          for (const bp of Object.keys(page.layouts)) {
            newLayouts[bp] = page.layouts[bp].filter((l) => l.i !== id);
          }
          const newPage: Page = {
            ...page,
            tiles: page.tiles.filter((t) => t.id !== id),
            layouts: newLayouts,
          };
          const newPages = [...state.pages];
          newPages[idx] = newPage;
          return { pages: newPages };
        }),

      updateTile: (tile) =>
        set((state) => {
          const idx = state.pages.findIndex((p) => p.id === state.currentPageId);
          if (idx === -1) return state;
          const page = state.pages[idx];
          const newPage: Page = {
            ...page,
            tiles: page.tiles.map((t) => (t.id === tile.id ? tile : t)),
          };
          const newPages = [...state.pages];
          newPages[idx] = newPage;
          return { pages: newPages };
        }),

      updateLayouts: (layouts) =>
        set((state) => {
          const idx = state.pages.findIndex((p) => p.id === state.currentPageId);
          if (idx === -1) return state;
          const newPages = [...state.pages];
          newPages[idx] = { ...newPages[idx], layouts };
          return { pages: newPages };
        }),
    }),
    {
      name: 'dashboard-tiles',
      version: 5,
      migrate: () => {
        const page = makePage('Home');
        return { pages: [page], currentPageId: page.id };
      },
    }
  )
);

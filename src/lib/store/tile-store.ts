import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Layouts } from 'react-grid-layout';
import type { Tile } from './tiles';
import type { BgConfig } from '../background';

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
  countdown:  { w: 2, h: 2 },
  spotify:    { w: 3, h: 3 },
};

function makePage(name: string): Page {
  return { id: crypto.randomUUID(), name, tiles: [], layouts: {} };
}

const DEFAULT_BG: BgConfig = { presetId: 'indigo', imageUrl: '' };

type TileStore = {
  pages: Page[];
  currentPageId: string;
  locked: boolean;
  bg: BgConfig;
  onboardingDone: boolean;
  addPage: () => void;
  removePage: (id: string) => void;
  renamePage: (id: string, name: string) => void;
  setCurrentPage: (id: string) => void;
  toggleLock: () => void;
  setBg: (bg: BgConfig) => void;
  dismissOnboarding: () => void;
  addTile: (tile: Tile) => void;
  removeTile: (id: string) => void;
  updateTile: (tile: Tile) => void;
  updateLayouts: (layouts: Layouts) => void;
  replaceDashboard: (pages: Page[], currentPageId: string) => void;
};

const initialPage = makePage('Home');

export const useTileStore = create<TileStore>()(
  persist(
    (set) => ({
      pages: [initialPage],
      currentPageId: initialPage.id,
      locked: false,
      bg: DEFAULT_BG,
      onboardingDone: false,

      toggleLock: () => set((state) => ({ locked: !state.locked })),
      setBg: (bg) => set({ bg }),
      dismissOnboarding: () => set({ onboardingDone: true }),

      addPage: () =>
        set((state) => {
          const page = makePage(`Page ${state.pages.length + 1}`);
          return { pages: [...state.pages, page], currentPageId: page.id };
        }),

      removePage: (id) =>
        set((state) => {
          if (state.pages.length <= 1) return state;
          const newPages = state.pages.filter((p) => p.id !== id);
          const newCurrentId = state.currentPageId === id ? newPages[0].id : state.currentPageId;
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
          const size = DEFAULT_SIZES[tile.kind];
          const shifted = lgLayout.map((l) => ({ ...l, y: l.y + size.h }));
          const newPage: Page = {
            ...page,
            tiles: [...page.tiles, tile],
            layouts: {
              ...page.layouts,
              lg: [...shifted, { i: tile.id, x: 0, y: 0, w: size.w, h: size.h }],
            },
          };
          const newPages = [...state.pages];
          newPages[idx] = newPage;
          return { pages: newPages, onboardingDone: true };
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

      replaceDashboard: (pages, currentPageId) => set({ pages, currentPageId }),
    }),
    {
      name: 'dashboard-tiles',
      version: 6,
      migrate: (persistedState) => {
        const s = persistedState as { pages?: Page[]; currentPageId?: string; locked?: boolean; bg?: BgConfig; onboardingDone?: boolean };
        if (s?.pages?.length) {
          // Rebuild lg layouts from tile list to fix overlapping caused by WidthProvider 0-width render
          s.pages = s.pages.map((page) => {
            const tiles = page.tiles ?? [];
            let y = 0;
            const lgLayout = tiles.map((tile) => {
              const size = DEFAULT_SIZES[tile.kind] ?? { w: 3, h: 3 };
              const item = { i: tile.id, x: 0, y, w: size.w, h: size.h };
              y += size.h;
              return item;
            });
            return { ...page, layouts: { lg: lgLayout } };
          });
          return s;
        }
        const page = makePage('Home');
        return { pages: [page], currentPageId: page.id };
      },
    }
  )
);

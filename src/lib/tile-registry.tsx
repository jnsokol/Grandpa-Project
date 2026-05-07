import type { ReactNode } from 'react';
import type { Tile } from './store/tiles';
import { LauncherTile } from '../tiles/launcher/LauncherTile';
import { CalculatorTile } from '../tiles/calculator/CalculatorTile';

export const TILE_LABELS: Record<Tile['kind'], string> = {
  launcher: 'Launcher',
  calculator: 'Calculator',
  todo: 'Google Tasks',
  weather: 'Weather',
  gcal: 'Google Calendar',
  gdrive: 'Google Drive',
  rss: 'News',
};

export function renderTile(tile: Tile): ReactNode {
  switch (tile.kind) {
    case 'launcher':
      return <LauncherTile tile={tile} />;
    case 'calculator':
      return <CalculatorTile tile={tile} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-sm text-slate-400">
          Coming in a later phase
        </div>
      );
  }
}

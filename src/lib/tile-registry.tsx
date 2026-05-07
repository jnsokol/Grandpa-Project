import type { ReactNode } from 'react';
import type { Tile } from './store/tiles';
import { LauncherTile } from '../tiles/launcher/LauncherTile';
import { CalculatorTile } from '../tiles/calculator/CalculatorTile';
import { WeatherTile } from '../tiles/weather/WeatherTile';
import { GoogleCalendarTile } from '../tiles/google-calendar/GoogleCalendarTile';
import { GoogleTasksTile } from '../tiles/google-tasks/GoogleTasksTile';
import { GoogleDriveTile } from '../tiles/google-drive/GoogleDriveTile';
import { NewsTile } from '../tiles/news/NewsTile';
import { BookmarksTile } from '../tiles/bookmarks/BookmarksTile';

export const TILE_LABELS: Record<Tile['kind'], string> = {
  launcher: 'Launcher',
  calculator: 'Calculator',
  todo: 'Google Tasks',
  weather: 'Weather',
  gcal: 'Google Calendar',
  gdrive: 'Google Drive',
  rss: 'News',
  bookmarks: 'Bookmarks',
};

export function renderTile(tile: Tile): ReactNode {
  switch (tile.kind) {
    case 'launcher':
      return <LauncherTile tile={tile} />;
    case 'calculator':
      return <CalculatorTile tile={tile} />;
    case 'weather':
      return <WeatherTile tile={tile} />;
    case 'gcal':
      return <GoogleCalendarTile tile={tile} />;
    case 'todo':
      return <GoogleTasksTile tile={tile} />;
    case 'gdrive':
      return <GoogleDriveTile />;
    case 'rss':
      return <NewsTile tile={tile} />;
    case 'bookmarks':
      return <BookmarksTile tile={tile} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-sm text-slate-400">
          Coming in a later phase
        </div>
      );
  }
}

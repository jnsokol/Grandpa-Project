export type LauncherTile = {
  kind: 'launcher';
  id: string;
  label: string;
  url: string;
  icon?: string;
};

export type CalculatorTile = {
  kind: 'calculator';
  id: string;
};

export type TodoTile = {
  kind: 'todo';
  id: string;
  provider: 'google-tasks';
  taskListId?: string;
};

export type WeatherTile = {
  kind: 'weather';
  id: string;
  locationMode: 'geolocation' | 'saved';
  lat?: number;
  lon?: number;
  label?: string;
};

export type GCalTile = {
  kind: 'gcal';
  id: string;
  calendarId?: string;
};

export type GDriveTile = {
  kind: 'gdrive';
  id: string;
  folderId?: string;
};

export type RssTile = {
  kind: 'rss';
  id: string;
  feedUrl: string;
  label: string;
};

export type BookmarkLink = {
  id: string;
  label: string;
  url: string;
  icon?: string;
};

export type BookmarksTile = {
  kind: 'bookmarks';
  id: string;
  title: string;
  links: BookmarkLink[];
};

export type GmailTile = {
  kind: 'gmail';
  id: string;
};

export type NotesTile = {
  kind: 'notes';
  id: string;
  title: string;
  content: string;
};

export type Tile =
  | LauncherTile
  | CalculatorTile
  | TodoTile
  | WeatherTile
  | GCalTile
  | GDriveTile
  | RssTile
  | BookmarksTile
  | GmailTile
  | NotesTile;

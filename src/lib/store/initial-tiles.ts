export type InitialTile = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
};

export const initialTiles: InitialTile[] = [
  {
    id: 'launcher',
    title: 'Launcher',
    eyebrow: 'Phase 1',
    description: 'Shortcut tiles for important links and everyday tools.',
  },
  {
    id: 'calculator',
    title: 'Calculator',
    eyebrow: 'Phase 2',
    description: 'A simple calculator tile that works on phone and desktop.',
  },
  {
    id: 'weather',
    title: 'Weather',
    eyebrow: 'Phase 3',
    description: 'Open-Meteo forecast using geolocation or a saved location.',
  },
  {
    id: 'calendar',
    title: 'Google Calendar',
    eyebrow: 'Phase 4',
    description: 'Upcoming events after Google sign-in and calendar consent.',
  },
  {
    id: 'tasks',
    title: 'Google Tasks',
    eyebrow: 'Phase 5',
    description: 'Task lists, active tasks, and completed tasks synced with Google Tasks.',
  },
  {
    id: 'drive',
    title: 'Google Drive',
    eyebrow: 'Phase 6',
    description: 'Recent or selected Drive files, depending on the final scope choice.',
  },
];

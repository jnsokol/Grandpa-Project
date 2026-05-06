# Architecture

## High Level
Single-page React app, fully static, deployed to Cloudflare Pages. Most state is local. Google APIs are called from the browser using OAuth 2.0 with the Google Identity Services token model. No server in MVP unless news RSS needs a CORS proxy.

```text
[ Browser SPA ]
  |-- localStorage  (tiles, layout, settings)
  |-- Google APIs   (Calendar, Drive, Tasks) via gapi.client / REST
  |-- Open-Meteo    (weather)                direct fetch
  `-- RSS proxy     (news, optional)         Cloudflare Worker
```

## Tile Model

```ts
type Tile =
  | { kind: 'launcher'; id: string; label: string; url: string; icon?: string }
  | { kind: 'calculator'; id: string }
  | { kind: 'todo'; id: string; provider: 'google-tasks'; taskListId?: string }
  | { kind: 'weather'; id: string; locationMode: 'geolocation' | 'saved'; lat?: number; lon?: number; label?: string }
  | { kind: 'gcal'; id: string; calendarId?: string }
  | { kind: 'gdrive'; id: string; folderId?: string }
  | { kind: 'rss'; id: string; feedUrl: string; label: string };
```

## Google Auth
- Use Google Identity Services token client.
- Request scopes incrementally only when a tile needs them.
- Keep access tokens in memory/session storage.
- Do not store refresh tokens in the browser.

## Weather
- Use Open-Meteo.
- Support browser geolocation and saved locations.
- Cache the latest response in local storage.

## Backend
No backend for MVP unless RSS/news needs a CORS proxy. If needed, use a small Cloudflare Worker under `workers/rss-proxy/`.

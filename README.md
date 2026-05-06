# Grandpa Project

Grandpa Project is a browser-based productivity dashboard built as a responsive single-page application. It is designed to give users one clean home screen for daily tools such as shortcuts, weather, Google Calendar, Google Tasks, Google Drive, and optional news.

The project is also a structured agentic-development workspace: product decisions, architecture notes, backlog items, and agent instructions live in the repository so work can continue predictably across sessions.

## Project Status

Current phase: **Phase 0 foundation**.

The app currently includes the Vite/React/TypeScript scaffold, project documentation, agent workflow files, a basic dashboard foundation screen, and initial test/build tooling. The real draggable tile grid begins in Phase 1.

## Tech Stack

| Area | Technology |
|---|---|
| Language | TypeScript |
| UI framework | React |
| Build tool | Vite |
| Styling | Tailwind CSS |
| State management | Zustand |
| Tile layout | react-grid-layout |
| Testing | Vitest, Testing Library, jsdom |
| Linting | ESLint, TypeScript |
| Hosting target | Cloudflare Pages |
| Optional backend | Cloudflare Workers |
| External APIs | Google APIs, Open-Meteo |
| Package manager | npm |

## Product Scope

MVP features:

- Responsive dashboard for desktop and mobile.
- Draggable/resizable tile grid.
- Launcher tiles for important links.
- Calculator tile.
- Weather tile using Open-Meteo with geolocation and saved-location fallback.
- Google Calendar tile.
- Google Tasks todo tile.
- Google Drive recents tile.
- Optional RSS/news tile if scoped later.

Explicitly out of the MVP:

- Gmail summary.
- URL/article summarization.
- Multi-account sync.
- Backend-stored refresh tokens.

## Architecture

The MVP is planned as a mostly static browser SPA:

```text
Browser SPA
|-- localStorage: layout, settings, cached client state
|-- Google APIs: Calendar, Drive, Tasks
|-- Open-Meteo: weather forecast
`-- Cloudflare Worker: optional RSS proxy only if needed
```

Google integration will use Google Identity Services. Scopes should be requested incrementally when a tile needs them. Secrets must not be committed to the repository.

More detail lives in:

- `dashboard-plan.md`
- `docs/ARCHITECTURE.md`
- `docs/BACKLOG.md`
- `docs/DECISIONS.md`
- `docs/CLIENT-QUESTIONS.md`

## Repository Structure

```text
.
├── .codex/              # Codex workflow prompts and checklists
├── .claude/             # Optional Claude Code workflow files
├── docs/                # Architecture, backlog, decisions, questions
├── src/
│   ├── lib/             # Shared API, store, and utility code
│   ├── tiles/           # One folder per tile type
│   ├── ui/              # Shared UI components
│   ├── App.tsx
│   └── main.tsx
├── tests/               # Test setup
├── workers/             # Optional Cloudflare Workers
├── dashboard-plan.md
├── package.json
└── vite.config.ts
```

## Getting Started

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run tests:

```bash
npm test -- --run
```

Run lint and TypeScript checks:

```bash
npm run lint
```

## Development Workflow

This repo uses a documented agentic workflow.

Before implementation work:

1. Read the relevant docs in `docs/`.
2. Check `AGENTS.md` and `.codex/project.md`.
3. Keep changes scoped to the current phase or feature.

After implementation work:

1. Run feasible verification commands.
2. Check `git status`.
3. Stage all changes with `git add .`.
4. Commit completed changes with a clear message.
5. Push the current branch to GitHub.

If commit or push is blocked by auth, missing remote, conflicts, or failing checks, report the blocker clearly instead of pretending the workflow is complete.

## Roadmap

1. Phase 0: Foundation and project structure.
2. Phase 1: Responsive shell and tile grid.
3. Phase 2: Launcher and calculator.
4. Phase 3: Weather.
5. Phase 4: Google Cloud setup and Calendar auth.
6. Phase 5: Google Tasks todo.
7. Phase 6: Google Drive recents.
8. Phase 7: Optional news/RSS.
9. Phase 8: Polish, PWA, accessibility, and performance.

## License

Private project. License not selected yet.

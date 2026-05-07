# Project: Personal / Dashboard

## What This Is
A browser-based tile dashboard for personal, family, and later other-user use. React + Vite + TypeScript + Tailwind. Deployed to Cloudflare Pages. Mostly client-side; one optional Worker for RSS/news proxy.

## Non-Negotiables
- Must work on mobile, including 375px width.
- Must work well on desktop too; design responsive behavior from the first implementation.
- Google integration uses Google Identity Services token client, not legacy gapi auth.
- MVP includes Google Calendar, Google Drive recents, and Google Tasks.
- MVP excludes Gmail and summarize/article URL features.
- No new dependencies without an entry in `docs/DECISIONS.md`.
- No backend secrets ever committed. Workers use Cloudflare secrets.

## Conventions
- TypeScript strict mode on. No `any`.
- Components: function components + hooks. No class components.
- State: Zustand for global, `useState` for local. No Redux.
- Styling: Tailwind utility classes.
- File names: kebab-case for files, PascalCase for components.
- One tile kind per folder under `src/tiles/`.

## Commands
- `npm run dev` - local dev server
- `npm test` - Vitest
- `npm run build` - production build
- `npm run lint` - ESLint + TypeScript checks

## Before Editing
1. Read `docs/ARCHITECTURE.md` if touching layout, auth, or storage.
2. If adding a tile, keep it inside one folder under `src/tiles/`.
3. If unsure, ask one clarifying question instead of guessing.

## End Of Session
- Update `docs/BACKLOG.md` if new work surfaced.
- Add an ADR to `docs/DECISIONS.md` if a non-trivial decision was made.
- Run `npm run lint && npm test` before declaring done when feasible.
- Stage changes with `git add .`, not file-by-file `git add` commands.
- Always commit completed changes and push the current branch to GitHub.
- If commit or push is blocked by missing remote, credentials, conflicts, or failing checks, stop and report the exact blocker.

## Known Constraints
- Work in 60-90 minute focused blocks.
- Do not run `wrangler deploy` from the agent. Deploys happen manually.

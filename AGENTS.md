# Project: Personal / Family Dashboard

## What This Is
A browser-based tile dashboard for personal, family, and later other-user use.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Zustand for app state
- Cloudflare Pages for hosting
- Google Identity Services for OAuth

## Non-Negotiables
- Must work on mobile and desktop from the first implementation.
- Google integration uses Google Identity Services token client.
- MVP includes launcher, calculator, weather, Google Calendar, Google Tasks, and Google Drive.
- MVP excludes Gmail and summarize/article URL features.
- No new dependencies without a note in `docs/DECISIONS.md`.
- No secrets in git. Use env vars and Cloudflare secrets.

## Conventions
- TypeScript strict mode.
- Function components and hooks.
- One tile kind per folder under `src/tiles/`.
- Shared UI primitives go in `src/ui/`.
- Shared API/store code goes in `src/lib/`.

## Verification
- Run `npm run lint`, `npm test`, and `npm run build` before declaring implementation work done when feasible.
- For UI changes, check phone-width and desktop-width layouts.

## Git Workflow
- After making changes, always check `git status`.
- Run the feasible verification commands before committing.
- Commit completed changes with a clear message.
- Push the current branch to GitHub after committing.
- If commit or push is blocked by missing remote, credentials, conflicts, or failing checks, stop and report the exact blocker.

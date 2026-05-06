# Personal / Family Dashboard App — Development Plan

A browser-based, responsive tile dashboard for you, your grandpa, and later other users. It includes launcher tiles, Google integration, calculator, Google Tasks todo, weather with geolocation plus saved locations, Google Calendar, Google Drive recents, and optional news. Built solo, on a tight budget, using an agentic AI workflow while still shipping a real, usable product.

---

## 1. Goals and constraints

| Constraint | Value |
|---|---|
| Monthly budget | ≤ 130 PLN |
| Workflow style | Agentic AI (no pure manual coding) |
| Learning goal | Master agentic workflow + ship a real product |
| Product target | Personal first, family-friendly second, expandable to other users later |
| UI target | Browser, equally responsive on phone and desktop from day one |
| Must-have features | Tile grid, launcher tiles, calculator, Google Tasks todo, weather, Google Calendar, Google Drive recents, optional news |
| Explicitly out of MVP | Summarize URL/article button, Gmail summary |
| Maybe-have | News, depending on preferred sources |
| Solo dev | Yes, with downtime expected |
| Product quality target | Balanced: learn agentic workflow, ship quickly, and keep the codebase clean |

---

## 2. Stack — final choices

| Layer | Choice | Why | Cost |
|---|---|---|---|
| AI / Coding agent | Codex in this repo + optional Claude Pro/Claude Code | Codex is the active workflow here. Claude can still be used later, but the repo should have Codex-native project files. | ~0–80 PLN/mo depending on subscriptions |
| Frontend framework | Vite + React + TypeScript | Industry standard, huge LLM training data → agent writes it well. | 0 |
| Styling | Tailwind CSS | Utility-first; agents write Tailwind faster and more consistently than hand-rolled CSS. | 0 |
| State (local) | Zustand + browser `localStorage` | Tile layout, todos, settings. No server needed for MVP. | 0 |
| Hosting | Cloudflare Pages | Unlimited bandwidth on free tier, 500 builds/mo, allows commercial use, fast global edge. | 0 |
| Optional backend | Cloudflare Workers | Only if a server-side proxy is needed (e.g. RSS/news CORS). 100k req/day free. | 0 |
| Google APIs | Google Identity Services + `gapi.client` | Pure client-side OAuth, no backend required for read operations. Free for personal use. | 0 |
| Weather | Open-Meteo | No API key, no signup, free for non-commercial under 10k req/day. | 0 |
| News (if scoped in) | RSS feeds via a CORS proxy on Workers | Free, no API key, works for any RSS-publishing source. | 0 |
| Source control | GitHub free | Private repos, Actions free tier covers small projects. | 0 |
| Domain (optional) | `.pages.dev` subdomain (free) or buy a `.dev` domain | Free option works for MVP. | 0–60 PLN/yr |

**Total recurring monthly: ~80 PLN.** Leaves ~50 PLN/mo of headroom for emergencies or pay-as-you-go API top-ups when Pro limits hit.

### Why not these

- **Vercel:** Hobby plan disallows commercial use; you would have to upgrade the moment this stops being personal.
- **Firebase:** Hosting is fine but Firestore/Functions create real risk of surprise bills under traffic.
- **Netlify:** Credit-based billing in 2026 makes spend forecasting harder than Cloudflare's flat free tier.
- **Self-hosted backend (Render/Railway):** Cold starts, sleeping services, and trial-credit models hurt UX and add ops work you don't need for a personal dashboard.

---

## 3. App architecture

### 3.1 High level

Single-page React app, fully static, deployed to Cloudflare Pages. Most state is local. Google APIs are called from the browser using OAuth 2.0 with the Google Identity Services token model. No server in MVP unless news RSS needs a CORS proxy.

```
[ Browser SPA ]
  ├── localStorage  (tiles, layout, todos, settings)
  ├── Google APIs   (Calendar, Drive, Tasks)          via gapi.client / REST
  ├── Open-Meteo    (weather)                         direct fetch
  └── RSS proxy     (news, optional)                  Cloudflare Worker
```

If/when server functionality is needed, start with one small Cloudflare Worker. For MVP this is only likely for RSS/news fetching.

### 3.2 Tile model

Each tile is a typed object:

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

Layout uses `react-grid-layout` for drag/resize (responsive — separate breakpoints for mobile and desktop).

### 3.3 Auth model (Google)

- OAuth 2.0 token client from Google Identity Services (GIS).
- Scopes requested incrementally — only when a tile needs them. Calendar = read-only initially; Drive = narrowest feasible read scope; Tasks = read/write because Google Tasks is the chosen todo provider.
- Tokens kept in memory + sessionStorage. No refresh token in browser; user re-consents on session restart (acceptable for a personal app, also avoids the "External + Testing 7-day refresh expiry" trap).
- If long-lived refresh becomes necessary later, move token exchange to a Worker.

### 3.4 Google setup plan

You do not have a Google Cloud project yet, so Google integration gets its own setup phase.

1. Create a Google Cloud project for the dashboard.
2. Enable these APIs in the project:
   - Google Calendar API
   - Google Drive API
   - Google Tasks API
3. Configure the OAuth consent screen:
   - User type: External if users are normal Gmail accounts.
   - Publishing status: Testing during MVP.
   - Test users: add your account, your grandpa's account, and any early user accounts.
4. Create OAuth client credentials:
   - Application type: Web application.
   - Authorized JavaScript origins:
     - `http://localhost:5173`
     - later, the Cloudflare Pages URL
   - Authorized redirect URIs are not required for the GIS popup token flow unless the implementation changes.
5. Store the client ID in a public frontend env var such as `VITE_GOOGLE_CLIENT_ID`.
6. In the app, request scopes only when opening/connecting a tile:
   - Calendar tile: `https://www.googleapis.com/auth/calendar.events.readonly` or `https://www.googleapis.com/auth/calendar.readonly`
   - Tasks tile: `https://www.googleapis.com/auth/tasks`
   - Drive tile: prefer the narrowest useful Drive scope; avoid broad restricted scopes unless the feature truly needs them.
7. Test on desktop and phone before adding more Google tiles.

References to check during implementation:
- Google Identity Services token model: https://developers.google.com/identity/oauth2/web/guides/use-token-model
- Calendar API scopes: https://developers.google.com/workspace/calendar/api/auth
- Drive API scopes: https://developers.google.com/drive/api/guides/api-specific-auth
- Google Tasks API: https://developers.google.com/workspace/tasks/reference/rest

### 3.5 Calculator

In-house React component. Two modes: basic and scientific (toggle). State is local. No deps beyond `mathjs` if you want safe expression evaluation. Trivial — leave for the agent.

### 3.6 Todo

MVP provider is Google Tasks. The UI should still tolerate being signed out: show a connect state, then load task lists after consent. Do not build Todoist, Microsoft To Do, or a local provider unless a later product decision requires it.

### 3.7 Weather

Open-Meteo `forecast` endpoint, daily + current. Support both browser geolocation and saved locations. The default flow asks for geolocation, but the user can always save a city/coordinate manually. Cache the last response in `localStorage` and refresh at most every 30 minutes unless the user explicitly refreshes.

### 3.8 News (if scoped)

User adds RSS feed URLs in tile config. Worker proxy fetches the feed, returns parsed JSON. Display title + link + published date. No persistence beyond the feed URL list. **Open question:** which sources, how many, do they need filtering/keywords?

---

## 4. Repo layout

```
dashboard/
├── .codex/
│   ├── project.md           # Codex project memory and working rules
│   ├── prompts/             # reusable task prompts
│   │   ├── plan.md
│   │   ├── implement.md
│   │   ├── review.md
│   │   └── debug.md
│   └── checklists/
│       ├── phase-0.md
│       └── pre-commit.md
├── AGENTS.md                # short repo-level instructions for Codex-style agents
├── .claude/                 # optional only if you also use Claude Code
│   ├── CLAUDE.md            # project memory for Claude Code
│   ├── commands/            # custom slash commands
│   │   ├── plan.md
│   │   ├── implement.md
│   │   ├── review.md
│   │   └── debug.md
│   └── settings.local.json  # auto-approved tools per-project
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DECISIONS.md         # ADR-style, one entry per decision
│   ├── BACKLOG.md           # prioritized work items
│   └── CLIENT-QUESTIONS.md  # open items to clarify
├── src/
│   ├── tiles/               # one folder per tile kind
│   ├── lib/
│   │   ├── google/
│   │   ├── weather/
│   │   └── store/
│   ├── ui/                  # shared UI primitives
│   ├── App.tsx
│   └── main.tsx
├── workers/                 # Cloudflare Workers (only if needed)
│   └── rss-proxy/
├── tests/
├── package.json
└── vite.config.ts
```

---

## 5. Agentic workflow setup — `.codex/` starter

Use `.codex/` as your project-local home for Codex workflow notes, reusable prompts, and checklists. Keep the automatic instructions short in `AGENTS.md`; keep longer workflow material in `.codex/`. Stale instructions are worse than no instructions.

### 5.1 `AGENTS.md` starter

```md
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
```

### 5.2 `.codex/project.md` starter

```md
# Project: Personal / Family Dashboard

## What this is
A browser-based tile dashboard for personal, family, and later other-user use. React + Vite + TS + Tailwind. Deployed to Cloudflare Pages. Mostly client-side; one optional Worker for RSS/news proxy.

## Non-negotiables
- Must work on mobile (test 375px width).
- Must work well on desktop too; design responsive behavior from the first implementation.
- Google integration uses Google Identity Services (GIS) token client, not legacy gapi auth.
- MVP includes Google Calendar, Google Drive recents, and Google Tasks.
- MVP excludes Gmail and summarize/article URL features.
- No new dependencies without an entry in docs/DECISIONS.md.
- No backend secrets ever committed. Workers use wrangler secrets.

## Conventions
- TypeScript strict mode on. No `any`.
- Components: function components + hooks. No class components.
- State: Zustand for global, useState for local. No Redux.
- Styling: Tailwind utility classes. No CSS modules, no styled-components.
- File names: kebab-case for files, PascalCase for components.
- One tile kind per folder under src/tiles/.

## Commands
- `npm run dev` — local dev server
- `npm test` — vitest
- `npm run build` — production build
- `npm run lint` — eslint + tsc --noEmit

## What to do before editing
1. Read docs/ARCHITECTURE.md if touching layout, auth, or storage.
2. If adding a tile, follow `.codex/prompts/implement.md`.
3. If unsure, ask one clarifying question instead of guessing.

## What to do at end of every session
- Update docs/BACKLOG.md if new work surfaced.
- Add an ADR to docs/DECISIONS.md if a non-trivial decision was made.
- Run `npm run lint && npm test` before declaring done.

## Known constraints
- Work in 60–90 minute focused blocks.
- Don't run `wrangler deploy` from the agent. Deploys happen manually.
```

### 5.3 Reusable prompts (in `.codex/prompts/`)

**`plan.md`:**
```md
You are in planning mode. Do not write code yet.
Given the task: $ARGUMENTS

1. Restate the task in your own words.
2. List the files you would touch.
3. List open questions and assumptions.
4. Sketch the minimal change. Bullet list of steps.
5. Estimate effort: S/M/L.
6. Stop and wait for me to approve before implementing.
```

**`implement.md`:**
```md
Implement the approved plan for: $ARGUMENTS
- Make the smallest correct change.
- Update tests in the same commit.
- Run `npm run lint && npm test` and report results.
- Do not introduce new top-level dependencies without asking.
- Update docs/BACKLOG.md if you discover follow-up work.
```

**`review.md`:**
```md
Review the current uncommitted diff.
- Flag anything that violates conventions in AGENTS.md or .codex/project.md.
- Flag missing tests for new behavior.
- Flag dead code or commented-out blocks.
- Suggest concrete fixes, not vague concerns.
```

**`debug.md`:**
```md
Reproduce the bug: $ARGUMENTS
- State the smallest reproduction.
- Form one hypothesis and test it before forming the next.
- Do not change unrelated code while debugging.
- When fixed, add a regression test.
```

### 5.4 `.codex/checklists/phase-0.md`

```md
# Phase 0 Checklist

- [ ] Decide root app vs. subfolder.
- [ ] Scaffold Vite React TypeScript app.
- [ ] Install Tailwind, Vitest, Zustand, react-grid-layout.
- [ ] Create `AGENTS.md`.
- [ ] Create `.codex/project.md`.
- [ ] Create `.codex/prompts/`.
- [ ] Create `docs/ARCHITECTURE.md`.
- [ ] Create `docs/DECISIONS.md`.
- [ ] Create `docs/BACKLOG.md`.
- [ ] Create `docs/CLIENT-QUESTIONS.md`.
- [ ] Run local dev server.
- [ ] Check phone-width and desktop-width layouts.
```

### 5.5 `.codex/checklists/pre-commit.md`

```md
# Pre-Commit Checklist

- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] UI checked at phone width and desktop width if UI changed.
- [ ] `docs/BACKLOG.md` updated if new follow-up work appeared.
- [ ] `docs/DECISIONS.md` updated if a dependency or architecture decision changed.
- [ ] No secrets or `.env` files committed.
```

### 5.6 Optional Claude Code folder

Only create `.claude/` if you also use Claude Code. Codex does not need it. If you do use Claude Code, mirror the important guidance from `AGENTS.md` and `.codex/project.md` into `.claude/CLAUDE.md`.

Optional `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(npm:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Read(*)",
      "Write(src/**)",
      "Write(tests/**)",
      "Write(docs/**)"
    ],
    "deny": [
      "Bash(rm:*)",
      "Bash(wrangler deploy:*)",
      "Bash(git push:*)",
      "Write(.env*)"
    ]
  }
}
```

### 5.7 Habits to adopt from day one

| Habit | Why |
|---|---|
| Always plan before implementation | Catches misunderstandings while they're cheap. |
| One feature = one branch = one PR | Forces atomic, reviewable diffs. |
| Commit messages written by you, not the agent | Forces you to internalize what changed. |
| Run the review prompt before every commit | Cheap second pass catches sloppy diffs. |
| End each session with a 2-line note in `BACKLOG.md` | Future-you needs context; agent will read it next session. |
| Resist letting the agent install random deps | Every dep is debt. ADR or it didn't happen. |

---

## 6. Phased roadmap

Each phase is sized for one focused agentic work session (≈60–90 min focused work, room for retries). If a phase blows past one session, split it.

### Phase 0 — Foundation decision + scaffold (1 session)
- Confirm you are ready to create the app in this repo. If yes: `npm create vite . -- --template react-ts` or create a `dashboard/` subfolder if you want to keep planning separate.
- Tailwind, ESLint, Prettier, Vitest.
- Write the `AGENTS.md` and `.codex/` files above.
- Create `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/BACKLOG.md`, and `docs/CLIENT-QUESTIONS.md`.
- Push to GitHub when the local app runs.
- **Done when:** the empty app runs locally on phone-size and desktop-size viewports.

### Phase 1 — Responsive shell + tile grid (1–2 sessions)
- `react-grid-layout` with mobile + desktop breakpoints.
- App shell with tile grid as the first screen; no landing page.
- Tile container component + tile registry pattern.
- Add/remove/reorder tiles. Persist layout in `localStorage`.
- One placeholder "launcher" tile that opens a URL.
- **Done when:** you can drag tiles on desktop and tap them on phone.

### Phase 2 — Launcher + calculator (1 session)
- Build the simple useful tiles before Google auth.
- Launcher tile supports label, URL, and optional icon.
- Calculator supports basic mode first; scientific mode can be Phase 8 polish unless you strongly want it earlier.
- **Done when:** both tiles work on phone and desktop and survive a refresh.

### Phase 3 — Weather (½ session)
- Open-Meteo fetch, `lat/lon` from tile config or browser geolocation.
- Saved location fallback plus manual location editing.
- Cache last response in `localStorage` for offline-ish behavior.
- **Done when:** weather tile shows current + 3-day forecast.

### Phase 4 — Google Cloud setup + auth foundation (2 sessions)
- Follow §3.4 to create the Google Cloud project, enable APIs, configure consent, add test users, and create a Web OAuth client.
- Integrate GIS token client. Handle scope-incremental requests.
- One end-to-end demo: list next 3 calendar events.
- **Done when:** sign-in works on mobile + desktop and a Calendar tile renders real events.

### Phase 5 — Google Tasks todo (1–2 sessions)
- Connect Google Tasks.
- Show task lists, active tasks, completed tasks, add/edit/complete/delete.
- Keep interactions simple and grandpa-friendly.
- **Done when:** tasks sync with Google Tasks and signed-out/offline states are clear.

### Phase 6 — Google Drive recents (1 session)
- Drive tile shows recent files or, if scope choice requires it, files selected/allowed by the user.
- Open files in Google Drive.
- **Done when:** recent/allowed files render and unauth'd/error states are clear.

### Phase 7 — News, if scoped (1 session)
- RSS proxy worker if direct feed fetches are blocked by CORS.
- Tile that lists items with title, source, date, and link.
- **Blocked on source clarification** (see CLIENT-QUESTIONS.md).

### Phase 8 — Polish (1–2 sessions)
- Loading states, error states, empty states for every tile.
- Keyboard shortcuts on desktop.
- PWA manifest + icon so it can be installed on phone home screen.
- Lighthouse pass: aim for 90+ on Performance and Accessibility.

**Total: 8–11 working sessions.** Realistic calendar time at 3 sessions/week: ~3–4 weeks to a polished MVP.

---

## 7. Session and downtime planning

### 7.1 Agentic workflow reality
Agentic coding work has practical limits even when the tools are good: context gets large, prompts get stale, and long sessions drift. Treat 60–90 minutes as the default productive block.

**Burn rate** depends on:
- How much code is in context (large files = expensive).
- Whether extended thinking is on (output tokens cost ~5× input tokens).
- How chatty your prompts are (each turn replays the whole thread).

### 7.2 Session structure that actually works

| Phase of session | Duration | What you do |
|---|---|---|
| Pre-flight (offline) | 5–10 min | Read yesterday's BACKLOG note. Open the issue. Decide today's *one* outcome. |
| Plan round | 10–15 min | Agent plans. You critique. No code yet. |
| Implement round 1 | 20–30 min | Agent writes. You read every diff. |
| Manual verification | 10–15 min | You run it on your phone. Note what's off. |
| Implement round 2 (fix) | 15–20 min | Tighten. Add tests. |
| Wrap (offline) | 5 min | Commit. Update BACKLOG.md. Push. |

A focused session is ~75–90 minutes. **Stop when the outcome is met**, even if you have token budget left. Saved tokens are tomorrow's progress.

### 7.3 Forced-downtime workflow

When you hit the rolling cap mid-session:
1. Commit whatever works. WIP commits are fine on a feature branch.
2. Switch to **non-AI tasks** that progress the project:
   - Manual testing on your actual phone, not the dev server.
   - Reading docs (Google API references, Cloudflare Workers).
   - Writing/sharpening BACKLOG.md and CLIENT-QUESTIONS.md.
   - Sketching the next tile's UX on paper.
   - Reviewing your own diffs without the agent.
3. Do **not** start a new feature manually just because you're frustrated. Manual context will conflict with the agent's mental model in the next session.

### 7.4 Context budget hygiene

| Practice | Why |
|---|---|
| Start a fresh thread between unrelated tasks | Prevents old context from muddying the next task. |
| Keep `AGENTS.md` short | It should be high-signal project guidance, not a second spec. |
| Drop large files from context once you're done with them | Read once, then move on or start a fresh thread. |
| Disable extended thinking for trivial tasks | Output tokens dominate; thinking is output. |
| Prefer many small PRs over one big refactor | Smaller diffs = smaller context = cheaper turns. |
| Avoid multi-agent work until the app is real | It multiplies context and coordination before the project needs it. |

### 7.5 If the workflow feels too slow

Honest signs the workflow needs tightening:
- You end sessions without a working checkpoint more than half the time.
- You consistently lose >30 min/week to re-explaining context.
- The agent changes files outside the feature area too often.

Order of operations to fix it:
1. Tighten `.codex/project.md`, `AGENTS.md`, and `docs/BACKLOG.md`.
2. Split tasks smaller. One tile or one behavior at a time.
3. Add checklists when repeated mistakes appear.
4. Only consider extra paid tooling after the workflow itself is clean.

---

## 8. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Google OAuth verification rejects external app | Medium | Keep app in **Testing** mode with yourself, your grandpa, and early users as test users. Don't publish until you have to. |
| Refresh tokens expire after 7 days in Testing | High | Accept it for MVP. Re-consent on each session is fine for a personal tool. Move to Worker-stored refresh tokens later. |
| Google Tasks adds auth/setup friction | Medium | Build launcher/calculator/weather first so the app is useful before OAuth is finished. |
| Open-Meteo rate limit (10k/day) | Low | Cache aggressively in localStorage; refresh at most every 30 min. |
| Cloudflare Pages free tier limit changes | Low | Project is portable. Static SPA can move to Netlify/GitHub Pages in an afternoon. |
| AI tool pricing or limits change | Medium | Keep the workflow portable: short docs, small tasks, and no tool-specific assumptions in app code. |
| Surprise scope creep ("just one more tile") | High | Tile registry pattern: every new tile is a contained, optional module. Backlog new ones; don't merge until MVP ships. |
| Agent introduces a dependency you don't understand | High | Hard rule in `AGENTS.md`: no new deps without an ADR. |

---

## 9. Open questions

Track these in `docs/CLIENT-QUESTIONS.md`. Some are product questions for you; some can later be asked to your grandpa or early users.

1. Where should the app be created: directly in this repo root, or inside a `dashboard/` subfolder?
2. News scope — which sources? RSS only or specific publishers? Filter by keyword or all items?
3. Calendar scope — primary calendar only, or all calendars including shared?
4. Drive scope — recent files globally, a chosen folder, or files selected by the user?
5. Multi-account support? Significant complexity; MVP should ideally be one signed-in Google account at a time.
6. Where will this be hosted long-term — your domain, or a `.pages.dev` URL acceptable?
7. Should dashboard layout/settings sync across devices? MVP should be per-device local settings; sync requires a backend.
8. What visual style should this have: calm/simple family dashboard, power-user dashboard, or something more playful?

---

## 10. Definition of "MVP done"

- Loads on phone and desktop, works offline-ish where possible (cached weather, clear Google reconnect states).
- Tiles for: launcher (× N), calculator, weather, Google Calendar, Google Tasks todo, Google Drive recents, optional news if scoped.
- Sign-in works, scope requests are minimal and incremental.
- Lighthouse: Performance ≥ 85, Accessibility ≥ 90 on mobile.
- All of `docs/CLIENT-QUESTIONS.md` is either answered or explicitly deferred.
- README explains how to run, deploy, and add a new tile.

---

## 11. First-day checklist

Do these in order, in one session:

1. Decide whether the app lives in repo root or a `dashboard/` subfolder.
2. Create GitHub repo if this repo is not already backed by GitHub.
3. Create the app with Vite + React + TypeScript.
4. Install Tailwind, ESLint, Prettier, Vitest, Zustand, react-grid-layout.
5. Create `AGENTS.md`, `.codex/project.md`, `.codex/prompts/`, and `.codex/checklists/` from §5 above.
6. Create `docs/ARCHITECTURE.md` (paste §3), `docs/DECISIONS.md` (empty with template), `docs/BACKLOG.md` (paste §6 phase list), `docs/CLIENT-QUESTIONS.md` (paste §9).
7. Run the local dev server.
8. Open the local app in phone and desktop viewport sizes. Confirm it loads.
9. Commit, push.
10. Create Cloudflare Pages project from the repo after the first push. Trigger first deploy.
11. Stop. Write a 2-line BACKLOG note for tomorrow.

You're ready. Phase 1 starts next session.

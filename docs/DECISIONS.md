# Decisions

Use this file for small ADR-style notes. Add one entry whenever a dependency, architecture choice, or important product decision changes.

## Template

```md
## YYYY-MM-DD - Decision title

### Status
Accepted

### Context
What problem or constraint led to this decision?

### Decision
What did we choose?

### Consequences
What tradeoffs does this create?
```

## 2026-05-06 - Use npm for project commands

### Status
Accepted

### Context
The originally suggested alternative package manager does not currently run in the user's terminal.

### Decision
Use `npm` commands in project docs, agent instructions, and scripts.

### Consequences
The project is easier to run locally right now. If the package manager changes later, update all workflow docs in one pass.

## 2026-05-06 - Use Vite 6 and Vitest 3 together

### Status
Accepted

### Context
The first verification pass found mismatched Vite/Vitest type trees.

### Decision
Use Vite 6 with Vitest 3 so the config, tests, and build share compatible Vite types.

### Consequences
The foundation verifies cleanly with `npm run lint`, `npm test -- --run`, and `npm run build`.

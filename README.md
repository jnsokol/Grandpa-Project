# Grandpa-Project

Personal / family dashboard app.

## Workflow Rule

After making changes, the agent should:

1. Check `git status`.
2. Run feasible verification commands.
3. Commit the completed changes with a clear message.
4. Push the current branch to GitHub.

If commit or push is blocked by GitHub auth, missing remote, conflicts, or failing checks, the agent should stop and report the exact blocker.

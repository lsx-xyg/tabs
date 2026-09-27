# Tabs — Agent Workspace

Cross-device bookmark navigation app (Vue 3 + TypeScript SPA). Bookmarks are persisted in Neon Postgres and synced per account; auth via Better Auth; all database access is proxied through Vercel Serverless Functions (the frontend never holds a connection string).

## Agent skills

### Issue tracker

Issues, specs and tickets live as GitHub issues in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles map to the default label strings. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: one `CONTEXT.md` at the repo root plus `docs/adr/`. See `docs/agents/domain.md`.

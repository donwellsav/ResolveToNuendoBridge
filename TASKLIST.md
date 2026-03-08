# TASKLIST — Conform Bridge

## Phase 1 (Scaffold)
- [x] Initialize Next.js App Router + TypeScript + Tailwind scaffold.
- [x] Build desktop-first app shell with sidebar and top bar.
- [x] Add routes: Dashboard, New Job, Jobs, Templates, Field Recorder, ReConform, Settings.
- [x] Define domain model in `lib/types.ts`.
- [x] Provide realistic mock workflow data in `lib/mock-data.ts`.
- [x] Build dense placeholder layouts with reusable table-oriented components.
- [x] Keep import/export service interfaces as stubs only.
- [x] Keep rendering deterministic and SSR-safe.
- [x] Keep scope frontend-only (no backend/auth/billing/db/marketing).

## Deferred to Phase 2+
- [ ] Real Resolve bundle parsing + validation engine.
- [ ] Real Nuendo export artifact writer.
- [ ] Interactive job creation with file intake UX.
- [ ] Persistent storage strategy.
- [ ] ReConform diff and merge execution logic.

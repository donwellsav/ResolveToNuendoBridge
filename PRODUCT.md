# Conform Bridge — Product Overview (Phase 1 Scaffold)

## Goal
Conform Bridge is a desktop-first internal operator application for Resolve -> Nuendo translation workflows.

Phase 1 is scaffold-only: deterministic UI, realistic domain mock data, and integration-ready interfaces without real parser/export execution.

## Scope
### Included
- Next.js App Router scaffold with TypeScript + Tailwind + shadcn/ui-style components.
- Operator shell (sidebar + top bar) and workflow routes:
  - Dashboard
  - New Job
  - Jobs
  - Templates
  - Field Recorder
  - ReConform
  - Settings
- Domain contracts and realistic mock data for translation workflow modeling.
- Stub interfaces for importer/exporter/persistence.

### Explicitly Excluded
- Real Resolve file parsing.
- Real Nuendo export writing.
- Auth, billing, database, and marketing/public pages.

## UX Direction
- Dark, technical, restrained visual system.
- Desktop-first information density.
- Structured tables, metadata, and operator-focused placeholders.

## Technical Constraints
- Deterministic SSR-safe rendering only.
- No browser-only APIs during initial render.
- No render-time randomness (`Math.random`, `Date.now`, UUID generation in render path).
- Reusable components over page-specific one-offs.

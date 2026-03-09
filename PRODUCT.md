# Conform Bridge — Product Contract (Phase 1/2)

## Product Intent
Conform Bridge is an internal, desktop-first operator tool for translating **Resolve editorial bundles** into a **Nuendo-ready handoff bundle**.

Phase 1 is intentionally frontend-only and contract-first:
- lock product terminology
- lock data model expectations
- lock bundle artifact contract
- scaffold operator routes with deterministic SSR-safe rendering

## In Scope (Current State)
- Next.js App Router application shell using TypeScript, Tailwind CSS, and reusable shadcn/ui-style primitives.
- Operator workflow routes:
  - Dashboard
  - Jobs
  - New Job
  - Templates
  - Field Recorder
  - ReConform
  - Settings
- Typed canonical internal model for translation workflow entities.
- Realistic, static mock data for Resolve -> Nuendo workflows.
- Importer now performs real intake for CSV/manifest/EDL/FCPXML plus binary/container-aware AAF extraction with reconciliation into the canonical model.
- Exporter remains planning-only (no Nuendo file writing yet).

## Out of Scope (Current State)
- Nuendo project writing / binary file generation.
- Full-fidelity AAF semantic decode beyond the current binary/container extraction subset and normalized adapter contract.
- Auth, billing, database persistence, and marketing/public pages.

## Primary Workflow Contract
1. Resolve exports (bundle artifacts) are ingested.
2. Data is normalized into a canonical internal model.
3. A Nuendo-ready outbound bundle is assembled.

Parser execution is now partially real (CSV/manifest/EDL/FCPXML plus binary/container-aware AAF ingestion + reconciliation). Export execution remains planning-only (Nuendo writing still unimplemented) so phase 2 can continue without reshaping the operator shell.

## UX Direction
- Desktop-first internal operations console.
- Serious post-production visual tone (dark, technical, restrained accents).
- Dense but readable information design.
- Emphasis on tables, badges, structured metadata blocks, and review surfaces.

## Rendering & Engineering Constraints
- Deterministic SSR-safe rendering.
- No browser-only APIs during initial render (`window`, `document`, `localStorage`, etc.).
- No render-time nondeterminism (`Date.now`, dynamic `new Date()`, `Math.random`, UUID generation).
- Prefer reusable components over page-specific one-offs.

## Acceptance Criteria (Phase 1)
- All required operator routes scaffolded and navigable in app shell.
- Domain model includes all entities listed in `SCHEMA.md`.
- Bundle artifact contract documented in `BUNDLE_SPEC.md` and represented in mock data.
- Importer performs structured intake and canonical hydration, including AAF enrichment/reconciliation when present.
- Exporter plans delivery artifacts only; writing remains intentionally unimplemented.

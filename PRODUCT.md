# Conform Bridge — Product Contract (Phase 2 Baseline)

## Product Intent
Conform Bridge is an internal, desktop-first operator tool for translating **Resolve editorial bundles** into a **Nuendo-ready handoff bundle**.

## Current Status
- Phase 1 contract lock + operator shell is complete.
- Phase 2A–2J implementation is complete.
- Current implementation includes persisted browser-local operator review deltas and reconform-ready review tooling.
- Next implementation target is **Phase 2K** (reduce remaining AAF adapter fallback dependence).
- Phase 3 delivery execution starts only after planning/review stability is achieved.

## Primary Workflow Contract
1. **SourceBundle / intake** ingests Resolve turnover artifacts.
2. **TranslationModel / canonical** hydrates normalized timeline, mapping workspace, and preservation diagnostics.
3. **DeliveryPackage / delivery** plans Nuendo-ready artifact output deterministically.

## In Scope (Current State)
- Next.js App Router shell using TypeScript, Tailwind CSS, and reusable shadcn/ui-style primitives.
- Operator workflow routes: Dashboard, Jobs, New Job, Templates, Field Recorder, ReConform, Settings.
- Typed canonical model spanning intake, canonical translation, mapping workspace, preservation issues, and delivery planning.
- Real intake parsing for manifest + metadata CSV + marker CSV/EDL + FCPXML/XML + direct in-repo AAF extraction/parsing.
- Importer precedence for timeline hydration:
  1. `fcpxml` / `xml`
  2. `aaf`
  3. `edl`
  4. metadata-only fallback
- AAF reconciliation/enrichment against canonical timeline, including explicit fallback diagnostics.
- Mapping/editor workflow for track/marker/metadata/field-recorder decisions.
- Browser-local persisted review-state overlays for operator deltas (mapping overrides, validation acknowledgements, reconform decisions) keyed by job and intake source signature.
- Validation workflow surfacing `PreservationIssue` summaries and unresolved mapping counts, including acknowledgement state.
- Delivery planner that consumes canonical + mapping decisions and produces artifact readiness statuses.

## Out of Scope (Current State)
- Nuendo project writing / binary file generation.
- Backend persistence services (state remains browser-local in this phase).
- Eliminating all AAF adapter fallback paths in this phase.
- Auth, billing, database-backed multi-user infrastructure, and marketing/public pages.

## Known Limitations
- Export execution remains planner-only (Nuendo writing intentionally unimplemented).
- AAF direct parser coverage is broad but not full-fidelity for all interchange variants.
- Adapter sidecar compatibility fallback still appears in some AAF edge cases.

## Next Recommended Work
1. **Phase 2K**: reduce compatibility fallback dependence by extending direct AAF extraction/traversal coverage.
2. Continue deterministic canonical normalization and warning taxonomy hardening.
3. Begin Phase 3 delivery execution prep only when planner/review behavior remains stable.

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

## Acceptance Criteria (Current Baseline)
- Operator routes are navigable in the app shell.
- Domain model remains aligned with `SCHEMA.md`.
- Bundle artifact contract remains aligned with `BUNDLE_SPEC.md`.
- Importer executes precedence-based intake/canonical hydration with explicit diagnostics.
- Exporter produces deterministic planning results only (no Nuendo writing yet).

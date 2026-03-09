# Conform Bridge — Product Contract (Phase 3B Baseline)

## Product Intent
Conform Bridge is an internal, desktop-first operator tool for translating **Resolve editorial bundles** into a **Nuendo-ready handoff bundle**.

## Current Status
- Phase 1 contract lock + operator shell is complete.
- Phase 2A–2J implementation is complete.
- Current implementation includes persisted browser-local operator review deltas and reconform-ready review tooling.
- Phase 2K fallback-reduction work is complete.
- Current implementation target is **Phase 3C** deferred writer-input contract hardening (planner + execution-prep + staging remain separate from writer implementation).

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
- AAF reconciliation/enrichment against canonical timeline, including explicit fallback diagnostics and richer mismatch taxonomy.
- Mapping/editor workflow for track/marker/metadata/field-recorder decisions.
- Browser-local persisted review-state overlays for operator deltas (mapping overrides, validation acknowledgements, reconform decisions) keyed by job and intake source signature.
- Validation workflow surfacing `PreservationIssue` summaries and unresolved mapping counts, including acknowledgement state.
- Delivery planner that consumes canonical + mapping decisions and produces artifact readiness statuses.
- Delivery execution-prep boundary that converts planned artifacts into deterministic serialized payloads for safe text/CSV/JSON outputs and marks binary writer-only artifacts as deferred.
- Delivery staging boundary that materializes deterministic staged bundle layout with generated payload files, explicit deferred descriptor files, and staging-summary output.

## Out of Scope (Current State)
- Nuendo project/session writing / binary file generation (still deferred past 3B).
- Backend persistence services (state remains browser-local in this phase).
- Eliminating all AAF adapter fallback paths in this phase.
- Auth, billing, database-backed multi-user infrastructure, and marketing/public pages.

## Known Limitations
- Export execution includes deterministic prep payload generation for non-binary artifacts and deterministic staged bundle materialization (`staging/<job>_<sequence>/manifest.json`, `README_NUENDO_IMPORT.txt`, markers/metadata/reports files, deferred descriptors, staging-summary.json); Nuendo/binary writing remains intentionally unimplemented.
- AAF direct parser coverage now includes broader record/token aliases and clip-bearing graph extraction from messier OLE/text layouts.
- Adapter sidecar compatibility fallback still appears in partial/unsupported AAF graph shapes and remains intentionally enabled.

## Next Recommended Work
1. **Post-2K**: continue reducing compatibility fallback dependence by extending direct OLE stream/object graph decoding coverage.
2. Continue deterministic canonical normalization and warning taxonomy hardening.
3. Phase 3C: harden deferred writer-input contracts + handoff/readiness manifests (without implementing binary writer outputs).
4. Phase 3D: implement binary writer/orchestration against the handoff contract (without collapsing planner/execution-prep responsibilities).

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
- Exporter remains planning-only and deterministic (no Nuendo writing yet).
- Execution-prep layer deterministically generates payloads for manifest, README, marker CSV/EDL, metadata CSV, and field-recorder report.
- Staging layer deterministically materializes generated payload files + deferred descriptor files + staging summary files.
- AAF/reference-video/native Nuendo writer outputs remain deferred records behind future writer boundary (now with versioned writer-input contracts and readiness states).

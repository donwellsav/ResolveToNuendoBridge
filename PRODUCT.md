# Conform Bridge — Product Contract (Phase 3I Baseline)

## Product Intent
Conform Bridge is an internal, desktop-first operator tool for translating **Resolve editorial bundles** into a **Nuendo-ready handoff bundle**.

## Current Status
- Phase 1 contract lock + operator shell is complete.
- Phase 2A–2J implementation is complete.
- Current implementation includes persisted browser-local operator review deltas and reconform-ready review tooling.
- Phase 2K fallback-reduction work is complete.
- Current implementation baseline is **Phase 3I** filesystem transport interoperability + receipt compatibility normalization/matching on top of writer transport/audit contracts (planner + execution-prep + staging + handoff + packaging + adapter + runner + transport/audit + receipt compatibility remain separate).

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
- Delivery handoff boundary that formalizes versioned deferred-writer input contracts, dependency/readiness validation, and deterministic handoff manifests without generating native binaries.
- Writer adapter boundary that normalizes external-execution package + handoff contracts into stable adapter input, supports adapter validation/dry-run, and reports capability matching/readiness/unsupported reasons without writing native binaries.
- Writer runner boundary that consumes package + handoff + adapter dry-run output to emit deterministic writer-run requests, normalized responses, and receipts/history using a reference no-op runner.
- Writer transport/audit boundary that consumes writer-run requests/responses/receipts to emit deterministic transport envelopes, dispatch records, acknowledgements, audit event logs, and attempt history for external executor handoff visibility.

## Out of Scope (Current State)
- Nuendo project/session writing / binary file generation (still deferred; Phase 3I deepens external filesystem handoff compatibility only).
- Backend persistence services (state remains browser-local in this phase).
- Eliminating all AAF adapter fallback paths in this phase.
- Auth, billing, database-backed multi-user infrastructure, and marketing/public pages.

## Known Limitations
- Export execution includes deterministic prep payload generation for non-binary artifacts and deterministic staged bundle materialization (`staging/<job>_<sequence>/manifest.json`, `README_NUENDO_IMPORT.txt`, markers/metadata/reports files, deferred descriptors, staging-summary.json); Nuendo/binary writing remains intentionally unimplemented.
- AAF direct parser coverage now includes broader record/token aliases and clip-bearing graph extraction from messier OLE/text layouts.
- Adapter sidecar compatibility fallback still appears in partial/unsupported AAF graph shapes and remains intentionally enabled.

## Next Recommended Work
1. **Phase 3J**: implement native writer/orchestration execution behind existing package -> adapter -> runner -> transport boundaries.
2. Keep planner/execution-prep/staging/handoff/package/adapter/runner/transport/receipt-compatibility responsibilities separated.
3. Continue reducing remaining AAF compatibility fallback dependence in intake while preserving deterministic canonical behavior.
4. Preserve deterministic receipt normalization and warning taxonomy as new transport profiles are introduced.


## Phase 3I Operator Visibility
- Dispatch now declares compatibility expectations for inbound receipts.
- Job transport view surfaces profile/version, match/validation status, and drift/problem reasons.
- Audit/history include partial, superseded, and incompatible receipt transitions in deterministic order.

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


## Phase 3D Baseline
- Add deterministic external execution packaging boundary after staging + handoff.
- Package includes staged generated payloads, deferred contract descriptors, and handoff manifests with checksums/index/summary files.
- Package readiness states: `ready`, `partial`, `blocked` based on staged prerequisites, handoff readiness, preservation blockers, and deferred dependencies.
- Native Nuendo/session writing remains intentionally unimplemented.


## Phase 3H Baseline
- Writer-runner requests include deterministic IDs, versioning, artifact linkage, source/review signatures, package readiness, dependency references, and blocked/unsupported reasoning.
- Runner responses are normalized as `simulated`, `partial`, `blocked`, or `unsupported`; reference runner is explicit no-op only.
- Receipts summarize runnable vs blocked vs unsupported outcomes and preserve adapter match + dry-run plan context at run time.
- Transport envelopes include deterministic transport IDs/correlation IDs, explicit dispatch statuses, package/signature linkage, retry/cancel/timeout/stale state, and machine-readable failures.
- Audit log/history capture status transitions and human-readable explanations separately from runner receipts.


## Phase 3I Baseline
- Receipt compatibility profiles are explicit (`canonical-filesystem-transport-v1`, `compatibility-filesystem-receipt-v1`, `future-service-transport-placeholder`) with required/optional fields and supported versions.
- Receipt normalization/migration is deterministic and isolated from transport dispatch.
- Receipt matching now evaluates correlation id, dispatch/transport id, package/source/review signatures, artifact identity, and adapter/runner path to classify matched/duplicate/stale/superseded/partial/incompatible/invalid states.
- Filesystem transport dispatch exports compatibility metadata and validates inbound receipts against declared profile expectations before ingesting outcomes.

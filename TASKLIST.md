# TASKLIST — Conform Bridge

## Current Phase Status
- ✅ Completed through **Phase 2J** (review-state persistence + reconform-ready review tooling landed).
- 🧭 Next phase is **2K** (reduce remaining AAF compatibility fallback dependence).
- 🗓️ Follow-on phase is **Phase 3** delivery execution once planning/review stability holds.
- 🗓️ **Phase 3** starts after planning/review stability is achieved.

## Phase 1 — Contract Lock + Frontend Operator Shell (Complete)
- [x] Lock product contract and scope boundaries in `PRODUCT.md`.
- [x] Lock canonical data contract in `SCHEMA.md`.
- [x] Lock bundle artifact contract in `BUNDLE_SPEC.md`.
- [x] Scaffold desktop-first operator shell with App Router navigation.
- [x] Scaffold routes: Dashboard, Jobs, New Job, Templates, Field Recorder, ReConform, Settings.
- [x] Implement typed models for all baseline entities.
- [x] Keep render deterministic and SSR-safe (no browser-only APIs in initial render path).
- [x] Use realistic Resolve -> Nuendo workflow fixtures/fallback data.
- [x] Exclude auth, billing, database, and marketing pages.

## Phase 2A–2I — Intake/Canonical/Planning + Mapping/Validation (Complete)
- [x] Implement intake scanning + classification for turnover assets.
- [x] Parse manifest + metadata CSV + marker CSV/EDL inputs.
- [x] Land FCPXML/XML timeline hydration.
- [x] Implement direct in-repo OLE/container AAF parsing + canonical reconciliation.
- [x] Keep explicit diagnostics when adapter compatibility fallback is required.
- [x] Maintain importer precedence (`fcpxml/xml` -> `aaf` -> `edl` -> metadata-only fallback).
- [x] Add operator mapping editors (track, marker, metadata, field recorder) and unresolved summaries.
- [x] Feed mapping workspace decisions into delivery planner.
- [x] Expand preservation/review issue taxonomy and dashboard/job-level visibility.
- [x] Add tests for importer/parser/planner/mapping integration paths.

## Phase 2J — Persisted Review State + Reconform Review (Complete)
- [x] Persist operator mapping/review decisions as browser-local review deltas keyed by job + intake signature.
- [x] Add reconform-ready review tooling depth (change triage, acknowledgement/risky state, unresolved filters).
- [x] Keep canonical/delivery contracts unchanged while persistence lands (no backend, no writer).

## Phase 2K — In Progress
- [x] Reduce remaining adapter-sidecar fallback dependence for AAF ingestion.
- [x] Extend direct parser coverage for edge AAF records that still require compatibility fallback.
- [x] Keep fallback diagnostics explicit while shrinking fallback frequency.
- [x] Add fixtures for broad direct parse, partial-direct/fallback classification, and missing-media/locator-heavy coverage.
- [x] Expand parser/importer/reconciliation tests for richer AAF mismatch and fallback diagnostics.

## Phase 3 — Delivery Execution (Planned)
- [ ] Implement deterministic canonical normalization pipeline end-to-end.
- [ ] Implement Nuendo-ready bundle writer for required artifact set.
- [ ] Add file intake execution controls/job orchestration UX around real services.
- [ ] Add persistence-backed operational state once service boundaries stabilize.

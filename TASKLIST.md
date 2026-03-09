# TASKLIST — Conform Bridge

## Current Phase Status
- ✅ Completed through **Phase 2J** (review-state persistence + reconform-ready review tooling landed).
- ✅ **Phase 2K** complete (AAF compatibility fallback dependence reduced).
- ✅ **Phase 3A** complete (execution prep boundary landed; planner still separate from writer).
- ✅ **Phase 3B** complete (staged delivery materialization landed; writer remains deferred).
- ✅ **Phase 3C** complete (deferred writer-input contract hardening + handoff readiness manifests landed).
- 🧭 Next phase is **Phase 3D** native writer/orchestration on top of handoff contracts.

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

## Phase 2K — Complete
- [x] Reduce remaining adapter-sidecar fallback dependence for AAF ingestion.
- [x] Extend direct parser coverage for edge AAF records that still require compatibility fallback.
- [x] Keep fallback diagnostics explicit while shrinking fallback frequency.
- [x] Add fixtures for broad direct parse, partial-direct/fallback classification, and missing-media/locator-heavy coverage.
- [x] Expand parser/importer/reconciliation tests for richer AAF mismatch and fallback diagnostics.

## Phase 3A — Delivery Execution Prep (Complete)
- [x] Add execution-prep service boundary after planner output.
- [x] Define generated payload contracts for manifest/readme/marker/metadata/field-recorder outputs plus deferred binary contracts.
- [x] Generate deterministic non-binary payload content from canonical + mapping/review state.
- [x] Keep exporter planning responsibilities unchanged and separate from execution prep.
- [x] Surface execution prep status/payload previews in job delivery view without redesigning core UI.
- [x] Add tests for deterministic output, deferred binary behavior, and review-overlay reflection.


## Phase 3B — Staged Delivery Materialization (Complete)
- [x] Add delivery-staging service boundary after execution prep.
- [x] Materialize deterministic staged bundle layout and file naming contract.
- [x] Stage generated manifest/README/marker/metadata/field-recorder outputs.
- [x] Stage explicit deferred descriptor JSON records for AAF/reference video artifacts (no fake binary contents).
- [x] Generate deterministic staging summary output including review influence + source signature.
- [x] Surface staged structure/previews/summary in job operator views without redesign.
- [x] Add tests for deterministic staging, generated payload writes, deferred descriptors, summary generation, and review-state overlays.

## Phase 3C — Deferred Writer Contract Hardening (Complete)
- [x] Add deferred-writer contract boundary and deterministic handoff service.
- [x] Define explicit versioned writer-input/handoff types with dependency/readiness status.
- [x] Generate handoff manifests (`deferred-writer-inputs.json`, `delivery-handoff-manifest.json`, `delivery-handoff-summary.json`).
- [x] Add readiness validation for missing/blocked dependencies and known writer gaps.
- [x] Capture handoff summary capability support + blocked artifact ids for explicit future writer orchestration inputs.
- [x] Surface handoff contracts/readiness in job/operator views without redesign.
- [x] Add deterministic contract/readiness/review-influence tests.

## Phase 3D — Native Writer/Orchestration (Planned)
- [ ] Implement Nuendo/session writer boundary for deferred AAF artifacts.
- [ ] Implement reference-video binary generation orchestration boundary.
- [ ] Add execution orchestration controls and persistence-backed execution-state tracking.

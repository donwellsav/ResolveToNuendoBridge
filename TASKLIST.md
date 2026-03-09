# TASKLIST — Conform Bridge

## Current Phase Status
- ✅ Completed through **Phase 2J** (review-state persistence + reconform-ready review tooling landed).
- ✅ **Phase 2K** complete (AAF compatibility fallback dependence reduced).
- ✅ **Phase 3A** complete (execution prep boundary landed; planner still separate from writer).
- ✅ **Phase 3B** complete (staged delivery materialization landed; writer remains deferred).
- ✅ **Phase 3C** complete (deferred writer-input contract hardening + handoff readiness manifests landed).
- ✅ **Phase 3D** complete (external execution packaging boundary landed).
- ✅ **Phase 3E** complete (writer-adapter interfaces + registry/capability matching + dry-run/readiness reporting on external-execution package outputs).
- ✅ **Phase 3F** complete (writer-runner request/response/receipt contracts + no-op runner landed).
- ✅ **Phase 3G** complete (transport envelopes + dispatch/audit/history contracts on top of writer-runner landed).
- ✅ **Phase 3H** complete (real filesystem transport adapter + deterministic receipt-ingestion flow landed).
🧭 Next phase is **Phase 3J** native writer orchestration execution before any backend queue/persistence.

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

## Phase 3D — External Execution Packaging (Complete)
- [x] Add external-execution package service boundary that consumes staging + handoff outputs.
- [x] Define deterministic versioned package manifest/index/checksum/deferred-input types.
- [x] Emit export-level package files (`external-execution-manifest.json`, `external-execution-index.json`, `external-execution-summary.json`, `checksums.json`, `deferred-writer-inputs.json`, `generated-artifact-index.json`).
- [x] Add package readiness evaluation (`ready`/`partial`/`blocked`) with explicit reasons.
- [x] Add disk materializer for deterministic package output layout.
- [x] Surface package status/contents/checksums in operator views without redesign.
- [x] Add deterministic packaging tests + staging/handoff consistency coverage.

## Phase 3E — Writer Adapter Interfaces (Complete)
- [x] Add writer-adapter service boundary that consumes external execution package outputs + deferred handoff contracts only.
- [x] Define explicit versioned writer-adapter input/capability/readiness/unsupported/dry-run types.
- [x] Normalize package/handoff/deferred contracts into deterministic adapter input shape.
- [x] Add reference/no-op adapter validation + dry-run behavior without native writing.
- [x] Add placeholder adapters for future Nuendo AAF and reference-video handoff capabilities with explicit unsupported reasons.
- [x] Add adapter registry for capability matching + per-artifact state explanations (ready/blocked/unsupported/deferred).
- [x] Surface adapter readiness and unsupported reasons in operator views without redesigning UI.
- [x] Add tests for normalization, matching, readiness, dry-run, unsupported reasons, and review-state influence.

## Phase 3F — Writer Runner Contracts + Receipts (Complete)
- [x] Add writer-runner boundary after adapter dry-runs to normalize runnable requests and blocked/unsupported records.
- [x] Define explicit writer-runner types: request, response, receipt, runner readiness/capability, attempts, and blocked/unsupported reasons.
- [x] Generate deterministic `handoff/writer-run-requests.json`, `handoff/writer-run-responses.json`, and `handoff/writer-run-receipts.json`.
- [x] Implement reference no-op runner proving execution boundary without writing Nuendo/session binaries.
- [x] Surface runner state in operator job detail without redesign.
- [x] Add tests for determinism, readiness classification, no-op responses, receipt consistency, and review-state signature influence.

## Phase 3G — External Runner Transport + Execution Audit (Complete)
- [x] Add writer-run transport boundary after writer-runner contracts.
- [x] Define deterministic transport envelope/dispatch/audit/history types with explicit versioning and linkage.
- [x] Generate deterministic transport/audit artifacts under handoff (`writer-run-transport-envelopes.json`, `writer-run-dispatch-records.json`, `writer-run-audit-log.json`, `writer-run-history.json`).
- [x] Implement reference no-op transport acknowledgements and audit events without native writer execution.
- [x] Add retry/cancel/timeout/superseded state model contracts and visibility.
- [x] Surface transport and audit visibility in job operator view without redesign.
- [x] Add tests for envelope determinism, linkage, classification, acknowledgements, audit/history generation, and state transitions.

## Phase 3H — Real Transport Adapters + Receipt Ingestion (Complete)
- [x] Implement real external transport adapter boundary with filesystem dispatch adapter plus no-op fallback path.
- [x] Add deterministic outbound dispatch materialization and inbound receipt ingestion/matching/validation flow.
- [x] Extend audit/history transitions for imported/duplicate/stale/unmatched/invalid/completed/failed/partial receipt outcomes.

## Phase 3I — External Execution Interoperability + Receipt Compatibility (Complete)
- [x] Add receipt compatibility schema/profile registry and deterministic normalization/migration layer.
- [x] Define explicit compatibility/normalization/fingerprint/signature/correlation types with versioned linkage to dispatch/package/source/review signatures.
- [x] Harden dispatch/receipt matching for duplicate, replay, stale, superseded, partial drift, invalid, and incompatible outcomes.
- [x] Export compatibility metadata with filesystem dispatch bundles and validate inbound receipts against declared profile expectations.
- [x] Extend audit/history/UI state visibility for receipt-normalized, migrated, partial, superseded, and incompatible transitions without redesign.
- [x] Add regression tests for canonical/compatibility normalization, migrations, replay safety, and deterministic matching.
- [x] Align README/PRODUCT/SCHEMA/BUNDLE_SPEC documentation with Phase 3I compatibility and deferred-writer constraints.

## Phase 3J — Native Writer/Orchestration Execution (Planned)
- [ ] Implement Nuendo/session writer boundary for deferred AAF artifacts.
- [ ] Implement reference-video binary generation orchestration boundary.
- [ ] Keep planner/execution-prep/staging/handoff/package/adapter/runner/transport layers separated while native writing lands.

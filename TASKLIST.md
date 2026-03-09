# TASKLIST — Conform Bridge

## Phase 1 — Contract Lock + Frontend Operator Shell
- [x] Lock product contract and scope boundaries in `PRODUCT.md`.
- [x] Lock canonical data contract in `SCHEMA.md`.
- [x] Lock bundle artifact contract in `BUNDLE_SPEC.md`.
- [x] Scaffold desktop-first operator shell with App Router navigation.
- [x] Scaffold routes: Dashboard, Jobs, New Job, Templates, Field Recorder, ReConform, Settings.
- [x] Implement typed models for all phase-1 entities:
  - [x] `TranslationJob`
  - [x] `SourceBundle`
  - [x] `SourceAsset`
  - [x] `Timeline`
  - [x] `Track`
  - [x] `ClipEvent`
  - [x] `Marker`
  - [x] `FieldRecorderCandidate`
  - [x] `MappingRule`
  - [x] `PreservationIssue`
  - [x] `OutputPreset`
  - [x] `ExportArtifact`
- [x] Keep render deterministic and SSR-safe (no browser-only APIs in initial render path).
- [x] Keep importer/exporter/persistence as stubs only.
- [x] Use realistic Resolve -> Nuendo mock workflow data.
- [x] Exclude auth, billing, database, and marketing pages.

## Phase 2 — Parser/Exporter Services (Active)
- [~] Implement Resolve intake validation/parsing service for CSV/manifest/EDL contract (partially real).
- [x] Make timeline_exchange (`.fcpxml`/`.xml`) the active canonical timeline hydration milestone.
- [x] Implement binary/container-aware AAF extraction adapter + reconciliation against canonical timeline (FCPXML precedence + AAF-only fallback + mismatch issue taxonomy).
- [ ] Build canonical normalization pipeline with deterministic transform rules.
- [ ] Implement Nuendo-ready bundle writer for required artifact set.
- [~] Add robust validation and warning taxonomy for reconform/preservation issues (AAF mismatch/media-reference coverage + extraction boundary warnings expanded).
- [ ] Add file intake UX and job execution controls around real services.
- [ ] Add persistence layer once service boundaries stabilize.

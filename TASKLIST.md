# TASKLIST — Conform Bridge

## Phase 1 — Contract Lock + Frontend Operator Shell
- [x] Lock product contract and scope boundaries in `PRODUCT.md`.
- [x] Split schema into Intake Package, Canonical Translation Model, and Delivery Package.
- [x] Split bundle spec into Intake vs Delivery and define shared file-kind rules.
- [x] Scaffold desktop-first operator shell with App Router navigation.
- [x] Scaffold routes: Dashboard, Jobs, New Job, Templates, Field Recorder, ReConform, Settings.
- [x] Keep importer/exporter/persistence as stubs only.
- [x] Keep render deterministic and SSR-safe.
- [x] Exclude auth, billing, database, and marketing pages.
- [x] Define typed model contracts for:
  - [x] `SourceBundle` + `IntakeAsset`
  - [x] `TranslationModel` + `NormalizedTimeline` + `NormalizedTrack`
  - [x] `ClipEvent` + `Marker`
  - [x] `AnalysisReport`
  - [x] `DeliveryPackage` + `DeliveryArtifact`
  - [x] `MappingRule`
  - [x] `PreservationIssue`
  - [x] `ReConformChange`

## Phase 2 — Parser/Exporter Services (Planned)
- [ ] Implement real intake parser/validator for AAF/XML/EDL/CSV/audio assets.
- [ ] Build canonical normalization engine with frame/timecode consistency checks.
- [ ] Implement delivery package writer for Nuendo handoff artifacts.
- [ ] Add reconform execution logic on top of modeled change events.
- [ ] Add persistence once service contracts are stable.

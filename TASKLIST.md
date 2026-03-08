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

## Phase 2A — Intake Analysis (Current)
- [x] Implement real intake folder scanner + file classification.
- [x] Parse metadata CSV, marker CSV, manifest JSON, and simple EDL marker lines.
- [x] Hydrate canonical timeline/tracks/clips/markers from parsed intake data where available.
- [x] Generate analysis report counts and delivery readiness summary.
- [x] Generate preservation issues for missing expected assets and unresolved metadata.
- [x] Wire New Job/Dashboard/Jobs/Field Recorder routes to importer data with mock fallback.
- [x] Add fixture turnover folder for importer validation.
- [x] Add parser/importer tests for classification and analysis generation.

## Phase 2B — Next (after merge conflict resolution)
- [ ] Implement robust AAF ingestion and mapping into canonical timeline events.
- [ ] Improve timecode/frame math and drop-frame conversion validation.
- [ ] Add stronger EDL event parsing beyond marker extraction.
- [ ] Keep exporter in planning mode until AAF ingestion stabilizes.

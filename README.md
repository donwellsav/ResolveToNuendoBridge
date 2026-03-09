# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Program Status at a Glance

| Status | Phase | Focus | State |
|---|---|---|---|
| Past | Phase 1 | Contract lock + frontend operator shell | ✅ Complete |
| Current | Phase 2A–2F | Real intake parsing + canonical hydration/reconciliation | 🚧 Active |
| Planned | Phase 3 | Canonical normalization + delivery writing + execution UX/persistence | 🗓️ Next |

## Phase History and Plan (Past / Current / Planned)

### Past — Phase 1 (Completed)
Phase 1 established the stable product/data/bundle contract and a deterministic operator shell.

Completed outcomes:
- Locked product/scope contract in `PRODUCT.md`.
- Locked canonical schema contract in `SCHEMA.md`.
- Locked bundle artifact contract in `BUNDLE_SPEC.md`.
- Delivered desktop-first Next.js App Router shell and core operator routes.
- Kept initial render deterministic and SSR-safe.
- Kept importer/exporter boundaries as stubs while validating UX and data contracts.

### Current — Phase 2 (Active implementation series)
Phase 2 incrementally replaces fixture-only paths with real intake parsing and canonical hydration while preserving the phase-1 contract.

#### Phase 2 progress so far
- **2A/2B foundation**
  - Intake scanning and file-role classification.
  - Real manifest + metadata CSV parsing.
  - Marker CSV/EDL parsing and baseline preservation issue reporting.
- **2C timeline exchange milestone**
  - FCPXML/XML parser path wired into canonical timeline hydration.
  - FCPXML/XML set as primary timeline source when present.
- **2D AAF baseline**
  - First-pass AAF parser integrated.
  - AAF enrichment against canonical timeline plus AAF-only fallback hydration.
- **2E deeper AAF ingestion**
  - Richer AAF token handling for composition/event-style records.
  - Improved extraction for source identity, reel/tape, in/out ranges, channels/layout.
  - Explicit offline/missing-reference signals preserved.
  - Inferable fade/speed metadata carried into canonical events.
  - Reconciliation issues expanded for AAF vs FCPXML/XML mismatches (counts/timing/source/reel/tape/missing media).
- **2F binary/container-aware AAF ingestion (latest)**
  - Added a binary/container-aware extraction boundary for real `.aaf` files.
  - Supports direct container record extraction plus a stable external-adapter normalization path.
  - Preserves fallback text-fixture compatibility for controlled fixture workflows.
  - Keeps FCPXML/XML primary when present, uses AAF for enrich/reconcile, and falls back to AAF-primary only when FCPXML/XML is absent.

#### What remains in current phase
- Deterministic canonical normalization pass across all ingest paths.
- Surface AAF extraction diagnostics/modes as explicit preservation issues where useful.
- Broader warning taxonomy and conflict diagnostics.
- Keep exporter planning unchanged except benefiting from richer canonical inputs.

### Planned — Next Phases

#### Phase 3 (planned)
- Implement deterministic canonical normalization pipeline.
- Add deeper validation/reconciliation diagnostics for operator triage.
- Implement Nuendo-ready bundle writing (actual artifact output; still intentionally not implemented today).
- Add intake execution controls/job orchestration in UI.
- Add persistence once service boundaries stabilize.

#### Later (post-Phase 3)
- Hardening/perf on large turnovers.
- Additional interchange adapters as needed.
- Operational reporting around preservation/reconform outcomes.

See `TASKLIST.md` for the live checklist and status markers.

## Source-of-Truth Contracts
- `PRODUCT.md`
- `SCHEMA.md`
- `BUNDLE_SPEC.md`
- `TASKLIST.md`

## Tech Stack
- Next.js App Router
- TypeScript
- Tailwind CSS
- Reusable shadcn/ui-style component primitives

## Local Development
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Available Scripts
```bash
npm run dev        # start local dev server
npm run build      # production build
npm run start      # run production server
npm run lint       # eslint via next lint
npm run typecheck  # TypeScript no-emit check
npm run test       # parser/service contract tests
```

## Operator Routes (App Shell)
- Dashboard
- Jobs
- New Job
- Templates
- Field Recorder
- ReConform
- Settings

## Domain + Artifact Contract Coverage
Canonical model includes translation jobs, source bundles, timeline entities, mapping rules, field-recorder candidates, preservation warnings/issues, output presets, and export artifact statuses.

Required artifact family modeled end-to-end:
1. AAF
2. marker EDL
3. marker CSV
4. metadata CSV
5. manifest.json
6. README instructions
7. reference video
8. field recorder matching report

## Implementation Notes
- Initial render paths are deterministic and SSR-safe.
- Intake and canonical services are now partially real (manifest/CSV/EDL/FCPXML/XML/AAF coverage).
- AAF ingestion now supports deeper reconciliation while keeping unknowns explicit.
- Exporter remains planner-only in the current phase (no Nuendo project writing yet).
- Mock workflow semantics remain plausible for Resolve/Nuendo workflows (reels, timeline TC, pull modes, field-recorder matching, reconform warnings).

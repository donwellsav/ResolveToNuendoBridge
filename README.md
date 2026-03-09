# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Program Status at a Glance

| Status | Phase | Focus | State |
|---|---|---|---|
| Past | Phase 1 | Contract lock + frontend operator shell | ✅ Complete |
| Current | Phase 2A–2I | Real intake parsing + canonical hydration/reconciliation | 🚧 Active |
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

#### Completed/landed Phase 2 steps
- **2A / 2B — Intake + metadata foundations**
  - Intake scanning and file-role classification.
  - Manifest + metadata CSV parsing.
  - Marker CSV/EDL parsing and baseline preservation issue reporting.
- **2C — Timeline exchange milestone**
  - FCPXML/XML parser path wired into canonical timeline hydration.
  - FCPXML/XML set as primary timeline source when present.
- **2D — AAF baseline**
  - First-pass AAF parser integration.
  - AAF enrichment against canonical timeline plus AAF-only fallback hydration.
- **2E — Deeper AAF ingestion**
  - Richer AAF token handling for composition/event-style records.
  - Improved extraction for source identity, reel/tape, in/out ranges, channels/layout.
  - Explicit offline/missing-reference signals preserved.
  - Inferable fade/speed metadata carried into canonical events.
  - Reconciliation issues expanded for AAF vs FCPXML/XML mismatches.
- **2F — Binary/container-aware AAF ingestion**
  - Binary/container extraction boundary for real `.aaf` files.
  - Direct container record extraction + adapter-normalization compatibility path.
  - Fallback compatibility retained for controlled fixture workflows.
- **2G / 2H — Expanded direct parser traversal + diagnostics**
  - Broader direct traversal coverage across composition/mob-slot/source-mob/source-clip style records.
  - Added locator/comment + media-descriptor/effect-hint extraction.
  - Preserved explicit fallback diagnostics when adapter compatibility path is required.
  - Expanded reconciliation taxonomy (identity/timing/reel-tape/media-reference/marker coverage).
- **2I — Mapping editors + validation workflow (latest)**
  - Added richer operator mapping editors for track, marker, metadata, and field-recorder review with practical bulk actions.
  - Added mapping workspace state to the canonical job model.
  - Surfaced unresolved mapping/validation summaries on Dashboard and Jobs.
  - Kept exporter planning-only while consuming richer mapping decisions (no Nuendo file writing).

#### In-progress / remaining within current phase
- Deterministic canonical normalization pass across all ingest paths.
- Broader warning taxonomy and conflict diagnostics where import sources disagree.
- Surface importer extraction/compatibility modes as explicit operator-facing diagnostics where useful.
- Keep exporter planning unchanged in write behavior while improving planning signals from canonical + mapping state.

### Planned — Next Phases

#### Phase 3 (planned)
- Implement deterministic canonical normalization pipeline end-to-end.
- Add deeper validation/reconciliation diagnostics for operator triage.
- Implement Nuendo-ready bundle writing for required artifacts (currently intentionally not implemented).
- Add intake execution controls/job orchestration UX around real services.
- Add persistence once service boundaries stabilize.

#### Later (post-Phase 3)
- Hardening/performance for large turnovers.
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

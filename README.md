# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Current Status

| Status | Phase | Focus | State |
|---|---|---|---|
| Past | Phase 1 | Contract lock + frontend operator shell | ✅ Complete |
| Past | Phase 2A–2J | Real intake parsing + canonical hydration/reconciliation + operator mapping/validation editors + persisted operator review state | ✅ Complete |
| Past | Phase 2K | Reduce remaining AAF adapter fallback dependence | ✅ Complete |
| Past | Phase 3A | Delivery execution prep boundary (planning remains separate from writing) | ✅ Complete |
| Past | Phase 3B | Staged delivery materialization from execution-prep payloads | ✅ Complete |
| Past | Phase 3C | Deferred writer-input contract hardening + delivery handoff manifests (writer still deferred) | ✅ Complete |
| Past | Phase 3D | External execution packaging boundary on staged + handoff outputs | ✅ Complete |
| Past | Phase 3E | Writer-adapter interface boundary + capability dry-run against external packages | ✅ Complete |
| Past | Phase 3F | Writer-runner request/response/receipt contracts on adapter dry-runs (no native writing) | ✅ Complete |
| Past | Phase 3G | External transport envelopes + execution audit/history on top of writer-runner contracts | ✅ Complete |
| Past | Phase 3H | Real external transport adapters + deterministic receipt ingestion (no queue/backend) | ✅ Complete |
| Past | Phase 3I | External execution interoperability + receipt compatibility hardening (still no native Nuendo writing) | ✅ Complete |
| Current | Phase 3J | External executor/package compatibility hardening + profile validation/reporting (still no native Nuendo writing) | ✅ Complete |
| Later | Phase 3K | Native writer execution/orchestration implementation behind adapter boundary | 🗓️ Planned |

## Architecture (Intake → Canonical → Delivery)
1. **SourceBundle / intake**: scan turnover files, classify file kind/role, and parse manifest/metadata/markers/timeline exchanges.
2. **TranslationModel / canonical**: hydrate normalized timeline + mapping workspace + preservation diagnostics.
3. **DeliveryPackage / delivery**: deterministic planner output for required Nuendo handoff artifacts.

Importer timeline precedence is currently:
1. `fcpxml` / `xml`
2. `aaf`
3. `edl`
4. metadata-only fallback (when no timeline exchange parse is available)

## Implemented Coverage (through Phase 3J)
- Real intake scanning + role classification for fixture turnover folders.
- Parsing for `manifest.json`, metadata CSV, marker CSV/EDL, FCPXML/XML, and broadened direct in-repo AAF extraction/parsing.
- Canonical hydration supports FCPXML-first + AAF enrichment/reconciliation, plus AAF-only and EDL fallbacks.
- Operator mapping/editor workflow for track, marker, metadata, and field recorder decisions.
- Validation workflow with `PreservationIssue` synthesis and unresolved mapping summaries surfaced on Dashboard/Jobs.
- Delivery artifact planner consumes canonical + mapping decisions without writing Nuendo files.
- Delivery execution-prep layer converts planned artifacts into deterministic payloads for manifest/README/marker EDL+CSV/metadata CSV/field-recorder report, while writer-only binaries remain deferred records.
- Delivery staging layer now materializes deterministic staged bundle structure and file-path contract on disk under `staging/<job>_<sequence>/` (manifest, README, marker/metadata/report files + deferred binary descriptor JSON + staging summary).
- Delivery handoff layer now emits deterministic future-writer contracts (`handoff/deferred-writer-inputs.json`, `handoff/delivery-handoff-manifest.json`, `handoff/delivery-handoff-summary.json`) with dependency/readiness validation and blocked/partial/known-gap states.
- External execution package layer now bundles staged outputs plus handoff contracts into deterministic export layout under `exports/<job>_<sequence>/` with `staged/`, `handoff/`, and `package/` indexes/manifests/checksums/readiness summaries for external executors.
- Writer-adapter boundary layer now normalizes external-execution package + handoff deferred inputs into a stable adapter contract, with deterministic serialization and explicit versioning/capability metadata.
- Writer-runner boundary now consumes external-execution package + writer-adapter report to generate deterministic runnable/blocked/unsupported requests, no-op runner responses, and receipts (`handoff/writer-run-requests.json`, `handoff/writer-run-responses.json`, `handoff/writer-run-receipts.json`).
- Transport/audit boundary now consumes writer-runner contracts to generate deterministic external transport envelopes, dispatch records, audit logs, and attempt history (`handoff/writer-run-transport-envelopes.json`, `handoff/writer-run-dispatch-records.json`, `handoff/writer-run-audit-log.json`, `handoff/writer-run-history.json`).
- Receipt compatibility layer now accepts canonical and compatibility receipt payloads, applies deterministic normalization/migration, and validates against explicit schema/profile registries before ingestion matching.
- Filesystem transport dispatch now exports receipt-compatibility metadata for external executors and imports compatibility/canonical receipts with deterministic replay safety (duplicate fingerprint, stale/superseded, partial drift, incompatible).
- Registry-driven adapter matching now reports deferred artifact states (`ready`, `blocked`, `unsupported`, `deferred`) and machine-readable unsupported reasons.
- Reference/no-op adapter validates and dry-runs writer contracts without generating native outputs; future Nuendo AAF and reference-video adapters are placeholders that expose capabilities and unsupported reasons only.
- Browser-local review-state persistence layer stores only operator deltas (mapping overrides, validation acknowledgements, reconform decisions) keyed by job + source signature with schema versioning/migration handling.
- Reconform review tools now support per-change status, notes-ready decision states, unresolved/acknowledged/risky filters, and cross-page unresolved review summaries.


## Phase 3J Executor Compatibility at a Glance
- First real transport path remains **filesystem** (`node.filesystem`) with optional stricter filesystem profile metadata (`filesystem-strict-export-v1`) while preserving existing contracts.
- Inbound receipts support canonical and compatibility payload shapes via schema/profile registry matching.
- Deterministic normalization can produce `normalized` or `migrated` outcomes before matching.
- Ingestion outcomes include: imported, duplicate, stale, superseded, partial, unmatched, invalid, incompatible.
- Matching evaluates correlation id, dispatch/transport id, package signature, source signature, review signature, and artifact/adapter/runner linkage context.

## Known Limitations
- Executor compatibility boundary now validates package/handoff/transport/receipt/signature alignment and emits deterministic compatibility artifacts (`handoff/executor-profile-resolution.json`, `handoff/executor-compatibility-report.json`, `handoff/executor-compatibility-summary.json`).
- Nuendo writer is still not implemented (Phase 3J hardens external compatibility only; no Nuendo/session binaries are written).
- Deferred artifacts are staged as descriptors only (`*_NUENDO_READY.aaf.deferred.json`, `*_REFERENCE_VIDEO.deferred.json`), with no fake binary contents.
- Persistence is local/browser-based only (no backend review-state service in this phase).
- Some AAF compatibility adapter fallback remains for partial/unsupported graph shapes.

## AAF Direct Parsing Coverage (Phase 2K)
- Direct parser now handles broader record/token variants (`CompositionMob`, `MasterMob`, alias token keys such as `sourcePackageID`, `timelineInFrames`, `mediaRefStatus`, `tapeId`).
- Extraction supports clip-bearing records across text and OLE/container scans, plus explicit warnings when only partial non-clip records are found.
- Canonical hydration coverage includes composition mobs, mob slots, source mobs/source clips, reel/tape, record/source in-out, locators/comments/markers, media descriptor hints, and missing/offline media flags.
- Fallback to `.adapter` remains enabled when direct extraction cannot recover clip-bearing graph nodes.
- Unsupported classes remain explicit via diagnostics/warnings; unknown values are preserved as `UNKNOWN` rather than invented.

Still unsupported in direct parsing (currently fallback-prone):
- Deep proprietary/obfuscated OLE stream layouts with no recoverable clip-bearing text records.
- Heavily nested/non-textual object graphs requiring full binary AAF object model decoding.
- Complex transition/effect classes beyond inferable hint flags.

## Next Recommended Work
- **Post-2K**: continue shrinking fallback by decoding additional opaque OLE stream layouts and richer effect object classes.
- **Phase 3J**: implement native writer/orchestration execution against the external-execution package + adapter + runner + transport boundaries.
- **Phase 3K**: optional backend/queue orchestration once native writer execution is validated.
- Keep deterministic normalization + warning taxonomy improvements in lockstep with parser work.
- Enter Phase 3 only after planning quality and review-state persistence are stable.

See `TASKLIST.md` for the live checklist/status markers and `SCHEMA.md` + `BUNDLE_SPEC.md` for aligned contract details.

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

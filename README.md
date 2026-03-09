# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Current Status

| Status | Phase | Focus | State |
|---|---|---|---|
| Past | Phase 1 | Contract lock + frontend operator shell | ✅ Complete |
| Current | Phase 2A–2J | Real intake parsing + canonical hydration/reconciliation + operator mapping/validation editors + persisted operator review state | ✅ Complete |
| Past | Phase 2K | Reduce remaining AAF adapter fallback dependence | ✅ Complete |
| Current | Phase 3A | Delivery execution prep boundary (planning remains separate from writing) | ✅ Complete |
| Later | Phase 3B+ | Writer/orchestration implementation behind execution boundary | 🗓️ Planned |

## Architecture (Intake → Canonical → Delivery)
1. **SourceBundle / intake**: scan turnover files, classify file kind/role, and parse manifest/metadata/markers/timeline exchanges.
2. **TranslationModel / canonical**: hydrate normalized timeline + mapping workspace + preservation diagnostics.
3. **DeliveryPackage / delivery**: deterministic planner output for required Nuendo handoff artifacts.

Importer timeline precedence is currently:
1. `fcpxml` / `xml`
2. `aaf`
3. `edl`
4. metadata-only fallback (when no timeline exchange parse is available)

## Implemented Coverage (through 2K baseline)
- Real intake scanning + role classification for fixture turnover folders.
- Parsing for `manifest.json`, metadata CSV, marker CSV/EDL, FCPXML/XML, and broadened direct in-repo AAF extraction/parsing.
- Canonical hydration supports FCPXML-first + AAF enrichment/reconciliation, plus AAF-only and EDL fallbacks.
- Operator mapping/editor workflow for track, marker, metadata, and field recorder decisions.
- Validation workflow with `PreservationIssue` synthesis and unresolved mapping summaries surfaced on Dashboard/Jobs.
- Delivery artifact planner consumes canonical + mapping decisions without writing Nuendo files.
- Delivery execution-prep layer now converts planned artifacts into deterministic payloads for manifest/README/marker EDL+CSV/metadata CSV/field-recorder report, while writer-only binaries remain deferred records.
- Browser-local review-state persistence layer stores only operator deltas (mapping overrides, validation acknowledgements, reconform decisions) keyed by job + source signature with schema versioning/migration handling.
- Reconform review tools now support per-change status, notes-ready decision states, unresolved/acknowledged/risky filters, and cross-page unresolved review summaries.

## Known Limitations
- Nuendo writer is not implemented yet (Phase 3A adds execution prep, not writer output).
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
- **Phase 3B**: implement writer/orchestration against the new execution boundary while keeping planner responsibilities unchanged.
- Keep deterministic normalization + warning taxonomy improvements in lockstep with parser work.
- Enter Phase 3 only after planning quality and review-state persistence are stable.

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

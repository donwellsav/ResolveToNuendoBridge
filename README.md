# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Current Status

| Status | Phase | Focus | State |
|---|---|---|---|
| Past | Phase 1 | Contract lock + frontend operator shell | ✅ Complete |
| Current | Phase 2A–2J | Real intake parsing + canonical hydration/reconciliation + operator mapping/validation editors + persisted operator review state | ✅ Complete |
| Next | Phase 2K | Reduce remaining AAF adapter fallback dependence | 🧭 Planned |
| Later | Phase 3 | Delivery execution (including writing/orchestration) once planning is stable | 🗓️ Planned |

## Architecture (Intake → Canonical → Delivery)
1. **SourceBundle / intake**: scan turnover files, classify file kind/role, and parse manifest/metadata/markers/timeline exchanges.
2. **TranslationModel / canonical**: hydrate normalized timeline + mapping workspace + preservation diagnostics.
3. **DeliveryPackage / delivery**: deterministic planner output for required Nuendo handoff artifacts.

Importer timeline precedence is currently:
1. `fcpxml` / `xml`
2. `aaf`
3. `edl`
4. metadata-only fallback (when no timeline exchange parse is available)

## Implemented Coverage (through 2J)
- Real intake scanning + role classification for fixture turnover folders.
- Parsing for `manifest.json`, metadata CSV, marker CSV/EDL, FCPXML/XML, and direct in-repo AAF extraction/parsing.
- Canonical hydration supports FCPXML-first + AAF enrichment/reconciliation, plus AAF-only and EDL fallbacks.
- Operator mapping/editor workflow for track, marker, metadata, and field recorder decisions.
- Validation workflow with `PreservationIssue` synthesis and unresolved mapping summaries surfaced on Dashboard/Jobs.
- Delivery artifact planner consumes canonical + mapping decisions without writing Nuendo files.
- Browser-local review-state persistence layer stores only operator deltas (mapping overrides, validation acknowledgements, reconform decisions) keyed by job + source signature with schema versioning/migration handling.
- Reconform review tools now support per-change status, notes-ready decision states, unresolved/acknowledged/risky filters, and cross-page unresolved review summaries.

## Known Limitations
- Nuendo writer is not implemented yet (planner-only delivery output).
- Persistence is local/browser-based only (no backend review-state service in this phase).
- Some AAF compatibility adapter fallback remains for edge/fixture coverage.

## Next Recommended Work
- **Phase 2K**: tighten direct AAF parser coverage and reduce adapter fallback usage.
- **Phase 3 prep**: deepen delivery execution readiness while preserving planner-only constraints.
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

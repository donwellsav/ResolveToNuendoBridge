# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Phase Roadmap (Past / Current / Planned)

### Past — Phase 1 (Completed)
Phase 1 locked contracts and delivered the frontend operator shell:
- Product/scope contract in `PRODUCT.md`
- Canonical schema contract in `SCHEMA.md`
- Delivery artifact/bundle contract in `BUNDLE_SPEC.md`
- Desktop-first Next.js App Router operator UI routes and reusable UI primitives
- Deterministic SSR-safe rendering constraints across initial render paths

### Current — Phase 2 (Active)
Phase 2 is focused on parser/import/export service milestones while preserving the phase-1 contracts.

Current implemented status:
- Real intake parsing for CSV/manifest/EDL/FCPXML
- AAF ingestion milestone added (structured extraction parser + importer precedence + reconciliation issue generation)
- Canonical hydration from FCPXML/XML when present
- AAF fallback hydration when FCPXML/XML is absent
- Export remains planning-only (artifact planning; no Nuendo project/file writing yet)

### Planned — Next Milestones
Planned sequence after current AAF milestone:
1. Deterministic canonical normalization pipeline across intake sources
2. Expanded validation taxonomy and richer reconciliation diagnostics
3. Nuendo-ready bundle writer implementation (actual file writing)
4. File intake UX + job execution controls around real services
5. Persistence layer once service boundaries are stable

See `TASKLIST.md` for the live checklist.

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
- Importer now includes partial real phase-2 parsing milestones (including AAF intake/reconciliation).
- Exporter remains planner-only in the current phase.
- Mock workflow data remains plausible to Resolve/Nuendo post workflows (reels, timeline TC, pull modes, field recorder matching, reconform warnings).

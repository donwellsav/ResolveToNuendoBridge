# Resolve to Nuendo Conform Bridge

Internal desktop-first operator tool for translating Resolve turnover bundles into a Nuendo-ready conform handoff.

## Current Phase
This repository is currently split across:
- **Phase 1 (locked):** product, schema, and bundle contracts + operator shell UI.
- **Phase 2 (active):** parser/exporter services are being incrementally implemented (currently focused on timeline exchange and intake validation milestones).

See the contract docs for source-of-truth expectations:
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

## Domain + Artifact Contract (Phase 1)
Canonical model includes translation jobs, source bundles, timeline entities, mapping rules, field-recorder candidates, preservation warnings, output presets, and export artifact statuses.

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
- Importer/exporter interfaces are preserved with stubs and partial phase-2 service implementation where explicitly tracked in `TASKLIST.md`.
- Mock workflow data remains plausible to Resolve/Nuendo post workflows (reels, timeline TC, pull modes, field recorder matching, reconform warnings).

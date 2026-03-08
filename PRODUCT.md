# Conform Bridge — Product Contract (Phase 1)

## Product Intent
Conform Bridge is a desktop-first internal operator tool that translates Resolve/editorial intake material into a Nuendo-ready delivery plan.

## Explicit 3-Layer Product Model
1. **Intake Package**: files received from Resolve/editorial/production audio.
2. **Canonical Translation Model**: normalized, format-agnostic timeline/clip/marker representation.
3. **Delivery Package**: planned outbound artifacts for Nuendo handoff.

This separation is contractual in phase 1 to prevent parser/export work from forcing UI rewrites.

## In Scope (Phase 1)
- Next.js App Router + TypeScript + Tailwind + shadcn/ui-style primitives.
- Operator routes: Dashboard, Jobs, New Job, Templates, Field Recorder, ReConform, Settings.
- Typed contracts for intake/canonical/delivery layers.
- Realistic mock data demonstrating all three layers.
- Importer/exporter/persistence service stubs only.

## Out of Scope (Phase 1)
- Real AAF/XML/EDL parsing.
- Real Nuendo export writing.
- Auth, billing, DB persistence, marketing/public pages.

## Rendering Constraints
- Deterministic SSR-safe render paths only.
- No browser-only APIs during initial render.
- No render-time nondeterminism (`Date.now`, dynamic `new Date`, `Math.random`, UUID generation).

## Acceptance
- Intake package and delivery package are modeled separately.
- Canonical model contains normalized frame + timecode fields.
- UI keeps existing shell/routes while labeling intake vs delivery correctly.
- Stubs accept/return the improved contracts without implementing parser/export logic.

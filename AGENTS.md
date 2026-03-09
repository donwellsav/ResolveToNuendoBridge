# AGENTS Instructions

Scope: entire repository.

## Mission (Phase 2 Baseline)
Maintain and extend the Resolve -> Nuendo translation pipeline across **intake -> canonical -> delivery planning** while keeping implementation deterministic and operator-focused.

## Engineering Rules
- Use Next.js App Router with TypeScript, Tailwind CSS, and shadcn/ui-style reusable primitives.
- Keep initial render deterministic and SSR-safe.
- Do not use browser-only APIs (`window`, `document`, `localStorage`, etc.) during initial render.
- Do not use `Date.now()`, dynamic `new Date()`, `Math.random()`, or UUID generation in render paths.
- Avoid page-wide client-only wrappers.
- Prefer reusable components over page-specific one-offs.

## UX / Visual Direction
- Desktop-first internal operator experience.
- Serious post-production aesthetic: dark, technical, restrained accents.
- Dense but readable information layouts.
- Prefer tables, badges, and structured metadata blocks.

## Data and Domain
- Preserve terminology: **SourceBundle/intake**, **TranslationModel/canonical**, **DeliveryPackage/delivery**, **PreservationIssue/validation**.
- Mock/fallback data must look plausible for Resolve/Nuendo workflows.
- Preserve terminology: reels, timeline TC, pull modes, field recorder matches, reconform warnings.
- Keep importer/exporter interfaces stable while importer parsing and delivery planning continue to deepen.
- Model full artifact contract: AAF, marker EDL, marker CSV, metadata CSV, manifest, README, reference video, field recorder report.

## Delivery
- Keep `README.md`, `PRODUCT.md`, `SCHEMA.md`, `BUNDLE_SPEC.md`, and `TASKLIST.md` aligned with implementation.
- Update task checklist status when features change.
- Do not add auth, billing, database-backed multi-user, or marketing/public pages in this phase.
- Do not implement Nuendo file writing until planned phase work explicitly calls for it.

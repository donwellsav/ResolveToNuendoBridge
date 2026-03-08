# AGENTS Instructions

Scope: entire repository.

## Engineering Rules
- Use Next.js App Router with TypeScript, Tailwind CSS, and shadcn/ui-style reusable primitives.
- Keep initial render deterministic and SSR-safe.
- Do not use browser-only APIs (`window`, `document`, `localStorage`, etc.) during initial render.
- Do not use `Date.now()`, `new Date()` without fixed input, `Math.random()`, or UUID generation in render paths.
- Avoid page-wide client-only wrappers.
- Prefer reusable components over page-specific one-offs.

## UX / Visual Direction
- Desktop-first internal operator experience.
- Serious post-production aesthetic: dark, technical, restrained accents.
- Dense but readable information layouts.
- Prefer tables, badges, and structured metadata blocks.

## Data and Domain
- Mock data must look plausible for Resolve/Nuendo workflows.
- Preserve terminology: reels, timeline TC, pull modes, field recorder matches, reconform warnings.
- Keep importer/exporter interfaces as stubs in this phase.

## Delivery
- Keep `PRODUCT.md`, `SCHEMA.md`, `BUNDLE_SPEC.md`, and `TASKLIST.md` aligned with implementation.
- Update task checklist status when features change.

# AGENTS Instructions

Scope: entire repository.

## Engineering Rules
- Use Next.js App Router with TypeScript and Tailwind.
- Keep initial render deterministic and SSR-safe.
- Do not use browser-only APIs (`window`, `document`, `localStorage`, etc.) during initial render.
- Do not use `Date.now()`, `new Date()` without fixed input, or `Math.random()` in render paths.
- Avoid page-wide "client-only" hacks (`"use client"` root wrappers, full-page hydration gates).
- Prefer reusable components over page-specific one-offs.

## UX / Visual Direction
- Desktop-first internal operator experience.
- Serious post-production aesthetic: dark, technical, restrained color accents.
- Dense but readable information layout.
- Tables, badges, and structured metadata blocks are preferred over oversized cards.

## Data and Domain
- Mock data must look like plausible Resolve/Nuendo workflow data.
- Preserve realistic terminology: reels, timeline TC, pull modes, field recorder matches, reconform warnings.
- Keep service interfaces for importer/exporter as stubs only in this phase.

## Delivery
- Keep docs (`PRODUCT.md`, `SCHEMA.md`, `BUNDLE_SPEC.md`, `TASKLIST.md`) aligned with implementation.
- When adding new features, update task checklist status.

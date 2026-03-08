# Resolve to Nuendo Conform Bridge — Product Contract

## Product Intent
Resolve to Nuendo Conform Bridge is a desktop-first internal operator tool for translating timeline and source metadata from DaVinci Resolve workflows into conform-ready Nuendo workflows.

The app should prioritize reliability, speed, and readability for post-production teams under schedule pressure.

## Phase Scope
### In Scope (Phase 1)
- App shell, navigation, and route structure
- Typed domain model for jobs, clips, templates, mappings, and reports
- Realistic mock data aligned to editorial and conform operations
- Operator-facing pages:
  - Dashboard
  - Jobs
  - New Job Wizard
  - Templates
  - Field Recorder
  - ReConform
  - Settings
- Preservation report and mapping inspection UI
- Import/export service interfaces as stubs (no real implementation)

### Explicit Non-Goals (Phase 1)
- Real file parsing
- Real export writing
- Authentication
- Billing
- Database/storage backend
- Marketing/public site
- AI chat user interface

## Experience Requirements
- Desktop-first information density
- Stable deterministic rendering (SSR-safe)
- No browser-only APIs used during initial render
- No render-time randomness/time dependence
- Reusable UI primitives and domain-oriented components
- Serious post-production visual language (muted, technical, high contrast)

## Architecture Guidelines
- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- shadcn/ui-style component architecture
- Frontend-only in this phase
- localStorage persistence can be introduced only after defaults and data contracts are stable

## Success Criteria
- Team can navigate all core workflow pages and inspect realistic job state
- Domain types and stubs make backend/parser/exporter integration straightforward
- Initial UI is deterministic, fast, and clean in SSR environments

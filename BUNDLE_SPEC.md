# Resolve -> Nuendo Bundle Specification (Phase 1 Mock Contract)

## Intent
Define the expected inbound/outbound bundle envelope for future parser/export implementation while keeping phase 1 frontend-only.

## Inbound Resolve Source Bundle (conceptual)
Expected operator-provided inputs:
- AAF
- marker EDL
- marker CSV
- metadata CSV
- manifest.json
- README import instructions
- reference video
- field recorder matching report

Conceptual envelope:
- project and timeline metadata
- track/clip event ranges
- marker payloads
- source/reel references

## Outbound Nuendo-ready Bundle (conceptual)
Expected artifacts produced by the bridge pipeline (future implementation):
- Nuendo-oriented AAF
- marker EDL and marker CSV
- metadata CSV
- manifest.json
- README import instructions
- reference video handoff
- field recorder matching report

## Validation Rules (future parser/export)
- Explicit bundle version and source application version.
- Stable unique IDs for timelines, tracks, and clip events.
- Timecode format `HH:MM:SS:FF` for all timeline/source fields.
- Supported frame rates only (`23.976`, `24`, `25`, `29.97`).
- Reject missing required core artifacts (AAF + manifest + metadata CSV).

## Phase 1 Status
No real file parsing, unpacking, transformation, or export writing is implemented.

# Resolve -> Nuendo Bundle Specification (Phase 1 Contract)

## Purpose
Define the bundle artifact contract now, while parser/export implementations remain deferred.

## Canonical Pipeline
**Resolve exports in -> canonical internal model -> Nuendo-ready bundle out**

## Required Artifact Set
The following artifacts are modeled in phase 1 and must remain part of the contract:
1. `AAF`
2. `marker EDL`
3. `marker CSV`
4. `metadata CSV`
5. `manifest.json`
6. `README import instructions`
7. `reference video`
8. `field recorder matching report`

## Inbound Bundle (Resolve-side)
Operator provides a source bundle that includes the required artifact set above.

Expected semantics:
- AAF provides editorial structure.
- Marker EDL/CSV provide review and cue references.
- Metadata CSV carries clip/scene/reel metadata.
- Manifest declares bundle versioning and required file inventory.
- README provides intake context/instructions.
- Reference video supports sync/verification during conform.
- Field recorder report provides match confidence and fallback details.

## Outbound Bundle (Nuendo-ready)
Exporter contract targets the same artifact family, emitted in Nuendo-oriented form:
- translated AAF
- marker EDL
- marker CSV
- metadata CSV
- manifest.json
- README import instructions
- field recorder matching report
- optional reference video copy/handoff

## Validation Rules (Phase 2 target behavior)
- Bundle must declare explicit contract version.
- Required artifacts must all be present.
- Timecode fields use `HH:MM:SS:FF`.
- Frame rates limited to `23.976`, `24`, `25`, `29.97`.
- IDs for timeline/track/clip events must be stable across pipeline stages.
- Missing AAF, manifest, or metadata CSV is a hard validation failure.

## Phase 1 Status
- No real bundle unpacking/parsing.
- No real transformation engine.
- No real export writing.
- UI and schema expose only mock contract + stub service boundaries.

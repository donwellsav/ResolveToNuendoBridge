# Resolve -> Nuendo Bundle Specification (Phase 1)

## Direction Contract
Direction is explicit and must not be inferred from file extension alone.
- `stage: "intake"` => inbound package
- `stage: "delivery"` => outbound package
- `origin` records source system/owner (`resolve`, `editorial`, `production-audio`, `conform-bridge`, `nuendo`)

## Intake Package (inbound)
Typical inbound assets:
- timeline exchange: AAF, FCPXML/XML, EDL
- metadata export CSV
- reference picture MOV/MP4
- production audio WAV/BWF (mono/polywav)

Intake package does **not** imply delivery planning files by default.

## Delivery Package (outbound plan)
Planned Nuendo handoff artifacts:
- Nuendo-ready AAF
- marker EDL
- marker CSV
- metadata CSV
- manifest.json
- README import instructions
- field recorder matching report
- optional reference video copy/handoff

## Shared File Kinds
The same `FileKind` may appear on either side (for example `csv`, `edl`, `aaf`, `json`, `txt`).
Use `stage` + `origin` + `fileRole` together to identify intent and direction.

## Validation Targets (Phase 2)
- Intake completeness checks per required inbound contract.
- Canonical normalization checks for stable IDs + valid frame/timecode math.
- Delivery readiness checks for required outbound artifacts and blocked/warning states.

## Phase 2A support (implemented)
- Intake scanner/classifier for local turnover folder inputs.
- Parsing for metadata CSV, marker CSV, manifest JSON, and simple EDL marker extraction.
- Canonical hydration uses known parsed fields and preserves unknowns as explicit defaults.
- Nuendo export writing remains out of scope in this phase.

## Intake Manifest Handling
- If `manifest.json` is present in turnover, Phase 2A treats it as intake context for project/timeline defaults.
- Delivery `manifest.json` remains a planned outbound artifact in delivery package.
- Direction is still determined by `stage` + `origin` + `fileRole`, not filename alone.

# Resolve -> Nuendo Bundle Specification (Phase 2 Baseline)

## Purpose
Define and maintain the artifact contract while intake/canonical fidelity improves and delivery writing remains intentionally deferred.

## Canonical Pipeline
**SourceBundle (intake) -> TranslationModel (canonical) -> DeliveryPackage (delivery)**

## Required Artifact Set
The following artifacts remain required in contract scope:
1. `AAF`
2. `marker EDL`
3. `marker CSV`
4. `metadata CSV`
5. `manifest.json`
6. `README import instructions`
7. `reference video`
8. `field recorder matching report`

## Intake (Resolve-side)
Operator provides a source bundle containing the required artifact family above.

Expected semantics:
- AAF carries editorial structure for timeline reconstruction/reconciliation.
- FCPXML/XML can provide preferred timeline exchange when present.
- Marker EDL/CSV provide review/cue metadata.
- Metadata CSV carries reel/tape/scene/take and clip metadata.
- Manifest declares package metadata + inventory.
- README provides operator transfer context.
- Reference video supports sync verification.
- Field recorder report carries match confidence/fallback context.

## Delivery (Nuendo-side)
Delivery planner targets the same artifact family in Nuendo-oriented form:
- translated AAF (planned, not yet written)
- marker EDL
- marker CSV
- metadata CSV
- manifest.json
- README import instructions
- field recorder matching report
- optional reference video copy/handoff

## Validation Rules (Current)
- Bundle must declare explicit contract version.
- Required artifacts must be represented in intake/delivery planning.
- Timecode fields use `HH:MM:SS:FF`.
- Frame rates limited to `23.976`, `24`, `25`, `29.97`.
- IDs for timeline/track/clip events remain stable across pipeline stages.
- Missing critical intake artifacts surfaces `PreservationIssue` warnings/blocks.

## Current Status
- Real intake parsing is implemented for manifest, metadata CSV, marker CSV/EDL, FCPXML/XML, and AAF-derived timeline sources.
- Import precedence is `fcpxml/xml` -> `aaf` -> `edl` -> metadata-only fallback.
- Canonical hydration supports FCPXML-first + AAF enrichment/reconciliation, plus AAF-only fallback when needed.
- Delivery planner is active and contract-driven; Nuendo writer remains unimplemented.

## Known Limitations
- Nuendo file writing is not implemented yet.
- Persistence for operator review state is still in-memory only.
- Some AAF compatibility adapter fallback remains in edge cases.

## Next Recommended Work
- Phase 2J: persist operator review/mapping state and deepen reconform-ready review flows.
- Phase 2K: reduce remaining AAF compatibility fallback dependence.
- Phase 3: implement delivery execution/writing once planning is stable.


## External Execution Package (Phase 3D)
Deterministic export package boundary layers on top of staged + handoff outputs:
- `exports/<job>_<sequence>/staged/...` (preserved staged payload layout)
- `exports/<job>_<sequence>/handoff/...` (preserved handoff manifests/contracts)
- `exports/<job>_<sequence>/package/...` (export-level manifest/index/summary/checksums/deferred-input index)

### Generated Now
- Text/JSON/CSV/EDL staged payloads from execution prep
- Deferred descriptor JSON for AAF/reference-video binaries
- Handoff manifests + deferred writer input contracts
- Package-level index/summary/checksum manifests for external executor intake

### Still Deferred
- Native Nuendo project/session writing
- Binary AAF writing via Nuendo writer adapter
- Binary reference video writing/copy orchestration

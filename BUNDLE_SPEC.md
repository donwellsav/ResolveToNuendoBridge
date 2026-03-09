# Resolve -> Nuendo Bundle Specification (Phase 3G Baseline)

## Purpose
Define and maintain the full artifact contract across the deterministic pipeline:
**intake -> canonical -> delivery planning -> execution prep -> staging -> handoff -> external package -> writer-adapter -> writer-runner -> transport/audit**.

Nuendo native/session writing remains intentionally deferred in this phase.

## Canonical Pipeline Vocabulary
**SourceBundle (intake) -> TranslationModel (canonical) -> DeliveryPackage (delivery)**

## Required Artifact Set (Contract Scope)
1. `AAF`
2. `marker EDL`
3. `marker CSV`
4. `metadata CSV`
5. `manifest.json`
6. `README import instructions`
7. `reference video`
8. `field recorder matching report`

## Intake (Resolve-side)
Operator provides a source bundle containing the artifact family above.

Expected semantics:
- AAF carries editorial structure for timeline reconstruction/reconciliation.
- FCPXML/XML is preferred timeline exchange when present.
- Marker EDL/CSV carry review/cue metadata.
- Metadata CSV carries reel/tape/scene/take and clip metadata.
- Manifest declares package metadata + inventory.
- README provides operator transfer context.
- Reference video supports sync verification.
- Field recorder report carries match confidence/fallback context.

## Delivery (Nuendo-side)
Delivery planning targets the same artifact family in Nuendo-oriented form:
- translated AAF (deferred contract, not yet written)
- marker EDL
- marker CSV
- metadata CSV
- manifest.json
- README import instructions
- field recorder matching report
- optional reference video copy/handoff

## Validation Rules (Current)
- Required artifacts must be represented in intake/delivery planning.
- Timeline/track/clip IDs remain stable across pipeline stages.
- Timecode fields use `HH:MM:SS:FF`.
- Frame rates are constrained to known supported values.
- Missing critical intake artifacts surface `PreservationIssue` warnings/blocks.

## Implemented Boundaries (through Phase 3G)
- Intake parsing + canonical hydration/reconciliation.
- Delivery planner (deterministic planning only; no native writer).
- Execution prep payload generation for safe text/JSON/CSV/EDL artifacts.
- Staged delivery materialization under `staging/<job>_<sequence>/...`.
- Deferred writer-input handoff contracts under `handoff/...`.
- External execution package under `exports/<job>_<sequence>/...` with checksums/index/summary.
- Writer-adapter dry-run/capability matching contracts (no native writing).
- Writer-runner request/response/receipt contracts with reference no-op runner.
- Writer-run transport/audit envelopes, dispatch records, audit events, and history with reference no-op transport.

## External Execution Package Layout (Phase 3D+)
Deterministic export package boundary layers on top of staged + handoff outputs:
- `exports/<job>_<sequence>/staged/...` (preserved staged payload layout)
- `exports/<job>_<sequence>/handoff/...` (handoff contracts + runner + transport/audit outputs)
- `exports/<job>_<sequence>/package/...` (manifest/index/summary/checksums/deferred-input index)

### Generated Now
- Text/JSON/CSV/EDL staged payloads from execution prep
- Deferred descriptor JSON for AAF/reference-video binaries
- Handoff manifests + deferred writer input contracts
- Writer-runner requests/responses/receipts
- Writer-run transport envelopes/dispatch/audit/history artifacts
- Package-level index/summary/checksum manifests for external executor intake

### Still Deferred
- Native Nuendo project/session writing
- Binary AAF writing via real Nuendo writer adapter
- Real external transport adapters / persistent queue orchestration
- Binary reference video writing/copy orchestration

# Resolve -> Nuendo Bundle Specification (Phase 3J Baseline)

## Purpose
Define and maintain the full artifact contract across the deterministic pipeline:
**intake -> canonical -> delivery planning -> execution prep -> staging -> handoff -> external package -> writer-adapter -> writer-runner -> transport -> receipt compatibility/ingestion -> executor compatibility**.

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

## Implemented Boundaries (through Phase 3J)
- Intake parsing + canonical hydration/reconciliation.
- Delivery planner (deterministic planning only; no native writer).
- Execution prep payload generation for safe text/JSON/CSV/EDL artifacts.
- Staged delivery materialization under `staging/<job>_<sequence>/...`.
- Deferred writer-input handoff contracts under `handoff/...`.
- External execution package under `exports/<job>_<sequence>/...` with checksums/index/summary.
- Writer-adapter dry-run/capability matching contracts (no native writing).
- Writer-runner request/response/receipt contracts with reference no-op runner.
- Writer-run transport envelopes/dispatch/audit/history artifacts.
- Filesystem transport dispatch materialization (`envelope.json`, `dispatch-summary.json`, `READY.marker`, `receipt-compatibility.json`).
- Deterministic receipt normalization + compatibility schema/profile matching + replay-safe ingestion outcomes.

## External Execution Package Layout
Deterministic export package boundary layers on top of staged + handoff outputs:
- `exports/<job>_<sequence>/staged/...` (preserved staged payload layout)
- `exports/<job>_<sequence>/handoff/...` (handoff + runner + transport/receipt artifacts)
- `exports/<job>_<sequence>/package/...` (manifest/index/summary/checksums/deferred-input index)

## Receipt Compatibility Profiles (Phase 3J)
Profiles are explicit and versioned:
- `canonical-filesystem-transport-v1`
- `compatibility-filesystem-receipt-v1`
- `future-service-transport-placeholder`

Each profile declares:
- expected outbound/inbound files
- required vs optional fields
- supported versions
- normalization rules
- unsupported reasons

## Generated Now
- Text/JSON/CSV/EDL staged payloads from execution prep.
- Deferred descriptor JSON for AAF/reference-video binaries.
- Handoff manifests + deferred writer input contracts.
- Writer-runner requests/responses/receipts.
- Writer-run transport envelopes/dispatch/audit/history artifacts.
- Dispatch compatibility metadata + deterministic receipt import classifications.
- Package-level index/summary/checksum manifests for external executor intake.

## Still Deferred
- Native Nuendo project/session writing.
- Binary AAF writing via real Nuendo writer adapter.
- Persistent backend queue/orchestration services.
- Binary reference video writing/copy orchestration.


## Executor Compatibility Artifacts (Phase 3J)
- `handoff/executor-profile-resolution.json`
- `handoff/executor-compatibility-report.json`
- `handoff/executor-compatibility-summary.json`
- Profiles: `canonical-filesystem-executor-v1`, `compatibility-filesystem-executor-v1`, `future-service-executor-placeholder`.

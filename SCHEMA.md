# Conform Bridge Canonical Schema (Phase 3G Baseline)

Canonical data contract for the deterministic pipeline:
**intake -> canonical -> delivery**
with downstream execution boundaries layered after delivery planning.

## Pipeline Vocabulary
- **SourceBundle**: intake envelope and discovered turnover assets.
- **TranslationModel**: canonical timeline representation derived from intake.
- **DeliveryPackage**: delivery planning output for Nuendo handoff artifacts.
- **PreservationIssue**: validation/review signal surfaced to operators.

## Core Entity Definitions

### SourceBundle (intake)
- `id: string`
- `stage: "intake"`
- `origin: "resolve" | "editorial"`
- `bundleName: string`
- `resolveProject: string`
- `resolveTimelineVersion: string`
- `importedAtIso: string`
- `intakeAssets: IntakeAsset[]`

### IntakeAsset
- `id: string`
- `stage: "intake"`
- `origin: "resolve" | "editorial" | "production-audio" | "conform-bridge" | "nuendo"`
- `fileKind: "aaf" | "fcpxml" | "xml" | "edl" | "csv" | "wav" | "bwf" | "mov" | "mp4" | "json" | "txt" | "otio" | "otioz"`
- `fileRole: "timeline_exchange" | "marker_export" | "metadata_export" | "reference_video" | "production_audio" | "delivery_manifest" | "delivery_readme" | "field_recorder_report"`
- `fileName: string`
- `pathHint: string`
- Optional media metadata (`channelCount`, `channelLayout`, `sampleRate`, `durationTimecode`, etc.)

### TranslationModel (canonical)
- `id: string`
- `stage: "canonical"`
- `sourceBundleId: string`
- `timeline: NormalizedTimeline`

### NormalizedTimeline
- `id: string`
- `name: string`
- `startTimecode: string`
- `durationTimecode: string`
- `startFrame: number`
- `durationFrames: number`
- `fps: 23.976 | 24 | 25 | 29.97`
- `sampleRate: 48000 | 96000`
- `dropFrame: boolean`
- `tracks: NormalizedTrack[]`
- `markers: Marker[]`

### NormalizedTrack
- `id: string`
- `name: string`
- `role: "DX" | "MX" | "FX" | "BG" | "VO"`
- `clips: ClipEvent[]`

### ClipEvent
- Timeline/source ranges: `recordIn`, `recordOut`, `sourceIn`, `sourceOut` (+ frame variants)
- Identity/media: `clipName`, `sourceFileName`, `sourceAssetId`, `reel`, optional `tape/scene/take`
- Audio/media flags: `channelCount`, `channelLayout`, `isPolyWav`, `hasBwf`, `hasIXml`, `isOffline`
- Editorial flags: `isNested`, `isFlattened`, `hasSpeedEffect`, `hasFadeIn`, `hasFadeOut`

### Marker
- `id: string`
- `timelineTc: string`
- `timelineFrame: number`
- `label: string`
- `color: "blue" | "green" | "yellow" | "red"`

### MappingWorkspace
Operator-editable decision layer consumed by validation + delivery planning.
- `trackMappings: TrackMappingDecision[]`
- `markerMappings: MarkerMappingDecision[]`
- `metadataMappings: MetadataMappingDecision[]`
- `fieldRecorderMappings: FieldRecorderDecision[]`

### PreservationIssue
- `id: string`
- `category: "preserved" | "downgraded" | "dropped" | "manual-review"`
- `severity: "info" | "warning" | "critical"`
- `scope: "timeline" | "track" | "clip" | "marker" | "metadata" | "delivery"`
- `title: string`
- `description: string`
- `sourceLocation: string`
- Optional target metadata (`targetArtifactId`, `targetArtifactName`)
- `recommendedAction: string`

### DeliveryPackage (delivery)
- `id: string`
- `stage: "delivery"`
- `target: "nuendo"`
- `packageName: string`
- `outputPresetId: string`
- `artifacts: DeliveryArtifact[]`

### DeliveryArtifact
- `id: string`
- `stage: "delivery"`
- `origin: "resolve" | "editorial" | "production-audio" | "conform-bridge" | "nuendo"`
- `fileKind: FileKind`
- `fileRole: FileRole`
- `fileName: string`
- `pathHint: string`
- `status: "planned" | "blocked" | "placeholder"`
- `note?: string`

## Downstream Contract Extensions (Implemented)
After `DeliveryPackage`, the current codebase also includes deterministic typed boundaries for:
- `DeliveryExecutionPlan`
- `DeliveryStagingBundle`
- `DeliveryHandoffBundle`
- `ExternalExecutionPackage`
- `WriterAdapterRegistryReport`
- `WriterRunBundle`
- `WriterRunTransportBundle`

These preserve separation of concerns and do not change canonical intake/canonical/delivery semantics.

## Runtime Status Notes
- Importer coverage includes manifest, metadata CSV, marker CSV/EDL, FCPXML/XML, and direct AAF extraction/parsing.
- Timeline source precedence is `fcpxml/xml` -> `aaf` -> `edl` -> metadata-only fallback.
- Browser-local persisted review state is implemented (versioned review deltas keyed by job + source signature).
- Native Nuendo writer/session outputs remain intentionally unimplemented.

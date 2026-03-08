# Conform Bridge Canonical Schema (Phase 1 Contract)

This schema defines the canonical internal model between Resolve intake and Nuendo export.

## Entity Definitions

### TranslationJob
Represents one end-to-end translation run.
- `id: string`
- `jobName: string`
- `status: "draft" | "queued" | "processing" | "needs_review" | "completed" | "failed"`
- `createdAtIso: string`
- `updatedAtIso: string`
- `sourceBundle: SourceBundle`
- `mappingRules: MappingRule[]`
- `fieldRecorderCandidates: FieldRecorderCandidate[]`
- `preservationIssues: PreservationIssue[]`
- `outputPreset: OutputPreset`
- `exportArtifacts: ExportArtifact[]`

### SourceBundle
Operator-provided Resolve payload envelope.
- `id: string`
- `resolveProject: string`
- `resolveTimelineVersion: string`
- `importedAtIso: string`
- `assets: SourceAsset[]`
- `timeline: Timeline`

### SourceAsset
Single source bundle artifact.
- `id: string`
- `name: string`
- `assetType: SourceBundleAssetType`
- `pathHint: string`
- `notes?: string`

### Timeline
Canonical timeline-level metadata.
- `id: string`
- `name: string`
- `frameRate: 23.976 | 24 | 25 | 29.97`
- `startTc: string`
- `tracks: Track[]`
- `markers: Marker[]`

### Track
Logical track container.
- `id: string`
- `name: string`
- `role: "DX" | "MX" | "FX" | "BG" | "VO"`
- `clips: ClipEvent[]`

### ClipEvent
Canonical clip event with timeline/source relationships.
- `id: string`
- `clipName: string`
- `sourceAssetId: string`
- `timelineTcIn: string`
- `timelineTcOut: string`
- `sourceTcIn: string`
- `sourceTcOut: string`
- `reel: string`
- `channelLayout: string`

### Marker
Timeline marker abstraction.
- `id: string`
- `timelineTc: string`
- `label: string`
- `color: "blue" | "green" | "yellow" | "red"`

### FieldRecorderCandidate
Potential field recorder match candidate per event.
- `id: string`
- `clipEventId: string`
- `candidateFile: string`
- `matchScore: number`
- `strategy: "scene_take" | "soundroll_tc" | "filename_tc"`
- `matched: boolean`

### MappingRule
Rule for source track role -> Nuendo track mapping.
- `id: string`
- `sourceTrackRole: Track["role"]`
- `targetNuendoTrack: string`
- `condition: string`

### PreservationIssue
Potential data loss / transform warning surfaced to operator.
- `id: string`
- `category: "timecode" | "channel_layout" | "metadata" | "automation" | "marker"`
- `severity: "info" | "warning" | "critical"`
- `detail: string`
- `recommendation: string`

### OutputPreset
Operator-selectable output policy.
- `id: string`
- `name: string`
- `sampleRate: 48000 | 96000`
- `bitDepth: 24 | 32`
- `pullMode: "none" | "pull_up" | "pull_down"`
- `includeReferenceVideo: boolean`

### ExportArtifact
Outbound bundle artifact status entry.
- `id: string`
- `artifactType: SourceBundleAssetType`
- `fileName: string`
- `status: "queued" | "ready"`

## SourceBundleAssetType enum
- `aaf`
- `marker_edl`
- `marker_csv`
- `metadata_csv`
- `manifest_json`
- `readme`
- `reference_video`
- `field_recorder_report`

## Phase 1 Service Interfaces (Stub Only)
- `ResolveImportService`
  - `validateBundle(input)`
  - `previewBundle(input)`
- `NuendoExportService`
  - `buildExport(job)`
- `PersistenceService`
  - `saveJobs(jobs)`
  - `loadJobs()`

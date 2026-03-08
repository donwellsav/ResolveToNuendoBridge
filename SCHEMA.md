# Conform Bridge Domain Schema (Phase 1)

## Core Entities

### TranslationJob
- `id`
- `jobName`
- `status`
- `createdAtIso`
- `updatedAtIso`
- `sourceBundle: SourceBundle`
- `mappingRules: MappingRule[]`
- `fieldRecorderCandidates: FieldRecorderCandidate[]`
- `preservationIssues: PreservationIssue[]`
- `outputPreset: OutputPreset`
- `exportArtifacts: ExportArtifact[]`

### SourceBundle
- `id`
- `resolveProject`
- `resolveTimelineVersion`
- `importedAtIso`
- `assets: SourceAsset[]`
- `timeline: Timeline`

### SourceAsset
- `id`
- `name`
- `assetType`
- `pathHint`
- `notes?`

### Timeline
- `id`
- `name`
- `frameRate`
- `startTc`
- `tracks: Track[]`
- `markers: Marker[]`

### Track
- `id`
- `name`
- `role (DX/MX/FX/BG/VO)`
- `clips: ClipEvent[]`

### ClipEvent
- `id`
- `clipName`
- `sourceAssetId`
- `timelineTcIn`
- `timelineTcOut`
- `sourceTcIn`
- `sourceTcOut`
- `reel`
- `channelLayout`

### Marker
- `id`
- `timelineTc`
- `label`
- `color`

### FieldRecorderCandidate
- `id`
- `clipEventId`
- `candidateFile`
- `matchScore`
- `strategy`
- `matched`

### MappingRule
- `id`
- `sourceTrackRole`
- `targetNuendoTrack`
- `condition`

### PreservationIssue
- `id`
- `category`
- `severity`
- `detail`
- `recommendation`

### OutputPreset
- `id`
- `name`
- `sampleRate`
- `bitDepth`
- `pullMode`
- `includeReferenceVideo`

### ExportArtifact
- `id`
- `artifactType`
- `fileName`
- `status`

## Service Contracts (Stubs)
- `ResolveImportService`
- `NuendoExportService`
- `PersistenceService`

All services are placeholder-only in phase 1.

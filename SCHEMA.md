# Conform Bridge Schema (Phase 1 Contract + Phase 2A Importer)

## Layer 1 — Intake Package (inbound only)

### SourceBundle
Intake container received from Resolve/editorial.
- `id`
- `stage: "intake"`
- `origin: "resolve" | "editorial"`
- `bundleName`
- `resolveProject`
- `resolveTimelineVersion`
- `importedAtIso`
- `intakeAssets: IntakeAsset[]`

### IntakeAsset
Inbound file entry with explicit direction metadata.
- `id`
- `stage: "intake"`
- `origin: AssetOrigin`
- `fileKind: FileKind`
- `fileRole: FileRole`
- `fileName`
- `pathHint`
- optional tech metadata: `channelCount`, `channelLayout`, `durationTimecode`, `durationFrames`, `sampleRate`
- optional audio metadata: `isPolyWav`, `hasBwf`, `hasIXml`
- optional review metadata: `status`, `note`

## Layer 2 — Canonical Normalized Translation Model

### TranslationModel (CanonicalProject)
- `id`
- `stage: "canonical"`
- `sourceBundleId`
- `timeline: NormalizedTimeline`

### NormalizedTimeline
- `id`
- `name`
- `startTimecode`
- `durationTimecode`
- `startFrame`
- `durationFrames`
- `fps`
- `sampleRate`
- `dropFrame`
- `tracks: NormalizedTrack[]`
- `markers: Marker[]`

### NormalizedTrack
- `id`
- `name`
- `role`
- `clips: ClipEvent[]`

### ClipEvent
- timing: `recordIn`, `recordOut`, `sourceIn`, `sourceOut`
- numeric timing: `recordInFrames`, `recordOutFrames`, `sourceInFrames`, `sourceOutFrames`
- metadata: `clipName`, `sourceFileName`, `reel`, `tape`, `scene`, `take`, `eventDescription`, `clipNotes`, `sourceAssetId`
- audio metadata: `channelCount`, `channelLayout`, `isPolyWav`, `hasBwf`, `hasIXml`
- conform flags: `isOffline`, `isNested`, `isFlattened`, `hasSpeedEffect`, `hasFadeIn`, `hasFadeOut`

### Marker
- `id`
- `timelineTc`
- `timelineFrame`
- `label`
- `color`

### AnalysisReport
- totals: `tracksTotal`, `clipsTotal`, `markersTotal`, `offlineAssetsTotal`
- risk summary: `highRiskCount`, `warningCount`, `blockedCount`
- summaries: `intakeCompletenessSummary`, `deliveryReadinessSummary`

## Layer 3 — Delivery Package (outbound only)

### DeliveryPackage
- `id`
- `stage: "delivery"`
- `target: "nuendo"`
- `packageName`
- `outputPresetId`
- `artifacts: DeliveryArtifact[]`

### DeliveryArtifact
- `id`
- `stage: "delivery"`
- `origin: AssetOrigin`
- `fileKind: FileKind`
- `fileRole: FileRole`
- `fileName`
- `pathHint`
- `status`
- `note?`

## Cross-Layer Supporting Models

### MappingRule
- `id`
- `sourceTrackRole`
- `targetNuendoTrack`
- `condition`

### PreservationIssue
- `id`
- `category: "preserved" | "downgraded" | "dropped" | "manual-review"`
- `severity`
- `scope`
- `title`
- `description`
- `sourceLocation`
- `targetArtifactId?`
- `targetArtifactName?`
- `recommendedAction`

### ReConformChange (ConformChangeEvent)
- `id`
- `jobId`
- `changeType: "insert" | "delete" | "move" | "trim" | "replace"`
- `oldTimecode?`
- `newTimecode?`
- `oldFrame?`
- `newFrame?`
- `note`

### TranslationJob
Orchestrates all three layers + reporting in one operator-visible unit.


## Service Boundaries (Phase 2A)
- `importer.ts` is the real intake boundary and is responsible for scanning + lightweight parsing + canonical hydration.
- `exporter.ts` remains a delivery planning stub and does not write Nuendo artifacts yet.


### Importer Hydration Rules (Phase 2A)
- Populate canonical fields from parsed intake files where values exist.
- Preserve unknown values explicitly (defaults/empty fields) instead of inventing source data.
- Emit preservation issues + blocked delivery artifacts when required intake evidence is missing.

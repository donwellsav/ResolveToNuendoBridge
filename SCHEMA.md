# Domain Schema (Phase 1)

## Core Entities

### Job
- `id: string`
- `name: string`
- `status: "draft" | "queued" | "processing" | "needs_review" | "completed" | "failed"`
- `createdAtIso: string`
- `updatedAtIso: string`
- `source: {
    show: string;
    reel: string;
    timelineName: string;
    frameRate: number;
    startTc: string;
  }`
- `target: {
    nuendoProject: string;
    sampleRate: 48000 | 96000;
    bitDepth: 24 | 32;
    pullMode: "none" | "pull_up" | "pull_down";
  }`
- `templateId: string`
- `summary: JobSummary`
- `mappings: ClipMapping[]`
- `report: PreservationReport`

### JobSummary
- `totalEvents: number`
- `mappedEvents: number`
- `unmappedEvents: number`
- `fieldRecorderMatches: number`
- `conformWarnings: number`

### ClipMapping
- `id: string`
- `resolveClipName: string`
- `sourceChannelLayout: string`
- `timecodeIn: string`
- `timecodeOut: string`
- `nuendoTrackName: string`
- `mappingStatus: "mapped" | "fallback" | "unmapped"`
- `notes: string`

### PreservationReport
- `id: string`
- `jobId: string`
- `generatedAtIso: string`
- `entries: PreservationEntry[]`

### PreservationEntry
- `id: string`
- `category: "timecode" | "handles" | "channel_layout" | "automation" | "markers" | "metadata"`
- `item: string`
- `sourceValue: string`
- `translatedValue: string`
- `result: "preserved" | "adjusted" | "dropped"`
- `reason: string`

### Template
- `id: string`
- `name: string`
- `description: string`
- `defaultFrameRate: number`
- `defaultSampleRate: 48000 | 96000`
- `trackMappings: Array<{ resolveBus: string; nuendoBus: string }>`

### FieldRecorderProfile
- `id: string`
- `name: string`
- `matchStrategy: "scene_take" | "soundroll_tc" | "filename_timecode"`
- `channelsPerPoly: number`
- `enabled: boolean`

### ReconformPreset
- `id: string`
- `name: string`
- `changeDetection: "events_only" | "events_and_fades" | "events_fades_markers"`
- `preserveManualEdits: boolean`

### AppSettings
- `theme: "charcoal" | "graphite"`
- `density: "compact" | "comfortable"`
- `showFrameCounts: boolean`
- `defaultPullMode: "none" | "pull_up" | "pull_down"`

## Service Interfaces (stubs in Phase 1)
- `ResolveImportService`
  - `validateBundle(input: unknown): Promise<{ valid: boolean; issues: string[] }>`
  - `previewBundle(input: unknown): Promise<{ timelineName: string; events: number }>`
- `NuendoExportService`
  - `buildExport(job: Job): Promise<{ artifactName: string; warnings: string[] }>`
- `PersistenceService`
  - `saveJobs(jobs: Job[]): Promise<void>`
  - `loadJobs(): Promise<Job[]>`

export type JobStatus = "draft" | "queued" | "processing" | "needs_review" | "completed" | "failed";

export type SourceBundleAssetType =
  | "aaf"
  | "marker_edl"
  | "marker_csv"
  | "metadata_csv"
  | "manifest_json"
  | "readme"
  | "reference_video"
  | "field_recorder_report";

export type SourceAsset = {
  id: string;
  name: string;
  assetType: SourceBundleAssetType;
  pathHint: string;
  notes?: string;
};

export type Marker = {
  id: string;
  timelineTc: string;
  label: string;
  color: "blue" | "green" | "yellow" | "red";
};

export type ClipEvent = {
  id: string;
  clipName: string;
  sourceAssetId: string;
  timelineTcIn: string;
  timelineTcOut: string;
  sourceTcIn: string;
  sourceTcOut: string;
  reel: string;
  channelLayout: string;
};

export type Track = {
  id: string;
  name: string;
  role: "DX" | "MX" | "FX" | "BG" | "VO";
  clips: ClipEvent[];
};

export type Timeline = {
  id: string;
  name: string;
  frameRate: 23.976 | 24 | 25 | 29.97;
  startTc: string;
  tracks: Track[];
  markers: Marker[];
};

export type SourceBundle = {
  id: string;
  resolveProject: string;
  resolveTimelineVersion: string;
  importedAtIso: string;
  assets: SourceAsset[];
  timeline: Timeline;
};

export type FieldRecorderCandidate = {
  id: string;
  clipEventId: string;
  candidateFile: string;
  matchScore: number;
  strategy: "scene_take" | "soundroll_tc" | "filename_tc";
  matched: boolean;
};

export type MappingRule = {
  id: string;
  sourceTrackRole: Track["role"];
  targetNuendoTrack: string;
  condition: string;
};

export type PreservationIssue = {
  id: string;
  category: "timecode" | "channel_layout" | "metadata" | "automation" | "marker";
  severity: "info" | "warning" | "critical";
  detail: string;
  recommendation: string;
};

export type OutputPreset = {
  id: string;
  name: string;
  sampleRate: 48000 | 96000;
  bitDepth: 24 | 32;
  pullMode: "none" | "pull_up" | "pull_down";
  includeReferenceVideo: boolean;
};

export type ExportArtifact = {
  id: string;
  artifactType: SourceBundleAssetType;
  fileName: string;
  status: "queued" | "ready";
};

export type TranslationJob = {
  id: string;
  jobName: string;
  status: JobStatus;
  createdAtIso: string;
  updatedAtIso: string;
  sourceBundle: SourceBundle;
  mappingRules: MappingRule[];
  fieldRecorderCandidates: FieldRecorderCandidate[];
  preservationIssues: PreservationIssue[];
  outputPreset: OutputPreset;
  exportArtifacts: ExportArtifact[];
};

export type AppSettings = {
  density: "compact" | "comfortable";
  defaultPresetId: string;
  showFrameCounts: boolean;
};

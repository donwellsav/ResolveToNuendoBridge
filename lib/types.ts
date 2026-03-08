export type JobStatus = "draft" | "queued" | "processing" | "needs_review" | "completed" | "failed";

export type AssetStage = "intake" | "delivery";

export type AssetOrigin = "resolve" | "editorial" | "production-audio" | "conform-bridge" | "nuendo";

export type FileKind =
  | "aaf"
  | "fcpxml"
  | "xml"
  | "edl"
  | "csv"
  | "wav"
  | "bwf"
  | "mov"
  | "mp4"
  | "json"
  | "txt"
  | "otio"
  | "otioz";

export type FileRole =
  | "timeline_exchange"
  | "marker_export"
  | "metadata_export"
  | "reference_video"
  | "production_audio"
  | "delivery_manifest"
  | "delivery_readme"
  | "field_recorder_report";

export type IntakeAsset = {
  id: string;
  stage: "intake";
  origin: AssetOrigin;
  fileKind: FileKind;
  fileRole: FileRole;
  fileName: string;
  pathHint: string;
  channelCount?: number;
  channelLayout?: string;
  durationTimecode?: string;
  durationFrames?: number;
  sampleRate?: number;
  isPolyWav?: boolean;
  hasBwf?: boolean;
  hasIXml?: boolean;
  status?: "ready" | "missing" | "offline" | "needs_review";
  note?: string;
};

export type DeliveryArtifact = {
  id: string;
  stage: "delivery";
  origin: AssetOrigin;
  fileKind: FileKind;
  fileRole: FileRole;
  fileName: string;
  pathHint: string;
  status: "planned" | "blocked" | "placeholder";
  note?: string;
};

export type Marker = {
  id: string;
  timelineTc: string;
  timelineFrame: number;
  label: string;
  color: "blue" | "green" | "yellow" | "red";
};

export type ClipEvent = {
  id: string;
  recordIn: string;
  recordOut: string;
  sourceIn: string;
  sourceOut: string;
  recordInFrames: number;
  recordOutFrames: number;
  sourceInFrames: number;
  sourceOutFrames: number;
  clipName: string;
  sourceFileName: string;
  reel: string;
  tape?: string;
  scene?: string;
  take?: string;
  eventDescription?: string;
  clipNotes?: string;
  sourceAssetId: string;
  channelCount: number;
  channelLayout: string;
  isPolyWav: boolean;
  hasBwf: boolean;
  hasIXml: boolean;
  isOffline: boolean;
  isNested: boolean;
  isFlattened: boolean;
  hasSpeedEffect: boolean;
  hasFadeIn: boolean;
  hasFadeOut: boolean;
};

export type NormalizedTrack = {
  id: string;
  name: string;
  role: "DX" | "MX" | "FX" | "BG" | "VO";
  clips: ClipEvent[];
};

export type NormalizedTimeline = {
  id: string;
  name: string;
  startTimecode: string;
  durationTimecode: string;
  startFrame: number;
  durationFrames: number;
  fps: 23.976 | 24 | 25 | 29.97;
  sampleRate: 48000 | 96000;
  dropFrame: boolean;
  tracks: NormalizedTrack[];
  markers: Marker[];
};

export type SourceBundle = {
  id: string;
  stage: "intake";
  origin: "resolve" | "editorial";
  bundleName: string;
  resolveProject: string;
  resolveTimelineVersion: string;
  importedAtIso: string;
  intakeAssets: IntakeAsset[];
};

export type MappingRule = {
  id: string;
  sourceTrackRole: NormalizedTrack["role"];
  targetNuendoTrack: string;
  condition: string;
};

export type PreservationIssue = {
  id: string;
  category: "preserved" | "downgraded" | "dropped" | "manual-review";
  severity: "info" | "warning" | "critical";
  scope: "timeline" | "track" | "clip" | "marker" | "metadata" | "delivery";
  title: string;
  description: string;
  sourceLocation: string;
  targetArtifactId?: string;
  targetArtifactName?: string;
  recommendedAction: string;
};

export type ReConformChange = {
  id: string;
  jobId: string;
  changeType: "insert" | "delete" | "move" | "trim" | "replace";
  oldTimecode?: string;
  newTimecode?: string;
  oldFrame?: number;
  newFrame?: number;
  note: string;
};

export type FieldRecorderCandidate = {
  id: string;
  clipEventId: string;
  candidateFile: string;
  matchScore: number;
  strategy: "scene_take" | "soundroll_tc" | "filename_tc";
  matched: boolean;
};

export type OutputPreset = {
  id: string;
  name: string;
  sampleRate: 48000 | 96000;
  bitDepth: 24 | 32;
  pullMode: "none" | "pull_up" | "pull_down";
  includeReferenceVideo: boolean;
};

export type AnalysisReport = {
  tracksTotal: number;
  clipsTotal: number;
  markersTotal: number;
  offlineAssetsTotal: number;
  highRiskCount: number;
  warningCount: number;
  blockedCount: number;
  intakeCompletenessSummary: string;
  deliveryReadinessSummary: string;
};

export type TranslationModel = {
  id: string;
  stage: "canonical";
  sourceBundleId: string;
  timeline: NormalizedTimeline;
};

export type DeliveryPackage = {
  id: string;
  stage: "delivery";
  target: "nuendo";
  packageName: string;
  outputPresetId: string;
  artifacts: DeliveryArtifact[];
};

export type TranslationJob = {
  id: string;
  jobName: string;
  status: JobStatus;
  createdAtIso: string;
  updatedAtIso: string;
  sourceBundle: SourceBundle;
  translationModel: TranslationModel;
  mappingRules: MappingRule[];
  fieldRecorderCandidates: FieldRecorderCandidate[];
  preservationIssues: PreservationIssue[];
  reconformChanges: ReConformChange[];
  analysisReport: AnalysisReport;
  outputPreset: OutputPreset;
  deliveryPackage: DeliveryPackage;
};

export type ImportAnalysisResult = Omit<
  TranslationJob,
  "id" | "jobName" | "status" | "createdAtIso" | "updatedAtIso" | "outputPreset" | "deliveryPackage"
>;

export type AppSettings = {
  density: "compact" | "comfortable";
  defaultPresetId: string;
  showFrameCounts: boolean;
};

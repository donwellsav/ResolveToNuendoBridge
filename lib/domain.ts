export type JobStatus =
  | "draft"
  | "queued"
  | "processing"
  | "needs_review"
  | "completed"
  | "failed";

export type MappingStatus = "mapped" | "fallback" | "unmapped";

export type Job = {
  id: string;
  name: string;
  status: JobStatus;
  createdAtIso: string;
  updatedAtIso: string;
  source: {
    show: string;
    reel: string;
    timelineName: string;
    frameRate: number;
    startTc: string;
  };
  target: {
    nuendoProject: string;
    sampleRate: 48000 | 96000;
    bitDepth: 24 | 32;
    pullMode: "none" | "pull_up" | "pull_down";
  };
  templateId: string;
  summary: JobSummary;
  mappings: ClipMapping[];
  report: PreservationReport;
};

export type JobSummary = {
  totalEvents: number;
  mappedEvents: number;
  unmappedEvents: number;
  fieldRecorderMatches: number;
  conformWarnings: number;
};

export type ClipMapping = {
  id: string;
  resolveClipName: string;
  sourceChannelLayout: string;
  timecodeIn: string;
  timecodeOut: string;
  nuendoTrackName: string;
  mappingStatus: MappingStatus;
  notes: string;
};

export type PreservationEntry = {
  id: string;
  category:
    | "timecode"
    | "handles"
    | "channel_layout"
    | "automation"
    | "markers"
    | "metadata";
  item: string;
  sourceValue: string;
  translatedValue: string;
  result: "preserved" | "adjusted" | "dropped";
  reason: string;
};

export type PreservationReport = {
  id: string;
  jobId: string;
  generatedAtIso: string;
  entries: PreservationEntry[];
};

export type Template = {
  id: string;
  name: string;
  description: string;
  defaultFrameRate: number;
  defaultSampleRate: 48000 | 96000;
  trackMappings: Array<{ resolveBus: string; nuendoBus: string }>;
};

export type FieldRecorderProfile = {
  id: string;
  name: string;
  matchStrategy: "scene_take" | "soundroll_tc" | "filename_timecode";
  channelsPerPoly: number;
  enabled: boolean;
};

export type ReconformPreset = {
  id: string;
  name: string;
  changeDetection: "events_only" | "events_and_fades" | "events_fades_markers";
  preserveManualEdits: boolean;
};

export type AppSettings = {
  theme: "charcoal" | "graphite";
  density: "compact" | "comfortable";
  showFrameCounts: boolean;
  defaultPullMode: "none" | "pull_up" | "pull_down";
};

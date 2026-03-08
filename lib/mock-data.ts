import type {
  AppSettings,
  MappingRule,
  OutputPreset,
  SourceBundle,
  TranslationJob,
} from "@/lib/types";

export const outputPresets: OutputPreset[] = [
  {
    id: "preset-tv-48k",
    name: "TV Episodic 48k",
    sampleRate: 48000,
    bitDepth: 24,
    pullMode: "none",
    includeReferenceVideo: true,
  },
  {
    id: "preset-feature-96k",
    name: "Feature Printmaster 96k",
    sampleRate: 96000,
    bitDepth: 24,
    pullMode: "pull_down",
    includeReferenceVideo: true,
  },
];

const baseMappingRules: MappingRule[] = [
  { id: "map-dx", sourceTrackRole: "DX", targetNuendoTrack: "DX_MAIN", condition: "Always map dialogue tracks" },
  { id: "map-mx", sourceTrackRole: "MX", targetNuendoTrack: "MX_STEM", condition: "Match music stem buses" },
  { id: "map-fx", sourceTrackRole: "FX", targetNuendoTrack: "FX_STEM", condition: "Preserve effects channel order" },
];

const inboundBundle: SourceBundle = {
  id: "bundle-rh-e03-r4",
  resolveProject: "Red Harbor",
  resolveTimelineVersion: "RH_E03_R4_LOCK_v12",
  importedAtIso: "2026-03-05T09:32:00.000Z",
  assets: [
    { id: "asset-aaf", name: "RH_E03_R4_v12.aaf", assetType: "aaf", pathHint: "incoming/RH_E03_R4_v12.aaf" },
    { id: "asset-edl", name: "RH_E03_R4_markers.edl", assetType: "marker_edl", pathHint: "incoming/markers.edl" },
    { id: "asset-meta", name: "RH_E03_R4_metadata.csv", assetType: "metadata_csv", pathHint: "incoming/metadata.csv" },
    { id: "asset-ref", name: "RH_E03_R4_ref.mov", assetType: "reference_video", pathHint: "incoming/ref.mov" },
  ],
  timeline: {
    id: "tl-rh-e03-r4",
    name: "RH_E03_R4_LOCK_v12",
    frameRate: 23.976,
    startTc: "01:00:00:00",
    markers: [
      { id: "mk-01", timelineTc: "01:08:12:00", label: "ADR NOTE SC15", color: "yellow" },
      { id: "mk-02", timelineTc: "01:10:03:19", label: "FX SWELL OUT", color: "blue" },
    ],
    tracks: [
      {
        id: "trk-dx1",
        name: "DX A",
        role: "DX",
        clips: [
          {
            id: "evt-001",
            clipName: "A102C008_230915",
            sourceAssetId: "asset-aaf",
            timelineTcIn: "01:08:11:12",
            timelineTcOut: "01:08:18:02",
            sourceTcIn: "10:41:02:14",
            sourceTcOut: "10:41:09:04",
            reel: "R4",
            channelLayout: "L,R,C,LFE,Ls,Rs",
          },
        ],
      },
      {
        id: "trk-fx1",
        name: "FX A",
        role: "FX",
        clips: [
          {
            id: "evt-002",
            clipName: "BG_STREET_RAIN",
            sourceAssetId: "asset-aaf",
            timelineTcIn: "01:08:22:08",
            timelineTcOut: "01:08:32:17",
            sourceTcIn: "08:10:17:20",
            sourceTcOut: "08:10:28:05",
            reel: "R4",
            channelLayout: "L,R",
          },
        ],
      },
    ],
  },
};

export const translationJobs: TranslationJob[] = [
  {
    id: "job-2403-e03-r4",
    jobName: "E03 Reel 4 Final Mix Prep",
    status: "needs_review",
    createdAtIso: "2026-03-05T09:34:00.000Z",
    updatedAtIso: "2026-03-05T09:51:00.000Z",
    sourceBundle: inboundBundle,
    mappingRules: baseMappingRules,
    fieldRecorderCandidates: [
      {
        id: "frc-01",
        clipEventId: "evt-001",
        candidateFile: "SC15_TK03_20260304.WAV",
        matchScore: 98,
        strategy: "scene_take",
        matched: true,
      },
      {
        id: "frc-02",
        clipEventId: "evt-002",
        candidateFile: "RAIN_WILDTRACK_02.WAV",
        matchScore: 61,
        strategy: "filename_tc",
        matched: false,
      },
    ],
    preservationIssues: [
      {
        id: "pi-01",
        category: "channel_layout",
        severity: "warning",
        detail: "5.1 input bus renamed to Nuendo 5.1 Film layout.",
        recommendation: "Verify fold-down behavior in premix template.",
      },
      {
        id: "pi-02",
        category: "metadata",
        severity: "info",
        detail: "Take metadata preserved for 93% of dialogue events.",
        recommendation: "Review 7% fallback matches in Field Recorder tab.",
      },
    ],
    outputPreset: outputPresets[0],
    exportArtifacts: [
      { id: "out-01", artifactType: "aaf", fileName: "RH_E03_R4_NUENDO.aaf", status: "queued" },
      { id: "out-02", artifactType: "marker_csv", fileName: "RH_E03_R4_MARKERS.csv", status: "queued" },
      { id: "out-03", artifactType: "manifest_json", fileName: "manifest.json", status: "queued" },
      { id: "out-04", artifactType: "readme", fileName: "README_IMPORT.txt", status: "queued" },
    ],
  },
];

export const templateMappingRules: MappingRule[] = baseMappingRules;

export const appSettings: AppSettings = {
  density: "compact",
  defaultPresetId: "preset-tv-48k",
  showFrameCounts: true,
};

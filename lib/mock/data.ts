import type {
  AppSettings,
  FieldRecorderProfile,
  Job,
  ReconformPreset,
  Template,
} from "@/lib/domain";

export const templates: Template[] = [
  {
    id: "tpl-drama-5-1",
    name: "Drama 5.1 Conform",
    description: "Standard episodic dialogue/music/effects split with 5.1 busses.",
    defaultFrameRate: 23.976,
    defaultSampleRate: 48000,
    trackMappings: [
      { resolveBus: "DX", nuendoBus: "DIALOGUE_5.1" },
      { resolveBus: "MX", nuendoBus: "MUSIC_5.1" },
      { resolveBus: "FX", nuendoBus: "EFFECTS_5.1" },
    ],
  },
  {
    id: "tpl-feature-atmos",
    name: "Feature Atmos Prep",
    description: "Film workflow with expanded stem mapping and Atmos-ready bed organization.",
    defaultFrameRate: 24,
    defaultSampleRate: 96000,
    trackMappings: [
      { resolveBus: "DX", nuendoBus: "DX_BED" },
      { resolveBus: "MX", nuendoBus: "MX_BED" },
      { resolveBus: "FX", nuendoBus: "FX_BED" },
    ],
  },
];

export const jobs: Job[] = [
  {
    id: "job-2403-e03-r4",
    name: "E03 Reel 4 Final Mix Prep",
    status: "needs_review",
    createdAtIso: "2026-03-02T11:20:00.000Z",
    updatedAtIso: "2026-03-03T09:05:00.000Z",
    source: {
      show: "Red Harbor",
      reel: "R4",
      timelineName: "RH_E03_R4_LOCK_v12",
      frameRate: 23.976,
      startTc: "01:00:00:00",
    },
    target: {
      nuendoProject: "RH_E03_R4_CONFORM",
      sampleRate: 48000,
      bitDepth: 24,
      pullMode: "none",
    },
    templateId: "tpl-drama-5-1",
    summary: {
      totalEvents: 342,
      mappedEvents: 333,
      unmappedEvents: 9,
      fieldRecorderMatches: 77,
      conformWarnings: 4,
    },
    mappings: [
      {
        id: "map-01",
        resolveClipName: "A102C008_230915",
        sourceChannelLayout: "L,R,C,LFE,Ls,Rs",
        timecodeIn: "01:08:11:12",
        timecodeOut: "01:08:18:02",
        nuendoTrackName: "DX_PRINCIPAL",
        mappingStatus: "mapped",
        notes: "Matched scene metadata and poly channel tags.",
      },
      {
        id: "map-02",
        resolveClipName: "BOOM_ALT_15B",
        sourceChannelLayout: "L,R",
        timecodeIn: "01:08:19:10",
        timecodeOut: "01:08:22:07",
        nuendoTrackName: "DX_ALT",
        mappingStatus: "fallback",
        notes: "Fallback to filename+TC due to missing take field.",
      },
      {
        id: "map-03",
        resolveClipName: "BG_STREET_RAIN",
        sourceChannelLayout: "L,R",
        timecodeIn: "01:08:22:08",
        timecodeOut: "01:08:32:17",
        nuendoTrackName: "",
        mappingStatus: "unmapped",
        notes: "No template route for BG weather pass bus.",
      },
    ],
    report: {
      id: "rep-2403-e03-r4",
      jobId: "job-2403-e03-r4",
      generatedAtIso: "2026-03-03T09:04:00.000Z",
      entries: [
        {
          id: "pre-01",
          category: "timecode",
          item: "Timeline start",
          sourceValue: "01:00:00:00",
          translatedValue: "01:00:00:00",
          result: "preserved",
          reason: "Exact frame rate and pull mode match.",
        },
        {
          id: "pre-02",
          category: "channel_layout",
          item: "Clip A102C008_230915",
          sourceValue: "L,R,C,LFE,Ls,Rs",
          translatedValue: "5.1 Film",
          result: "adjusted",
          reason: "Mapped to Nuendo bus naming convention.",
        },
      ],
    },
  },
  {
    id: "job-2403-e04-r1",
    name: "E04 Reel 1 Temp Conform",
    status: "processing",
    createdAtIso: "2026-03-04T13:45:00.000Z",
    updatedAtIso: "2026-03-04T14:02:00.000Z",
    source: {
      show: "Red Harbor",
      reel: "R1",
      timelineName: "RH_E04_R1_TEMP_v03",
      frameRate: 23.976,
      startTc: "01:00:00:00",
    },
    target: {
      nuendoProject: "RH_E04_R1_TEMP_CONFORM",
      sampleRate: 48000,
      bitDepth: 24,
      pullMode: "none",
    },
    templateId: "tpl-drama-5-1",
    summary: {
      totalEvents: 188,
      mappedEvents: 188,
      unmappedEvents: 0,
      fieldRecorderMatches: 53,
      conformWarnings: 1,
    },
    mappings: [],
    report: {
      id: "rep-2403-e04-r1",
      jobId: "job-2403-e04-r1",
      generatedAtIso: "2026-03-04T14:01:00.000Z",
      entries: [],
    },
  },
];

export const fieldRecorderProfiles: FieldRecorderProfile[] = [
  {
    id: "fr-default-tv",
    name: "TV Episodic: Scene/Take",
    matchStrategy: "scene_take",
    channelsPerPoly: 8,
    enabled: true,
  },
  {
    id: "fr-soundroll",
    name: "Soundroll + TC",
    matchStrategy: "soundroll_tc",
    channelsPerPoly: 8,
    enabled: false,
  },
];

export const reconformPresets: ReconformPreset[] = [
  {
    id: "rc-episodic-safe",
    name: "Episodic Safe ReConform",
    changeDetection: "events_and_fades",
    preserveManualEdits: true,
  },
  {
    id: "rc-full-change-pass",
    name: "Full Change Pass",
    changeDetection: "events_fades_markers",
    preserveManualEdits: false,
  },
];

export const appSettings: AppSettings = {
  theme: "charcoal",
  density: "compact",
  showFrameCounts: true,
  defaultPullMode: "none",
};

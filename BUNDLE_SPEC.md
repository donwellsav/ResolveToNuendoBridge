# Bundle Spec (Phase 1 Mock Contract)

## Purpose
Defines the conceptual shape of Resolve-originating bundles used by the bridge. This document does not imply parser implementation in this phase.

## Inbound Bundle (Conceptual)
A Resolve bundle is expected to include:
- Timeline metadata (`timelineName`, frame rate, start timecode)
- Event list with clip identifiers and ranges
- Audio source references (file names, channel layouts, sound roll)
- Marker and metadata payload for conform guidance

```ts
type ResolveBundleDraft = {
  bundleVersion: "0.1";
  sourceApp: "resolve";
  sourceVersion: string;
  project: {
    show: string;
    episode?: string;
    reel: string;
    timelineName: string;
    frameRate: number;
    startTc: string;
  };
  events: Array<{
    id: string;
    clipName: string;
    sourceFile: string;
    sourceTcIn: string;
    sourceTcOut: string;
    timelineTcIn: string;
    timelineTcOut: string;
    channels: string;
    markers?: string[];
  }>;
};
```

## Outbound Export Artifact (Conceptual)
A Nuendo-targeting export payload should eventually contain:
- Track and channel mapping plan
- Event conform operations
- Field recorder relink decisions
- Preservation report summary

```ts
type NuendoExportDraft = {
  exportVersion: "0.1";
  targetApp: "nuendo";
  targetVersion: string;
  jobId: string;
  timelineName: string;
  operations: Array<{
    type: "create_event" | "move_event" | "map_channel" | "attach_metadata";
    description: string;
  }>;
  warnings: string[];
};
```

## Validation Rules (Phase 1)
- Bundle versions must be explicit.
- Frame rate must be one of internally supported values.
- Timecode fields must use `HH:MM:SS:FF` format.
- Event IDs must be stable and unique.

No runtime parser enforcement is included in this phase.

import type { ClipEvent, Marker, TranslationModel } from "@/lib/types";

type ParsedAafTrack = TranslationModel["timeline"]["tracks"][number];

type ParsedAafTimeline = {
  timelineName?: string;
  fps?: TranslationModel["timeline"]["fps"];
  startTimecode?: string;
  tracks: ParsedAafTrack[];
  markers: Marker[];
};

type TokenMap = Record<string, string>;

function parseTokens(raw: string): TokenMap {
  const tokens: TokenMap = {};
  const regex = /(\w+)=(("[^"]*")|([^\s]+))/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(raw))) {
    const key = match[1];
    const value = match[2].replace(/^"|"$/g, "");
    tokens[key] = value;
  }
  return tokens;
}

function asInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBool(value: string | undefined): boolean | undefined {
  if (value === undefined) return undefined;
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;
  return undefined;
}

function asFps(value: string | undefined): ParsedAafTimeline["fps"] | undefined {
  const parsed = Number(value);
  if (parsed === 24 || parsed === 25) return parsed;
  if (parsed === 23.976 || parsed === 29.97) return parsed;
  return undefined;
}

function toExplicit(value: string | undefined, fallback: string): string {
  return value && value.trim().length > 0 ? value : fallback;
}

function toClip(tokens: TokenMap, clipIndex: number): ClipEvent {
  const recordInFrames = asInt(tokens.recordInFrames, 0);
  const recordOutFrames = asInt(tokens.recordOutFrames, recordInFrames);
  const sourceInFrames = asInt(tokens.sourceInFrames, 0);
  const sourceOutFrames = asInt(tokens.sourceOutFrames, sourceInFrames);

  return {
    id: `evt-aaf-${clipIndex}`,
    recordIn: toExplicit(tokens.recordIn, "UNKNOWN"),
    recordOut: toExplicit(tokens.recordOut, "UNKNOWN"),
    sourceIn: toExplicit(tokens.sourceIn, "UNKNOWN"),
    sourceOut: toExplicit(tokens.sourceOut, "UNKNOWN"),
    recordInFrames,
    recordOutFrames,
    sourceInFrames,
    sourceOutFrames,
    clipName: toExplicit(tokens.name, `AAF Clip ${clipIndex}`),
    sourceFileName: toExplicit(tokens.sourceFile, toExplicit(tokens.mob, "UNKNOWN")),
    reel: toExplicit(tokens.reel, "UNKNOWN"),
    tape: tokens.tape,
    scene: tokens.scene,
    take: tokens.take,
    eventDescription: tokens.eventDescription,
    clipNotes: tokens.clipNotes,
    sourceAssetId: `in-${toExplicit(tokens.sourceFile, toExplicit(tokens.mob, `unknown-${clipIndex}`))
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()}`,
    channelCount: asInt(tokens.channels, 0),
    channelLayout: toExplicit(tokens.layout, "UNKNOWN"),
    isPolyWav: asBool(tokens.isPolyWav) ?? false,
    hasBwf: asBool(tokens.hasBwf) ?? false,
    hasIXml: asBool(tokens.hasIXml) ?? false,
    isOffline: asBool(tokens.offline) ?? false,
    isNested: false,
    isFlattened: true,
    hasSpeedEffect: false,
    hasFadeIn: asBool(tokens.fadeIn) ?? false,
    hasFadeOut: asBool(tokens.fadeOut) ?? false,
  };
}

export function parseAaf(content: string): ParsedAafTimeline {
  const tracksById = new Map<string, ParsedAafTrack>();
  const markers: Marker[] = [];
  let timelineName: string | undefined;
  let fps: ParsedAafTimeline["fps"] | undefined;
  let startTimecode: string | undefined;
  let clipIndex = 0;

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  lines.forEach((line) => {
    if (line.startsWith("TIMELINE")) {
      const tokens = parseTokens(line);
      timelineName = tokens.name ?? timelineName;
      fps = asFps(tokens.fps) ?? fps;
      startTimecode = tokens.start ?? startTimecode;
      return;
    }

    if (line.startsWith("TRACK")) {
      const tokens = parseTokens(line);
      const trackId = tokens.id ?? `t${tracksById.size + 1}`;
      if (!tracksById.has(trackId)) {
        tracksById.set(trackId, {
          id: `trk-aaf-${trackId}`,
          name: toExplicit(tokens.name, `AAF Track ${tracksById.size + 1}`),
          role: (tokens.role as ParsedAafTrack["role"]) || "DX",
          clips: [],
        });
      }
      return;
    }

    if (line.startsWith("CLIP")) {
      const tokens = parseTokens(line);
      const trackKey = tokens.track ?? "t1";
      if (!tracksById.has(trackKey)) {
        tracksById.set(trackKey, {
          id: `trk-aaf-${trackKey}`,
          name: `AAF Track ${tracksById.size + 1}`,
          role: "DX",
          clips: [],
        });
      }

      clipIndex += 1;
      tracksById.get(trackKey)?.clips.push(toClip(tokens, clipIndex));
      return;
    }

    if (line.startsWith("MARKER")) {
      const tokens = parseTokens(line);
      const markerIndex = markers.length + 1;
      markers.push({
        id: `mk-aaf-${markerIndex}`,
        timelineTc: toExplicit(tokens.tc, "UNKNOWN"),
        timelineFrame: asInt(tokens.frame, markerIndex),
        label: toExplicit(tokens.label, `AAF Marker ${markerIndex}`),
        color: "yellow",
      });
    }
  });

  return {
    timelineName,
    fps,
    startTimecode,
    tracks: Array.from(tracksById.values()),
    markers,
  };
}

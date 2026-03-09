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

type ParsedContext = {
  currentComposition?: string;
};

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

function asFloat(value: string | undefined): number | undefined {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : undefined;
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

function normalizeTrackRole(value: string | undefined): ParsedAafTrack["role"] {
  if (value === "DX" || value === "MX" || value === "FX" || value === "BG" || value === "VO") return value;
  return "DX";
}

function inferOffline(tokens: TokenMap): boolean {
  const explicitOffline = asBool(tokens.offline);
  if (explicitOffline !== undefined) return explicitOffline;

  const missingRef = asBool(tokens.missingRef) ?? asBool(tokens.mediaMissing) ?? asBool(tokens.offlineRef);
  if (missingRef !== undefined) return missingRef;

  const mediaStatus = (tokens.mediaStatus ?? "").toLowerCase();
  return mediaStatus === "missing" || mediaStatus === "offline";
}

function inferSourceName(tokens: TokenMap, clipIndex: number): string {
  return toExplicit(tokens.sourceFile, toExplicit(tokens.mobName, toExplicit(tokens.mob, `UNKNOWN_SOURCE_${clipIndex}`)));
}

function inferHasSpeedEffect(tokens: TokenMap): boolean {
  const explicit = asBool(tokens.hasSpeedEffect);
  if (explicit !== undefined) return explicit;
  const ratio = asFloat(tokens.speed) ?? asFloat(tokens.speedRatio);
  if (ratio !== undefined) return ratio !== 1;
  return Boolean(tokens.speedEffect || tokens.timeWarp || tokens.retime);
}

function inferFadeFlag(tokens: TokenMap, direction: "in" | "out"): boolean {
  const explicit = asBool(direction === "in" ? tokens.fadeIn : tokens.fadeOut);
  if (explicit !== undefined) return explicit;
  const frameCount = asInt(direction === "in" ? tokens.fadeInFrames : tokens.fadeOutFrames, 0);
  if (frameCount > 0) return true;
  const curve = direction === "in" ? tokens.fadeInCurve : tokens.fadeOutCurve;
  return Boolean(curve);
}

function toClip(tokens: TokenMap, clipIndex: number, context: ParsedContext): ClipEvent {
  const recordInFrames = asInt(tokens.recordInFrames, 0);
  const recordOutFrames = asInt(tokens.recordOutFrames, recordInFrames);
  const sourceInFrames = asInt(tokens.sourceInFrames, 0);
  const sourceOutFrames = asInt(tokens.sourceOutFrames, sourceInFrames);
  const sourceFileName = inferSourceName(tokens, clipIndex);

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
    sourceFileName,
    reel: toExplicit(tokens.reel, "UNKNOWN"),
    tape: toExplicit(tokens.tape, tokens.soundRoll),
    scene: tokens.scene,
    take: tokens.take,
    eventDescription: tokens.eventDescription ?? tokens.mobName ?? tokens.mob ?? context.currentComposition,
    clipNotes: tokens.clipNotes ?? tokens.mediaRef ?? tokens.sourcePath,
    sourceAssetId: `in-${sourceFileName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
    channelCount: asInt(tokens.channels, 0),
    channelLayout: toExplicit(tokens.layout ?? tokens.channelLayout, "UNKNOWN"),
    isPolyWav: asBool(tokens.isPolyWav) ?? false,
    hasBwf: asBool(tokens.hasBwf) ?? false,
    hasIXml: asBool(tokens.hasIXml) ?? false,
    isOffline: inferOffline(tokens),
    isNested: asBool(tokens.isNested) ?? false,
    isFlattened: asBool(tokens.isFlattened) ?? true,
    hasSpeedEffect: inferHasSpeedEffect(tokens),
    hasFadeIn: inferFadeFlag(tokens, "in"),
    hasFadeOut: inferFadeFlag(tokens, "out"),
  };
}

export function parseAaf(content: string): ParsedAafTimeline {
  const tracksById = new Map<string, ParsedAafTrack>();
  const markers: Marker[] = [];
  let timelineName: string | undefined;
  let fps: ParsedAafTimeline["fps"] | undefined;
  let startTimecode: string | undefined;
  let clipIndex = 0;
  const context: ParsedContext = {};

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

    if (line.startsWith("COMPOSITION")) {
      const tokens = parseTokens(line);
      context.currentComposition = tokens.name ?? context.currentComposition;
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
          role: normalizeTrackRole(tokens.role),
          clips: [],
        });
      }
      return;
    }

    if (line.startsWith("EVENT") || line.startsWith("CLIP")) {
      const tokens = parseTokens(line);
      const trackKey = tokens.track ?? tokens.trackId ?? "t1";
      if (!tracksById.has(trackKey)) {
        tracksById.set(trackKey, {
          id: `trk-aaf-${trackKey}`,
          name: `AAF Track ${tracksById.size + 1}`,
          role: "DX",
          clips: [],
        });
      }

      clipIndex += 1;
      tracksById.get(trackKey)?.clips.push(toClip(tokens, clipIndex, context));
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

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
  mobSlots: Map<string, string>;
  sourceMobById: Map<string, TokenMap>;
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

function firstDefined(tokens: TokenMap, keys: string[]): string | undefined {
  return keys.map((key) => tokens[key]).find((value) => value !== undefined);
}

function inferOffline(tokens: TokenMap): boolean {
  const explicitOffline = asBool(tokens.offline);
  if (explicitOffline !== undefined) return explicitOffline;

  const missingRef = asBool(tokens.missingRef) ?? asBool(tokens.mediaMissing) ?? asBool(tokens.offlineRef) ?? asBool(tokens.fileMissing);
  if (missingRef !== undefined) return missingRef;

  const mediaStatus = (tokens.mediaStatus ?? tokens.mediaRefStatus ?? "").toLowerCase();
  return mediaStatus === "missing" || mediaStatus === "offline";
}

function inferSourceName(tokens: TokenMap, clipIndex: number): string {
  return toExplicit(
    firstDefined(tokens, ["sourceFile", "mediaFile", "locatorFile", "sourcePath", "mobName", "mob"]),
    `UNKNOWN_SOURCE_${clipIndex}`
  );
}

function inferHasSpeedEffect(tokens: TokenMap): boolean {
  const explicit = asBool(tokens.hasSpeedEffect) ?? asBool(tokens.timeWarp) ?? asBool(tokens.retime);
  if (explicit !== undefined) return explicit;
  const ratio = asFloat(tokens.speed) ?? asFloat(tokens.speedRatio) ?? asFloat(tokens.playbackRate);
  if (ratio !== undefined) return ratio !== 1;
  return Boolean(tokens.speedEffect || tokens.transitionEffect || tokens.effectHint);
}

function inferFadeFlag(tokens: TokenMap, direction: "in" | "out"): boolean {
  const explicit = asBool(direction === "in" ? tokens.fadeIn : tokens.fadeOut);
  if (explicit !== undefined) return explicit;
  const frameCount = asInt(direction === "in" ? tokens.fadeInFrames : tokens.fadeOutFrames, 0);
  if (frameCount > 0) return true;
  const curve = direction === "in" ? tokens.fadeInCurve : tokens.fadeOutCurve;
  return Boolean(curve);
}

function composeNotes(tokens: TokenMap): string | undefined {
  const parts = [tokens.clipNotes, tokens.comment, tokens.locatorComment, tokens.mediaDescriptor, tokens.transition, tokens.effectHint].filter(Boolean);
  if (parts.length === 0) return undefined;
  return parts.join(" | ");
}

function toClip(tokens: TokenMap, clipIndex: number, context: ParsedContext): ClipEvent {
  const recordInFrames = asInt(firstDefined(tokens, ["recordInFrames", "timelineInFrames", "editInFrames"]), 0);
  const recordOutFrames = asInt(firstDefined(tokens, ["recordOutFrames", "timelineOutFrames", "editOutFrames"]), recordInFrames);
  const sourceInFrames = asInt(firstDefined(tokens, ["sourceInFrames", "srcInFrames"]), 0);
  const sourceOutFrames = asInt(firstDefined(tokens, ["sourceOutFrames", "srcOutFrames"]), sourceInFrames);
  const sourceFileName = inferSourceName(tokens, clipIndex);
  const sourceClipIdentity = firstDefined(tokens, ["sourceClipId", "sourceClipIdentity", "sourceMobId", "mobId"]);
  const descriptor = [tokens.mediaDescriptor, tokens.descriptorClass, tokens.codec].filter(Boolean).join(",");

  return {
    id: `evt-aaf-${clipIndex}`,
    recordIn: toExplicit(firstDefined(tokens, ["recordIn", "timelineIn", "editIn"]), "UNKNOWN"),
    recordOut: toExplicit(firstDefined(tokens, ["recordOut", "timelineOut", "editOut"]), "UNKNOWN"),
    sourceIn: toExplicit(firstDefined(tokens, ["sourceIn", "srcIn"]), "UNKNOWN"),
    sourceOut: toExplicit(firstDefined(tokens, ["sourceOut", "srcOut"]), "UNKNOWN"),
    recordInFrames,
    recordOutFrames,
    sourceInFrames,
    sourceOutFrames,
    clipName: toExplicit(firstDefined(tokens, ["name", "sourceClipName"]), `AAF Clip ${clipIndex}`),
    sourceFileName,
    reel: toExplicit(firstDefined(tokens, ["reel", "soundRoll", "sourcePackageReel"]), "UNKNOWN"),
    tape: firstDefined(tokens, ["tape", "soundRoll", "sourcePackageTape"]),
    scene: tokens.scene,
    take: tokens.take,
    eventDescription:
      firstDefined(tokens, ["eventDescription", "transition", "effectHint", "mobName", "sourceMobName"]) ?? context.currentComposition,
    clipNotes: composeNotes(tokens),
    sourceAssetId: sourceClipIdentity ? `in-${sourceClipIdentity}` : `in-${sourceFileName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
    channelCount: asInt(firstDefined(tokens, ["channels", "channelCount"]), 0),
    channelLayout: toExplicit(firstDefined(tokens, ["layout", "channelLayout"]), "UNKNOWN"),
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

function addMarker(tokens: TokenMap, markers: Marker[], prefix: "mk-aaf" | "loc-aaf") {
  const markerIndex = markers.length + 1;
  markers.push({
    id: `${prefix}-${markerIndex}`,
    timelineTc: toExplicit(firstDefined(tokens, ["tc", "timelineTc", "recordIn", "position"]), "UNKNOWN"),
    timelineFrame: asInt(firstDefined(tokens, ["frame", "timelineFrame", "recordInFrames"]), markerIndex),
    label: toExplicit(firstDefined(tokens, ["label", "name", "comment", "text"]), `AAF Marker ${markerIndex}`),
    color: "yellow",
  });
}

export function parseAaf(content: string): ParsedAafTimeline {
  const tracksById = new Map<string, ParsedAafTrack>();
  const markers: Marker[] = [];
  let timelineName: string | undefined;
  let fps: ParsedAafTimeline["fps"] | undefined;
  let startTimecode: string | undefined;
  let clipIndex = 0;
  const context: ParsedContext = {
    mobSlots: new Map<string, string>(),
    sourceMobById: new Map<string, TokenMap>(),
  };

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

    if (line.startsWith("MOBSLOT")) {
      const tokens = parseTokens(line);
      const slotId = firstDefined(tokens, ["slotId", "id"]);
      const trackId = firstDefined(tokens, ["track", "trackId"]);
      if (slotId && trackId) context.mobSlots.set(slotId, trackId);
      return;
    }

    if (line.startsWith("SOURCEMOB")) {
      const tokens = parseTokens(line);
      const sourceMobId = firstDefined(tokens, ["id", "sourceMobId"]);
      if (sourceMobId) context.sourceMobById.set(sourceMobId, tokens);
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

    if (line.startsWith("SOURCECLIP") || line.startsWith("EVENT") || line.startsWith("CLIP")) {
      const tokens = parseTokens(line);
      const slotTrack = tokens.slotId ? context.mobSlots.get(tokens.slotId) : undefined;
      const sourceMob = firstDefined(tokens, ["sourceMobId", "mobId"]);
      const sourceMobTokens = sourceMob ? context.sourceMobById.get(sourceMob) : undefined;
      const merged = sourceMobTokens ? { ...sourceMobTokens, ...tokens } : tokens;
      const trackKey = firstDefined(merged, ["track", "trackId"]) ?? slotTrack ?? "t1";
      if (!tracksById.has(trackKey)) {
        tracksById.set(trackKey, {
          id: `trk-aaf-${trackKey}`,
          name: `AAF Track ${tracksById.size + 1}`,
          role: "DX",
          clips: [],
        });
      }

      clipIndex += 1;
      tracksById.get(trackKey)?.clips.push(toClip(merged, clipIndex, context));
      return;
    }

    if (line.startsWith("MARKER")) {
      addMarker(parseTokens(line), markers, "mk-aaf");
      return;
    }

    if (line.startsWith("LOCATOR") || line.startsWith("COMMENT")) {
      addMarker(parseTokens(line), markers, "loc-aaf");
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

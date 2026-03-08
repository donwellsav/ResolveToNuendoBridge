import type { ClipEvent, Marker, TranslationModel } from "@/lib/types";

type ParsedClip = ClipEvent;
type ParsedTrack = TranslationModel["timeline"]["tracks"][number];

type ParsedFcpxmlTimeline = {
  timelineName?: string;
  fps?: TranslationModel["timeline"]["fps"];
  startTimecode?: string;
  dropFrame?: boolean;
  tracks: ParsedTrack[];
  markers: Marker[];
};

function parseAttributes(raw: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRegex = /(\w+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRegex.exec(raw))) {
    attrs[match[1]] = match[2];
  }
  return attrs;
}

function parseFractionalSeconds(value: string | undefined): number {
  if (!value) return 0;
  if (value.includes("/")) {
    const cleaned = value.replace(/s$/i, "");
    const [numeratorRaw, denominatorRaw] = cleaned.split("/");
    const numerator = Number(numeratorRaw);
    const denominator = Number(denominatorRaw);
    if (Number.isFinite(numerator) && Number.isFinite(denominator) && denominator !== 0) {
      return numerator / denominator;
    }
  }

  const numeric = Number(value.replace(/s$/i, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function frameDurationToFps(frameDuration: string | undefined): ParsedFcpxmlTimeline["fps"] | undefined {
  if (!frameDuration) return undefined;
  const secondsPerFrame = parseFractionalSeconds(frameDuration);
  if (!secondsPerFrame) return undefined;
  const fps = 1 / secondsPerFrame;
  const candidates: NonNullable<ParsedFcpxmlTimeline["fps"]>[] = [23.976, 24, 25, 29.97];
  const nearest = candidates
    .map((candidate) => ({ candidate, diff: Math.abs(candidate - fps) }))
    .sort((a, b) => a.diff - b.diff)[0];
  return nearest && nearest.diff < 0.05 ? nearest.candidate : undefined;
}

function framesToTimecode(frame: number, fps: number): string {
  const safeFrame = Math.max(0, Math.round(frame));
  const fpsInt = Math.max(1, Math.round(fps));
  const framePart = safeFrame % fpsInt;
  const totalSeconds = Math.floor(safeFrame / fpsInt);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const ff = String(framePart).padStart(2, "0");
  return `${hh}:${mm}:${ss}:${ff}`;
}

function secondsToFrames(seconds: number, fps: number): number {
  return Math.max(0, Math.round(seconds * fps));
}

export function parseFcpxml(content: string): ParsedFcpxmlTimeline {
  const assetsById = new Map<string, Record<string, string>>();
  const formatById = new Map<string, Record<string, string>>();

  const formatRegex = /<format\s+([^>]*)\/>/g;
  let formatMatch: RegExpExecArray | null;
  while ((formatMatch = formatRegex.exec(content))) {
    const attrs = parseAttributes(formatMatch[1]);
    if (attrs.id) formatById.set(attrs.id, attrs);
  }

  const assetRegex = /<asset\s+([^>]*)\/>/g;
  let assetMatch: RegExpExecArray | null;
  while ((assetMatch = assetRegex.exec(content))) {
    const attrs = parseAttributes(assetMatch[1]);
    if (attrs.id) assetsById.set(attrs.id, attrs);
  }

  const sequenceTag = content.match(/<sequence\s+([^>]*)>/)?.[1] ?? "";
  const sequenceAttrs = parseAttributes(sequenceTag);
  const sequenceName = sequenceAttrs.name;
  const sequenceFormat = formatById.get(sequenceAttrs.format ?? "");
  const fps = frameDurationToFps(sequenceFormat?.frameDuration) ?? 24;
  const startFrames = secondsToFrames(parseFractionalSeconds(sequenceAttrs.tcStart), fps);

  const clipRegex = /<(asset-clip|clip)\s+([^>]*)>([\s\S]*?)<\/\1>/g;
  const tracksByLane = new Map<string, ParsedTrack>();
  const markers: Marker[] = [];
  let clipIndex = 0;
  let markerIndex = 0;
  let clipMatch: RegExpExecArray | null;

  while ((clipMatch = clipRegex.exec(content))) {
    clipIndex += 1;
    const clipAttrs = parseAttributes(clipMatch[2]);
    const clipBody = clipMatch[3] ?? "";

    const lane = clipAttrs.lane && clipAttrs.lane !== "0" ? clipAttrs.lane : "A1";
    if (!tracksByLane.has(lane)) {
      tracksByLane.set(lane, {
        id: `trk-fcpxml-${tracksByLane.size + 1}`,
        name: `Lane ${lane}`,
        role: "DX",
        clips: [],
      });
    }

    const recordInFrames = startFrames + secondsToFrames(parseFractionalSeconds(clipAttrs.start), fps);
    const clipDurationFrames = secondsToFrames(parseFractionalSeconds(clipAttrs.duration), fps);
    const recordOutFrames = recordInFrames + clipDurationFrames;
    const sourceInFrames = secondsToFrames(parseFractionalSeconds(clipAttrs.offset || clipAttrs.start), fps);
    const sourceOutFrames = sourceInFrames + clipDurationFrames;

    const assetInfo = assetsById.get(clipAttrs.ref ?? "");
    const sourceFileName = (assetInfo?.src ?? clipAttrs.name ?? "unknown.wav").split("/").pop() ?? "unknown.wav";

    const clip: ParsedClip = {
      id: `evt-fcpxml-${clipIndex}`,
      recordIn: framesToTimecode(recordInFrames, fps),
      recordOut: framesToTimecode(recordOutFrames, fps),
      sourceIn: framesToTimecode(sourceInFrames, fps),
      sourceOut: framesToTimecode(sourceOutFrames, fps),
      recordInFrames,
      recordOutFrames,
      sourceInFrames,
      sourceOutFrames,
      clipName: clipAttrs.name || `Clip ${clipIndex}`,
      sourceFileName,
      reel: assetInfo?.reel || "UNKNOWN",
      tape: assetInfo?.tape,
      scene: undefined,
      take: undefined,
      eventDescription: undefined,
      clipNotes: undefined,
      sourceAssetId: `in-${sourceFileName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
      channelCount: 2,
      channelLayout: "L,R",
      isPolyWav: false,
      hasBwf: sourceFileName.toLowerCase().endsWith(".bwf"),
      hasIXml: false,
      isOffline: false,
      isNested: false,
      isFlattened: true,
      hasSpeedEffect: false,
      hasFadeIn: false,
      hasFadeOut: false,
    };

    tracksByLane.get(lane)?.clips.push(clip);

    const markerRegex = /<marker\s+([^>]*)\/>/g;
    let markerMatch: RegExpExecArray | null;
    while ((markerMatch = markerRegex.exec(clipBody))) {
      markerIndex += 1;
      const attrs = parseAttributes(markerMatch[1]);
      const markerFrame = recordInFrames + secondsToFrames(parseFractionalSeconds(attrs.start), fps);
      markers.push({
        id: `mk-fcpxml-${markerIndex}`,
        timelineTc: framesToTimecode(markerFrame, fps),
        timelineFrame: markerFrame,
        label: attrs.value || attrs.note || `Marker ${markerIndex}`,
        color: "blue",
      });
    }
  }


  const selfClosingClipRegex = /<(asset-clip|clip)\s+([^>]*)\/>/g;
  let selfClosingMatch: RegExpExecArray | null;
  while ((selfClosingMatch = selfClosingClipRegex.exec(content))) {
    if (clipRegex.lastIndex && selfClosingMatch.index < clipRegex.lastIndex) {
      continue;
    }
    clipIndex += 1;
    const clipAttrs = parseAttributes(selfClosingMatch[2]);

    const lane = clipAttrs.lane && clipAttrs.lane !== "0" ? clipAttrs.lane : "A1";
    if (!tracksByLane.has(lane)) {
      tracksByLane.set(lane, {
        id: `trk-fcpxml-${tracksByLane.size + 1}`,
        name: `Lane ${lane}`,
        role: "DX",
        clips: [],
      });
    }

    const recordInFrames = startFrames + secondsToFrames(parseFractionalSeconds(clipAttrs.start), fps);
    const clipDurationFrames = secondsToFrames(parseFractionalSeconds(clipAttrs.duration), fps);
    const recordOutFrames = recordInFrames + clipDurationFrames;
    const sourceInFrames = secondsToFrames(parseFractionalSeconds(clipAttrs.offset || clipAttrs.start), fps);
    const sourceOutFrames = sourceInFrames + clipDurationFrames;

    const assetInfo = assetsById.get(clipAttrs.ref ?? "");
    const sourceFileName = (assetInfo?.src ?? clipAttrs.name ?? "unknown.wav").split("/").pop() ?? "unknown.wav";

    tracksByLane.get(lane)?.clips.push({
      id: `evt-fcpxml-${clipIndex}`,
      recordIn: framesToTimecode(recordInFrames, fps),
      recordOut: framesToTimecode(recordOutFrames, fps),
      sourceIn: framesToTimecode(sourceInFrames, fps),
      sourceOut: framesToTimecode(sourceOutFrames, fps),
      recordInFrames,
      recordOutFrames,
      sourceInFrames,
      sourceOutFrames,
      clipName: clipAttrs.name || `Clip ${clipIndex}`,
      sourceFileName,
      reel: assetInfo?.reel || "UNKNOWN",
      tape: assetInfo?.tape,
      scene: undefined,
      take: undefined,
      eventDescription: undefined,
      clipNotes: undefined,
      sourceAssetId: `in-${sourceFileName.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
      channelCount: 2,
      channelLayout: "L,R",
      isPolyWav: false,
      hasBwf: sourceFileName.toLowerCase().endsWith(".bwf"),
      hasIXml: false,
      isOffline: false,
      isNested: false,
      isFlattened: true,
      hasSpeedEffect: false,
      hasFadeIn: false,
      hasFadeOut: false,
    });
  }

    const timelineMarkerRegex = /<marker\s+([^>]*)\/>/g;
  let timelineMarkerMatch: RegExpExecArray | null;
  while ((timelineMarkerMatch = timelineMarkerRegex.exec(content))) {
    const attrs = parseAttributes(timelineMarkerMatch[1]);
    if (!attrs.start) continue;
    if (markers.some((marker) => marker.label === (attrs.value || attrs.note))) continue;
    markerIndex += 1;
    const markerFrame = startFrames + secondsToFrames(parseFractionalSeconds(attrs.start), fps);
    markers.push({
      id: `mk-fcpxml-${markerIndex}`,
      timelineTc: framesToTimecode(markerFrame, fps),
      timelineFrame: markerFrame,
      label: attrs.value || attrs.note || `Marker ${markerIndex}`,
      color: "blue",
    });
  }

  return {
    timelineName: sequenceName,
    fps,
    startTimecode: framesToTimecode(startFrames, fps),
    dropFrame: false,
    tracks: Array.from(tracksByLane.values()),
    markers,
  };
}

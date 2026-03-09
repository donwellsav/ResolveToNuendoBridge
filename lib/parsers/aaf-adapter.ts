import { promises as fs } from "node:fs";

import type { TranslationModel } from "@/lib/types";

import { extractRecordsFromOleContainer, isOleCompoundFile } from "./aaf-ole";

type AdapterClip = {
  trackId?: string;
  track?: string;
  name?: string;
  sourceFile?: string;
  mobName?: string;
  recordIn?: string;
  recordOut?: string;
  sourceIn?: string;
  sourceOut?: string;
  recordInFrames?: number;
  recordOutFrames?: number;
  sourceInFrames?: number;
  sourceOutFrames?: number;
  reel?: string;
  tape?: string;
  soundRoll?: string;
  channels?: number;
  layout?: string;
  channelLayout?: string;
  offline?: boolean;
  mediaMissing?: boolean;
  hasSpeedEffect?: boolean;
  speedRatio?: number;
  fadeIn?: boolean;
  fadeOut?: boolean;
};

type AdapterTrack = {
  id?: string;
  name?: string;
  role?: TranslationModel["timeline"]["tracks"][number]["role"];
  clips?: AdapterClip[];
};

type AdapterMarker = {
  tc?: string;
  frame?: number;
  label?: string;
};

type AafExternalAdapterPayload = {
  timeline?: {
    name?: string;
    fps?: TranslationModel["timeline"]["fps"];
    startTimecode?: string;
  };
  composition?: {
    name?: string;
    fps?: TranslationModel["timeline"]["fps"];
    startTimecode?: string;
  };
  tracks?: AdapterTrack[];
  markers?: AdapterMarker[];
};

export type AafExtractionMode = "binary-container" | "external-adapter" | "text-fixture" | "unknown";

export type AafExtractionResult = {
  normalizedText: string;
  mode: AafExtractionMode;
  warnings: string[];
};

function encodeValue(value: string | number | boolean | undefined): string {
  if (value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  const asString = String(value);
  if (/\s/.test(asString) || asString.includes(",")) return `"${asString}"`;
  return asString;
}

function compactTokenPairs(tokens: Record<string, string | number | boolean | undefined>): string {
  return Object.entries(tokens)
    .filter(([, value]) => value !== undefined && String(value).length > 0)
    .map(([key, value]) => `${key}=${encodeValue(value)}`)
    .join(" ");
}

function normalizeExternalAdapterPayload(payload: AafExternalAdapterPayload): string {
  const lines: string[] = ["# AAF_EXTERNAL_ADAPTER v1"];

  const timeline = payload.timeline ?? payload.composition;
  if (timeline) {
    lines.push(
      `TIMELINE ${compactTokenPairs({
        name: timeline.name,
        fps: timeline.fps,
        start: timeline.startTimecode,
      })}`.trim()
    );
  }

  (payload.tracks ?? []).forEach((track, trackIndex) => {
    const trackId = track.id ?? `t${trackIndex + 1}`;
    lines.push(
      `TRACK ${compactTokenPairs({
        id: trackId,
        name: track.name,
        role: track.role,
      })}`.trim()
    );

    (track.clips ?? []).forEach((clip) => {
      lines.push(
        `CLIP ${compactTokenPairs({
          track: clip.trackId ?? clip.track ?? trackId,
          name: clip.name,
          sourceFile: clip.sourceFile,
          mobName: clip.mobName,
          recordIn: clip.recordIn,
          recordOut: clip.recordOut,
          sourceIn: clip.sourceIn,
          sourceOut: clip.sourceOut,
          recordInFrames: clip.recordInFrames,
          recordOutFrames: clip.recordOutFrames,
          sourceInFrames: clip.sourceInFrames,
          sourceOutFrames: clip.sourceOutFrames,
          reel: clip.reel,
          tape: clip.tape,
          soundRoll: clip.soundRoll,
          channels: clip.channels,
          layout: clip.layout ?? clip.channelLayout,
          offline: clip.offline,
          mediaMissing: clip.mediaMissing,
          hasSpeedEffect: clip.hasSpeedEffect,
          speedRatio: clip.speedRatio,
          fadeIn: clip.fadeIn,
          fadeOut: clip.fadeOut,
        })}`.trim()
      );
    });
  });

  (payload.markers ?? []).forEach((marker) => {
    lines.push(`MARKER ${compactTokenPairs({ tc: marker.tc, frame: marker.frame, label: marker.label })}`.trim());
  });

  return lines.join("\n");
}

function extractContainerRecords(buffer: Buffer): string {
  const asciiSegments: string[] = [];
  let current = "";

  for (const byte of buffer.values()) {
    const printable = byte >= 32 && byte <= 126;
    if (printable) {
      current += String.fromCharCode(byte);
      continue;
    }

    if (current.length >= 8) asciiSegments.push(current);
    current = "";
  }

  if (current.length >= 8) asciiSegments.push(current);

  const recordRegex = /(TIMELINE|COMPOSITION|TRACK|MOBSLOT|SOURCEMOB|SOURCECLIP|CLIP|EVENT|MARKER|LOCATOR|COMMENT)\b[^\r\n]*/;
  const extractedRecords = asciiSegments
    .map((segment) => segment.match(recordRegex)?.[0])
    .filter((record): record is string => Boolean(record));

  return extractedRecords.join("\n");
}

function normalizeMaybeTextAaf(content: string): string {
  const knownRecordRegex = /^(TIMELINE|COMPOSITION|TRACK|MOBSLOT|SOURCEMOB|SOURCECLIP|CLIP|EVENT|MARKER|LOCATOR|COMMENT)\b/;
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line.startsWith("#") || knownRecordRegex.test(line));

  return lines.join("\n");
}

export async function extractAafTimelineText(filePath: string): Promise<AafExtractionResult> {
  const warnings: string[] = [];
  const sidecarAdapterPath = `${filePath}.adapter.json`;

  const buffer = await fs.readFile(filePath);
  const utf8 = buffer.toString("utf8");
  const normalizedText = normalizeMaybeTextAaf(utf8);

  if (normalizedText.includes("TIMELINE") && (normalizedText.includes("CLIP") || normalizedText.includes("EVENT"))) {
    return {
      normalizedText,
      mode: "text-fixture",
      warnings,
    };
  }

  if (isOleCompoundFile(buffer)) {
    const oleRecords = extractRecordsFromOleContainer(buffer);
    if (oleRecords.length > 0) {
      return {
        normalizedText: oleRecords,
        mode: "binary-container",
        warnings,
      };
    }

    warnings.push("Direct in-repo OLE AAF parser found no recognizable timeline records.");
  }

  const extractedRecords = extractContainerRecords(buffer);
  if (extractedRecords.length > 0) {
    return {
      normalizedText: extractedRecords,
      mode: "binary-container",
      warnings,
    };
  }

  try {
    const sidecar = await fs.readFile(sidecarAdapterPath, "utf8");
    const payload = JSON.parse(sidecar) as AafExternalAdapterPayload;
    warnings.push("Direct in-repo AAF parsing failed; used external adapter sidecar fallback.");
    return {
      normalizedText: normalizeExternalAdapterPayload(payload),
      mode: "external-adapter",
      warnings,
    };
  } catch {
    // No sidecar adapter output available.
  }

  warnings.push("Unable to extract recognizable AAF timeline records from file contents.");
  return {
    normalizedText: "",
    mode: "unknown",
    warnings,
  };
}


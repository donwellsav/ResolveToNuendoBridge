import { promises as fs } from "node:fs";
import path from "node:path";

import { parseAaf } from "../parsers/aaf";
import { extractAafTimelineText } from "../parsers/aaf-adapter";
import { parseFcpxml } from "../parsers/fcpxml";

import type {
  AnalysisReport,
  AssetOrigin,
  ClipEvent,
  FileKind,
  FileRole,
  ImportAnalysisResult,
  IntakeAsset,
  Marker,
  PreservationIssue,
  TranslationModel,
} from "../types";
import { templateMappingRules } from "../mock-data";

type MetadataRow = Record<string, string>;

type ManifestPayload = {
  project?: string;
  timelineVersion?: string;
  timelineName?: string;
  startTimecode?: string;
  durationTimecode?: string;
  fps?: 23.976 | 24 | 25 | 29.97;
  sampleRate?: 48000 | 96000;
  dropFrame?: boolean;
};

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): MetadataRow[] {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: MetadataRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
}

function asBool(value: string | undefined): boolean {
  return value?.toLowerCase() === "true";
}

function asInt(value: string | undefined, fallback = 0): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function classifyFileKind(fileName: string): FileKind {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === ".aaf") return "aaf";
  if (ext === ".fcpxml") return "fcpxml";
  if (ext === ".xml") return "xml";
  if (ext === ".edl") return "edl";
  if (ext === ".csv") return "csv";
  if (ext === ".wav") return "wav";
  if (ext === ".bwf") return "bwf";
  if (ext === ".mov") return "mov";
  if (ext === ".mp4") return "mp4";
  if (ext === ".json") return "json";
  if (ext === ".txt") return "txt";
  return "txt";
}

function classifyFileRole(fileName: string, kind: FileKind): FileRole {
  const lower = fileName.toLowerCase();
  if (kind === "aaf" || kind === "fcpxml" || (kind === "xml" && !lower.includes("manifest"))) return "timeline_exchange";
  if (kind === "edl" || lower.includes("marker")) return "marker_export";
  if (kind === "csv" && lower.includes("metadata")) return "metadata_export";
  if (kind === "mov" || kind === "mp4") return "reference_video";
  if (kind === "wav" || kind === "bwf") return "production_audio";
  if (kind === "json" && lower.includes("manifest")) return "delivery_manifest";
  if (kind === "txt" && lower.includes("readme")) return "delivery_readme";
  if (kind === "csv" && lower.includes("field") && lower.includes("report")) return "field_recorder_report";
  return kind === "csv" ? "metadata_export" : "timeline_exchange";
}

function classifyOrigin(fileName: string, role: FileRole): AssetOrigin {
  const lower = fileName.toLowerCase();
  if (role === "production_audio") return "production-audio";
  if (lower.includes("editorial") || lower.includes("fcpxml") || lower.endsWith(".xml")) return "editorial";
  return "resolve";
}

async function walkFolder(folderPath: string): Promise<string[]> {
  const entries = await fs.readdir(folderPath, { withFileTypes: true });
  const filePaths = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(folderPath, entry.name);
      if (entry.isDirectory()) return walkFolder(entryPath);
      return [entryPath];
    })
  );
  return filePaths.flat();
}

function parseMarkerEdl(content: string): Marker[] {
  const markers: Marker[] = [];
  const lines = content.split(/\r?\n/);
  let markerIndex = 0;

  for (const line of lines) {
    const tcMatch = line.match(/(\d{2}:\d{2}:\d{2}:\d{2})/);
    if (!tcMatch) continue;
    if (!line.includes("LOC") && !line.includes("MKR") && !line.includes("MARK")) continue;

    markerIndex += 1;
    markers.push({
      id: `mk-edl-${markerIndex}`,
      timelineTc: tcMatch[1],
      timelineFrame: markerIndex,
      label: line.replace(/\s+/g, " ").trim().slice(0, 64),
      color: "yellow",
    });
  }

  return markers;
}

function parseEdlTimeline(content: string): TranslationModel["timeline"]["tracks"] {
  const eventRegex = /^\s*\d+\s+\S+\s+\S\s+\S\s+(\d{2}:\d{2}:\d{2}:\d{2})\s+(\d{2}:\d{2}:\d{2}:\d{2})\s+(\d{2}:\d{2}:\d{2}:\d{2})\s+(\d{2}:\d{2}:\d{2}:\d{2})/;
  const clips: ClipEvent[] = [];

  content.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(eventRegex);
    if (!match) return;

    clips.push({
      id: `evt-edl-${clips.length + 1}`,
      sourceIn: match[1],
      sourceOut: match[2],
      recordIn: match[3],
      recordOut: match[4],
      sourceInFrames: index * 10,
      sourceOutFrames: index * 10 + 1,
      recordInFrames: index * 10,
      recordOutFrames: index * 10 + 1,
      clipName: `EDL Event ${clips.length + 1}`,
      sourceFileName: "unknown.wav",
      reel: "UNKNOWN",
      sourceAssetId: "unknown-asset",
      channelCount: 2,
      channelLayout: "L,R",
      isPolyWav: false,
      hasBwf: false,
      hasIXml: false,
      isOffline: false,
      isNested: false,
      isFlattened: true,
      hasSpeedEffect: false,
      hasFadeIn: false,
      hasFadeOut: false,
    });
  });

  return clips.length === 0
    ? []
    : [
        {
          id: "trk-edl-1",
          name: "EDL A",
          role: "DX",
          clips,
        },
      ];
}

function deriveTimelineFrameRange(tracks: TranslationModel["timeline"]["tracks"]): { startFrame: number; durationFrames: number } {
  const clips = tracks.flatMap((track) => track.clips).filter((clip) => clip.recordOutFrames > clip.recordInFrames);
  if (clips.length === 0) return { startFrame: 0, durationFrames: 0 };

  const startFrame = Math.min(...clips.map((clip) => clip.recordInFrames));
  const endFrame = Math.max(...clips.map((clip) => clip.recordOutFrames));
  return { startFrame, durationFrames: Math.max(0, endFrame - startFrame) };
}

function clipsFromMetadata(metadataRows: MetadataRow[], intakeAssets: IntakeAsset[]): TranslationModel["timeline"]["tracks"] {
  const tracksByName = new Map<string, TranslationModel["timeline"]["tracks"][number]>();
  metadataRows.forEach((row, index) => {
    const trackName = row.trackName || row.track || "Unknown Track";
    const role = (row.role as "DX" | "MX" | "FX" | "BG" | "VO") || "DX";

    if (!tracksByName.has(trackName)) {
      tracksByName.set(trackName, {
        id: `trk-${tracksByName.size + 1}`,
        name: trackName,
        role,
        clips: [],
      });
    }

    tracksByName.get(trackName)?.clips.push({
      id: `evt-${index + 1}`,
      recordIn: row.recordIn || "00:00:00:00",
      recordOut: row.recordOut || "00:00:00:00",
      sourceIn: row.sourceIn || "00:00:00:00",
      sourceOut: row.sourceOut || "00:00:00:00",
      recordInFrames: asInt(row.recordInFrames),
      recordOutFrames: asInt(row.recordOutFrames),
      sourceInFrames: asInt(row.sourceInFrames),
      sourceOutFrames: asInt(row.sourceOutFrames),
      clipName: row.clipName || `Clip ${index + 1}`,
      sourceFileName: row.sourceFileName || "unknown.wav",
      reel: row.reel || "UNKNOWN",
      tape: row.tape || undefined,
      scene: row.scene || undefined,
      take: row.take || undefined,
      eventDescription: row.eventDescription || undefined,
      clipNotes: row.clipNotes || undefined,
      sourceAssetId: intakeAssets.find((asset) => asset.fileName === row.sourceFileName)?.id ?? "unknown-asset",
      channelCount: asInt(row.channelCount, 2),
      channelLayout: row.channelLayout || "L,R",
      isPolyWav: asBool(row.isPolyWav),
      hasBwf: asBool(row.hasBwf),
      hasIXml: asBool(row.hasIXml),
      isOffline: asBool(row.isOffline),
      isNested: asBool(row.isNested),
      isFlattened: asBool(row.isFlattened || "true"),
      hasSpeedEffect: asBool(row.hasSpeedEffect),
      hasFadeIn: asBool(row.hasFadeIn),
      hasFadeOut: asBool(row.hasFadeOut),
    });
  });

  return Array.from(tracksByName.values());
}

function enrichFromMetadata(tracks: TranslationModel["timeline"]["tracks"], metadataRows: MetadataRow[], intakeAssets: IntakeAsset[]) {
  const byClipName = new Map(metadataRows.map((row) => [row.clipName, row]));
  tracks.forEach((track) => {
    track.clips = track.clips.map((clip) => {
      const metadata = byClipName.get(clip.clipName) ?? metadataRows.find((row) => row.sourceFileName === clip.sourceFileName);
      if (!metadata) return clip;

      return {
        ...clip,
        tape: metadata.tape || clip.tape,
        scene: metadata.scene || clip.scene,
        take: metadata.take || clip.take,
        reel: metadata.reel || clip.reel,
        eventDescription: metadata.eventDescription || clip.eventDescription,
        clipNotes: metadata.clipNotes || clip.clipNotes,
        sourceAssetId: intakeAssets.find((asset) => asset.fileName === (metadata.sourceFileName || clip.sourceFileName))?.id ?? clip.sourceAssetId,
        channelCount: metadata.channelCount ? asInt(metadata.channelCount, clip.channelCount) : clip.channelCount,
        channelLayout: metadata.channelLayout || clip.channelLayout,
        isPolyWav: metadata.isPolyWav ? asBool(metadata.isPolyWav) : clip.isPolyWav,
        hasBwf: metadata.hasBwf ? asBool(metadata.hasBwf) : clip.hasBwf,
        hasIXml: metadata.hasIXml ? asBool(metadata.hasIXml) : clip.hasIXml,
      };
    });
  });
}

function reconcileFcpxmlWithMetadata(
  tracks: TranslationModel["timeline"]["tracks"],
  metadataRows: MetadataRow[],
  markers: Marker[],
  markerRows: MetadataRow[],
  intakeAssets: IntakeAsset[]
): PreservationIssue[] {
  const issues: PreservationIssue[] = [];

  if (metadataRows.length > 0 && tracks.length !== new Set(metadataRows.map((row) => row.trackName || row.track || "Unknown Track")).size) {
    issues.push({
      id: "issue-track-count-mismatch",
      category: "manual-review",
      severity: "warning",
      scope: "track",
      title: "Track count mismatch between FCPXML/XML and metadata CSV",
      description: "Timeline exchange track count does not match metadata CSV track declarations.",
      sourceLocation: "fcpxml+metadata.csv",
      recommendedAction: "Verify track mapping and regenerate turnover metadata.",
    });
  }

  for (const clip of tracks.flatMap((track) => track.clips)) {
    const metadata = metadataRows.find((row) => row.clipName === clip.clipName || row.sourceFileName === clip.sourceFileName);
    if (!metadata) continue;

    if ((metadata.recordIn && metadata.recordIn !== clip.recordIn) || (metadata.recordOut && metadata.recordOut !== clip.recordOut)) {
      issues.push({
        id: `issue-clip-timecode-mismatch-${clip.id}`,
        category: "manual-review",
        severity: "warning",
        scope: "clip",
        title: `Clip timecode mismatch: ${clip.clipName}`,
        description: `FCPXML/XML record range ${clip.recordIn}-${clip.recordOut} differs from metadata CSV ${metadata.recordIn}-${metadata.recordOut}.`,
        sourceLocation: "fcpxml+metadata.csv",
        recommendedAction: "Review editorial timeline and metadata export alignment.",
      });
    }

    if (!metadata.reel || !metadata.tape || !metadata.scene || !metadata.take) {
      issues.push({
        id: `issue-missing-rst-${clip.id}`,
        category: "manual-review",
        severity: "warning",
        scope: "metadata",
        title: `Missing reel/tape/scene/take on ${clip.clipName}`,
        description: "Metadata CSV row is missing one or more of reel/tape/scene/take fields.",
        sourceLocation: "metadata.csv",
        recommendedAction: "Backfill production metadata before delivery handoff.",
      });
    }
  }

  if (markerRows.length > 0 && markerRows.length !== markers.length) {
    issues.push({
      id: "issue-marker-count-mismatch",
      category: "manual-review",
      severity: "warning",
      scope: "marker",
      title: "Marker count mismatch",
      description: `Timeline exchange contains ${markers.length} markers while marker CSV contains ${markerRows.length}.`,
      sourceLocation: "fcpxml+marker.csv",
      recommendedAction: "Confirm marker export source and rerun marker extract.",
    });
  }

  tracks.flatMap((track) => track.clips).forEach((clip) => {
    if (!intakeAssets.some((asset) => asset.fileRole === "production_audio" && asset.fileName === clip.sourceFileName)) {
      issues.push({
        id: `issue-source-missing-${clip.id}`,
        category: "manual-review",
        severity: "critical",
        scope: "clip",
        title: `Source file missing from intake bundle: ${clip.sourceFileName}`,
        description: "Canonical clip references a file that is not present in intake production audio assets.",
        sourceLocation: "timeline_exchange",
        recommendedAction: "Add missing source file to turnover bundle.",
      });
    }
  });

  return issues;
}

function enrichFromAaf(
  tracks: TranslationModel["timeline"]["tracks"],
  aafTracks: TranslationModel["timeline"]["tracks"],
  intakeAssets: IntakeAsset[]
) {
  const aafClips = aafTracks.flatMap((track) => track.clips);

  const findAafClip = (clip: ClipEvent) =>
    aafClips.find((candidate) => candidate.clipName === clip.clipName && candidate.recordInFrames === clip.recordInFrames) ??
    aafClips.find((candidate) => candidate.clipName === clip.clipName) ??
    aafClips.find((candidate) => candidate.sourceFileName === clip.sourceFileName && candidate.recordInFrames === clip.recordInFrames) ??
    aafClips.find((candidate) => candidate.sourceFileName === clip.sourceFileName);

  tracks.forEach((track) => {
    track.clips = track.clips.map((clip) => {
      const fromAaf = findAafClip(clip);
      if (!fromAaf) return clip;

      return {
        ...clip,
        sourceFileName: fromAaf.sourceFileName !== "UNKNOWN" ? fromAaf.sourceFileName : clip.sourceFileName,
        sourceAssetId:
          intakeAssets.find((asset) => asset.fileName === fromAaf.sourceFileName)?.id ??
          intakeAssets.find((asset) => asset.fileName === clip.sourceFileName)?.id ??
          clip.sourceAssetId,
        reel: fromAaf.reel !== "UNKNOWN" ? fromAaf.reel : clip.reel,
        tape: fromAaf.tape ?? clip.tape,
        channelCount: fromAaf.channelCount > 0 ? fromAaf.channelCount : clip.channelCount,
        channelLayout: fromAaf.channelLayout !== "UNKNOWN" ? fromAaf.channelLayout : clip.channelLayout,
        hasFadeIn: fromAaf.hasFadeIn || clip.hasFadeIn,
        hasFadeOut: fromAaf.hasFadeOut || clip.hasFadeOut,
        isOffline: fromAaf.isOffline || clip.isOffline,
      };
    });
  });
}

function reconcileAafMediaReferences(tracks: TranslationModel["timeline"]["tracks"], intakeAssets: IntakeAsset[]): PreservationIssue[] {
  const issues: PreservationIssue[] = [];
  tracks
    .flatMap((track) => track.clips)
    .forEach((clip) => {
      const hasSourceFile = intakeAssets.some((asset) => asset.fileRole === "production_audio" && asset.fileName === clip.sourceFileName);
      if (clip.isOffline || !hasSourceFile) {
        issues.push({
          id: `issue-aaf-expected-media-missing-${clip.id}`,
          category: "manual-review",
          severity: "critical",
          scope: "clip",
          title: `AAF indicates missing expected media: ${clip.sourceFileName}`,
          description: "AAF clip is marked offline or references media not found in the intake production audio set.",
          sourceLocation: "aaf+intake/audio",
          recommendedAction: "Restore or provide expected media and regenerate turnover package.",
        });
      }
    });

  return issues;
}

function reconcileFcpxmlWithAaf(
  tracks: TranslationModel["timeline"]["tracks"],
  markers: Marker[],
  aafTracks: TranslationModel["timeline"]["tracks"],
  aafMarkers: Marker[],
  intakeAssets: IntakeAsset[]
): PreservationIssue[] {
  const issues: PreservationIssue[] = [];
  const fcpxmlClips = tracks.flatMap((track) => track.clips);
  const aafClips = aafTracks.flatMap((track) => track.clips);

  if (tracks.length !== aafTracks.length) {
    issues.push({
      id: "issue-aaf-track-count-mismatch",
      category: "manual-review",
      severity: "warning",
      scope: "track",
      title: "Track count mismatch between FCPXML/XML and AAF",
      description: `FCPXML/XML declares ${tracks.length} tracks while AAF declares ${aafTracks.length}.`,
      sourceLocation: "fcpxml+xml+aaf",
      recommendedAction: "Confirm timeline sync and regenerate either FCPXML/XML or AAF from the same Resolve version.",
    });
  }

  if (fcpxmlClips.length !== aafClips.length) {
    issues.push({
      id: "issue-aaf-clip-count-mismatch",
      category: "manual-review",
      severity: "warning",
      scope: "clip",
      title: "Clip count mismatch between FCPXML/XML and AAF",
      description: `FCPXML/XML contains ${fcpxmlClips.length} clips while AAF contains ${aafClips.length}.`,
      sourceLocation: "fcpxml+xml+aaf",
      recommendedAction: "Verify turnover exports were generated from the same locked timeline.",
    });
  }

  fcpxmlClips.forEach((clip) => {
    const fromAaf =
      aafClips.find((candidate) => candidate.clipName === clip.clipName && candidate.recordInFrames === clip.recordInFrames) ??
      aafClips.find((candidate) => candidate.clipName === clip.clipName) ??
      aafClips.find((candidate) => candidate.sourceFileName === clip.sourceFileName && candidate.recordInFrames === clip.recordInFrames) ??
      aafClips.find((candidate) => candidate.sourceFileName === clip.sourceFileName);
    if (!fromAaf) return;

    if (clip.recordIn !== fromAaf.recordIn || clip.recordOut !== fromAaf.recordOut) {
      issues.push({
        id: `issue-aaf-timing-mismatch-${clip.id}`,
        category: "manual-review",
        severity: "warning",
        scope: "clip",
        title: `Clip timing mismatch against AAF: ${clip.clipName}`,
        description: `FCPXML/XML ${clip.recordIn}-${clip.recordOut} differs from AAF ${fromAaf.recordIn}-${fromAaf.recordOut}.`,
        sourceLocation: "fcpxml+xml+aaf",
        recommendedAction: "Inspect record/source in-out values and resolve timeline version drift.",
      });
    }

    if (clip.sourceFileName !== fromAaf.sourceFileName && fromAaf.sourceFileName !== "UNKNOWN") {
      issues.push({
        id: `issue-aaf-source-file-mismatch-${clip.id}`,
        category: "manual-review",
        severity: "warning",
        scope: "clip",
        title: `Source file mismatch against AAF: ${clip.clipName}`,
        description: `FCPXML/XML source ${clip.sourceFileName} differs from AAF source ${fromAaf.sourceFileName}.`,
        sourceLocation: "fcpxml+xml+aaf",
        recommendedAction: "Confirm clip relink state and re-export timeline exchange artifacts.",
      });
    }

    if ((fromAaf.reel !== "UNKNOWN" && clip.reel !== fromAaf.reel) || (fromAaf.tape && clip.tape !== fromAaf.tape)) {
      issues.push({
        id: `issue-aaf-reel-tape-mismatch-${clip.id}`,
        category: "manual-review",
        severity: "warning",
        scope: "metadata",
        title: `Reel/tape mismatch against AAF: ${clip.clipName}`,
        description: `FCPXML/XML reel/tape ${clip.reel}/${clip.tape ?? "UNKNOWN"} differs from AAF ${fromAaf.reel}/${fromAaf.tape ?? "UNKNOWN"}.`,
        sourceLocation: "fcpxml+xml+aaf",
        recommendedAction: "Resolve metadata conflicts before field recorder and delivery planning.",
      });
    }

  });

  if (aafMarkers.length > 0 && aafMarkers.length !== markers.length) {
    issues.push({
      id: "issue-aaf-marker-coverage-mismatch",
      category: "manual-review",
      severity: "warning",
      scope: "marker",
      title: "Marker coverage mismatch between FCPXML/XML and AAF",
      description: `FCPXML/XML exposes ${markers.length} markers while AAF exposes ${aafMarkers.length}.`,
      sourceLocation: "fcpxml+xml+aaf",
      recommendedAction: "Confirm marker export source and merge strategy before delivery.",
    });
  }

  issues.push(...reconcileAafMediaReferences(aafTracks, intakeAssets));

  return issues;
}

export async function importTurnoverFolder(folderPath: string): Promise<ImportAnalysisResult> {
  const files = await walkFolder(folderPath);
  const intakeAssets: IntakeAsset[] = [];

  let metadataRows: MetadataRow[] = [];
  let markerRows: MetadataRow[] = [];
  let edlMarkers: Marker[] = [];
  let edlTracks: TranslationModel["timeline"]["tracks"] = [];
  let manifest: ManifestPayload = {};
  let parsedFcpxml: ReturnType<typeof parseFcpxml> | undefined;
  let parsedAaf: ReturnType<typeof parseAaf> | undefined;

  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const kind = classifyFileKind(fileName);
    const role = classifyFileRole(fileName, kind);
    const origin = classifyOrigin(fileName, role);
    const relativePath = path.relative(folderPath, filePath);

    const asset: IntakeAsset = {
      id: `in-${relativePath.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
      stage: "intake",
      origin,
      fileKind: kind,
      fileRole: role,
      fileName,
      pathHint: relativePath,
      status: "ready",
    };

    if (role === "production_audio") {
      asset.hasBwf = kind === "bwf";
      asset.isPolyWav = fileName.toLowerCase().includes("poly") || fileName.toLowerCase().includes("_6ch");
      asset.hasIXml = false;
    }

    if (kind === "csv" || kind === "edl" || kind === "json" || kind === "fcpxml" || kind === "xml" || kind === "aaf") {
      const content = await fs.readFile(filePath, "utf8");
      if (kind === "csv" && fileName.toLowerCase().includes("metadata")) metadataRows = parseCsv(content);
      if (kind === "csv" && fileName.toLowerCase().includes("marker")) markerRows = parseCsv(content);
      if (kind === "edl") {
        edlMarkers = parseMarkerEdl(content);
        edlTracks = parseEdlTimeline(content);
      }
      if (kind === "json" && fileName.toLowerCase().includes("manifest")) manifest = JSON.parse(content) as ManifestPayload;
      if ((kind === "fcpxml" || kind === "xml") && role === "timeline_exchange" && !parsedFcpxml) parsedFcpxml = parseFcpxml(content);
    }

    if (kind === "aaf" && !parsedAaf) {
      const extraction = await extractAafTimelineText(filePath);
      parsedAaf = parseAaf(extraction.normalizedText);
    }

    intakeAssets.push(asset);
  }

  const markersFromCsv: Marker[] = markerRows.map((row, index) => ({
    id: `mk-csv-${index + 1}`,
    timelineTc: row.timelineTc || row.timecode || "00:00:00:00",
    timelineFrame: asInt(row.timelineFrame, index + 1),
    label: row.label || row.name || `Marker ${index + 1}`,
    color: (row.color as Marker["color"]) || "blue",
  }));

  const issues: PreservationIssue[] = [];

  const hasFcpxmlTimeline = Boolean(parsedFcpxml && parsedFcpxml.tracks.length > 0);
  const hasAafTimeline = Boolean(parsedAaf && parsedAaf.tracks.length > 0);
  const timelineSource = hasFcpxmlTimeline ? "fcpxml" : hasAafTimeline ? "aaf" : edlTracks.length > 0 ? "edl" : "metadata";
  let tracks: TranslationModel["timeline"]["tracks"] = [];
  let markers: Marker[] = [];

  if (timelineSource === "fcpxml") {
    tracks = parsedFcpxml?.tracks ?? [];
    enrichFromMetadata(tracks, metadataRows, intakeAssets);
    if (hasAafTimeline && parsedAaf) {
      issues.push(...reconcileFcpxmlWithAaf(tracks, parsedFcpxml?.markers ?? [], parsedAaf.tracks, parsedAaf.markers, intakeAssets));
      enrichFromAaf(tracks, parsedAaf.tracks, intakeAssets);
    }
    markers = (parsedFcpxml?.markers?.length ?? 0) > 0 ? parsedFcpxml?.markers ?? [] : markersFromCsv.length > 0 ? markersFromCsv : edlMarkers;
    issues.push(...reconcileFcpxmlWithMetadata(tracks, metadataRows, markers, markerRows, intakeAssets));
  } else if (timelineSource === "aaf") {
    tracks = parsedAaf?.tracks ?? [];
    enrichFromMetadata(tracks, metadataRows, intakeAssets);
    markers = (parsedAaf?.markers?.length ?? 0) > 0 ? parsedAaf?.markers ?? [] : markersFromCsv.length > 0 ? markersFromCsv : edlMarkers;
    issues.push(...reconcileAafMediaReferences(tracks, intakeAssets));
  } else if (timelineSource === "edl") {
    tracks = edlTracks;
    enrichFromMetadata(tracks, metadataRows, intakeAssets);
    markers = markersFromCsv.length > 0 ? markersFromCsv : edlMarkers;
  } else {
    tracks = clipsFromMetadata(metadataRows, intakeAssets);
    markers = markersFromCsv.length > 0 ? markersFromCsv : edlMarkers;
  }

  const requiredRoles: FileRole[] = ["timeline_exchange", "metadata_export", "reference_video", "marker_export"];
  requiredRoles.forEach((role) => {
    if (!intakeAssets.some((asset) => asset.fileRole === role)) {
      issues.push({
        id: `issue-missing-${role}`,
        category: "manual-review",
        severity: role === "marker_export" ? "warning" : "critical",
        scope: "timeline",
        title: `Missing expected intake file: ${role}`,
        description: `Turnover folder does not include required intake role ${role}.`,
        sourceLocation: "intake",
        recommendedAction: "Add missing turnover file and re-run import.",
      });
    }
  });

  if (!intakeAssets.some((asset) => asset.fileRole === "production_audio")) {
    issues.push({
      id: "issue-no-production-audio",
      category: "dropped",
      severity: "critical",
      scope: "metadata",
      title: "No production audio rolls detected",
      description: "No WAV/BWF files were found for field recorder matching.",
      sourceLocation: "intake/audio",
      recommendedAction: "Provide production audio rolls in turnover folder.",
    });
  }

  const clipCount = tracks.reduce((sum, track) => sum + track.clips.length, 0);
  const offlineAssetCount = tracks.reduce((sum, track) => sum + track.clips.filter((clip) => clip.isOffline).length, 0);
  const unresolvedMetadataCount = tracks
    .flatMap((track) => track.clips)
    .filter((clip) => !clip.reel || !clip.scene || !clip.take || !clip.tape).length;

  if (unresolvedMetadataCount > 0) {
    issues.push({
      id: "issue-unresolved-scene-take",
      category: "manual-review",
      severity: "warning",
      scope: "clip",
      title: "Unresolved reel/tape/scene/take metadata",
      description: `${unresolvedMetadataCount} clip events are missing reel/tape/scene/take fields.`,
      sourceLocation: "metadata.csv",
      recommendedAction: "Review metadata CSV and production audio iXML/BWF fields.",
    });
  }

  const blocked = issues.some((issue) => issue.severity === "critical");
  if (blocked) {
    issues.push({
      id: "issue-delivery-blocked",
      category: "manual-review",
      severity: "critical",
      scope: "delivery",
      title: "Delivery package remains blocked",
      description: "One or more critical intake issues prevent delivery planning from becoming ready.",
      sourceLocation: "analysis",
      targetArtifactName: "delivery-package",
      recommendedAction: "Resolve critical intake issues then re-run intake analysis.",
    });
  }

  const timelineFrames = deriveTimelineFrameRange(tracks);
  const nowIso = "2026-03-08T00:00:00.000Z";
  const sourceBundle = {
    id: "bundle-imported",
    stage: "intake" as const,
    origin: "resolve" as const,
    bundleName: path.basename(folderPath),
    resolveProject: manifest.project ?? "Imported Resolve Project",
    resolveTimelineVersion: manifest.timelineVersion ?? "Imported Timeline v1",
    importedAtIso: nowIso,
    intakeAssets,
  };

  const analysis: AnalysisReport = {
    tracksTotal: tracks.length,
    clipsTotal: clipCount,
    markersTotal: markers.length,
    offlineAssetsTotal: offlineAssetCount,
    highRiskCount: issues.filter((issue) => issue.severity === "critical").length,
    warningCount: issues.filter((issue) => issue.severity === "warning").length,
    blockedCount: blocked ? 1 : 0,
    intakeCompletenessSummary: `${intakeAssets.length} intake files scanned; ${issues.filter((issue) => issue.scope !== "delivery").length} intake findings.`,
    deliveryReadinessSummary: blocked ? "Delivery planning blocked by critical intake issues." : "Intake and canonical analysis complete. Delivery planning ready.",
  };

  const translationModel: TranslationModel = {
    id: "model-imported",
    stage: "canonical",
    sourceBundleId: sourceBundle.id,
    timeline: {
      id: "timeline-imported",
      name: parsedFcpxml?.timelineName ?? parsedAaf?.timelineName ?? manifest.timelineName ?? sourceBundle.resolveTimelineVersion,
      startTimecode: parsedFcpxml?.startTimecode ?? parsedAaf?.startTimecode ?? manifest.startTimecode ?? "01:00:00:00",
      durationTimecode: manifest.durationTimecode ?? "00:00:00:00",
      startFrame: timelineFrames.startFrame,
      durationFrames: timelineFrames.durationFrames,
      fps: parsedFcpxml?.fps ?? parsedAaf?.fps ?? manifest.fps ?? 24,
      sampleRate: manifest.sampleRate ?? 48000,
      dropFrame: parsedFcpxml?.dropFrame ?? manifest.dropFrame ?? false,
      tracks,
      markers,
    },
  };

  return {
    sourceBundle,
    translationModel,
    mappingRules: templateMappingRules,
    fieldRecorderCandidates: tracks.flatMap((track) => track.clips).map((clip, index) => ({
      id: `frc-${index + 1}`,
      clipEventId: clip.id,
      candidateFile: clip.sourceFileName,
      matchScore: clip.hasIXml ? 92 : 65,
      strategy: clip.hasIXml ? "scene_take" : "filename_tc",
      matched: !clip.isOffline,
    })),
    preservationIssues: issues,
    reconformChanges: [],
    analysisReport: analysis,
  };
}

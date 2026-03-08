import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  AnalysisReport,
  AssetOrigin,
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

function deriveTimelineFrameRange(tracks: TranslationModel["timeline"]["tracks"]): { startFrame: number; durationFrames: number } {
  const clips = tracks.flatMap((track) => track.clips).filter((clip) => clip.recordOutFrames > clip.recordInFrames);
  if (clips.length === 0) return { startFrame: 0, durationFrames: 0 };

  const startFrame = Math.min(...clips.map((clip) => clip.recordInFrames));
  const endFrame = Math.max(...clips.map((clip) => clip.recordOutFrames));
  return { startFrame, durationFrames: Math.max(0, endFrame - startFrame) };
}

export async function importTurnoverFolder(folderPath: string): Promise<ImportAnalysisResult> {
  const files = await walkFolder(folderPath);
  const intakeAssets: IntakeAsset[] = [];

  let metadataRows: MetadataRow[] = [];
  let markerRows: MetadataRow[] = [];
  let edlMarkers: Marker[] = [];
  let manifest: ManifestPayload = {};

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

    if (kind === "csv" || kind === "edl" || kind === "json") {
      const content = await fs.readFile(filePath, "utf8");
      if (kind === "csv" && fileName.toLowerCase().includes("metadata")) metadataRows = parseCsv(content);
      if (kind === "csv" && fileName.toLowerCase().includes("marker")) markerRows = parseCsv(content);
      if (kind === "edl") edlMarkers = parseMarkerEdl(content);
      if (kind === "json" && fileName.toLowerCase().includes("manifest")) {
        manifest = JSON.parse(content) as ManifestPayload;
      }
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

  const markers = markersFromCsv.length > 0 ? markersFromCsv : edlMarkers;

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

    const clip = {
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
    };

    tracksByName.get(trackName)?.clips.push(clip);
  });

  const tracks = Array.from(tracksByName.values());
  const clipCount = tracks.reduce((sum, track) => sum + track.clips.length, 0);
  const offlineAssetCount = tracks.reduce((sum, track) => sum + track.clips.filter((clip) => clip.isOffline).length, 0);

  const issues: PreservationIssue[] = [];
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

  const translationModel: TranslationModel = {
    id: "model-imported",
    stage: "canonical",
    sourceBundleId: sourceBundle.id,
    timeline: {
      id: "timeline-imported",
      name: manifest.timelineName ?? sourceBundle.resolveTimelineVersion,
      startTimecode: manifest.startTimecode ?? "01:00:00:00",
      durationTimecode: manifest.durationTimecode ?? "00:00:00:00",
      startFrame: timelineFrames.startFrame,
      durationFrames: timelineFrames.durationFrames,
      fps: manifest.fps ?? 24,
      sampleRate: manifest.sampleRate ?? 48000,
      dropFrame: manifest.dropFrame ?? false,
      tracks,
      markers,
    },
  };

  return {
    sourceBundle,
    translationModel,
    mappingRules: templateMappingRules,
    fieldRecorderCandidates: tracks
      .flatMap((track) => track.clips)
      .map((clip, index) => ({
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

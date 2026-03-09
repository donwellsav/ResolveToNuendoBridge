import type {
  AnalysisReport,
  DeliveryArtifact,
  DeliveryPackage,
  MappingRule,
  OutputPreset,
  PreservationIssue,
  TranslationJob,
  TranslationModel,
} from "../types";
import { summarizeUnresolved } from "./mapping-workspace";

type PlanInputs = {
  job: TranslationJob;
  model: TranslationModel;
  outputPreset: OutputPreset;
  analysisReport: AnalysisReport;
  mappingRules: MappingRule[];
  preservationIssues: PreservationIssue[];
};

function artifactStatus(
  isBlocked: boolean,
  isPlaceholder: boolean,
  blockedNote: string,
  placeholderNote: string
): { status: DeliveryArtifact["status"]; note?: string } {
  if (isBlocked) {
    return { status: "blocked", note: blockedNote };
  }

  if (isPlaceholder) {
    return { status: "placeholder", note: placeholderNote };
  }

  return { status: "planned" };
}

export function planNuendoDeliveryArtifacts({
  job,
  model,
  outputPreset,
  analysisReport,
  mappingRules,
  preservationIssues,
}: PlanInputs): DeliveryArtifact[] {
  const hasCriticalIssue = preservationIssues.some((issue) => issue.severity === "critical");
  const unresolved = summarizeUnresolved(job.mappingWorkspace);
  const hasMarkers = model.timeline.markers.length > 0;
  const hasMetadata = model.timeline.tracks.some((track) => track.clips.length > 0);
  const matchedFieldRecorderCount = job.fieldRecorderCandidates.filter((candidate) => candidate.matched).length;
  const hasFieldRecorderMatches = matchedFieldRecorderCount > 0;
  const hasReferenceVideo = job.sourceBundle.intakeAssets.some((asset) => asset.fileRole === "reference_video");

  const aafStatus = artifactStatus(
    hasCriticalIssue,
    false,
    "AAF planning blocked by critical intake/canonical findings.",
    ""
  );

  const markerStatus = artifactStatus(
    hasCriticalIssue,
    !hasMarkers,
    "Marker exports blocked because delivery cannot proceed.",
    "No timeline markers found in canonical model."
  );

  const metadataStatus = artifactStatus(
    hasCriticalIssue,
    !hasMetadata || unresolved.unresolvedMetadataMappings > 0,
    "Metadata CSV blocked because delivery cannot proceed.",
    "No canonical clips available for metadata rows."
  );

  const referenceStatus = artifactStatus(
    hasCriticalIssue,
    !outputPreset.includeReferenceVideo || !hasReferenceVideo,
    "Reference video plan blocked because delivery cannot proceed.",
    !outputPreset.includeReferenceVideo
      ? "Output preset disables reference video export."
      : "No reference video file found in intake assets."
  );

  const fieldRecorderStatus = artifactStatus(
    hasCriticalIssue,
    !hasFieldRecorderMatches || unresolved.unresolvedFieldRecorderMappings > 0,
    "Field recorder report blocked because delivery cannot proceed.",
    "No matched field recorder candidates available."
  );

  return [
    {
      id: "out-aaf",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "aaf",
      fileRole: "timeline_exchange",
      fileName: "NUENDO_EXPORT.aaf",
      pathHint: "delivery/NUENDO_EXPORT.aaf",
      status: aafStatus.status,
      note: aafStatus.note,
    },
    {
      id: "out-marker-edl",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "edl",
      fileRole: "marker_export",
      fileName: "MARKERS.edl",
      pathHint: "delivery/MARKERS.edl",
      status: markerStatus.status,
      note: markerStatus.note,
    },
    {
      id: "out-marker-csv",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "csv",
      fileRole: "marker_export",
      fileName: "MARKERS.csv",
      pathHint: "delivery/MARKERS.csv",
      status: markerStatus.status,
      note: markerStatus.note,
    },
    {
      id: "out-metadata-csv",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "csv",
      fileRole: "metadata_export",
      fileName: "METADATA.csv",
      pathHint: "delivery/METADATA.csv",
      status: metadataStatus.status,
      note: metadataStatus.note,
    },
    {
      id: "out-manifest",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "json",
      fileRole: "delivery_manifest",
      fileName: "manifest.json",
      pathHint: "delivery/manifest.json",
      status: hasCriticalIssue ? "blocked" : "planned",
      note: hasCriticalIssue ? "Manifest planning blocked by critical intake/canonical findings." : undefined,
    },
    {
      id: "out-readme",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "txt",
      fileRole: "delivery_readme",
      fileName: "README_IMPORT.txt",
      pathHint: "delivery/README_IMPORT.txt",
      status: hasCriticalIssue ? "blocked" : "planned",
      note: hasCriticalIssue ? "README planning blocked by critical intake/canonical findings." : undefined,
    },
    {
      id: "out-reference-video",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "mov",
      fileRole: "reference_video",
      fileName: "REFERENCE.mov",
      pathHint: "delivery/REFERENCE.mov",
      status: referenceStatus.status,
      note: referenceStatus.note,
    },
    {
      id: "out-field-recorder",
      stage: "delivery",
      origin: "conform-bridge",
      fileKind: "csv",
      fileRole: "field_recorder_report",
      fileName: "FIELD_RECORDER_REPORT.csv",
      pathHint: "delivery/FIELD_RECORDER_REPORT.csv",
      status: fieldRecorderStatus.status,
      note: fieldRecorderStatus.note,
    },
  ];
}

export async function planNuendoDelivery(
  job: TranslationJob,
  model: TranslationModel
): Promise<{ packagePlan: DeliveryPackage; warnings: string[] }> {
  const unresolved = summarizeUnresolved(job.mappingWorkspace);
  const artifacts = planNuendoDeliveryArtifacts({
    job,
    model,
    outputPreset: job.outputPreset,
    analysisReport: job.analysisReport,
    mappingRules: job.mappingRules,
    preservationIssues: job.preservationIssues,
  });

  const blockedCount = artifacts.filter((artifact) => artifact.status === "blocked").length;
  const placeholderCount = artifacts.filter((artifact) => artifact.status === "placeholder").length;

  const packagePlan: DeliveryPackage = {
    id: `delivery-${job.id}`,
    stage: "delivery",
    target: "nuendo",
    packageName: `${job.sourceBundle.resolveTimelineVersion}_NUENDO_PLAN`,
    outputPresetId: job.outputPreset.id,
    artifacts,
  };

  return {
    packagePlan,
    warnings: [
      "Planner mode: Nuendo export writing remains unimplemented in this phase.",
      `Planner summary: ${job.analysisReport.blockedCount} intake blocks, ${blockedCount} blocked artifacts, ${placeholderCount} placeholders, ${job.mappingRules.length} mapping rules evaluated, ${unresolved.totalUnresolved} unresolved mapping decisions.`,
    ],
  };
}

import type {
  DeliveryArtifact,
  DeliveryExecutionPlan,
  DeliveryStagingBundle,
  DeferredArtifactDescriptor,
  MappingWorkspace,
  TranslationJob,
} from "../types";

type DeliveryStagingInputs = {
  job: TranslationJob;
  packagePlan: TranslationJob["deliveryPackage"];
  executionPlan: DeliveryExecutionPlan;
  effectiveWorkspace: MappingWorkspace;
  reviewState?: {
    trackTargetOverrides: Record<string, string>;
    markerOverrides: Record<string, unknown>;
    metadataOverrides: Record<string, unknown>;
    fieldRecorderOverrides: Record<string, unknown>;
    validationAcknowledgements: Record<string, unknown>;
    reconformDecisions: Record<string, unknown>;
  };
  stagingRoot?: string;
};

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildSourceSignature(job: TranslationJob): string {
  return [job.sourceBundle.id, job.sourceBundle.resolveTimelineVersion, job.sourceBundle.importedAtIso, job.translationModel.id].join("::");
}

function resolveGeneratedPath(artifactId: string, sequenceLabel: string): string {
  switch (artifactId) {
    case "out-manifest":
      return "manifest.json";
    case "out-readme":
      return "README_NUENDO_IMPORT.txt";
    case "out-marker-csv":
      return `markers/${sequenceLabel}_MARKERS.csv`;
    case "out-marker-edl":
      return `markers/${sequenceLabel}_MARKERS.edl`;
    case "out-metadata-csv":
      return `metadata/${sequenceLabel}_METADATA.csv`;
    case "out-field-recorder":
      return `reports/${sequenceLabel}_FIELD_RECORDER_REPORT.csv`;
    default:
      return `generated/${artifactId}.txt`;
  }
}

function resolveDeferredPath(artifact: DeliveryArtifact, sequenceLabel: string): string {
  if (artifact.fileKind === "aaf") {
    return `deferred/${sequenceLabel}_NUENDO_READY.aaf.deferred.json`;
  }
  return `deferred/${sequenceLabel}_REFERENCE_VIDEO.deferred.json`;
}

function dependenciesForArtifact(artifact: DeliveryArtifact): string[] {
  if (artifact.fileKind === "aaf") {
    return ["canonical.timeline", "mappingWorkspace.trackMappings", "mappingWorkspace.metadataMappings"];
  }
  return ["canonical.timeline", "delivery.referenceVideoPreset"];
}

function summarizeReviewInfluence(reviewState?: DeliveryStagingInputs["reviewState"]) {
  return {
    trackOverrides: Object.keys(reviewState?.trackTargetOverrides ?? {}).length,
    markerOverrides: Object.keys(reviewState?.markerOverrides ?? {}).length,
    metadataOverrides: Object.keys(reviewState?.metadataOverrides ?? {}).length,
    fieldRecorderOverrides: Object.keys(reviewState?.fieldRecorderOverrides ?? {}).length,
    validationAcknowledgements: Object.keys(reviewState?.validationAcknowledgements ?? {}).length,
    reconformDecisions: Object.keys(reviewState?.reconformDecisions ?? {}).length,
  };
}

export function stageDeliveryBundle({
  job,
  packagePlan,
  executionPlan,
  effectiveWorkspace,
  reviewState,
  stagingRoot = "staging",
}: DeliveryStagingInputs): DeliveryStagingBundle {
  const sequenceLabel = sanitizeSegment(job.sourceBundle.resolveTimelineVersion || job.translationModel.timeline.name || job.id);
  const rootLabel = sanitizeSegment(`${job.id}_${sequenceLabel}`);
  const rootPath = `${stagingRoot}/${rootLabel}`;

  const files: DeliveryStagingBundle["files"] = [];
  const deferredArtifacts: DeferredArtifactDescriptor[] = [];
  const unresolvedBlockers: string[] = [];

  for (const artifactExecution of executionPlan.artifacts) {
    if (artifactExecution.executionStatus === "generated" && artifactExecution.generatedPayload) {
      const relativePath = resolveGeneratedPath(artifactExecution.artifact.id, sequenceLabel);
      files.push({
        artifactId: artifactExecution.artifact.id,
        fileName: artifactExecution.artifact.fileName,
        relativePath,
        category: "generated",
        mediaType: artifactExecution.generatedPayload.mediaType,
        contentPreview: artifactExecution.generatedPayload.content,
      });
      continue;
    }

    if (artifactExecution.executionStatus === "deferred" && artifactExecution.deferredPayload) {
      const deferredPath = resolveDeferredPath(artifactExecution.artifact, sequenceLabel);
      const descriptor: DeferredArtifactDescriptor = {
        artifactId: artifactExecution.artifact.id,
        fileName: artifactExecution.artifact.fileName,
        deferredPath,
        status: artifactExecution.artifact.status,
        deferredReason: artifactExecution.deferredPayload.deferredReason,
        writerBoundary: artifactExecution.artifact.fileKind === "aaf" ? "nuendo_writer" : "reference_video_writer",
        sourceDependencies: dependenciesForArtifact(artifactExecution.artifact),
      };
      deferredArtifacts.push(descriptor);
      files.push({
        artifactId: artifactExecution.artifact.id,
        fileName: `${artifactExecution.artifact.fileName}.deferred.json`,
        relativePath: deferredPath,
        category: "deferred",
        mediaType: "application/json",
        contentPreview: `${JSON.stringify(descriptor, null, 2)}\n`,
      });
      continue;
    }

    if (artifactExecution.executionStatus === "unavailable") {
      unresolvedBlockers.push(`${artifactExecution.artifact.id}: ${artifactExecution.note ?? "not available for staging"}`);
    }
  }

  const summary = {
    jobId: job.id,
    deliveryPackageId: packagePlan.id,
    sourceSignature: buildSourceSignature(job),
    generatedArtifacts: files.filter((file) => file.category === "generated").length,
    deferredArtifacts: deferredArtifacts.length,
    unavailableArtifacts: executionPlan.artifacts.filter((artifact) => artifact.executionStatus === "unavailable").length,
    unresolvedBlockers,
    reviewInfluence: summarizeReviewInfluence(reviewState),
    artifactPaths: files.map((file) => ({
      artifactId: file.artifactId,
      relativePath: file.relativePath,
      category: file.category,
    })),
  };

  files.push({
    artifactId: "staging-summary",
    fileName: "staging-summary.json",
    relativePath: "staging-summary.json",
    category: "generated",
    mediaType: "application/json",
    contentPreview: `${JSON.stringify(summary, null, 2)}\n`,
  });

  void effectiveWorkspace;

  return {
    stage: "delivery-staging",
    rootLabel,
    rootPath,
    files,
    deferredArtifacts,
    summary,
  };
}

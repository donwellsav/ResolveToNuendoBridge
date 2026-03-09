import type {
  DeferredWriterArtifact,
  DeferredWriterInput,
  DeferredWriterInputVersion,
  DeliveryArtifact,
  DeliveryHandoffBundle,
  DeliveryHandoffManifest,
  DeliveryReviewSignature,
  DeliverySourceSignature,
  DeliveryStagingBundle,
  MappingWorkspace,
  TranslationJob,
  WriterDependency,
  WriterReadinessStatus,
} from "../types";

type DeliveryHandoffInputs = {
  job: TranslationJob;
  packagePlan: TranslationJob["deliveryPackage"];
  executionPlan: NonNullable<TranslationJob["deliveryExecution"]>;
  stagingBundle: DeliveryStagingBundle;
  effectiveWorkspace: MappingWorkspace;
  reviewState?: {
    trackTargetOverrides: Record<string, string>;
    markerOverrides: Record<string, unknown>;
    metadataOverrides: Record<string, unknown>;
    fieldRecorderOverrides: Record<string, unknown>;
    validationAcknowledgements: Record<string, unknown>;
    reconformDecisions: Record<string, unknown>;
  };
};

const WRITER_INPUT_VERSION: DeferredWriterInputVersion = "phase3c.v1";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
}

function hashSignature(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function buildSourceSignature(job: TranslationJob): DeliverySourceSignature {
  const payload = {
    sourceBundleId: job.sourceBundle.id,
    resolveTimelineVersion: job.sourceBundle.resolveTimelineVersion,
    importedAtIso: job.sourceBundle.importedAtIso,
    translationModelId: job.translationModel.id,
  };

  return {
    ...payload,
    signature: hashSignature(stableStringify(payload)),
  };
}

function buildReviewSignature(inputs: DeliveryHandoffInputs["reviewState"]): DeliveryReviewSignature {
  const influence = {
    trackOverrides: Object.keys(inputs?.trackTargetOverrides ?? {}).length,
    markerOverrides: Object.keys(inputs?.markerOverrides ?? {}).length,
    metadataOverrides: Object.keys(inputs?.metadataOverrides ?? {}).length,
    fieldRecorderOverrides: Object.keys(inputs?.fieldRecorderOverrides ?? {}).length,
    validationAcknowledgements: Object.keys(inputs?.validationAcknowledgements ?? {}).length,
    reconformDecisions: Object.keys(inputs?.reconformDecisions ?? {}).length,
  };

  const revision = hashSignature(stableStringify(influence));
  return { revision, influence };
}

function classifyDeferredKind(artifact: DeliveryArtifact): DeferredWriterArtifact["artifactKind"] {
  if (artifact.fileKind === "aaf") {
    return "nuendo_ready_aaf";
  }
  if (artifact.fileRole === "reference_video") {
    return "reference_video_binary";
  }
  return "nuendo_session";
}

function resolveWriterCapability(kind: DeferredWriterArtifact["artifactKind"]): DeferredWriterArtifact["requiredWriterCapability"] {
  switch (kind) {
    case "nuendo_ready_aaf":
      return "nuendo_writer.aaf";
    case "reference_video_binary":
      return "video_writer.reference";
    case "nuendo_session":
      return "nuendo_writer.session";
  }
}

function buildDependencies(
  job: TranslationJob,
  artifact: DeliveryArtifact,
  stagedPathSet: Set<string>,
  effectiveWorkspace: MappingWorkspace
): WriterDependency[] {
  const dependencies: WriterDependency[] = [
    {
      id: `${artifact.id}:canonical-timeline`,
      reference: "canonical.timeline",
      status: job.translationModel.timeline.tracks.length > 0 ? "satisfied" : "missing",
      reason: job.translationModel.timeline.tracks.length > 0 ? undefined : "Canonical timeline has no normalized tracks.",
    },
    {
      id: `${artifact.id}:metadata-csv`,
      reference: "staging:metadata/*_METADATA.csv",
      status: Array.from(stagedPathSet).some((path) => path.includes("_METADATA.csv")) ? "satisfied" : "missing",
      reason: Array.from(stagedPathSet).some((path) => path.includes("_METADATA.csv"))
        ? undefined
        : "Metadata CSV prerequisite is missing from staged output.",
    },
    {
      id: `${artifact.id}:field-recorder`,
      reference: "mappingWorkspace.fieldRecorderMappings",
      status: effectiveWorkspace.fieldRecorderMappings.some((mapping) => mapping.selected) ? "satisfied" : "blocked",
      reason: effectiveWorkspace.fieldRecorderMappings.some((mapping) => mapping.selected)
        ? undefined
        : "No selected field recorder matches are available for deferred writer handoff.",
    },
  ];

  if (artifact.fileRole === "reference_video") {
    const refInIntake = job.sourceBundle.intakeAssets.some((asset) => asset.fileRole === "reference_video" && asset.status === "ready");
    dependencies.push({
      id: `${artifact.id}:intake-reference-video`,
      reference: "intake.reference_video",
      status: refInIntake ? "satisfied" : "missing",
      reason: refInIntake ? undefined : "Reference video dependency was not present/ready in intake bundle.",
    });
  }

  return dependencies;
}

function buildBlockers(job: TranslationJob, artifactId: string, dependencies: WriterDependency[]): string[] {
  const blockers = dependencies
    .filter((dependency) => dependency.status !== "satisfied")
    .map((dependency) => `${dependency.reference}: ${dependency.reason ?? dependency.status}`);

  const criticalIssues = job.preservationIssues
    .filter((issue) => issue.severity === "critical" && (!issue.targetArtifactId || issue.targetArtifactId === artifactId))
    .map((issue) => `${issue.id}: ${issue.title}`);

  return [...blockers, ...criticalIssues];
}

function resolveReadinessStatus(
  artifact: DeliveryArtifact,
  dependencies: WriterDependency[],
  unresolvedBlockers: string[]
): WriterReadinessStatus {
  if (artifact.fileKind !== "aaf" && artifact.fileRole !== "reference_video") {
    return "deferred-with-known-gaps";
  }

  if (dependencies.some((dependency) => dependency.status === "blocked") || unresolvedBlockers.length > 0) {
    return "blocked";
  }

  if (dependencies.some((dependency) => dependency.status === "missing")) {
    return "partial";
  }

  return "ready-for-writer";
}

function buildExplanation(status: WriterReadinessStatus, blockers: string[]): string {
  if (status === "ready-for-writer") {
    return "Deferred artifact contract is complete and ready for future writer execution.";
  }
  if (status === "partial") {
    return "Deferred artifact contract is mostly complete but has missing prerequisites to be staged/resolved.";
  }
  if (status === "deferred-with-known-gaps") {
    return "Artifact kind is intentionally deferred and outside currently supported writer capability set.";
  }
  return `Deferred artifact is blocked by unresolved prerequisites: ${blockers.join("; ")}`;
}

function buildPackageSignature(packageId: string, writerInputs: DeferredWriterInput[]): string {
  return hashSignature(
    stableStringify({
      packageId,
      writerInputIds: writerInputs.map((item) => item.inputId),
      statuses: writerInputs.map((item) => item.artifact.readinessStatus),
    })
  );
}

export function buildDeliveryHandoffContracts({
  job,
  packagePlan,
  executionPlan,
  stagingBundle,
  effectiveWorkspace,
  reviewState,
}: DeliveryHandoffInputs): DeliveryHandoffBundle {
  const sourceSignature = buildSourceSignature(job);
  const reviewSignature = buildReviewSignature(reviewState);
  const stagedPathSet = new Set(stagingBundle.files.map((file) => file.relativePath));

  const deferredArtifacts = executionPlan.artifacts
    .filter((artifact) => artifact.executionStatus === "deferred")
    .map((item) => item.artifact)
    .sort((a, b) => a.id.localeCompare(b.id));

  const writerInputs: DeferredWriterInput[] = deferredArtifacts.map((artifact) => {
    const stagedDescriptorPath =
      stagingBundle.deferredArtifacts.find((descriptor) => descriptor.artifactId === artifact.id)?.deferredPath ??
      `deferred/${artifact.id}.deferred.json`;

    const dependencies = buildDependencies(job, artifact, stagedPathSet, effectiveWorkspace);
    const unresolvedBlockers = buildBlockers(job, artifact.id, dependencies);
    const readinessStatus = resolveReadinessStatus(artifact, dependencies, unresolvedBlockers);
    const artifactKind = classifyDeferredKind(artifact);

    const writerArtifact: DeferredWriterArtifact = {
      artifactId: artifact.id,
      artifactKind,
      plannedOutputPath: artifact.pathHint,
      stagedDescriptorPath,
      requiredWriterCapability: resolveWriterCapability(artifactKind),
      dependencies,
      unresolvedBlockers,
      readinessStatus,
      explanation: buildExplanation(readinessStatus, unresolvedBlockers),
      machinePayload: {
        artifactId: artifact.id,
        fileName: artifact.fileName,
        fileKind: artifact.fileKind,
        fileRole: artifact.fileRole,
        sourceSignature: sourceSignature.signature,
        reviewRevision: reviewSignature.revision,
        dependencyRefs: dependencies.map((dependency) => dependency.reference),
      },
    };

    const inputSeed = stableStringify({
      packageId: packagePlan.id,
      artifactId: artifact.id,
      sourceSignature: sourceSignature.signature,
      reviewRevision: reviewSignature.revision,
      version: WRITER_INPUT_VERSION,
    });

    return {
      inputId: `writer-input-${hashSignature(inputSeed).replace("fnv1a32:", "")}`,
      inputVersion: WRITER_INPUT_VERSION,
      packageId: packagePlan.id,
      packageSignature: "pending",
      sourceSignature,
      reviewSignature,
      artifact: writerArtifact,
    };
  });

  const packageSignature = buildPackageSignature(packagePlan.id, writerInputs);
  const finalizedInputs = writerInputs.map((input) => ({ ...input, packageSignature }));

  const artifacts: DeliveryHandoffManifest["artifacts"] = executionPlan.artifacts.map((entry) => ({
    artifactId: entry.artifact.id,
    fileName: entry.artifact.fileName,
    category: entry.executionStatus === "deferred" ? "deferred" : "generated",
    relativePath:
      stagingBundle.files.find((file) => file.artifactId === entry.artifact.id)?.relativePath ?? entry.artifact.pathHint,
    executionStatus: entry.executionStatus,
  }));

  const unresolvedBlockers = finalizedInputs.flatMap((input) => input.artifact.unresolvedBlockers);

  const summary = {
    packageId: packagePlan.id,
    packageName: packagePlan.packageName,
    packageVersion: WRITER_INPUT_VERSION,
    packageSignature,
    sourceSignature,
    reviewSignature,
    generatedArtifacts: artifacts.filter((artifact) => artifact.category === "generated").length,
    deferredArtifacts: finalizedInputs.length,
    readyForWriter: finalizedInputs.filter((input) => input.artifact.readinessStatus === "ready-for-writer").length,
    blocked: finalizedInputs.filter((input) => input.artifact.readinessStatus === "blocked").length,
    partial: finalizedInputs.filter((input) => input.artifact.readinessStatus === "partial").length,
    deferredWithKnownGaps: finalizedInputs.filter((input) => input.artifact.readinessStatus === "deferred-with-known-gaps")
      .length,
    unresolvedBlockers,
  };

  const manifest: DeliveryHandoffManifest = {
    manifestVersion: WRITER_INPUT_VERSION,
    generatedAtIso: job.sourceBundle.importedAtIso,
    artifacts,
    deferredWriterInputs: finalizedInputs,
    summary,
  };

  const files: DeliveryHandoffBundle["files"] = [
    {
      artifactId: "handoff-writer-inputs",
      fileName: "deferred-writer-inputs.json",
      relativePath: "handoff/deferred-writer-inputs.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(finalizedInputs, null, 2)}\n`,
    },
    {
      artifactId: "handoff-manifest",
      fileName: "delivery-handoff-manifest.json",
      relativePath: "handoff/delivery-handoff-manifest.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    {
      artifactId: "handoff-summary",
      fileName: "delivery-handoff-summary.json",
      relativePath: "handoff/delivery-handoff-summary.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(summary, null, 2)}\n`,
    },
  ];

  return {
    stage: "delivery-handoff",
    writerInputVersion: WRITER_INPUT_VERSION,
    writerInputs: finalizedInputs,
    manifest,
    summary,
    files,
  };
}

import type {
  ExternalExecutionDeferredInput,
  ExternalExecutionEntry,
  ExternalExecutionManifest,
  ExternalExecutionPackage,
  ExternalExecutionPackageVersion,
  ExternalExecutionStatus,
  TranslationJob,
} from "../types";
import { buildExecutorCompatibilityArtifacts } from "./executor-compatibility";

type ExternalExecutionPackageInputs = {
  job: TranslationJob;
  stagingBundle: NonNullable<TranslationJob["deliveryStaging"]>;
  handoffBundle: NonNullable<TranslationJob["deliveryHandoff"]>;
  exportRoot?: string;
  transportProfileId?: "canonical-filesystem-transport-v1" | "filesystem-strict-export-v1";
  receiptProfileId?: "canonical-filesystem-transport-v1" | "compatibility-filesystem-receipt-v1";
  executorProfileId?: "canonical-filesystem-executor-v1" | "compatibility-filesystem-executor-v1" | "future-service-executor-placeholder";
};

const PACKAGE_VERSION: ExternalExecutionPackageVersion = "phase3d.v1";

function sanitizeSegment(value: string): string {
  return value
    .trim()
    .replace(/[^A-Za-z0-9_-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

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

function asFileName(relativePath: string): string {
  const segments = relativePath.split("/");
  return segments[segments.length - 1] ?? relativePath;
}

function buildPackageReadiness(
  job: TranslationJob,
  stagingBundle: ExternalExecutionPackageInputs["stagingBundle"],
  handoffBundle: ExternalExecutionPackageInputs["handoffBundle"]
): { status: ExternalExecutionStatus; reasons: string[] } {
  const reasons: string[] = [];

  if (stagingBundle.summary.unavailableArtifacts > 0) {
    reasons.push(`staging has ${stagingBundle.summary.unavailableArtifacts} unavailable artifact(s)`);
  }

  const blockedPreservation = job.preservationIssues.filter((issue) => issue.severity === "critical");
  if (blockedPreservation.length > 0) {
    reasons.push(`critical preservation issues remain (${blockedPreservation.length})`);
  }

  if (handoffBundle.summary.blocked > 0) {
    reasons.push(`handoff has ${handoffBundle.summary.blocked} blocked deferred input(s)`);
  }

  if (handoffBundle.summary.partial > 0) {
    reasons.push(`handoff has ${handoffBundle.summary.partial} partial deferred input(s)`);
  }

  const expectedGenerated = stagingBundle.summary.generatedArtifacts;
  const generatedPresent = stagingBundle.files.filter((file) => file.category === "generated").length;
  if (generatedPresent < expectedGenerated) {
    reasons.push("one or more generated staged payloads are missing from package inputs");
  }

  if (handoffBundle.summary.blocked > 0 || blockedPreservation.length > 0) {
    return { status: "blocked", reasons: reasons.sort((a, b) => a.localeCompare(b)) };
  }

  if (handoffBundle.summary.partial > 0 || stagingBundle.summary.unavailableArtifacts > 0) {
    return { status: "partial", reasons: reasons.sort((a, b) => a.localeCompare(b)) };
  }

  return { status: "ready", reasons: [] };
}

export function buildExternalExecutionPackage({
  job,
  stagingBundle,
  handoffBundle,
  exportRoot = "exports",
  transportProfileId = "canonical-filesystem-transport-v1",
  receiptProfileId = "canonical-filesystem-transport-v1",
  executorProfileId = "canonical-filesystem-executor-v1",
}: ExternalExecutionPackageInputs): ExternalExecutionPackage {
  const sequenceLabel = sanitizeSegment(job.sourceBundle.resolveTimelineVersion || job.translationModel.timeline.name || job.id);
  const rootLabel = sanitizeSegment(`${job.id}_${sequenceLabel}`);
  const rootPath = `${exportRoot}/${rootLabel}`;

  const entries: ExternalExecutionEntry[] = [];
  const checksums: ExternalExecutionPackage["checksums"] = [];

  for (const file of stagingBundle.files) {
    const relativePath = `staged/${file.relativePath}`;
    const sizeBytes = Buffer.byteLength(file.contentPreview, "utf8");
    const checksum = { algorithm: "fnv1a32" as const, value: hashSignature(file.contentPreview) };
    entries.push({
      entryId: `entry-${hashSignature(`${file.artifactId}:${relativePath}`).replace("fnv1a32:", "")}`,
      sourceStage: "staged",
      artifactId: file.artifactId,
      artifactKind: file.category,
      classification: file.category === "generated" ? "generated" : "deferred-contract",
      relativePath,
      mediaType: file.mediaType,
      sizeBytes,
      checksum,
      status: file.category === "generated" ? "generated" : "contract-only",
      reason: file.category === "generated" ? undefined : "deferred binary remains contract-only in Phase 3D",
    });
    checksums.push({ relativePath, checksum, sizeBytes });
  }

  for (const file of handoffBundle.files) {
    const relativePath = file.relativePath;
    const sizeBytes = Buffer.byteLength(file.contentPreview, "utf8");
    const checksum = { algorithm: "fnv1a32" as const, value: hashSignature(file.contentPreview) };
    entries.push({
      entryId: `entry-${hashSignature(`${file.artifactId}:${relativePath}`).replace("fnv1a32:", "")}`,
      sourceStage: "handoff",
      artifactId: file.artifactId,
      artifactKind: "handoff-contract",
      classification: "deferred-contract",
      relativePath,
      mediaType: file.mediaType,
      sizeBytes,
      checksum,
      status: "contract-only",
      reason: "handoff manifests and deferred writer inputs are contract-only outputs",
    });
    checksums.push({ relativePath, checksum, sizeBytes });
  }

  entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  checksums.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const deferredInputs: ExternalExecutionDeferredInput[] = handoffBundle.writerInputs
    .map((input) => ({
      inputId: input.inputId,
      artifactId: input.artifact.artifactId,
      readinessStatus: input.artifact.readinessStatus,
      requiredWriterCapability: input.artifact.requiredWriterCapability,
      unresolvedBlockers: [...input.artifact.unresolvedBlockers],
    }))
    .sort((a, b) => a.artifactId.localeCompare(b.artifactId));

  const readiness = buildPackageReadiness(job, stagingBundle, handoffBundle);

  const packageSignature = hashSignature(
    stableStringify({
      packageId: job.deliveryPackage.id,
      packageVersion: PACKAGE_VERSION,
      status: readiness.status,
      entryPaths: entries.map((entry) => entry.relativePath),
      checksums: checksums.map((item) => `${item.relativePath}:${item.checksum.value}`),
      sourceSignature: handoffBundle.summary.sourceSignature.signature,
      reviewSignature: handoffBundle.summary.reviewSignature.revision,
    })
  );

  const manifest: ExternalExecutionManifest = {
    manifestVersion: PACKAGE_VERSION,
    packageId: job.deliveryPackage.id,
    packageSignature,
    generatedAtIso: job.sourceBundle.importedAtIso,
    sourceSignature: handoffBundle.summary.sourceSignature,
    reviewSignature: handoffBundle.summary.reviewSignature,
    status: readiness.status,
    reasons: readiness.reasons,
  };

  const index = {
    indexVersion: PACKAGE_VERSION,
    packageId: job.deliveryPackage.id,
    entries,
    generatedCount: entries.filter((entry) => entry.classification === "generated").length,
    deferredContractCount: entries.filter((entry) => entry.classification === "deferred-contract").length,
    packageMetadataCount: 6,
  };

  const summary = {
    packageId: job.deliveryPackage.id,
    packageVersion: PACKAGE_VERSION,
    packageSignature,
    status: readiness.status,
    reasons: readiness.reasons,
    sourceSignature: handoffBundle.summary.sourceSignature.signature,
    reviewSignature: handoffBundle.summary.reviewSignature.revision,
    stagedGeneratedArtifacts: stagingBundle.summary.generatedArtifacts,
    stagedDeferredArtifacts: stagingBundle.summary.deferredArtifacts,
    handoffDeferredInputs: deferredInputs.length,
    blockedDeferredInputs: deferredInputs.filter((input) => input.readinessStatus === "blocked").length,
    partialDeferredInputs: deferredInputs.filter((input) => input.readinessStatus === "partial").length,
  };

  const compatibility = buildExecutorCompatibilityArtifacts({
    pkg: {
      packageVersion: PACKAGE_VERSION,
      transportProfileId,
      receiptProfileId,
      manifest,
      index,
      summary,
      files: [],
    },
    profileId: executorProfileId,
    transportProfileId,
    receiptProfileId,
    handoffManifestVersion: handoffBundle.manifest.manifestVersion,
  });

  const packageFiles: ExternalExecutionPackage["files"] = [
    ...stagingBundle.files.map((file) => ({
      artifactId: file.artifactId,
      fileName: asFileName(file.relativePath),
      relativePath: `staged/${file.relativePath}`,
      mediaType: file.mediaType,
      contentPreview: file.contentPreview,
    })),
    ...handoffBundle.files.map((file) => ({
      artifactId: file.artifactId,
      fileName: file.fileName,
      relativePath: file.relativePath,
      mediaType: file.mediaType,
      contentPreview: file.contentPreview,
    })),
    {
      artifactId: "external-execution-manifest",
      fileName: "external-execution-manifest.json",
      relativePath: "package/external-execution-manifest.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(manifest, null, 2)}\n`,
    },
    {
      artifactId: "external-execution-index",
      fileName: "external-execution-index.json",
      relativePath: "package/external-execution-index.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(index, null, 2)}\n`,
    },
    {
      artifactId: "external-execution-summary",
      fileName: "external-execution-summary.json",
      relativePath: "package/external-execution-summary.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(summary, null, 2)}\n`,
    },
    {
      artifactId: "checksums",
      fileName: "checksums.json",
      relativePath: "package/checksums.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(checksums, null, 2)}\n`,
    },
    {
      artifactId: "deferred-writer-inputs",
      fileName: "deferred-writer-inputs.json",
      relativePath: "package/deferred-writer-inputs.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(deferredInputs, null, 2)}\n`,
    },
    {
      artifactId: "generated-artifact-index",
      fileName: "generated-artifact-index.json",
      relativePath: "package/generated-artifact-index.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(entries.filter((entry) => entry.classification === "generated"), null, 2)}\n`,
    },
    {
      artifactId: "executor-profile-resolution",
      fileName: "executor-profile-resolution.json",
      relativePath: "handoff/executor-profile-resolution.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(compatibility.profileResolution, null, 2)}\n`,
    },
    {
      artifactId: "executor-compatibility-report",
      fileName: "executor-compatibility-report.json",
      relativePath: "handoff/executor-compatibility-report.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(compatibility.report, null, 2)}\n`,
    },
    {
      artifactId: "executor-compatibility-summary",
      fileName: "executor-compatibility-summary.json",
      relativePath: "handoff/executor-compatibility-summary.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(compatibility.summary, null, 2)}\n`,
    },
  ].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return {
    stage: "external-execution-package",
    packageVersion: PACKAGE_VERSION,
    transportProfileId,
    receiptProfileId,
    rootLabel,
    rootPath,
    manifest,
    index,
    summary,
    executorCompatibility: compatibility,
    deferredInputs,
    checksums,
    files: packageFiles,
  };
}

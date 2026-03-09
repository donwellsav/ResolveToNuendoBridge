import type {
  ExternalExecutionPackage,
  WriterAdapterArtifactMatch,
  WriterAdapterRegistryReport,
  WriterRunArtifactRequest,
  WriterRunBlockedReason,
  WriterRunBundle,
  WriterRunReceipt,
  WriterRunReceiptArtifact,
  WriterRunRequest,
  WriterRunRequestId,
  WriterRunRequestVersion,
  WriterRunnerReadiness,
  WriterRunnerUnsupportedReason,
} from "../types";
import { createDefaultWriterRunnerRegistry } from "./writer-runner-registry";
import { buildWriterRunReceipt } from "./writer-runner-receipts";

const WRITER_RUN_REQUEST_VERSION: WriterRunRequestVersion = "phase3f.v1";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
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

function asRequestId(input: { packageId: string; artifactId: string; packageSignature: string }): WriterRunRequestId {
  return `writer-run-${hashSignature(stableStringify(input)).replace("fnv1a32:", "")}`;
}

function toBlockedReasons(match: WriterAdapterArtifactMatch, dependencyReferences: string[]): WriterRunBlockedReason[] {
  const base: WriterRunBlockedReason[] = [];
  if (match.state === "blocked") {
    base.push({
      code: match.readinessStatus === "partial" ? "readiness-partial" : "readiness-blocked",
      message: match.reason,
      dependencyReferences,
    });
  }
  for (const unsupported of match.unsupported) {
    if (unsupported.code === "dependency-blocked") {
      base.push({ code: "dependency-blocked", message: unsupported.message, dependencyReferences });
    }
    if (unsupported.code === "adapter-placeholder" || unsupported.code === "capability-mismatch") {
      base.push({ code: "adapter-unsupported", message: unsupported.message, dependencyReferences });
    }
  }
  return base.sort((a, b) => `${a.code}:${a.message}`.localeCompare(`${b.code}:${b.message}`));
}

function toRunnerReasonCode(code: WriterAdapterArtifactMatch["unsupported"][number]["code"]): WriterRunnerUnsupportedReason["code"] {
  if (code === "capability-mismatch") return "missing-adapter";
  if (code === "adapter-placeholder") return "adapter-unsupported";
  if (code === "dependency-blocked") return "dependency-blocked";
  if (code === "readiness-blocked") return "readiness-blocked";
  if (code === "readiness-partial") return "readiness-partial";
  if (code === "known-gap") return "known-gap";
  return "adapter-unsupported";
}

function toUnsupportedReasons(match: WriterAdapterArtifactMatch): WriterRunnerUnsupportedReason[] {
  return match.unsupported
    .map((reason): WriterRunnerUnsupportedReason => ({
      code: toRunnerReasonCode(reason.code),
      message: reason.message,
      artifactId: match.artifactId,
      machineCode: reason.code,
    }))
    .sort((a, b) => `${a.code}:${a.message}`.localeCompare(`${b.code}:${b.message}`));
}

function mapReadiness(match: WriterAdapterArtifactMatch, pkg: ExternalExecutionPackage): WriterRunnerReadiness {
  if (pkg.summary.status === "blocked") return "blocked";
  if (match.state === "ready") return "ready";
  if (match.state === "blocked") return "blocked";
  if (match.state === "unsupported") return "unsupported";
  return "partial";
}

function buildArtifactRequest(pkg: ExternalExecutionPackage, match: WriterAdapterArtifactMatch): WriterRunArtifactRequest {
  const deferred = pkg.deferredInputs.find((item) => item.artifactId === match.artifactId);
  const handoffFile = pkg.files.find((file) => file.relativePath === "handoff/deferred-writer-inputs.json");
  const handoffInputs = handoffFile
    ? (JSON.parse(handoffFile.contentPreview) as Array<{
        inputId: string;
        artifact: {
          artifactId: string;
          plannedOutputPath: string;
          stagedDescriptorPath: string;
          dependencies: Array<{ reference: string }>;
        };
      }>)
    : [];
  const handoff = handoffInputs.find((item) => item.artifact.artifactId === match.artifactId);

  return {
    artifactId: match.artifactId,
    inputId: handoff?.inputId ?? `unknown-${match.artifactId}`,
    artifactKind: match.artifactKind,
    plannedOutputPath: handoff?.artifact.plannedOutputPath ?? `delivery/${match.artifactId}`,
    stagedDescriptorPath: handoff?.artifact.stagedDescriptorPath ?? `deferred/${match.artifactId}.deferred.json`,
    requiredWriterCapability: match.requiredWriterCapability,
    readinessStatus: match.readinessStatus,
    dependencySummary: {
      satisfied: deferred?.readinessStatus === "ready-for-writer" ? 1 : 0,
      missing: deferred?.readinessStatus === "partial" ? 1 : 0,
      blocked: deferred?.readinessStatus === "blocked" ? 1 : 0,
    },
    unresolvedBlockers: [...(deferred?.unresolvedBlockers ?? [])].sort(),
    dependencyReferences: (handoff?.artifact.dependencies ?? []).map((dep) => dep.reference).sort(),
  };
}

export function buildWriterRunBundle(params: {
  pkg: ExternalExecutionPackage;
  adapterReport: WriterAdapterRegistryReport;
}): WriterRunBundle {
  const { pkg, adapterReport } = params;

  const requests: WriterRunRequest[] = adapterReport.matches
    .map((match, requestSequence) => {
      const artifact = buildArtifactRequest(pkg, match);
      const dependencyReferences = artifact.dependencyReferences;
      const requestId = asRequestId({
        packageId: pkg.summary.packageId,
        artifactId: artifact.artifactId,
        packageSignature: pkg.summary.packageSignature,
      });
      const unsupportedReasons = [
        ...toUnsupportedReasons(match),
        ...(pkg.summary.status !== "ready"
          ? [
              {
                code: "package-not-ready" as const,
                message: `External package readiness is ${pkg.summary.status}.`,
                artifactId: artifact.artifactId,
                machineCode: "package-status",
              },
            ]
          : []),
      ];

      return {
        requestId,
        requestVersion: WRITER_RUN_REQUEST_VERSION,
        requestSequence: requestSequence + 1,
        packageId: pkg.summary.packageId,
        packageVersion: pkg.packageVersion,
        packageSignature: pkg.summary.packageSignature,
        packageReadiness: pkg.summary.status,
        sourceSignature: pkg.manifest.sourceSignature,
        reviewSignature: pkg.manifest.reviewSignature,
        adapterId: match.adapterId,
        adapterVersion: match.adapterVersion,
        runnerId: match.state === "ready" ? ("reference.noop-runner" as const) : undefined,
        runnerReadiness: mapReadiness(match, pkg),
        unsupportedReasons,
        blockedReasons: toBlockedReasons(match, dependencyReferences),
        artifact,
      };
    })
    .sort((a, b) => a.artifact.artifactId.localeCompare(b.artifact.artifactId));

  const registry = createDefaultWriterRunnerRegistry();
  const responses = requests
    .map((request) => registry.run(request))
    .sort((a, b) => a.requestId.localeCompare(b.requestId));

  const receipt: WriterRunReceipt = buildWriterRunReceipt({ pkg, adapterReport, requests, responses });

  const requestContent = `${JSON.stringify(requests, null, 2)}\n`;
  const responseContent = `${JSON.stringify(responses, null, 2)}\n`;
  const receiptContent = `${JSON.stringify(receipt, null, 2)}\n`;

  const files: WriterRunBundle["files"] = [
    {
      artifactId: "writer-run-requests",
      fileName: "writer-run-requests.json",
      relativePath: "handoff/writer-run-requests.json",
      mediaType: "application/json",
      contentPreview: requestContent,
    },
    {
      artifactId: "writer-run-responses",
      fileName: "writer-run-responses.json",
      relativePath: "handoff/writer-run-responses.json",
      mediaType: "application/json",
      contentPreview: responseContent,
    },
    {
      artifactId: "writer-run-receipts",
      fileName: "writer-run-receipts.json",
      relativePath: "handoff/writer-run-receipts.json",
      mediaType: "application/json",
      contentPreview: receiptContent,
    },
  ];

  return {
    stage: "writer-runner",
    requestVersion: WRITER_RUN_REQUEST_VERSION,
    requests,
    responses,
    receipt,
    files,
  };
}

export function serializeWriterRunRequest(request: WriterRunRequest): string {
  return stableStringify(request);
}

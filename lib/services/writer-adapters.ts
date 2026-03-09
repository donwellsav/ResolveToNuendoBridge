import type {
  ExternalExecutionPackage,
  WriterAdapterCapability,
  WriterAdapterInput,
  WriterAdapterReadiness,
  WriterAdapterUnsupportedReason,
  WriterAdapterValidationResult,
  WriterReadinessStatus,
} from "../types";

const WRITER_ADAPTER_SCHEMA_VERSION = "phase3e.v1" as const;

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

export function serializeWriterAdapterInput(input: WriterAdapterInput): string {
  return stableStringify(input);
}

export function normalizeWriterAdapterInput(pkg: ExternalExecutionPackage): WriterAdapterInput {
  const deferredInputByArtifact = new Map(pkg.deferredInputs.map((item) => [item.artifactId, item]));

  const handoffInputsFile = pkg.files.find((file) => file.relativePath === "handoff/deferred-writer-inputs.json");
  const handoffInputs = handoffInputsFile
    ? (JSON.parse(handoffInputsFile.contentPreview) as Array<{
        inputId: string;
        artifact: {
          artifactId: string;
          artifactKind: WriterAdapterInput["artifacts"][number]["artifactKind"];
          plannedOutputPath: string;
          stagedDescriptorPath: string;
          dependencies: Array<{ status: "satisfied" | "missing" | "blocked" }>;
        };
      }>)
    : [];

  const artifacts = handoffInputs
    .map((input) => {
      const deferredInput = deferredInputByArtifact.get(input.artifact.artifactId);
      const dependencySummary = input.artifact.dependencies.reduce(
        (summary, dependency) => {
          summary[dependency.status] += 1;
          return summary;
        },
        { satisfied: 0, missing: 0, blocked: 0 }
      );

      return {
        artifactId: input.artifact.artifactId,
        inputId: input.inputId,
        artifactKind: input.artifact.artifactKind,
        plannedOutputPath: input.artifact.plannedOutputPath,
        stagedDescriptorPath: input.artifact.stagedDescriptorPath,
        requiredWriterCapability: deferredInput?.requiredWriterCapability ?? "nuendo_writer.session",
        readinessStatus: deferredInput?.readinessStatus ?? ("deferred-with-known-gaps" as WriterReadinessStatus),
        unresolvedBlockers: [...(deferredInput?.unresolvedBlockers ?? [])],
        dependencySummary,
      };
    })
    .sort((a, b) => a.artifactId.localeCompare(b.artifactId));

  return {
    schemaVersion: WRITER_ADAPTER_SCHEMA_VERSION,
    packageId: pkg.summary.packageId,
    packageVersion: pkg.packageVersion,
    packageSignature: pkg.summary.packageSignature,
    packageReadiness: pkg.summary.status,
    sourceSignature: pkg.manifest.sourceSignature,
    reviewSignature: pkg.manifest.reviewSignature,
    handoffManifestVersion: "phase3c.v1",
    artifacts,
    entries: pkg.index.entries
      .map((entry) => ({
        artifactId: entry.artifactId,
        artifactKind: entry.artifactKind,
        classification: entry.classification,
        relativePath: entry.relativePath,
        status: entry.status,
      }))
      .sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
  };
}

export function resolveAdapterReadiness(
  results: Array<{ readiness: WriterAdapterReadiness }>,
  unsupported: WriterAdapterUnsupportedReason[]
): WriterAdapterReadiness {
  if (results.some((result) => result.readiness === "blocked") || unsupported.some((reason) => reason.code === "readiness-blocked")) {
    return "blocked";
  }
  if (results.some((result) => result.readiness === "partial") || unsupported.length > 0) {
    return "partial";
  }
  return "ready";
}

export function validateByCapability(
  capabilities: WriterAdapterCapability[],
  input: WriterAdapterInput
): WriterAdapterValidationResult["unsupported"] {
  const capabilityIds = new Set(capabilities.filter((capability) => capability.supported).map((capability) => capability.capabilityId));
  const unsupported: WriterAdapterUnsupportedReason[] = [];

  for (const artifact of input.artifacts) {
    if (!capabilityIds.has(artifact.requiredWriterCapability)) {
      unsupported.push({
        code: "capability-mismatch",
        message: `No supported capability for ${artifact.requiredWriterCapability}.`,
        artifactId: artifact.artifactId,
      });
      continue;
    }

    if (artifact.readinessStatus === "blocked") {
      unsupported.push({
        code: "readiness-blocked",
        message: "Deferred writer input is blocked by unresolved dependencies.",
        artifactId: artifact.artifactId,
      });
      continue;
    }

    if (artifact.readinessStatus === "partial") {
      unsupported.push({
        code: "readiness-partial",
        message: "Deferred writer input is partial and requires additional prerequisites.",
        artifactId: artifact.artifactId,
      });
      continue;
    }

    if (artifact.readinessStatus === "deferred-with-known-gaps") {
      unsupported.push({
        code: "known-gap",
        message: "Artifact remains deferred with known gaps for this phase.",
        artifactId: artifact.artifactId,
      });
    }
  }

  return unsupported.sort((a, b) => `${a.artifactId ?? ""}:${a.code}`.localeCompare(`${b.artifactId ?? ""}:${b.code}`));
}

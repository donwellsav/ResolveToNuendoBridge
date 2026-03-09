import { futureNuendoAafWriterAdapter, futureReferenceVideoHandoffAdapter } from "../adapters/writers/placeholder-writer-adapters";
import { referenceWriterAdapter } from "../adapters/writers/reference-writer-adapter";
import { normalizeWriterAdapterInput } from "./writer-adapters";
import type {
  ExternalExecutionPackage,
  WriterAdapter,
  WriterAdapterArtifactInput,
  WriterAdapterArtifactMatch,
  WriterAdapterRegistryReport,
} from "../types";

function mapArtifactToState(
  artifact: WriterAdapterArtifactInput,
  adapter: WriterAdapter | undefined,
  reason: string,
  unsupported: WriterAdapterArtifactMatch["unsupported"]
): WriterAdapterArtifactMatch {
  if (!adapter) {
    return {
      artifactId: artifact.artifactId,
      artifactKind: artifact.artifactKind,
      requiredWriterCapability: artifact.requiredWriterCapability,
      readinessStatus: artifact.readinessStatus,
      state: "deferred",
      reason,
      unsupported,
    };
  }

  if (unsupported.length > 0) {
    return {
      artifactId: artifact.artifactId,
      artifactKind: artifact.artifactKind,
      requiredWriterCapability: artifact.requiredWriterCapability,
      readinessStatus: artifact.readinessStatus,
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      state: artifact.readinessStatus === "ready-for-writer" ? "unsupported" : "blocked",
      reason,
      unsupported,
    };
  }

  return {
    artifactId: artifact.artifactId,
    artifactKind: artifact.artifactKind,
    requiredWriterCapability: artifact.requiredWriterCapability,
    readinessStatus: artifact.readinessStatus,
    adapterId: adapter.id,
    adapterVersion: adapter.version,
    state: artifact.readinessStatus === "ready-for-writer" ? "ready" : "blocked",
    reason,
    unsupported: [],
  };
}

export class WriterAdapterRegistry {
  private readonly adapters = new Map<WriterAdapter["id"], WriterAdapter>();

  register(adapter: WriterAdapter) {
    this.adapters.set(adapter.id, adapter);
  }

  list(): WriterAdapter[] {
    return Array.from(this.adapters.values()).sort((a, b) => a.id.localeCompare(b.id));
  }

  buildReport(pkg: ExternalExecutionPackage): WriterAdapterRegistryReport {
    const input = normalizeWriterAdapterInput(pkg);
    const matches = input.artifacts
      .map((artifact) => {
        const adapter = this.list().find((candidate) =>
          candidate.capabilities.some(
            (capability) => capability.capabilityId === artifact.requiredWriterCapability && capability.artifactKinds.includes(artifact.artifactKind)
          )
        );

        if (!adapter) {
          return mapArtifactToState(artifact, undefined, "No registered adapter currently advertises this capability.", [
            {
              code: "capability-mismatch",
              message: "No adapter capability match found.",
              artifactId: artifact.artifactId,
            },
          ]);
        }

        const dryRun = adapter.dryRun({ ...input, artifacts: [artifact] });
        const unsupported = dryRun.unsupported.filter((reason) => !reason.artifactId || reason.artifactId === artifact.artifactId);
        const reason = unsupported[0]?.message ?? "Artifact is ready for adapter execution plan generation.";
        return mapArtifactToState(artifact, adapter, reason, unsupported);
      })
      .sort((a, b) => a.artifactId.localeCompare(b.artifactId));

    return {
      packageId: input.packageId,
      packageSignature: input.packageSignature,
      schemaVersion: "phase3e.v1",
      matches,
      adapters: this.list().map((adapter) => ({
        adapterId: adapter.id,
        version: adapter.version,
        capabilities: adapter.capabilities,
      })),
    };
  }
}

export function createDefaultWriterAdapterRegistry(): WriterAdapterRegistry {
  const registry = new WriterAdapterRegistry();
  registry.register(referenceWriterAdapter);
  registry.register(futureNuendoAafWriterAdapter);
  registry.register(futureReferenceVideoHandoffAdapter);
  return registry;
}

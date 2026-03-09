import { resolveAdapterReadiness, validateByCapability } from "../../services/writer-adapters";
import type { WriterAdapter, WriterAdapterExecutionPlan } from "../../types";

export const referenceWriterAdapter: WriterAdapter = {
  id: "reference.noop",
  version: "phase3e.v1",
  capabilities: [
    {
      capabilityId: "nuendo_writer.aaf",
      artifactKinds: ["nuendo_ready_aaf"],
      supported: true,
      note: "Reference adapter validates AAF contract readiness only. No binary writing is performed.",
    },
    {
      capabilityId: "video_writer.reference",
      artifactKinds: ["reference_video_binary"],
      supported: true,
      note: "Reference adapter validates reference-video handoff contracts only.",
    },
  ],
  validate(input) {
    const unsupported = validateByCapability(this.capabilities, input);
    return {
      adapterId: this.id,
      adapterVersion: this.version,
      readiness: resolveAdapterReadiness([], unsupported),
      reasons: unsupported.map((reason) => reason.message),
      unsupported,
    };
  },
  dryRun(input) {
    const validation = this.validate(input);
    const executionPlan: WriterAdapterExecutionPlan = {
      adapterId: this.id,
      adapterVersion: this.version,
      readyArtifacts: input.artifacts
        .filter((artifact) => artifact.readinessStatus === "ready-for-writer")
        .map((artifact) => artifact.artifactId)
        .sort(),
      deferredArtifacts: input.artifacts
        .filter((artifact) => artifact.readinessStatus === "deferred-with-known-gaps")
        .map((artifact) => artifact.artifactId)
        .sort(),
      blockedArtifacts: input.artifacts
        .filter((artifact) => artifact.readinessStatus === "blocked" || artifact.readinessStatus === "partial")
        .map((artifact) => artifact.artifactId)
        .sort(),
      dependencySummary: input.artifacts.reduce(
        (summary, artifact) => ({
          satisfied: summary.satisfied + artifact.dependencySummary.satisfied,
          missing: summary.missing + artifact.dependencySummary.missing,
          blocked: summary.blocked + artifact.dependencySummary.blocked,
        }),
        { satisfied: 0, missing: 0, blocked: 0 }
      ),
    };

    return {
      adapterId: this.id,
      adapterVersion: this.version,
      validation,
      executionPlan,
      unsupported: validation.unsupported,
    };
  },
};

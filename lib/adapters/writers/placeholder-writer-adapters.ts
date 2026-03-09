import { resolveAdapterReadiness, validateByCapability } from "../../services/writer-adapters";
import type { WriterAdapter, WriterAdapterExecutionPlan, WriterAdapterUnsupportedReason } from "../../types";

function buildPlaceholderAdapter(
  adapter: Pick<WriterAdapter, "id" | "capabilities">,
  note: string
): WriterAdapter {
  return {
    ...adapter,
    version: "phase3e.v1",
    validate(input) {
      const unsupported: WriterAdapterUnsupportedReason[] = [
        {
          code: "adapter-placeholder",
          message: note,
        },
        ...validateByCapability(adapter.capabilities, input),
      ];
      return {
        adapterId: adapter.id,
        adapterVersion: "phase3e.v1",
        readiness: resolveAdapterReadiness([], unsupported),
        reasons: unsupported.map((reason) => reason.message),
        unsupported,
      };
    },
    dryRun(input) {
      const validation = this.validate(input);
      const executionPlan: WriterAdapterExecutionPlan = {
        adapterId: adapter.id,
        adapterVersion: "phase3e.v1",
        readyArtifacts: [],
        deferredArtifacts: input.artifacts.map((artifact) => artifact.artifactId).sort(),
        blockedArtifacts: [],
        dependencySummary: { satisfied: 0, missing: 0, blocked: 0 },
      };

      return {
        adapterId: adapter.id,
        adapterVersion: "phase3e.v1",
        validation,
        executionPlan,
        unsupported: validation.unsupported,
      };
    },
  };
}

export const futureNuendoAafWriterAdapter = buildPlaceholderAdapter(
  {
    id: "future.nuendo-aaf",
    capabilities: [
      {
        capabilityId: "nuendo_writer.aaf",
        artifactKinds: ["nuendo_ready_aaf"],
        supported: false,
        note: "Planned native Nuendo AAF writer adapter boundary.",
      },
    ],
  },
  "Future Nuendo AAF writer adapter is a placeholder in Phase 3E (interfaces only)."
);

export const futureReferenceVideoHandoffAdapter = buildPlaceholderAdapter(
  {
    id: "future.reference-video",
    capabilities: [
      {
        capabilityId: "video_writer.reference",
        artifactKinds: ["reference_video_binary"],
        supported: false,
        note: "Planned external reference-video handoff adapter boundary.",
      },
    ],
  },
  "Future reference-video handoff adapter is a placeholder in Phase 3E (interfaces only)."
);

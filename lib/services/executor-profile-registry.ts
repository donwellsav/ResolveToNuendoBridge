import type {
  ExecutorCompatibilityProfile,
  ExecutorCompatibilityProfileId,
} from "../types";

const PROFILES: Record<ExecutorCompatibilityProfileId, ExecutorCompatibilityProfile> = {
  "canonical-filesystem-executor-v1": {
    profileId: "canonical-filesystem-executor-v1",
    profileVersion: "phase3j.v1",
    label: "Canonical Filesystem Executor",
    description: "Primary deterministic filesystem executor compatibility profile.",
    capabilityMatrix: {
      artifactKinds: [
        "manifest",
        "readme",
        "marker_edl",
        "marker_csv",
        "metadata_csv",
        "field_recorder_report",
        "nuendo_ready_aaf",
        "reference_video_binary",
        "nuendo_session",
        "handoff-contract",
        "package-metadata",
      ],
      transportProfiles: ["canonical-filesystem-transport-v1"],
      receiptProfiles: ["canonical-filesystem-transport-v1", "compatibility-filesystem-receipt-v1"],
      packageVersions: ["phase3d.v1"],
      handoffVersions: ["phase3c.v1"],
    },
    versionConstraints: {
      packageVersion: { equals: ["phase3d.v1"] },
      handoffVersion: { equals: ["phase3c.v1"] },
      transportAdapterVersion: { equals: ["phase3h.v1"] },
      receiptVersion: { equals: ["phase3h.v1", "phase3i.v1"] },
    },
    requiredMembers: [
      "package/external-execution-manifest.json",
      "package/external-execution-index.json",
      "package/external-execution-summary.json",
      "package/checksums.json",
      "handoff/delivery-handoff-manifest.json",
      "handoff/deferred-writer-inputs.json",
    ],
    optionalMembers: ["handoff/writer-run-requests.json", "handoff/writer-run-receipts.json", "handoff/writer-run-transport-envelopes.json"],
    unsupportedReasons: ["future-placeholder"],
    constraints: ["filesystem transport is required", "nuendo/session native writing remains deferred"],
  },
  "compatibility-filesystem-executor-v1": {
    profileId: "compatibility-filesystem-executor-v1",
    profileVersion: "phase3j.v1",
    label: "Compatibility Filesystem Executor",
    description: "Compatibility variant for broader receipt import versions on filesystem dispatch.",
    capabilityMatrix: {
      artifactKinds: [
        "manifest",
        "readme",
        "marker_edl",
        "marker_csv",
        "metadata_csv",
        "field_recorder_report",
        "nuendo_ready_aaf",
        "reference_video_binary",
        "nuendo_session",
        "handoff-contract",
        "package-metadata",
      ],
      transportProfiles: ["canonical-filesystem-transport-v1", "filesystem-strict-export-v1"],
      receiptProfiles: ["canonical-filesystem-transport-v1", "compatibility-filesystem-receipt-v1"],
      packageVersions: ["phase3d.v1"],
      handoffVersions: ["phase3c.v1"],
    },
    versionConstraints: {
      packageVersion: { equals: ["phase3d.v1"] },
      handoffVersion: { equals: ["phase3c.v1"] },
      transportAdapterVersion: { equals: ["phase3h.v1"] },
      receiptVersion: { equals: ["phase3h.v1", "phase3i.v1"] },
    },
    requiredMembers: [
      "package/external-execution-manifest.json",
      "package/external-execution-index.json",
      "package/external-execution-summary.json",
      "package/checksums.json",
      "package/deferred-writer-inputs.json",
      "handoff/delivery-handoff-manifest.json",
    ],
    optionalMembers: ["handoff/writer-run-transport-envelopes.json", "handoff/executor-compatibility-report.json"],
    unsupportedReasons: [],
    constraints: ["compatibility receipt normalization accepted", "filesystem dispatch structure must remain deterministic"],
  },
  "future-service-executor-placeholder": {
    profileId: "future-service-executor-placeholder",
    profileVersion: "phase3j.v1",
    label: "Future Service Executor Placeholder",
    description: "Placeholder for future non-filesystem execution without implementation in this phase.",
    capabilityMatrix: {
      artifactKinds: ["package-metadata"],
      transportProfiles: ["future-service-transport-placeholder"],
      receiptProfiles: ["future-service-transport-placeholder"],
      packageVersions: ["phase3d.v1"],
      handoffVersions: ["phase3c.v1"],
    },
    versionConstraints: {
      packageVersion: { equals: ["phase3d.v1"] },
      handoffVersion: { equals: ["phase3c.v1"] },
    },
    requiredMembers: [],
    optionalMembers: [],
    unsupportedReasons: ["future-placeholder"],
    constraints: ["deferred: no backend/queue/service dispatch in phase 3J"],
  },
};

export function listExecutorCompatibilityProfiles(): ExecutorCompatibilityProfile[] {
  return Object.values(PROFILES).map((profile) => ({
    ...profile,
    requiredMembers: [...profile.requiredMembers],
    optionalMembers: [...profile.optionalMembers],
    constraints: [...profile.constraints],
  }));
}

export function resolveExecutorCompatibilityProfile(profileId: ExecutorCompatibilityProfileId): ExecutorCompatibilityProfile {
  const profile = PROFILES[profileId];
  if (!profile) {
    return PROFILES["canonical-filesystem-executor-v1"];
  }
  return {
    ...profile,
    requiredMembers: [...profile.requiredMembers],
    optionalMembers: [...profile.optionalMembers],
    constraints: [...profile.constraints],
  };
}

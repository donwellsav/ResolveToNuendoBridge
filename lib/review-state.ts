import { planNuendoDeliveryArtifacts } from "./services/exporter";
import { summarizeUnresolved } from "./services/mapping-workspace";
import type {
  DeliveryArtifact,
  MappingWorkspace,
  PreservationIssue,
  ReConformChange,
  TranslationJob,
} from "./types";

export const REVIEW_STATE_VERSION = 1;

export type ReviewStateVersion = 1;

export type ReviewStateKey = {
  jobId: string;
  sourceSignature: string;
};

export type ValidationAcknowledgement = {
  issueId: string;
  status: "acknowledged" | "dismissed";
  note?: string;
};

export type ReconformReviewDecision = {
  changeId: string;
  status: "unresolved" | "acknowledged" | "risky";
  note?: string;
};

export type ReviewState = {
  version: ReviewStateVersion;
  key: ReviewStateKey;
  updatedAtIso: string;
  trackTargetOverrides: Record<string, string>;
  markerOverrides: Record<string, { exportLabel?: string; includeInEdl?: boolean; includeInCsv?: boolean }>;
  metadataOverrides: Record<string, { reel?: string; tape?: string; scene?: string; take?: string }>;
  fieldRecorderOverrides: Record<string, { selected: boolean }>;
  validationAcknowledgements: Record<string, ValidationAcknowledgement>;
  reconformDecisions: Record<string, ReconformReviewDecision>;
};

type PersistedReviewEnvelopeV0 = {
  version: 0;
  key: ReviewStateKey;
  trackTargetOverrides?: Record<string, string>;
};

type PersistedReviewEnvelope = ReviewState | PersistedReviewEnvelopeV0;

export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export function buildSourceSignature(job: TranslationJob): string {
  return [
    job.sourceBundle.id,
    job.sourceBundle.resolveTimelineVersion,
    job.sourceBundle.importedAtIso,
    job.translationModel.id,
  ].join("::");
}

export function buildReviewStateKey(job: TranslationJob): ReviewStateKey {
  return {
    jobId: job.id,
    sourceSignature: buildSourceSignature(job),
  };
}

export function getReviewStorageKey(key: ReviewStateKey): string {
  return `resolve-bridge:review:${key.jobId}:${key.sourceSignature}`;
}

export function createEmptyReviewState(key: ReviewStateKey): ReviewState {
  return {
    version: REVIEW_STATE_VERSION,
    key,
    updatedAtIso: "1970-01-01T00:00:00.000Z",
    trackTargetOverrides: {},
    markerOverrides: {},
    metadataOverrides: {},
    fieldRecorderOverrides: {},
    validationAcknowledgements: {},
    reconformDecisions: {},
  };
}

function migratePersistedState(raw: PersistedReviewEnvelope, key: ReviewStateKey): ReviewState {
  if (raw.version === 1) {
    if (raw.key.jobId !== key.jobId || raw.key.sourceSignature !== key.sourceSignature) {
      return createEmptyReviewState(key);
    }

    return {
      ...createEmptyReviewState(key),
      ...raw,
      key,
      version: 1,
    };
  }

  if (raw.version === 0) {
    return {
      ...createEmptyReviewState(key),
      trackTargetOverrides: raw.trackTargetOverrides ?? {},
    };
  }

  return createEmptyReviewState(key);
}

export function loadReviewState(storage: StorageLike, key: ReviewStateKey): ReviewState {
  try {
    const payload = storage.getItem(getReviewStorageKey(key));
    if (!payload) return createEmptyReviewState(key);
    const parsed = JSON.parse(payload) as PersistedReviewEnvelope;
    return migratePersistedState(parsed, key);
  } catch {
    return createEmptyReviewState(key);
  }
}

export function saveReviewState(storage: StorageLike, state: ReviewState) {
  storage.setItem(getReviewStorageKey(state.key), JSON.stringify(state));
}

export function resetReviewState(storage: StorageLike, key: ReviewStateKey): ReviewState {
  storage.removeItem(getReviewStorageKey(key));
  return createEmptyReviewState(key);
}

export function overlayMappingWorkspace(base: MappingWorkspace, reviewState: ReviewState): MappingWorkspace {
  return {
    trackMappings: base.trackMappings.map((track) => {
      const override = reviewState.trackTargetOverrides[track.trackId];
      if (!override) return track;
      return {
        ...track,
        targetNuendoTrack: override,
        state: override === "UNASSIGNED" ? "needs_review" : "mapped",
      };
    }),
    markerMappings: base.markerMappings.map((marker) => {
      const override = reviewState.markerOverrides[marker.markerId];
      if (!override) return marker;
      const includeInEdl = override.includeInEdl ?? marker.includeInEdl;
      const includeInCsv = override.includeInCsv ?? marker.includeInCsv;
      return {
        ...marker,
        exportLabel: override.exportLabel ?? marker.exportLabel,
        includeInEdl,
        includeInCsv,
        state: includeInEdl || includeInCsv ? "mapped" : "needs_review",
      };
    }),
    metadataMappings: base.metadataMappings.map((metadata) => {
      const override = reviewState.metadataOverrides[metadata.clipId];
      if (!override) return metadata;
      const reel = override.reel ?? metadata.reel;
      const tape = override.tape ?? metadata.tape;
      const scene = override.scene ?? metadata.scene;
      const take = override.take ?? metadata.take;
      return {
        ...metadata,
        reel,
        tape,
        scene,
        take,
        state: reel && tape && scene && take ? "resolved" : "unresolved",
      };
    }),
    fieldRecorderMappings: base.fieldRecorderMappings.map((candidate) => {
      const override = reviewState.fieldRecorderOverrides[candidate.candidateId];
      if (!override) return candidate;
      return {
        ...candidate,
        selected: override.selected,
        state: override.selected ? "matched" : "needs_review",
      };
    }),
  };
}

export function summarizeValidation(issues: PreservationIssue[], reviewState: ReviewState) {
  let acknowledged = 0;
  let dismissed = 0;
  let unresolved = 0;

  for (const issue of issues) {
    const decision = reviewState.validationAcknowledgements[issue.id];
    if (!decision) {
      unresolved += 1;
      continue;
    }
    if (decision.status === "dismissed") dismissed += 1;
    if (decision.status === "acknowledged") acknowledged += 1;
  }

  return {
    total: issues.length,
    acknowledged,
    dismissed,
    unresolved,
  };
}

export function summarizeReconform(changes: ReConformChange[], reviewState: ReviewState) {
  let unresolved = 0;
  let acknowledged = 0;
  let risky = 0;
  for (const change of changes) {
    const decision = reviewState.reconformDecisions[change.id];
    const status = decision?.status ?? "unresolved";
    if (status === "unresolved") unresolved += 1;
    if (status === "acknowledged") acknowledged += 1;
    if (status === "risky") risky += 1;
  }

  return {
    total: changes.length,
    unresolved,
    acknowledged,
    risky,
  };
}

export function buildEffectiveDeliveryPreview(job: TranslationJob, effectiveWorkspace: MappingWorkspace): DeliveryArtifact[] {
  return planNuendoDeliveryArtifacts({
    job: {
      ...job,
      mappingWorkspace: effectiveWorkspace,
    },
    model: job.translationModel,
    outputPreset: job.outputPreset,
    analysisReport: job.analysisReport,
    mappingRules: job.mappingRules,
    preservationIssues: job.preservationIssues,
  });
}

export function summarizeOperatorProgress(job: TranslationJob, reviewState: ReviewState) {
  const effectiveWorkspace = overlayMappingWorkspace(job.mappingWorkspace, reviewState);
  const unresolvedMappings = summarizeUnresolved(effectiveWorkspace).totalUnresolved;
  const validation = summarizeValidation(job.preservationIssues, reviewState);
  const reconform = summarizeReconform(job.reconformChanges, reviewState);

  return {
    unresolvedMappings,
    validation,
    reconform,
  };
}

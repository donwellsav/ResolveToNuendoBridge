import assert from "node:assert/strict";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  buildEffectiveDeliveryPreview,
  buildReviewStateKey,
  createEmptyReviewState,
  loadReviewState,
  overlayMappingWorkspace,
  saveReviewState,
  summarizeOperatorProgress,
  summarizeReconform,
  type StorageLike,
} from "../lib/review-state";

function memoryStorage(seed: Record<string, string> = {}): StorageLike {
  const data = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
  };
}

test("review state hydration defaults deterministically and tolerates corrupt payloads", () => {
  const job = translationJobs[0];
  const key = buildReviewStateKey(job);
  const empty = loadReviewState(memoryStorage(), key);
  assert.deepEqual(empty, createEmptyReviewState(key));

  const corruptedStorageKey = `resolve-bridge:review:${key.jobId}:${key.sourceSignature}`;
  const corrupted = loadReviewState(memoryStorage({ [corruptedStorageKey]: "{" }), key);
  assert.deepEqual(corrupted, createEmptyReviewState(key));
});

test("review state migration from v0 applies track overrides", () => {
  const job = translationJobs[0];
  const key = buildReviewStateKey(job);
  const storageKey = `resolve-bridge:review:${key.jobId}:${key.sourceSignature}`;
  const storage = memoryStorage({
    [storageKey]: JSON.stringify({ version: 0, key, trackTargetOverrides: { "trk-fx1": "FX_ALT" } }),
  });
  const state = loadReviewState(storage, key);
  const overlaid = overlayMappingWorkspace(job.mappingWorkspace, state);
  assert.equal(overlaid.trackMappings.find((track) => track.trackId === "trk-fx1")?.targetNuendoTrack, "FX_ALT");
});

test("review state persistence updates exporter preview and validation summary", () => {
  const job = translationJobs[0];
  const key = buildReviewStateKey(job);
  const storage = memoryStorage();
  const state = {
    ...createEmptyReviewState(key),
    metadataOverrides: {
      "evt-002": { tape: "SR300", take: "5" },
    },
    validationAcknowledgements: {
      "pi-01": { issueId: "pi-01", status: "acknowledged" as const },
    },
  };

  saveReviewState(storage, state);
  const loaded = loadReviewState(storage, key);
  const effectiveWorkspace = overlayMappingWorkspace(job.mappingWorkspace, loaded);
  const preview = buildEffectiveDeliveryPreview(job, effectiveWorkspace);
  const metadataArtifact = preview.find((artifact) => artifact.id === "out-metadata-csv");
  assert.equal(metadataArtifact?.status, "planned");

  const progress = summarizeOperatorProgress(job, loaded);
  assert.equal(progress.validation.acknowledged, 1);
});

test("reconform decisions persist and filter counts", () => {
  const job = {
    ...translationJobs[0],
    reconformChanges: [
      { id: "rc-1", jobId: "j", changeType: "move" as const, note: "shift", oldFrame: 10, newFrame: 20 },
      { id: "rc-2", jobId: "j", changeType: "trim" as const, note: "trim", oldFrame: 10, newFrame: 12 },
    ],
  };
  const state = {
    ...createEmptyReviewState(buildReviewStateKey(job)),
    reconformDecisions: {
      "rc-1": { changeId: "rc-1", status: "acknowledged" as const },
      "rc-2": { changeId: "rc-2", status: "risky" as const },
    },
  };

  const summary = summarizeReconform(job.reconformChanges, state);
  assert.equal(summary.acknowledged, 1);
  assert.equal(summary.risky, 1);
  assert.equal(summary.unresolved, 0);
});

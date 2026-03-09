import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEffectiveExternalExecutionPackagePreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { translationJobs } from "../lib/mock-data";
import {
  normalizeWriterAdapterInput,
  serializeWriterAdapterInput,
} from "../lib/services/writer-adapters";
import { createDefaultWriterAdapterRegistry } from "../lib/services/writer-adapter-registry";

test("writer adapter input normalization is deterministic and scoped to package contracts", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const pkg = buildEffectiveExternalExecutionPackagePreview(job, workspace, state);

  const first = normalizeWriterAdapterInput(pkg);
  const second = normalizeWriterAdapterInput(pkg);
  assert.deepEqual(first, second);
  assert.equal(serializeWriterAdapterInput(first), serializeWriterAdapterInput(second));
  assert.equal(first.artifacts.length > 0, true);
});

test("registry capability matching explains ready/blocked/unsupported/deferred states", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const pkg = buildEffectiveExternalExecutionPackagePreview(job, workspace, state);

  const registry = createDefaultWriterAdapterRegistry();
  const report = registry.buildReport(pkg);

  assert.equal(report.matches.length, pkg.deferredInputs.length);
  assert.equal(report.adapters.length >= 3, true);
  assert.equal(report.matches.some((match) => ["ready", "blocked", "unsupported", "deferred"].includes(match.state)), true);
});

test("readiness and dry-run report unsupported reasons for placeholder adapters", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const pkg = buildEffectiveExternalExecutionPackagePreview(job, workspace, state);
  const input = normalizeWriterAdapterInput(pkg);

  const placeholders = createDefaultWriterAdapterRegistry()
    .list()
    .filter((adapter) => adapter.id.startsWith("future."));

  for (const adapter of placeholders) {
    const dryRun = adapter.dryRun(input);
    assert.equal(dryRun.validation.unsupported.some((reason) => reason.code === "adapter-placeholder"), true);
  }
});

test("review-state changes influence normalized adapter input review signature", () => {
  const job = translationJobs[0];
  const base = createEmptyReviewState(buildReviewStateKey(job));
  const revised = {
    ...base,
    fieldRecorderOverrides: {
      [job.mappingWorkspace.fieldRecorderMappings[0]?.candidateId ?? "none"]: { selected: false },
    },
  };

  const basePkg = buildEffectiveExternalExecutionPackagePreview(job, overlayMappingWorkspace(job.mappingWorkspace, base), base);
  const revisedPkg = buildEffectiveExternalExecutionPackagePreview(
    job,
    overlayMappingWorkspace(job.mappingWorkspace, revised),
    revised
  );

  const baseInput = normalizeWriterAdapterInput(basePkg);
  const revisedInput = normalizeWriterAdapterInput(revisedPkg);
  assert.notEqual(baseInput.reviewSignature.revision, revisedInput.reviewSignature.revision);
});

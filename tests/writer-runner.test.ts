import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEffectiveExternalExecutionPackagePreview,
  buildEffectiveWriterAdapterReportPreview,
  buildEffectiveWriterRunBundlePreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { translationJobs } from "../lib/mock-data";
import { serializeWriterRunRequest } from "../lib/services/writer-runner";

test("writer runner request generation is deterministic", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);

  const first = buildEffectiveWriterRunBundlePreview(job, workspace, state);
  const second = buildEffectiveWriterRunBundlePreview(job, workspace, state);

  assert.deepEqual(first.requests, second.requests);
  assert.equal(serializeWriterRunRequest(first.requests[0]), serializeWriterRunRequest(second.requests[0]));
});

test("writer runner classifies runnable vs blocked/unsupported from adapter and package contracts", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);

  const pkg = buildEffectiveExternalExecutionPackagePreview(job, workspace, state);
  const report = buildEffectiveWriterAdapterReportPreview(job, workspace, state);
  const bundle = buildEffectiveWriterRunBundlePreview(job, workspace, state);

  assert.equal(bundle.requests.length, pkg.deferredInputs.length);
  assert.equal(bundle.requests.length, report.matches.length);
  assert.equal(bundle.requests.some((req) => ["ready", "blocked", "partial", "unsupported"].includes(req.runnerReadiness)), true);
});

test("no-op runner generates deterministic responses and no material writes", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunBundlePreview(job, workspace, state);

  assert.equal(bundle.responses.length, bundle.requests.length);
  for (const response of bundle.responses) {
    assert.equal(response.materialWrite, "none");
    assert.equal(["simulated", "partial", "blocked", "unsupported"].includes(response.responseStatus), true);
  }
});

test("writer runner receipt summarizes statuses and signatures", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunBundlePreview(job, workspace, state);

  assert.equal(bundle.receipt.summary.totalRequests, bundle.requests.length);
  assert.equal(bundle.receipt.artifacts.length, bundle.requests.length);
  assert.equal(bundle.receipt.artifacts.every((item) => item.signatures.source.length > 0 && item.signatures.review.length > 0), true);
});

test("review-state changes influence runner receipt review signature linkage", () => {
  const job = translationJobs[0];
  const base = createEmptyReviewState(buildReviewStateKey(job));
  const revised = {
    ...base,
    markerOverrides: {
      [job.mappingWorkspace.markerMappings[0]?.markerId ?? "none"]: { includeInCsv: false },
    },
  };

  const workspaceBase = overlayMappingWorkspace(job.mappingWorkspace, base);
  const workspaceRevised = overlayMappingWorkspace(job.mappingWorkspace, revised);
  const first = buildEffectiveWriterRunBundlePreview(job, workspaceBase, base);
  const second = buildEffectiveWriterRunBundlePreview(job, workspaceRevised, revised);

  assert.notEqual(first.requests[0]?.reviewSignature.revision, second.requests[0]?.reviewSignature.revision);
});

test("writer runner file artifacts include requests/responses/receipts", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunBundlePreview(job, workspace, state);

  const paths = bundle.files.map((item) => item.relativePath).sort();
  assert.deepEqual(paths, [
    "handoff/writer-run-receipts.json",
    "handoff/writer-run-requests.json",
    "handoff/writer-run-responses.json",
  ]);
});

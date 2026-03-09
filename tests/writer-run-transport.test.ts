import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEffectiveExternalExecutionPackagePreview,
  buildEffectiveWriterAdapterReportPreview,
  buildEffectiveWriterRunBundlePreview,
  buildEffectiveWriterRunTransportBundlePreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { translationJobs } from "../lib/mock-data";
import { buildWriterRunAttemptHistory } from "../lib/services/writer-run-history";
import { buildWriterRunTransportEnvelopes, classifyDispatchStatus } from "../lib/services/writer-run-transport";

test("transport envelope generation is deterministic", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);

  const first = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);
  const second = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);

  assert.deepEqual(first.envelopes, second.envelopes);
  assert.deepEqual(first.auditLog, second.auditLog);
});

test("transport correlation and ids link back to requests", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);

  for (const envelope of bundle.envelopes) {
    assert.ok(envelope.transportId.startsWith("transport-"));
    assert.equal(envelope.correlationId, `corr-${envelope.request.requestId}`);
  }
});

test("dispatchable vs blocked classification is explicit", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const pkg = buildEffectiveExternalExecutionPackagePreview(job, workspace, state);
  const adapterReport = buildEffectiveWriterAdapterReportPreview(job, workspace, state);
  const runBundle = buildEffectiveWriterRunBundlePreview(job, workspace, state);

  const envelopes = buildWriterRunTransportEnvelopes({
    pkg,
    adapterReport,
    requests: runBundle.requests,
    responses: runBundle.responses,
  });

  assert.equal(envelopes.some((item) => item.dispatchStatus === "runner-blocked"), true);
  assert.equal(
    envelopes.every((item) => classifyDispatchStatus(item.request, item.response) === item.dispatchStatus),
    true
  );
});

test("transport bundle emits deterministic dispatch and receipts", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);

  assert.equal(bundle.dispatchRecords.every((item) => item.status === "dispatched" || item.status === "runner-blocked"), true);
  assert.equal(bundle.transportResponses.every((item) => item.status === "acknowledged" || item.status === "runner-complete"), true);
  assert.equal(bundle.transportReceipts.every((item) => item.receiptStatus === "receipt-recorded"), true);
});

test("audit log and history are generated with retry cancel timeout state", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);

  assert.equal(bundle.auditLog.length, bundle.envelopes.length);
  assert.equal(bundle.history.length, bundle.envelopes.length);
  assert.equal(bundle.history.every((entry) => ["none", "not-started", "timed-out"].includes(entry.timeoutState)), true);
  assert.equal(bundle.history.every((entry) => ["current", "superseded"].includes(entry.staleState)), true);
});

test("transport bundle outputs expected artifact files", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);

  const paths = bundle.files.map((item) => item.relativePath).sort();
  assert.deepEqual(paths, [
    "handoff/writer-run-audit-log.json",
    "handoff/writer-run-dispatch-records.json",
    "handoff/writer-run-history.json",
    "handoff/writer-run-transport-envelopes.json",
  ]);
});

test("history marks request superseded when source/review signatures diverge", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);
  const first = bundle.envelopes[0];
  assert.ok(first);

  const mutated = {
    ...first,
    sourceSignature: { ...first.sourceSignature, signature: `${first.sourceSignature.signature}-changed` },
  };
  const history = buildWriterRunAttemptHistory({
    envelopes: [mutated],
    dispatchRecords: bundle.dispatchRecords.filter((item) => item.transportId === mutated.transportId),
    auditLog: bundle.auditLog.filter((item) => item.transportId === mutated.transportId),
  });
  assert.equal(history[0]?.staleState, "superseded");
});

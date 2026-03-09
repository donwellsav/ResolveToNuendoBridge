import assert from "node:assert/strict";
import { existsSync, mkdtempSync } from "node:fs";
import os from "node:os";
import path from "node:path";
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
import { ingestWriterRunReceipts } from "../lib/services/writer-run-receipt-ingestion";
import { buildWriterRunTransportEnvelopes } from "../lib/services/writer-run-transport";
import { createWriterRunTransportRegistry } from "../lib/services/writer-run-transport-registry";
import type { WriterRunReceiptEnvelope } from "../lib/types";

test("filesystem adapter writes deterministic outbound layout", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "r2n-transport-"));
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const pkg = buildEffectiveExternalExecutionPackagePreview(job, workspace, state);
  const adapterReport = buildEffectiveWriterAdapterReportPreview(job, workspace, state);
  const envelopes = buildWriterRunTransportEnvelopes({
    pkg: { ...pkg, rootPath: tempRoot },
    adapterReport,
    requests: buildEffectiveWriterRunBundlePreview(job, workspace, state).requests,
    responses: buildEffectiveWriterRunBundlePreview(job, workspace, state).responses,
  });

  const registry = createWriterRunTransportRegistry(tempRoot);
  const adapter = registry.resolveAdapter("node.filesystem");
  const results = adapter.dispatch(envelopes);
  const first = results[0];
  assert.ok(first?.outboundPath);
  assert.equal(adapter.id, "node.filesystem");

  const outboundRoot = path.join(process.cwd(), first.outboundPath!);
  assert.equal(existsSync(path.join(outboundRoot, "envelope.json")), true);
  assert.equal(existsSync(path.join(outboundRoot, "dispatch-summary.json")), true);
  assert.equal(existsSync(path.join(outboundRoot, "READY.marker")), true);
  assert.equal(existsSync(path.join(outboundRoot, "receipt-compatibility.json")), true);
});

test("registry resolves preferred adapter and fallback", () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "r2n-transport-registry-"));
  const registry = createWriterRunTransportRegistry(tempRoot);
  assert.equal(registry.resolveAdapter("node.filesystem").id, "node.filesystem");
  assert.equal(registry.resolveAdapter("reference.noop-transport").id, "reference.noop-transport");
});

test("receipt ingestion handles valid duplicate stale invalid and unmatched receipts", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);
  const envelope = bundle.envelopes.find((item) => item.runnerPath.runnerReadiness === "ready") ?? bundle.envelopes[0]!;
  const valid: WriterRunReceiptEnvelope = {
    receiptId: "receipt-001",
    receiptVersion: "phase3h.v1",
    adapterId: "node.filesystem",
    transportId: envelope.transportId,
    correlationId: envelope.correlationId,
    requestId: envelope.request.requestId,
    packageId: envelope.packageId,
    packageSignature: envelope.packageSignature,
    sourceSignature: envelope.sourceSignature.signature,
    reviewSignature: envelope.reviewSignature.revision,
    outcome: "completed",
    details: "ok",
  };

  const receipts: WriterRunReceiptEnvelope[] = [
    valid,
    { ...valid },
    { ...valid, receiptId: "receipt-002", outcome: "partial" },
    { ...valid, receiptId: "receipt-003", receiptVersion: "phase3g.v1" as "phase3h.v1" },
    { ...valid, receiptId: "receipt-004", packageSignature: "bad-signature" },
    { ...valid, receiptId: "receipt-005", transportId: "transport-unmatched", correlationId: "corr-unmatched" },
  ];

  const ingested = ingestWriterRunReceipts({
    receipts,
    envelopes: bundle.envelopes,
    dispatchRecords: bundle.dispatchRecords,
  });

  assert.equal(ingested.some((item) => item.status === "receipt-imported" || item.status === "receipt-partial"), true);
  assert.equal(ingested.some((item) => item.status === "receipt-duplicate"), true);
  assert.equal(ingested.some((item) => item.status === "receipt-stale"), true);
  assert.equal(ingested.some((item) => item.status === "receipt-invalid" || item.status === "receipt-incompatible"), true);
  assert.equal(ingested.some((item) => item.status === "receipt-unmatched"), true);
});

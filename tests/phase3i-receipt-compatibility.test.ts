import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEffectiveWriterRunTransportBundlePreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { translationJobs } from "../lib/mock-data";
import { normalizeReceiptPayload } from "../lib/services/receipt-normalization";
import { ingestWriterRunReceiptsCompatibility } from "../lib/services/receipt-compatibility";

test("normalizes canonical receipt and migrates phase3h version", () => {
  const normalized = normalizeReceiptPayload({
    receiptId: "r-1",
    receiptVersion: "phase3h.v1",
    adapterId: "node.filesystem",
    transportId: "transport-1",
    correlationId: "corr-1",
    requestId: "request-1",
    packageId: "package-1",
    packageSignature: "pkg-sig",
    sourceSignature: "src-sig",
    reviewSignature: "rev-sig",
    outcome: "completed",
    details: "ok",
  });

  assert.equal(normalized.status, "migrated");
  assert.equal(normalized.normalizedReceipt?.receiptVersion, "phase3i.v1");
});

test("normalizes compatibility wrapper receipt", () => {
  const normalized = normalizeReceiptPayload({
    receipt: { id: "r-compat", outcome: "partial", details: "drift" },
    context: {
      adapterId: "node.filesystem",
      transportId: "transport-1",
      correlationId: "corr-1",
      requestId: "request-1",
      packageId: "package-1",
      packageSignature: "pkg-sig",
      sourceSignature: "src-sig",
      reviewSignature: "rev-sig",
    },
  });

  assert.equal(normalized.status, "normalized");
  assert.equal(normalized.normalizedReceipt?.profileId, "compatibility-filesystem-receipt-v1");
});

test("ingestion handles duplicate, stale, partial and incompatible deterministically", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const bundle = buildEffectiveWriterRunTransportBundlePreview(job, workspace, state);
  const envelope = bundle.envelopes.find((item) => item.runnerPath.runnerReadiness === "ready") ?? bundle.envelopes[0]!;

  const canonical = {
    receiptId: "r-100",
    receiptVersion: "phase3i.v1",
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

  const partialCompatibility = {
    receipt: { id: "r-101", outcome: "partial", details: "drift" },
    context: {
      adapterId: "node.filesystem",
      transportId: envelope.transportId,
      correlationId: envelope.correlationId,
      requestId: envelope.request.requestId,
      packageId: envelope.packageId,
      packageSignature: envelope.packageSignature,
      sourceSignature: "changed-source",
      reviewSignature: envelope.reviewSignature.revision,
    },
  };

  const incompatible = {
    receiptId: "r-102",
    receiptVersion: "phase3z.v9",
    adapterId: "node.filesystem",
  };

  const ingested = ingestWriterRunReceiptsCompatibility({
    receipts: [canonical, canonical, partialCompatibility, incompatible],
    envelopes: bundle.envelopes,
    dispatchRecords: bundle.dispatchRecords,
  });

  assert.equal(ingested[0]?.status, "receipt-partial");
  assert.equal(ingested[1]?.status, "receipt-duplicate");
  assert.equal(ingested[2]?.status, "receipt-incompatible");
  assert.equal(ingested[3]?.status, "receipt-incompatible");
});

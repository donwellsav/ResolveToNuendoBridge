import assert from "node:assert/strict";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  buildEffectiveExternalExecutionPackagePreview,
  buildEffectiveWriterAdapterReportPreview,
  buildEffectiveWriterRunBundlePreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { buildWriterRunTransportEnvelopes } from "../lib/services/writer-run-transport";
import { buildExecutorCompatibilityArtifacts } from "../lib/services/executor-compatibility";
import { listExecutorCompatibilityProfiles, resolveExecutorCompatibilityProfile } from "../lib/services/executor-profile-registry";

function buildFixture() {
  const job = translationJobs[0]!;
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
  return { pkg, envelopes };
}

test("executor profile registry resolves canonical and compatibility profiles deterministically", () => {
  const profiles = listExecutorCompatibilityProfiles();
  assert.equal(profiles.length >= 3, true);
  assert.equal(resolveExecutorCompatibilityProfile("canonical-filesystem-executor-v1").profileVersion, "phase3j.v1");
  assert.equal(resolveExecutorCompatibilityProfile("compatibility-filesystem-executor-v1").profileVersion, "phase3j.v1");
});

test("executor compatibility artifacts are deterministic for same package/signatures", () => {
  const { pkg, envelopes } = buildFixture();
  const one = buildExecutorCompatibilityArtifacts({ pkg, envelopes });
  const two = buildExecutorCompatibilityArtifacts({ pkg, envelopes });
  assert.deepEqual(one, two);
  assert.equal(one.summary.status === "compatible" || one.summary.status === "compatible-with-warnings" || one.summary.status === "partial", true);
});

test("unsupported transport and receipt profiles are blocking", () => {
  const { pkg, envelopes } = buildFixture();
  const result = buildExecutorCompatibilityArtifacts({
    pkg,
    envelopes,
    transportProfileId: "future-service-transport-placeholder",
    receiptProfileId: "future-service-transport-placeholder",
  });

  assert.equal(result.report.status, "blocked");
  assert.equal(result.report.issues.some((item) => item.code === "unsupported-transport-profile"), true);
  assert.equal(result.report.issues.some((item) => item.code === "unsupported-receipt-profile"), true);
});

test("mismatched receipt profile in envelopes yields warnings/partial compatibility", () => {
  const { pkg, envelopes } = buildFixture();
  const drifted = envelopes.map((envelope, index) =>
    index === 0
      ? {
          ...envelope,
          receiptCompatibilityProfile: { ...envelope.receiptCompatibilityProfile, profileId: "compatibility-filesystem-receipt-v1" as const },
        }
      : envelope
  );

  const result = buildExecutorCompatibilityArtifacts({ pkg, envelopes: drifted });
  assert.equal(result.report.issues.some((item) => item.code === "version-mismatch"), true);
});

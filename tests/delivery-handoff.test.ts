import assert from "node:assert/strict";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  buildEffectiveDeliveryExecutionPreview,
  buildEffectiveDeliveryHandoffPreview,
  buildEffectiveDeliveryStagingPreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { buildDeliveryHandoffContracts } from "../lib/services/delivery-handoff";

test("delivery handoff contracts are deterministic", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const first = buildEffectiveDeliveryHandoffPreview(job, workspace, state);
  const second = buildEffectiveDeliveryHandoffPreview(job, workspace, state);

  assert.deepEqual(first, second);
  assert.equal(first.writerInputVersion, "phase3c.v1");
});

test("delivery handoff writes deterministic handoff json outputs", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const handoff = buildEffectiveDeliveryHandoffPreview(job, workspace, state);

  assert.equal(handoff.files.length, 3);
  assert.equal(handoff.files[0].relativePath, "handoff/deferred-writer-inputs.json");
  assert.equal(handoff.files[1].relativePath, "handoff/delivery-handoff-manifest.json");
  assert.equal(handoff.files[2].relativePath, "handoff/delivery-handoff-summary.json");
});

test("delivery handoff readiness becomes blocked when dependencies are missing", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = {
    ...job.mappingWorkspace,
    fieldRecorderMappings: job.mappingWorkspace.fieldRecorderMappings.map((mapping) => ({
      ...mapping,
      selected: false,
      state: "needs_review" as const,
    })),
  };

  const executionPlan = buildEffectiveDeliveryExecutionPreview(job, workspace);
  const stagingBundle = buildEffectiveDeliveryStagingPreview(job, workspace, state);
  const handoff = buildDeliveryHandoffContracts({
    job: { ...job, deliveryExecution: executionPlan, deliveryStaging: stagingBundle },
    packagePlan: job.deliveryPackage,
    executionPlan,
    stagingBundle,
    effectiveWorkspace: workspace,
    reviewState: state,
  });

  assert.equal(handoff.summary.blocked > 0, true);
  assert.equal(handoff.writerInputs.some((input) => input.artifact.readinessStatus === "blocked"), true);
});

test("review-state changes alter handoff review signature and readiness", () => {
  const job = translationJobs[0];
  const base = createEmptyReviewState(buildReviewStateKey(job));
  const revised = {
    ...base,
    metadataOverrides: {
      "evt-002": { tape: "SR777", take: "8" },
    },
  };

  const workspaceBase = overlayMappingWorkspace(job.mappingWorkspace, base);
  const workspaceRevised = overlayMappingWorkspace(job.mappingWorkspace, revised);
  const handoffBase = buildEffectiveDeliveryHandoffPreview(job, workspaceBase, base);
  const handoffRevised = buildEffectiveDeliveryHandoffPreview(job, workspaceRevised, revised);

  assert.notEqual(handoffBase.summary.reviewSignature.revision, handoffRevised.summary.reviewSignature.revision);
});

test("staging deferred artifacts and handoff writer inputs stay consistent", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const staging = buildEffectiveDeliveryStagingPreview(job, workspace, state);
  const handoff = buildEffectiveDeliveryHandoffPreview(job, workspace, state);

  assert.equal(handoff.writerInputs.length, staging.deferredArtifacts.length);
  assert.deepEqual(
    handoff.writerInputs.map((input) => input.artifact.artifactId).sort(),
    staging.deferredArtifacts.map((artifact) => artifact.artifactId).sort()
  );
});

test("handoff summary exposes blocked artifacts and supported capabilities", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const handoff = buildEffectiveDeliveryHandoffPreview(job, workspace, state);

  assert.equal(Array.isArray(handoff.summary.blockedArtifacts), true);
  assert.deepEqual(handoff.summary.supportedCapabilities, ["nuendo_writer.aaf", "video_writer.reference"]);
});

test("missing staged deferred descriptor drives partial readiness", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const executionPlan = buildEffectiveDeliveryExecutionPreview(job, workspace);
  const stagingBundle = buildEffectiveDeliveryStagingPreview(job, workspace, state);
  const trimmedStaging = {
    ...stagingBundle,
    files: stagingBundle.files.filter((file) => !file.relativePath.endsWith("out-aaf.deferred.json")),
  };

  const handoff = buildDeliveryHandoffContracts({
    job: { ...job, deliveryExecution: executionPlan, deliveryStaging: trimmedStaging },
    packagePlan: job.deliveryPackage,
    executionPlan,
    stagingBundle: trimmedStaging,
    effectiveWorkspace: workspace,
    reviewState: state,
  });

  const aaf = handoff.writerInputs.find((input) => input.artifact.artifactId === "out-aaf");
  assert.ok(aaf);
  assert.equal(aaf.artifact.readinessStatus, "partial");
});

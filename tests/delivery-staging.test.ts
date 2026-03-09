import assert from "node:assert/strict";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  buildEffectiveDeliveryExecutionPreview,
  buildEffectiveDeliveryStagingPreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { stageDeliveryBundle } from "../lib/services/delivery-staging";
import { planNuendoDelivery } from "../lib/services/exporter";

async function buildStaging() {
  const base = translationJobs[0];
  const job = {
    ...base,
    mappingWorkspace: {
      ...base.mappingWorkspace,
      metadataMappings: base.mappingWorkspace.metadataMappings.map((mapping) => ({
        ...mapping,
        tape: mapping.tape || "SR200",
        take: mapping.take || "2",
        state: "resolved" as const,
      })),
      fieldRecorderMappings: base.mappingWorkspace.fieldRecorderMappings.map((mapping) => ({
        ...mapping,
        selected: true,
        state: "matched" as const,
      })),
    },
    fieldRecorderCandidates: base.fieldRecorderCandidates.map((candidate) => ({ ...candidate, matched: true })),
  };
  const { packagePlan } = await planNuendoDelivery(job, job.translationModel);
  const executionPlan = buildEffectiveDeliveryExecutionPreview({ ...job, deliveryPackage: packagePlan }, job.mappingWorkspace);
  return stageDeliveryBundle({
    job: { ...job, deliveryPackage: packagePlan, deliveryExecution: executionPlan },
    packagePlan,
    executionPlan,
    effectiveWorkspace: job.mappingWorkspace,
  });
}

test("delivery staging layout is deterministic", async () => {
  const first = await buildStaging();
  const second = await buildStaging();
  assert.deepEqual(second, first);
  assert.match(first.rootPath, /^staging\//);
});

test("delivery staging materializes generated payloads into staged paths", async () => {
  const staged = await buildStaging();
  const manifest = staged.files.find((file) => file.relativePath === "manifest.json");
  const readme = staged.files.find((file) => file.relativePath === "README_NUENDO_IMPORT.txt");
  const markerCsv = staged.files.find((file) => file.relativePath.includes("markers/") && file.relativePath.endsWith("_MARKERS.csv"));

  assert.ok(manifest);
  assert.match(manifest?.contentPreview ?? "", /\"packageId\"/);
  assert.ok(readme);
  assert.match(readme?.contentPreview ?? "", /Nuendo writer boundary remains intentionally unimplemented/);
  assert.ok(markerCsv);
  assert.match(markerCsv?.contentPreview ?? "", /timeline_tc,timeline_frame,label,color/);
});

test("delivery staging generates deferred artifact descriptors", async () => {
  const staged = await buildStaging();
  const aafDeferred = staged.deferredArtifacts.find((artifact) => artifact.artifactId === "out-aaf");
  const videoDeferred = staged.deferredArtifacts.find((artifact) => artifact.artifactId === "out-reference-video");

  assert.ok(aafDeferred);
  assert.equal(aafDeferred?.writerBoundary, "nuendo_writer");
  assert.match(aafDeferred?.deferredPath ?? "", /\.deferred\.json$/);

  assert.ok(videoDeferred);
  assert.equal(videoDeferred?.writerBoundary, "reference_video_writer");
});

test("delivery staging includes a summary with artifact paths and blocker counts", async () => {
  const staged = await buildStaging();
  const summaryFile = staged.files.find((file) => file.relativePath === "staging-summary.json");

  assert.ok(summaryFile);
  assert.equal(staged.summary.jobId, translationJobs[0].id);
  assert.equal(staged.summary.generatedArtifacts > 0, true);
  assert.equal(staged.summary.deferredArtifacts, staged.deferredArtifacts.length);
  assert.equal(staged.summary.artifactPaths.length > 0, true);
});

test("saved review state overlays affect staged outputs", async () => {
  const job = translationJobs[0];
  const key = buildReviewStateKey(job);
  const state = {
    ...createEmptyReviewState(key),
    markerOverrides: {
      "mk-02": { includeInCsv: false, includeInEdl: false },
    },
    metadataOverrides: {
      "evt-002": { tape: "SR300", take: "5" },
    },
  };

  const effectiveWorkspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const staged = buildEffectiveDeliveryStagingPreview(job, effectiveWorkspace, state);
  const markerCsv = staged.files.find((file) => file.relativePath.includes("_MARKERS.csv"));
  const metadataCsv = staged.files.find((file) => file.relativePath.includes("_METADATA.csv"));

  assert.match(markerCsv?.contentPreview ?? "", /ADR NOTE SC15/);
  assert.doesNotMatch(markerCsv?.contentPreview ?? "", /FX SWELL OUT/);
  assert.match(metadataCsv?.contentPreview ?? "", /evt-002,RAIN_WILDTRACK_02.WAV,R4,SR300,15,5/);
  assert.equal(staged.summary.reviewInfluence.markerOverrides, 1);
});

import assert from "node:assert/strict";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  buildEffectiveDeliveryExecutionPreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { prepareDeliveryExecution } from "../lib/services/delivery-execution";
import { planNuendoDelivery } from "../lib/services/exporter";

async function buildExecutionPlan() {
  const base = translationJobs[0];
  const job = {
    ...base,
    mappingWorkspace: {
      ...base.mappingWorkspace,
      metadataMappings: base.mappingWorkspace.metadataMappings.map((mapping) => ({ ...mapping, tape: mapping.tape || "SR200", take: mapping.take || "2", state: "resolved" as const })),
      fieldRecorderMappings: base.mappingWorkspace.fieldRecorderMappings.map((mapping) => ({ ...mapping, selected: true, state: "matched" as const })),
    },
    fieldRecorderCandidates: base.fieldRecorderCandidates.map((candidate) => ({ ...candidate, matched: true })),
  };
  const { packagePlan } = await planNuendoDelivery(job, job.translationModel);
  return prepareDeliveryExecution({
    job: { ...job, deliveryPackage: packagePlan },
    packagePlan,
  });
}

test("delivery execution prep generates manifest and readme payloads", async () => {
  const plan = await buildExecutionPlan();
  const manifest = plan.artifacts.find((artifact) => artifact.artifact.id === "out-manifest");
  const readme = plan.artifacts.find((artifact) => artifact.artifact.id === "out-readme");

  assert.equal(manifest?.executionStatus, "generated");
  assert.equal(manifest?.generatedPayload?.artifactKind, "manifest");
  assert.match(manifest?.generatedPayload?.content ?? "", /"executionPrepStage": "delivery-execution-prep"/);

  assert.equal(readme?.executionStatus, "generated");
  assert.equal(readme?.generatedPayload?.artifactKind, "readme");
  assert.match(readme?.generatedPayload?.content ?? "", /Nuendo writer boundary remains intentionally unimplemented/);
});

test("delivery execution prep generates marker and metadata csv payloads", async () => {
  const plan = await buildExecutionPlan();
  const markerCsv = plan.artifacts.find((artifact) => artifact.artifact.id === "out-marker-csv");
  const metadataCsv = plan.artifacts.find((artifact) => artifact.artifact.id === "out-metadata-csv");

  assert.equal(markerCsv?.executionStatus, "generated");
  assert.equal(markerCsv?.generatedPayload?.artifactKind, "marker_csv");
  assert.match(markerCsv?.generatedPayload?.content ?? "", /timeline_tc,timeline_frame,label,color/);

  assert.equal(metadataCsv?.executionStatus, "generated");
  assert.equal(metadataCsv?.generatedPayload?.artifactKind, "metadata_csv");
  assert.match(metadataCsv?.generatedPayload?.content ?? "", /clip_id,source_file,reel,tape,scene,take,record_in,record_out/);
});

test("delivery execution prep generates field recorder and marker edl payloads", async () => {
  const plan = await buildExecutionPlan();
  const report = plan.artifacts.find((artifact) => artifact.artifact.id === "out-field-recorder");
  const edl = plan.artifacts.find((artifact) => artifact.artifact.id === "out-marker-edl");

  assert.equal(edl?.executionStatus, "generated");
  assert.equal(edl?.generatedPayload?.artifactKind, "marker_edl");
  assert.match(edl?.generatedPayload?.content ?? "", /TITLE: MARKERS/);

  assert.equal(report?.executionStatus, "generated");
  assert.equal(report?.generatedPayload?.artifactKind, "field_recorder_report");
  assert.match(report?.generatedPayload?.content ?? "", /clip_event_id,candidate_file,strategy,match_score,selected/);
});

test("delivery execution prep is deterministic for known fixture-backed job", async () => {
  const first = await buildExecutionPlan();
  const second = await buildExecutionPlan();
  assert.deepEqual(second, first);
});

test("binary artifacts are marked deferred for future writer boundary", async () => {
  const plan = await buildExecutionPlan();
  const aaf = plan.artifacts.find((artifact) => artifact.artifact.id === "out-aaf");

  assert.equal(aaf?.executionStatus, "deferred");
  assert.equal(aaf?.deferredPayload?.artifactKind, "deferred_binary");
  assert.match(aaf?.deferredPayload?.deferredReason ?? "", /future Nuendo writer boundary/);
});

test("execution prep reflects persisted operator review state overlays", async () => {
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
  const preview = buildEffectiveDeliveryExecutionPreview(job, effectiveWorkspace);

  const markerCsv = preview.artifacts.find((artifact) => artifact.artifact.id === "out-marker-csv");
  const metadataCsv = preview.artifacts.find((artifact) => artifact.artifact.id === "out-metadata-csv");

  assert.equal(markerCsv?.executionStatus, "generated");
  assert.match(markerCsv?.generatedPayload?.content ?? "", /ADR NOTE SC15/);
  assert.doesNotMatch(markerCsv?.generatedPayload?.content ?? "", /FX SWELL OUT/);

  assert.equal(metadataCsv?.executionStatus, "generated");
  assert.match(metadataCsv?.generatedPayload?.content ?? "", /evt-002,RAIN_WILDTRACK_02.WAV,R4,SR300,15,5/);
});

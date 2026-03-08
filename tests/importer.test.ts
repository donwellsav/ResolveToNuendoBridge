import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";

const fixtureFolder = path.join(process.cwd(), "fixtures", "turnover-basic");

test("importTurnoverFolder classifies intake assets and builds canonical model", async () => {
  const job = await importTurnoverFolder(fixtureFolder);

  assert.equal(job.sourceBundle.stage, "intake");
  assert.equal(job.translationModel.stage, "canonical");
  assert.equal(job.deliveryPackage.stage, "delivery");

  const hasMetadataCsv = job.sourceBundle.intakeAssets.some((asset) => asset.fileRole === "metadata_export" && asset.fileKind === "csv");
  const hasReferenceVideo = job.sourceBundle.intakeAssets.some((asset) => asset.fileRole === "reference_video");
  const hasProductionAudio = job.sourceBundle.intakeAssets.some((asset) => asset.fileRole === "production_audio");

  assert.equal(hasMetadataCsv, true);
  assert.equal(hasReferenceVideo, true);
  assert.equal(hasProductionAudio, true);

  assert.ok(job.translationModel.timeline.tracks.length > 0);
  assert.ok(job.translationModel.timeline.markers.length > 0);
});

test("importTurnoverFolder generates analysis and blocked delivery status from unresolved metadata", async () => {
  const job = await importTurnoverFolder(fixtureFolder);

  assert.ok(job.analysisReport.tracksTotal >= 1);
  assert.ok(job.analysisReport.clipsTotal >= 1);
  assert.ok(job.analysisReport.markersTotal >= 1);

  assert.ok(job.preservationIssues.some((issue) => issue.title.includes("Unresolved reel/tape/scene/take metadata")));
  assert.ok(job.deliveryPackage.artifacts.every((artifact) => artifact.status === "queued" || artifact.status === "blocked"));
});

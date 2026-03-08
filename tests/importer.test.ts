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

test("importTurnoverFolder generates analysis and delivery status from intake findings", async () => {
  const job = await importTurnoverFolder(fixtureFolder);

  assert.ok(job.analysisReport.tracksTotal >= 1);
  assert.ok(job.analysisReport.clipsTotal >= 1);
  assert.ok(job.analysisReport.markersTotal >= 1);
  assert.ok(job.translationModel.timeline.startFrame > 0);
  assert.ok(job.translationModel.timeline.durationFrames > 0);

  assert.ok(job.preservationIssues.some((issue) => issue.title.includes("Unresolved reel/tape/scene/take metadata")));
  assert.ok(job.deliveryPackage.artifacts.every((artifact) => artifact.status === "queued" || artifact.status === "blocked"));
});

test("csv parsing preserves quoted channel layouts", async () => {
  const job = await importTurnoverFolder(fixtureFolder);
  const clips = job.translationModel.timeline.tracks.flatMap((track) => track.clips);

  const surroundClip = clips.find((clip) => clip.channelCount === 6);
  assert.ok(surroundClip);
  assert.equal(surroundClip?.channelLayout, "L,R,C,LFE,Ls,Rs");
});

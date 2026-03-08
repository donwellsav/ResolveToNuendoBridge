import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";

const fixtureFolder = path.join(process.cwd(), "fixtures", "turnover-basic");

test("importTurnoverFolder hydrates intake and canonical analysis only", async () => {
  const imported = await importTurnoverFolder(fixtureFolder);

  assert.equal(imported.sourceBundle.stage, "intake");
  assert.equal(imported.translationModel.stage, "canonical");
  assert.ok(imported.sourceBundle.intakeAssets.length >= 5);
  assert.ok(imported.translationModel.timeline.tracks.length >= 1);
  assert.ok(imported.analysisReport.clipsTotal >= 1);
  assert.ok(imported.analysisReport.markersTotal >= 1);
  assert.ok(imported.fieldRecorderCandidates.length >= 1);
  assert.ok(imported.reconformChanges.length === 0);
  assert.equal((imported as unknown as { deliveryPackage?: unknown }).deliveryPackage, undefined);
});

test("csv parsing preserves quoted channel layouts", async () => {
  const imported = await importTurnoverFolder(fixtureFolder);
  const clips = imported.translationModel.timeline.tracks.flatMap((track) => track.clips);

  const surroundClip = clips.find((clip) => clip.channelCount === 6);
  assert.ok(surroundClip);
  assert.equal(surroundClip?.channelLayout, "L,R,C,LFE,Ls,Rs");
});

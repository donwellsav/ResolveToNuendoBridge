import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";

const fcpxmlFixture = path.join(process.cwd(), "fixtures", "turnover-fcpxml-rich");
const edlFixture = path.join(process.cwd(), "fixtures", "turnover-edl-metadata-only");

test("importer prefers FCPXML/XML as primary timeline source when present", async () => {
  const imported = await importTurnoverFolder(fcpxmlFixture);

  assert.equal(imported.translationModel.timeline.name, "RH_E03_R4_LOCK_v13");
  assert.equal(imported.translationModel.timeline.tracks.length, 2);
  assert.equal(imported.translationModel.timeline.tracks[0].clips[0].clipName, "A102C008_230915");
  assert.equal(imported.translationModel.timeline.tracks[0].clips[0].recordIn, "01:00:00:00");
  assert.equal(imported.translationModel.timeline.markers.length, 1);

  const mismatchIssues = imported.preservationIssues.filter((issue) => issue.id.includes("mismatch"));
  assert.ok(mismatchIssues.length >= 2);
});

test("importer falls back to EDL when no FCPXML/XML exists", async () => {
  const imported = await importTurnoverFolder(edlFixture);

  assert.equal(imported.translationModel.timeline.name, "RH_E03_EDL_ONLY");
  assert.equal(imported.translationModel.timeline.tracks.length, 1);
  assert.equal(imported.translationModel.timeline.tracks[0].clips.length, 2);
  assert.equal(imported.translationModel.timeline.tracks[0].clips[0].clipName, "EDL Event 1");
  assert.ok(imported.translationModel.timeline.markers.length >= 1);
  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-missing-reference_video"));
});

test("metadata enrichment preserves quoted channel layouts", async () => {
  const imported = await importTurnoverFolder(fcpxmlFixture);
  const clip = imported.translationModel.timeline.tracks[0].clips[0];

  assert.equal(clip.channelLayout, "L,R,C,LFE,Ls,Rs");
  assert.equal(clip.channelCount, 6);
});

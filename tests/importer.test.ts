import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";

const fcpxmlFixture = path.join(process.cwd(), "fixtures", "turnover-fcpxml-rich");
const edlFixture = path.join(process.cwd(), "fixtures", "turnover-edl-metadata-only");
const aafOnlyFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-205-aaf-only");
const aafVsFcpxmlFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-206-aaf-vs-fcpxml");
const aafMissingMediaFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-207-aaf-missing-media");

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

test("importer hydrates canonical timeline from AAF when AAF is the only structured timeline source", async () => {
  const imported = await importTurnoverFolder(aafOnlyFixture);

  assert.equal(imported.translationModel.timeline.name, "RVR_205_LOCK_v5");
  assert.equal(imported.translationModel.timeline.tracks.length, 1);
  assert.equal(imported.translationModel.timeline.tracks[0].clips.length, 2);
  assert.equal(imported.translationModel.timeline.tracks[0].clips[0].clipName, "DX_205_001");
  assert.equal(imported.translationModel.timeline.tracks[0].clips[0].channelLayout, "L,R,C,LFE,Ls,Rs");
  assert.equal(imported.translationModel.timeline.tracks[0].clips[1].isOffline, true);
});

test("importer keeps FCPXML/XML as primary timeline and reconciles mismatches with AAF", async () => {
  const imported = await importTurnoverFolder(aafVsFcpxmlFixture);

  assert.equal(imported.translationModel.timeline.name, "RVR_206_LOCK_v8");
  assert.equal(imported.translationModel.timeline.tracks.length, 2);
  assert.equal(imported.translationModel.timeline.tracks[0].clips[0].clipName, "DX_206_001");

  const issueIds = imported.preservationIssues.map((issue) => issue.id);
  assert.ok(issueIds.includes("issue-aaf-track-count-mismatch"));
  assert.ok(issueIds.includes("issue-aaf-clip-count-mismatch"));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-timing-mismatch-")));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-source-file-mismatch-")));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-reel-tape-mismatch-")));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-expected-media-missing-")));
  assert.ok(issueIds.includes("issue-aaf-marker-coverage-mismatch"));
});


test("importer raises critical AAF media-reference issues when AAF is primary timeline source", async () => {
  const imported = await importTurnoverFolder(aafMissingMediaFixture);

  assert.equal(imported.translationModel.timeline.name, "RVR_207_LOCK_v2");
  assert.equal(imported.translationModel.timeline.tracks.length, 1);
  assert.equal(imported.translationModel.timeline.tracks[0].clips[1].hasSpeedEffect, true);

  const missingMedia = imported.preservationIssues.filter((issue) => issue.id.startsWith("issue-aaf-expected-media-missing-"));
  assert.ok(missingMedia.length >= 1);
  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-delivery-blocked"));
});

import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";

import { buildOleWithTimelineRecords } from "./helpers-ole";

const fcpxmlFixture = path.join(process.cwd(), "fixtures", "turnover-fcpxml-rich");
const edlFixture = path.join(process.cwd(), "fixtures", "turnover-edl-metadata-only");
const aafOnlyFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-205-aaf-only");
const aafVsFcpxmlFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-206-aaf-vs-fcpxml");
const aafMissingMediaFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-207-aaf-missing-media");
const aafBroadFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-209-aaf-broad-ole");

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
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-source-clip-mismatch-")));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-reel-tape-mismatch-")));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-missing-media-reference-")));
  assert.ok(issueIds.some((id) => id.startsWith("issue-aaf-expected-media-missing-")));
  assert.ok(issueIds.includes("issue-aaf-marker-coverage-mismatch"));
});

test("importer hydrates canonical timeline from direct OLE AAF fixture without adapter sidecar", async () => {
  const fixtureRoot = await fs.mkdtemp(path.join(os.tmpdir(), "aaf-ole-intake-"));
  const fixturePath = path.join(fixtureRoot, "rvr-208-aaf-ole-direct");
  await fs.mkdir(path.join(fixturePath, "audio"), { recursive: true });

  const timelineBuffer = buildOleWithTimelineRecords([
    'TIMELINE name="RVR_208_LOCK_v1" fps=24 start=01:00:00:00',
    'TRACK id=t1 name="DX A" role=DX',
    'CLIP track=t1 name="DX_208_001" sourceFile="SC08_TK01.BWF" recordIn=01:00:00:00 recordOut=01:00:04:00 sourceIn=10:00:00:00 sourceOut=10:00:04:00 channels=4 layout="L,R,Ls,Rs" reel=R208 tape=SR208A offline=false',
    'CLIP track=t1 name="DX_208_002" sourceFile="SC08_TK99.BWF" recordIn=01:00:04:00 recordOut=01:00:08:00 sourceIn=10:00:04:00 sourceOut=10:00:08:00 channels=2 layout="L,R" reel=R208 tape=SR208A offline=true hasSpeedEffect=true fadeIn=true',
    'MARKER tc=01:00:02:00 frame=48 label="Missing alt take"',
  ]);

  await fs.writeFile(path.join(fixturePath, "timeline.aaf"), timelineBuffer);
  await fs.writeFile(
    path.join(fixturePath, "manifest.json"),
    JSON.stringify(
      {
        project: "RVR208",
        timelineVersion: "RVR_208_LOCK_v1",
        timelineName: "RVR_208_LOCK_v1",
        startTimecode: "01:00:00:00",
        durationTimecode: "00:00:08:00",
        fps: 24,
        sampleRate: 48000,
        dropFrame: false,
      },
      null,
      2
    )
  );
  await fs.writeFile(
    path.join(fixturePath, "metadata.csv"),
    [
      "trackName,role,recordIn,recordOut,sourceIn,sourceOut,recordInFrames,recordOutFrames,sourceInFrames,sourceOutFrames,clipName,sourceFileName,reel,tape,scene,take,eventDescription,clipNotes,channelCount,channelLayout,isPolyWav,hasBwf,hasIXml,isOffline,isNested,isFlattened,hasSpeedEffect,hasFadeIn,hasFadeOut",
      'DX A,DX,01:00:00:00,01:00:04:00,10:00:00:00,10:00:04:00,0,96,864000,864096,DX_208_001,SC08_TK01.BWF,R208,SR208A,8,1,Dialog line 1,Clean take,4,"L,R,Ls,Rs",false,true,false,false,false,true,false,false,false',
      'DX A,DX,01:00:04:00,01:00:08:00,10:00:04:00,10:00:08:00,96,192,864096,864192,DX_208_002,SC08_TK99.BWF,R208,SR208A,8,2,Dialog line 2,Missing media,2,"L,R",false,true,false,true,false,true,true,true,false',
    ].join("\n")
  );
  await fs.writeFile(path.join(fixturePath, "audio", "SC08_TK01.BWF"), "placeholder");

  try {
    const imported = await importTurnoverFolder(fixturePath);

    assert.equal(imported.translationModel.timeline.name, "RVR_208_LOCK_v1");
    assert.equal(imported.translationModel.timeline.tracks.length, 1);
    assert.equal(imported.translationModel.timeline.tracks[0].clips.length, 2);
    assert.equal(imported.translationModel.timeline.tracks[0].clips[0].sourceFileName, "SC08_TK01.BWF");
    assert.equal(imported.translationModel.timeline.tracks[0].clips[1].isOffline, true);
    assert.ok(!imported.preservationIssues.some((issue) => issue.id === "issue-aaf-direct-parser-fallback"));
  } finally {
    await fs.rm(fixtureRoot, { recursive: true, force: true });
  }
});



test("importer extracts locator/comment markers and media descriptors from broader direct AAF fixture", async () => {
  const imported = await importTurnoverFolder(aafBroadFixture);

  assert.equal(imported.translationModel.timeline.name, "RVR_209_LOCK_v3");
  assert.equal(imported.translationModel.timeline.markers.length, 3);
  assert.ok(imported.translationModel.timeline.markers.some((marker) => marker.label.includes("Missing line pickup")));

  const firstClip = imported.translationModel.timeline.tracks[0].clips[0];
  const secondClip = imported.translationModel.timeline.tracks[0].clips[1];
  assert.equal(secondClip.sourceAssetId, "in-SRC209B");
  assert.equal(firstClip.hasFadeIn, false);
});

test("importer emits diagnostics when adapter fallback path is required", async () => {
  const imported = await importTurnoverFolder(aafMissingMediaFixture);

  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-aaf-direct-parser-fallback"));
  assert.ok(imported.preservationIssues.some((issue) => issue.id.startsWith("issue-aaf-extraction-warning-")));
});
test("importer raises critical AAF media-reference issues when AAF is primary timeline source", async () => {
  const imported = await importTurnoverFolder(aafMissingMediaFixture);

  assert.equal(imported.translationModel.timeline.name, "RVR_207_LOCK_v2");
  assert.equal(imported.translationModel.timeline.tracks.length, 1);
  assert.equal(imported.translationModel.timeline.tracks[0].clips[1].hasSpeedEffect, true);

  const missingMedia = imported.preservationIssues.filter((issue) => issue.id.startsWith("issue-aaf-expected-media-missing-"));
  assert.ok(missingMedia.length >= 1);
  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-delivery-blocked"));
  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-aaf-direct-parser-fallback"));
});

import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parseAaf } from "../lib/parsers/aaf";
import { extractAafTimelineText } from "../lib/parsers/aaf-adapter";

const aafMissingMediaFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-207-aaf-missing-media", "timeline.aaf");
const aafBroadFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-209-aaf-broad-ole", "timeline.aaf");

test("AAF adapter extracts binary/container records and parser hydrates canonical clip fields", async () => {
  const tempFile = path.join(os.tmpdir(), "aaf-binary-container-test.aaf");
  const binaryFixture = Buffer.from([
    ...Buffer.from("AAFBIN\0hdr\0", "binary"),
    ...Buffer.from("TIMELINE name=\"RVR_205_LOCK_v5\" fps=24 start=01:00:00:00\0", "binary"),
    ...Buffer.from("TRACK id=t1 name=\"DX A\" role=DX\0", "binary"),
    ...Buffer.from(
      "CLIP track=t1 name=\"DX_205_001\" sourceFile=\"SC05_TK01.BWF\" recordIn=01:00:00:00 recordOut=01:00:04:00 sourceIn=10:00:00:00 sourceOut=10:00:04:00 recordInFrames=0 recordOutFrames=96 sourceInFrames=864000 sourceOutFrames=864096 channels=6 layout=\"L,R,C,LFE,Ls,Rs\" reel=R205 tape=SR205A fadeIn=true fadeOut=false offline=false\0",
      "binary"
    ),
    ...Buffer.from(
      "CLIP track=t1 name=\"DX_205_002\" sourceFile=\"SC05_TK02.BWF\" recordIn=01:00:04:00 recordOut=01:00:08:00 sourceIn=10:00:04:00 sourceOut=10:00:08:00 recordInFrames=96 recordOutFrames=192 sourceInFrames=864096 sourceOutFrames=864192 channels=2 layout=\"L,R\" reel=R205 tape=SR205A fadeIn=false fadeOut=true offline=true\0",
      "binary"
    ),
    ...Buffer.from("MARKER tc=01:00:02:00 frame=48 label=\"ADR candidate\"\0", "binary"),
  ]);

  await fs.writeFile(tempFile, binaryFixture);

  try {
    const extraction = await extractAafTimelineText(tempFile);
    const parsed = parseAaf(extraction.normalizedText);

    assert.equal(extraction.mode, "binary-container");
    assert.equal(parsed.timelineName, "RVR_205_LOCK_v5");
    assert.equal(parsed.fps, 24);
    assert.equal(parsed.startTimecode, "01:00:00:00");
    assert.equal(parsed.tracks.length, 1);
    assert.equal(parsed.tracks[0].clips.length, 2);

    const firstClip = parsed.tracks[0].clips[0];
    assert.equal(firstClip.sourceFileName, "SC05_TK01.BWF");
    assert.equal(firstClip.reel, "R205");
    assert.equal(firstClip.tape, "SR205A");
    assert.equal(firstClip.channelCount, 6);
    assert.equal(firstClip.channelLayout, "L,R,C,LFE,Ls,Rs");
    assert.equal(firstClip.hasFadeIn, true);
    assert.equal(firstClip.hasFadeOut, false);

    const secondClip = parsed.tracks[0].clips[1];
    assert.equal(secondClip.isOffline, true);
    assert.equal(secondClip.sourceIn, "10:00:04:00");
    assert.equal(secondClip.recordOut, "01:00:08:00");

    assert.equal(parsed.markers.length, 1);
    assert.equal(parsed.markers[0].label, "ADR candidate");
  } finally {
    await fs.unlink(tempFile);
  }
});

test("AAF adapter normalizes external adapter JSON output into parser contract", async () => {
  const extraction = await extractAafTimelineText(aafMissingMediaFixture);
  const parsed = parseAaf(extraction.normalizedText);

  assert.equal(extraction.mode, "external-adapter");
  assert.ok(extraction.warnings.some((warning) => warning.includes("fallback")));
  assert.equal(parsed.timelineName, "RVR_207_LOCK_v2");
  assert.equal(parsed.tracks.length, 1);
  assert.equal(parsed.tracks[0].clips.length, 2);

  const secondClip = parsed.tracks[0].clips[1];
  assert.equal(secondClip.sourceFileName, "SC07_TK99.BWF");
  assert.equal(secondClip.channelLayout, "L,R");
  assert.equal(secondClip.hasSpeedEffect, true);
  assert.equal(secondClip.hasFadeIn, true);
  assert.equal(secondClip.hasFadeOut, false);
  assert.equal(secondClip.isOffline, true);
  assert.equal(secondClip.eventDescription, "DXMob207_2");
});

test("direct AAF parser traverses broader SOURCECLIP/LOCATOR/COMMENT descriptors", async () => {
  const text = await fs.readFile(aafBroadFixture, "utf8");
  const parsed = parseAaf(text);

  assert.equal(parsed.timelineName, "RVR_209_LOCK_v3");
  assert.equal(parsed.tracks.length, 2);
  assert.equal(parsed.tracks[0].clips.length, 2);

  const clip = parsed.tracks[0].clips[0];
  assert.equal(clip.sourceAssetId, "in-SRC209A");
  assert.equal(clip.channelLayout, "L,R,Ls,Rs");
  assert.ok((clip.eventDescription ?? "").includes("crossfade"));
  assert.ok((clip.clipNotes ?? "").includes("WaveDescriptor"));

  const offlineClip = parsed.tracks[0].clips[1];
  assert.equal(offlineClip.isOffline, true);

  assert.equal(parsed.markers.length, 3);
  assert.ok(parsed.markers.some((marker) => marker.label.includes("Missing line pickup")));
});

test("direct parser accepts broader record/token alias variants used by messier AAF exports", () => {
  const parsed = parseAaf([
    'CompositionMob name="AliasTimeline" fps=24 start=01:00:00:00',
    'Track id=t1 name="DX A" role=DX',
    'MasterMob id=mob1 sourceFile="SCX.BWF" reel=R1 tapeId=SR1 descriptorClassId="WaveDescriptor"',
    'SourceClip trackId=t1 sourcePackageID=mob1 sourcePackageClipID=SRCALIAS1 name="AliasClip" timelineInFrames=0 timelineOutFrames=96 srcInFrames=100 srcOutFrames=196 mediaRefStatus=offline',
    'Locator tc=01:00:01:00 frame=24 label="Alias locator"',
  ].join("\n"));

  assert.equal(parsed.timelineName, "AliasTimeline");
  assert.equal(parsed.tracks.length, 1);
  assert.equal(parsed.tracks[0].clips[0].sourceAssetId, "in-SRCALIAS1");
  assert.equal(parsed.tracks[0].clips[0].isOffline, true);
  assert.equal(parsed.markers[0].label, "Alias locator");
});

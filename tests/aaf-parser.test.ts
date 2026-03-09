import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { parseAaf } from "../lib/parsers/aaf";

const aafOnlyFixture = path.join(process.cwd(), "fixtures", "intake", "rvr-205-aaf-only", "timeline.aaf");

test("AAF parser hydrates timeline, track, clip, media, and marker fields", () => {
  const content = readFileSync(aafOnlyFixture, "utf8");
  const parsed = parseAaf(content);

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
});

import assert from "node:assert/strict";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  applyBulkTrackTarget,
  selectFieldRecorderCandidates,
  summarizeUnresolved,
  toggleAllMarkers,
} from "../lib/services/mapping-workspace";

test("mapping workspace bulk actions update mapping state deterministically", () => {
  const base = translationJobs[0].mappingWorkspace;
  const afterTrackBulk = applyBulkTrackTarget(base, "FX", "FX_ALT");
  assert.equal(afterTrackBulk.trackMappings.find((item) => item.sourceRole === "FX")?.targetNuendoTrack, "FX_ALT");

  const afterMarkerBulk = toggleAllMarkers(afterTrackBulk, false);
  assert.ok(afterMarkerBulk.markerMappings.every((item) => item.state === "needs_review"));

  const afterFieldRecorderBulk = selectFieldRecorderCandidates(afterMarkerBulk, 80, translationJobs[0].fieldRecorderCandidates);
  assert.equal(afterFieldRecorderBulk.fieldRecorderMappings.filter((item) => item.selected).length, 1);

  const unresolved = summarizeUnresolved(afterFieldRecorderBulk);
  assert.ok(unresolved.totalUnresolved > 0);
});

import assert from "node:assert/strict";
import test from "node:test";

import { getTranslationJobs } from "../lib/data-source";

test("imported fixture data flows through exporter planning into job data", async () => {
  const jobs = await getTranslationJobs();
  const job = jobs[0];

  assert.ok(job);
  assert.ok(job.translationModel.timeline.tracks.length >= 1);
  assert.ok(job.deliveryPackage.artifacts.length >= 1);
  assert.ok(job.deliveryPackage.artifacts.every((artifact) => ["planned", "blocked", "placeholder"].includes(artifact.status)));
  assert.ok(job.deliveryPackage.artifacts.some((artifact) => artifact.fileRole === "reference_video"));
  assert.ok(job.externalExecutionPackage);
  assert.ok(job.externalExecutionPackage?.files.some((file) => file.relativePath === "package/external-execution-manifest.json"));
});

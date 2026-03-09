import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { translationJobs } from "../lib/mock-data";
import {
  buildEffectiveDeliveryExecutionPreview,
  buildEffectiveDeliveryHandoffPreview,
  buildEffectiveDeliveryStagingPreview,
  buildEffectiveExternalExecutionPackagePreview,
  buildReviewStateKey,
  createEmptyReviewState,
  overlayMappingWorkspace,
} from "../lib/review-state";
import { buildExternalExecutionPackage } from "../lib/services/external-execution-package";
import { materializeExternalExecutionPackage } from "../lib/services/external-execution-package-materializer";

function buildPackage() {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  return buildEffectiveExternalExecutionPackagePreview(job, workspace, state);
}

test("external execution package manifest/index are deterministic", () => {
  const first = buildPackage();
  const second = buildPackage();

  assert.deepEqual(first.manifest, second.manifest);
  assert.deepEqual(first.index, second.index);
  assert.equal(first.packageVersion, "phase3d.v1");
});

test("external package includes checksum/index entries for staged and handoff outputs", () => {
  const pkg = buildPackage();

  assert.equal(pkg.index.entries.length > 0, true);
  assert.equal(pkg.checksums.length >= pkg.index.entries.length - 6, true);
  assert.equal(pkg.index.entries.some((entry) => entry.relativePath.startsWith("staged/")), true);
  assert.equal(pkg.index.entries.some((entry) => entry.relativePath.startsWith("handoff/")), true);
  assert.equal(pkg.index.entries.some((entry) => entry.classification === "deferred-contract"), true);
});

test("readiness supports ready, partial, and blocked", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const staging = buildEffectiveDeliveryStagingPreview(job, workspace, state);
  const handoff = buildEffectiveDeliveryHandoffPreview(job, workspace, state);

  const readyStaging = { ...staging, summary: { ...staging.summary, unavailableArtifacts: 0 } };
  const readyHandoff = { ...handoff, summary: { ...handoff.summary, partial: 0, blocked: 0 } };
  const readyPackage = buildExternalExecutionPackage({
    job: { ...job, preservationIssues: job.preservationIssues.filter((issue) => issue.severity !== "critical"), deliveryStaging: readyStaging, deliveryHandoff: readyHandoff },
    stagingBundle: readyStaging,
    handoffBundle: readyHandoff,
  });
  assert.equal(readyPackage.summary.status, "ready");

  const partialPackage = buildExternalExecutionPackage({
    job: { ...job, deliveryStaging: { ...staging, summary: { ...staging.summary, unavailableArtifacts: 1 } }, deliveryHandoff: handoff },
    stagingBundle: { ...staging, summary: { ...staging.summary, unavailableArtifacts: 1 } },
    handoffBundle: { ...handoff, summary: { ...handoff.summary, partial: 1, blocked: 0 } },
  });
  assert.equal(partialPackage.summary.status, "partial");

  const blockedPackage = buildExternalExecutionPackage({
    job: {
      ...job,
      preservationIssues: [...job.preservationIssues, { ...job.preservationIssues[0], id: "pi-critical", severity: "critical" as const }],
      deliveryStaging: staging,
      deliveryHandoff: handoff,
    },
    stagingBundle: staging,
    handoffBundle: { ...handoff, summary: { ...handoff.summary, blocked: 1 } },
  });
  assert.equal(blockedPackage.summary.status, "blocked");
});

test("review-state deltas alter package review signature while keeping canonical out of persistence", () => {
  const job = translationJobs[0];
  const base = createEmptyReviewState(buildReviewStateKey(job));
  const revised = {
    ...base,
    markerOverrides: {
      "mk-01": { includeInCsv: false, includeInEdl: false },
    },
  };

  const packageBase = buildEffectiveExternalExecutionPackagePreview(job, overlayMappingWorkspace(job.mappingWorkspace, base), base);
  const packageRevised = buildEffectiveExternalExecutionPackagePreview(
    job,
    overlayMappingWorkspace(job.mappingWorkspace, revised),
    revised
  );

  assert.notEqual(packageBase.summary.reviewSignature, packageRevised.summary.reviewSignature);
  assert.equal(packageRevised.files.some((file) => file.contentPreview.includes('"stage": "canonical"')), false);
});

test("package materializer writes deterministic package layout files", async () => {
  const pkg = buildPackage();
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "resolve-bridge-export-"));
  const diskBundle = { ...pkg, rootPath: path.relative(process.cwd(), tempRoot) };
  const written = await materializeExternalExecutionPackage(diskBundle);

  assert.equal(written.includes(`${diskBundle.rootPath}/package/external-execution-manifest.json`), true);
  assert.equal(written.includes(`${diskBundle.rootPath}/package/external-execution-index.json`), true);

  const manifest = await readFile(path.join(process.cwd(), diskBundle.rootPath, "package/external-execution-manifest.json"), "utf8");
  assert.match(manifest, /"manifestVersion": "phase3d.v1"/);
});

test("consistency maintained across staging, handoff, and package deferred artifacts", () => {
  const job = translationJobs[0];
  const state = createEmptyReviewState(buildReviewStateKey(job));
  const workspace = overlayMappingWorkspace(job.mappingWorkspace, state);
  const execution = buildEffectiveDeliveryExecutionPreview(job, workspace);
  const staging = buildEffectiveDeliveryStagingPreview(job, workspace, state);
  const handoff = buildEffectiveDeliveryHandoffPreview(job, workspace, state);
  const pkg = buildExternalExecutionPackage({
    job: { ...job, deliveryExecution: execution, deliveryStaging: staging, deliveryHandoff: handoff },
    stagingBundle: staging,
    handoffBundle: handoff,
  });

  assert.equal(handoff.writerInputs.length, staging.deferredArtifacts.length);
  assert.equal(
    pkg.index.entries.filter((entry) => entry.classification === "deferred-contract").length >= handoff.writerInputs.length,
    true
  );
});

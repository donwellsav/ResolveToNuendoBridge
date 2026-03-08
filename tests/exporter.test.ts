import assert from "node:assert/strict";
import test from "node:test";

import { planNuendoDelivery } from "../lib/services/exporter";
import { outputPresets, translationJobs } from "../lib/mock-data";
import type { TranslationJob } from "../lib/types";

function makeJob(partial: Partial<TranslationJob>): TranslationJob {
  const base = translationJobs[0];
  return {
    ...base,
    ...partial,
    sourceBundle: partial.sourceBundle ?? base.sourceBundle,
    translationModel: partial.translationModel ?? base.translationModel,
    mappingRules: partial.mappingRules ?? base.mappingRules,
    fieldRecorderCandidates: partial.fieldRecorderCandidates ?? base.fieldRecorderCandidates,
    preservationIssues: partial.preservationIssues ?? base.preservationIssues,
    analysisReport: partial.analysisReport ?? base.analysisReport,
    outputPreset: partial.outputPreset ?? base.outputPreset,
    deliveryPackage: partial.deliveryPackage ?? base.deliveryPackage,
    reconformChanges: partial.reconformChanges ?? base.reconformChanges,
  };
}

test("exporter planner sets planned/blocked/placeholder deterministically", async () => {
  const plannedJob = makeJob({
    preservationIssues: [],
    analysisReport: { ...translationJobs[0].analysisReport, blockedCount: 0 },
    fieldRecorderCandidates: [{ ...translationJobs[0].fieldRecorderCandidates[0], matched: true }],
    outputPreset: { ...outputPresets[0], includeReferenceVideo: false },
  });

  const plannedResult = await planNuendoDelivery(plannedJob, plannedJob.translationModel);

  const aaf = plannedResult.packagePlan.artifacts.find((artifact) => artifact.id === "out-aaf");
  const reference = plannedResult.packagePlan.artifacts.find((artifact) => artifact.id === "out-reference-video");
  assert.equal(aaf?.status, "planned");
  assert.equal(reference?.status, "placeholder");

  const blockedJob = makeJob({
    preservationIssues: [
      {
        id: "pi-critical",
        category: "manual-review",
        severity: "critical",
        scope: "delivery",
        title: "Critical intake failure",
        description: "Blocking issue",
        sourceLocation: "intake",
        recommendedAction: "Fix intake",
      },
    ],
    analysisReport: { ...translationJobs[0].analysisReport, blockedCount: 1 },
  });

  const blockedResult = await planNuendoDelivery(blockedJob, blockedJob.translationModel);
  assert.ok(blockedResult.packagePlan.artifacts.some((artifact) => artifact.status === "blocked"));
});

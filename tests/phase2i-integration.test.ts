import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";
import { planNuendoDelivery } from "../lib/services/exporter";
import { outputPresets } from "../lib/mock-data";
import { applyBulkTrackTarget } from "../lib/services/mapping-workspace";

const fixturePath = path.join(process.cwd(), "fixtures", "turnover-basic");

test("integration: imported fixture to edited mapping to updated delivery planning summary", async () => {
  const imported = await importTurnoverFolder(fixturePath);

  const job = {
    id: "job-phase2i",
    jobName: "Phase2I Integration",
    status: "needs_review" as const,
    createdAtIso: imported.sourceBundle.importedAtIso,
    updatedAtIso: imported.sourceBundle.importedAtIso,
    sourceBundle: imported.sourceBundle,
    translationModel: imported.translationModel,
    mappingRules: imported.mappingRules,
    mappingWorkspace: applyBulkTrackTarget(imported.mappingWorkspace, "FX", "FX_STEM_ALT"),
    fieldRecorderCandidates: imported.fieldRecorderCandidates,
    preservationIssues: imported.preservationIssues,
    reconformChanges: imported.reconformChanges,
    analysisReport: imported.analysisReport,
    outputPreset: outputPresets[0],
    deliveryPackage: {
      id: "delivery-temp",
      stage: "delivery" as const,
      target: "nuendo" as const,
      packageName: "temp",
      outputPresetId: outputPresets[0].id,
      artifacts: [],
    },
  };

  const planned = await planNuendoDelivery(job, job.translationModel);
  assert.ok(planned.warnings[1].includes("unresolved mapping decisions"));
  assert.ok(planned.packagePlan.artifacts.length >= 6);
});

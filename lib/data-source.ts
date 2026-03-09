import path from "node:path";

import { outputPresets, translationJobs as fallbackJobs } from "./mock-data";
import { prepareDeliveryExecution } from "./services/delivery-execution";
import { buildDeliveryHandoffContracts } from "./services/delivery-handoff";
import { stageDeliveryBundle } from "./services/delivery-staging";
import { materializeStagedDeliveryBundle } from "./services/delivery-staging-materializer";
import { buildExternalExecutionPackage } from "./services/external-execution-package";
import { materializeExternalExecutionPackage } from "./services/external-execution-package-materializer";
import { planNuendoDelivery } from "./services/exporter";
import { importTurnoverFolder } from "./services/importer";
import type { TranslationJob } from "./types";

const fixtureFolder = path.join(process.cwd(), "fixtures", "turnover-basic");

export async function getTranslationJobs(): Promise<TranslationJob[]> {
  try {
    const imported = await importTurnoverFolder(fixtureFolder);

    const baseJob: TranslationJob = {
      id: "job-imported-turnover",
      jobName: `Imported ${imported.sourceBundle.resolveTimelineVersion}`,
      status: imported.preservationIssues.some((issue) => issue.severity === "critical") ? "needs_review" : "queued",
      createdAtIso: imported.sourceBundle.importedAtIso,
      updatedAtIso: imported.sourceBundle.importedAtIso,
      sourceBundle: imported.sourceBundle,
      translationModel: imported.translationModel,
      mappingRules: imported.mappingRules,
      mappingWorkspace: imported.mappingWorkspace,
      fieldRecorderCandidates: imported.fieldRecorderCandidates,
      preservationIssues: imported.preservationIssues,
      reconformChanges: imported.reconformChanges,
      analysisReport: imported.analysisReport,
      outputPreset: outputPresets[0],
      deliveryPackage: {
        id: "delivery-imported-placeholder",
        stage: "delivery",
        target: "nuendo",
        packageName: `${imported.sourceBundle.resolveTimelineVersion}_NUENDO_PLAN`,
        outputPresetId: outputPresets[0].id,
        artifacts: [],
      },
    };

    const { packagePlan } = await planNuendoDelivery(baseJob, baseJob.translationModel);
    const deliveryExecution = prepareDeliveryExecution({
      job: { ...baseJob, deliveryPackage: packagePlan },
      packagePlan,
    });
    const deliveryStaging = stageDeliveryBundle({
      job: { ...baseJob, deliveryPackage: packagePlan, deliveryExecution },
      packagePlan,
      executionPlan: deliveryExecution,
      effectiveWorkspace: baseJob.mappingWorkspace,
    });
    await materializeStagedDeliveryBundle(deliveryStaging);

    const deliveryHandoff = buildDeliveryHandoffContracts({
      job: { ...baseJob, deliveryPackage: packagePlan, deliveryExecution, deliveryStaging },
      packagePlan,
      executionPlan: deliveryExecution,
      stagingBundle: deliveryStaging,
      effectiveWorkspace: baseJob.mappingWorkspace,
    });

    const externalExecutionPackage = buildExternalExecutionPackage({
      job: { ...baseJob, deliveryPackage: packagePlan, deliveryExecution, deliveryStaging, deliveryHandoff },
      stagingBundle: deliveryStaging,
      handoffBundle: deliveryHandoff,
    });
    await materializeExternalExecutionPackage(externalExecutionPackage);

    return [
      {
        ...baseJob,
        deliveryPackage: packagePlan,
        deliveryExecution,
        deliveryStaging,
        deliveryHandoff,
        externalExecutionPackage,
      },
    ];
  } catch {
    return fallbackJobs;
  }
}

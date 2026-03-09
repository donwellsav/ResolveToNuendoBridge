import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import { outputPresets, translationJobs as fallbackJobs } from "./mock-data";
import { prepareDeliveryExecution } from "./services/delivery-execution";
import { buildDeliveryHandoffContracts } from "./services/delivery-handoff";
import { stageDeliveryBundle } from "./services/delivery-staging";
import { materializeStagedDeliveryBundle } from "./services/delivery-staging-materializer";
import { buildExternalExecutionPackage } from "./services/external-execution-package";
import { createDefaultWriterAdapterRegistry } from "./services/writer-adapter-registry";
import { buildWriterRunBundle } from "./services/writer-runner";
import { buildWriterRunTransportBundle } from "./services/writer-run-transport-bundle";
import { applyExternalTransportAdapter } from "./services/writer-run-transport-external";
import { buildWriterRunTransportEndpoint } from "./services/writer-run-transport-registry";
import { materializeExternalExecutionPackage } from "./services/external-execution-package-materializer";
import { materializeWriterRunBundle } from "./services/writer-runner-materializer";
import { materializeWriterRunTransportBundle } from "./services/writer-run-transport-materializer";
import { planNuendoDelivery } from "./services/exporter";
import { importTurnoverFolder } from "./services/importer";
import type { TranslationJob, WriterRunTransportEnvelope } from "./types";

const fixtureFolder = path.join(process.cwd(), "fixtures", "turnover-basic");

async function materializeDeterministicInboundReceipts(rootPath: string, envelopes: WriterRunTransportEnvelope[]) {
  const endpoint = buildWriterRunTransportEndpoint(rootPath);
  await mkdir(endpoint.inboundPath, { recursive: true });
  const envelope = envelopes[0];
  if (!envelope) return;

  const payloads = [
    {
      receiptId: `receipt-${envelope.request.requestId}-ok`,
      receiptVersion: "phase3h.v1",
      adapterId: "node.filesystem",
      transportId: envelope.transportId,
      correlationId: envelope.correlationId,
      requestId: envelope.request.requestId,
      packageId: envelope.packageId,
      packageSignature: envelope.packageSignature,
      sourceSignature: envelope.sourceSignature.signature,
      reviewSignature: envelope.reviewSignature.revision,
      outcome: "completed",
      details: "Deterministic matched receipt fixture.",
    },
    {
      receiptId: `receipt-${envelope.request.requestId}-stale`,
      receiptVersion: "phase3h.v1",
      adapterId: "node.filesystem",
      transportId: envelope.transportId,
      correlationId: envelope.correlationId,
      requestId: envelope.request.requestId,
      packageId: envelope.packageId,
      packageSignature: envelope.packageSignature,
      sourceSignature: envelope.sourceSignature.signature,
      reviewSignature: envelope.reviewSignature.revision,
      outcome: "partial",
      details: "Deterministic stale receipt fixture.",
    },
    {
      receiptId: "receipt-unmatched",
      receiptVersion: "phase3h.v1",
      adapterId: "node.filesystem",
      transportId: "transport-unmatched",
      correlationId: "corr-unmatched",
      requestId: "request-unmatched",
      packageId: "missing",
      packageSignature: "missing",
      sourceSignature: "missing",
      reviewSignature: "missing",
      outcome: "failed",
      details: "Unmatched fixture receipt.",
    },
  ];

  await Promise.all(
    payloads.map((payload, index) =>
      writeFile(path.join(endpoint.inboundPath, `receipt-${(index + 1).toString().padStart(2, "0")}.json`), `${JSON.stringify(payload, null, 2)}\n`, "utf8")
    )
  );
}

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
    const writerAdapterReport = createDefaultWriterAdapterRegistry().buildReport(externalExecutionPackage);
    const writerRunBundle = buildWriterRunBundle({ pkg: externalExecutionPackage, adapterReport: writerAdapterReport });
    await materializeWriterRunBundle(writerRunBundle, externalExecutionPackage.rootPath);
    const writerRunTransportBundleBase = buildWriterRunTransportBundle({
      pkg: externalExecutionPackage,
      writerRunBundle,
      adapterReport: writerAdapterReport,
    });
    await materializeDeterministicInboundReceipts(externalExecutionPackage.rootPath, writerRunTransportBundleBase.envelopes);
    const writerRunTransportBundle = applyExternalTransportAdapter(writerRunTransportBundleBase, externalExecutionPackage.rootPath);
    await materializeWriterRunTransportBundle(writerRunTransportBundle, externalExecutionPackage.rootPath);

    return [
      {
        ...baseJob,
        deliveryPackage: packagePlan,
        deliveryExecution,
        deliveryStaging,
        deliveryHandoff,
        externalExecutionPackage,
        writerAdapterReport,
        writerRunBundle,
        writerRunTransportBundle,
      },
    ];
  } catch {
    return fallbackJobs;
  }
}

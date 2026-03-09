import type {
  ExternalExecutionPackage,
  WriterAdapterRegistryReport,
  WriterRunReceipt,
  WriterRunReceiptArtifact,
  WriterRunRequest,
  WriterRunResponse,
} from "../types";

export function buildWriterRunReceipt(params: {
  pkg: ExternalExecutionPackage;
  adapterReport: WriterAdapterRegistryReport;
  requests: WriterRunRequest[];
  responses: WriterRunResponse[];
}): WriterRunReceipt {
  const { pkg, adapterReport, requests, responses } = params;
  const responseByRequest = new Map(responses.map((response) => [response.requestId, response]));

  const artifacts: WriterRunReceiptArtifact[] = requests
    .map((request) => {
      const response = responseByRequest.get(request.requestId);
      const adapter = adapterReport.matches.find((item) => item.artifactId === request.artifact.artifactId);
      const dryRunPlan = {
        readyArtifacts: adapter && adapter.state === "ready" ? [adapter.artifactId] : [],
        deferredArtifacts: adapter && adapter.state === "deferred" ? [adapter.artifactId] : [],
        blockedArtifacts: adapter && (adapter.state === "blocked" || adapter.state === "unsupported") ? [adapter.artifactId] : [],
      };
      const reasons = [
        ...request.unsupportedReasons.map((reason) => reason.message),
        ...request.blockedReasons.map((reason) => reason.message),
        ...(response ? [response.message] : ["No response record available."]),
      ];

      const resultKind: WriterRunReceiptArtifact["resultKind"] =
        response?.responseStatus === "simulated"
          ? "simulated/no-op"
          : response?.responseStatus === "partial"
            ? "partial"
            : response?.responseStatus === "unsupported"
              ? "unsupported"
              : "blocked";

      return {
        artifactId: request.artifact.artifactId,
        requestId: request.requestId,
        responseStatus: response?.responseStatus ?? "blocked",
        runnerReadiness: request.runnerReadiness,
        adapterId: request.adapterId,
        adapterVersion: request.adapterVersion,
        runnerId: response?.runnerId,
        dryRunPlan,
        dependencyState: {
          unresolvedBlockers: request.artifact.unresolvedBlockers,
          dependencySummary: request.artifact.dependencySummary,
        },
        signatures: {
          source: request.sourceSignature.signature,
          review: request.reviewSignature.revision,
        },
        resultKind,
        reasons,
      };
    })
    .sort((a, b) => a.artifactId.localeCompare(b.artifactId));

  const summary = {
    packageId: pkg.summary.packageId,
    packageSignature: pkg.summary.packageSignature,
    totalRequests: requests.length,
    runnableRequests: requests.filter((request) => request.runnerReadiness === "ready").length,
    blockedRequests: artifacts.filter((artifact) => artifact.responseStatus === "blocked").length,
    unsupportedRequests: artifacts.filter((artifact) => artifact.responseStatus === "unsupported").length,
    partialRequests: artifacts.filter((artifact) => artifact.responseStatus === "partial").length,
    simulatedRequests: artifacts.filter((artifact) => artifact.responseStatus === "simulated").length,
  };

  return {
    receiptVersion: "phase3f.v1",
    generatedSequence: 1,
    artifacts,
    summary,
  };
}

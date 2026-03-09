import type {
  ExternalExecutionPackage,
  WriterAdapterRegistryReport,
  WriterRunCancellationState,
  WriterRunDispatchRecord,
  WriterRunDispatchStatus,
  WriterRunRequest,
  WriterRunResponse,
  WriterRunRetryState,
  WriterRunTransportEnvelope,
  WriterRunTransportEnvelopeVersion,
  WriterRunTransportFailure,
  WriterRunTransportId,
  WriterRunTransportReceipt,
  WriterRunTransportResponse,
} from "../types";

const WRITER_RUN_TRANSPORT_ENVELOPE_VERSION: WriterRunTransportEnvelopeVersion = "phase3g.v1";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
}

function hashSignature(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function asTransportId(input: { requestId: string; packageId: string; packageSignature: string }): WriterRunTransportId {
  return `transport-${hashSignature(stableStringify(input)).replace("fnv1a32:", "")}`;
}

export function classifyDispatchStatus(request: WriterRunRequest, response?: WriterRunResponse): WriterRunDispatchStatus {
  if (request.runnerReadiness !== "ready") return "runner-blocked";
  if (!response) return "ready-to-dispatch";
  if (response.responseStatus === "simulated") return "acknowledged";
  if (response.responseStatus === "partial") return "runner-complete";
  return "transport-failed";
}

export function buildRetryState(status: WriterRunDispatchStatus, failure?: WriterRunTransportFailure): WriterRunRetryState {
  if (status === "transport-failed" && failure?.retryable) {
    return { retryable: true, retryCount: 0, maxRetries: 2, nextAction: "retry" };
  }
  return { retryable: false, retryCount: 0, maxRetries: 0, nextAction: "none" };
}

export function buildCancellationState(): WriterRunCancellationState {
  return { state: "active", reason: "none" };
}

export function buildWriterRunTransportEnvelopes(params: {
  pkg: ExternalExecutionPackage;
  adapterReport: WriterAdapterRegistryReport;
  requests: WriterRunRequest[];
  responses: WriterRunResponse[];
}): WriterRunTransportEnvelope[] {
  const { pkg, adapterReport, requests, responses } = params;
  const responseByRequestId = new Map(responses.map((response) => [response.requestId, response]));

  return requests
    .map((request, envelopeSequence) => {
      const transportId = asTransportId({
        requestId: request.requestId,
        packageId: request.packageId,
        packageSignature: request.packageSignature,
      });
      const response = responseByRequestId.get(request.requestId);
      const dispatchStatus = classifyDispatchStatus(request, response);
      const transportFailure: WriterRunTransportFailure | undefined =
        dispatchStatus === "transport-failed"
          ? {
              code: "runner-response-not-simulated",
              retryable: response?.responseStatus === "partial",
              machineReason: `runner-status:${response?.responseStatus ?? "missing"}`,
              explanation: `Runner status ${response?.responseStatus ?? "missing"} is not dispatch-acknowledged in reference transport.`,
            }
          : undefined;

      return {
        executorCompatibilityProfileId: pkg.executorCompatibility.profileResolution.profileId,
        executorCompatibilityStatus: pkg.executorCompatibility.summary.status,
        envelopeVersion: WRITER_RUN_TRANSPORT_ENVELOPE_VERSION,
        envelopeSequence: envelopeSequence + 1,
        transportId,
        correlationId: `corr-${request.requestId}`,
        request,
        response,
        dispatchStatus,
        packageId: pkg.summary.packageId,
        packageSignature: pkg.summary.packageSignature,
        packageVersion: pkg.packageVersion,
        sourceSignature: pkg.manifest.sourceSignature,
        reviewSignature: pkg.manifest.reviewSignature,
        adapterPath: {
          adapterId: request.adapterId,
          adapterVersion: request.adapterVersion,
          matchedState: adapterReport.matches.find((match) => match.artifactId === request.artifact.artifactId)?.state,
        },
        runnerPath: {
          runnerId: request.runnerId,
          runnerReadiness: request.runnerReadiness,
        },
        receiptCompatibilityProfile: {
          profileId: pkg.receiptProfileId,
          expectedEnvelopeFiles: ["envelope.json", "dispatch-summary.json", "READY.marker"],
          expectedReceiptFiles: ["receipt.json"],
          requiredFields: [
            "receiptId",
            "receiptVersion",
            "adapterId",
            "transportId",
            "correlationId",
            "requestId",
            "packageId",
            "packageSignature",
            "sourceSignature",
            "reviewSignature",
            "outcome",
            "details",
          ],
          optionalFields: ["profileId", "payloadFingerprint", "importedFrom"],
          supportedVersions: ["phase3h.v1", "phase3i.v1"] as const,
          normalizationRules: ["canonical envelope normalization", "phase3h.v1 migration"],
          unsupportedReasons: ["missing-required-field", "unsupported-version"],
        },
        retryState: buildRetryState(dispatchStatus, transportFailure),
        cancellationState: buildCancellationState(),
        transportFailure,
      };
    })
    .sort((a, b) => a.transportId.localeCompare(b.transportId));
}

export function dispatchWriterRunTransportReference(
  envelopes: WriterRunTransportEnvelope[]
): { dispatchRecords: WriterRunDispatchRecord[]; transportResponses: WriterRunTransportResponse[]; transportReceipts: WriterRunTransportReceipt[] } {
  const dispatchRecords: WriterRunDispatchRecord[] = [];
  const transportResponses: WriterRunTransportResponse[] = [];
  const transportReceipts: WriterRunTransportReceipt[] = [];

  for (const envelope of envelopes) {
    const status = envelope.dispatchStatus;
    dispatchRecords.push({
      executorCompatibilityProfileId: envelope.executorCompatibilityProfileId,
      executorCompatibilityStatus: envelope.executorCompatibilityStatus,
      recordId: `dispatch-${envelope.transportId}`,
      transportId: envelope.transportId,
      requestId: envelope.request.requestId,
      correlationId: envelope.correlationId,
      status,
      failure: envelope.transportFailure,
      retryState: envelope.retryState,
      cancellationState: envelope.cancellationState,
      timeoutState: status === "ready-to-dispatch" ? "not-started" : "none",
      staleState: "current",
    });

    if (status === "acknowledged" || status === "runner-complete") {
      transportResponses.push({
        transportId: envelope.transportId,
        requestId: envelope.request.requestId,
        correlationId: envelope.correlationId,
        status,
        explanation:
          status === "acknowledged"
            ? "Reference transport acknowledged dispatch without external execution."
            : "Runner reported completion state propagated through reference transport.",
      });
      transportReceipts.push({
        transportId: envelope.transportId,
        requestId: envelope.request.requestId,
        correlationId: envelope.correlationId,
        receiptStatus: "receipt-recorded",
        message: "Reference transport receipt recorded deterministically.",
      });
    }
  }

  return { dispatchRecords, transportResponses, transportReceipts };
}

import type {
  WriterRunAuditEvent,
  WriterRunAuditEventType,
  WriterRunAuditRecord,
  WriterRunDispatchRecord,
  WriterRunTransportEnvelope,
  WriterRunTransportReceipt,
  WriterRunTransportResponse,
} from "../types";

function buildEvent(eventType: WriterRunAuditEventType, sequence: number, explanation: string): WriterRunAuditEvent {
  return {
    eventId: `audit-event-${sequence.toString().padStart(4, "0")}`,
    eventType,
    sequence,
    explanation,
  };
}

export function buildWriterRunAuditLog(params: {
  envelopes: WriterRunTransportEnvelope[];
  dispatchRecords: WriterRunDispatchRecord[];
  transportResponses: WriterRunTransportResponse[];
  transportReceipts: WriterRunTransportReceipt[];
}): WriterRunAuditRecord[] {
  const { envelopes, dispatchRecords, transportResponses, transportReceipts } = params;

  return envelopes
    .map((envelope, index) => {
      const dispatch = dispatchRecords.find((record) => record.transportId === envelope.transportId);
      const response = transportResponses.find((item) => item.transportId === envelope.transportId);
      const receipt = transportReceipts.find((item) => item.transportId === envelope.transportId);
      const events: WriterRunAuditEvent[] = [
        buildEvent("classified", 1, `Request ${envelope.request.requestId} classified as ${envelope.dispatchStatus}.`),
      ];

      if (dispatch && dispatch.status !== "runner-blocked") {
        events.push(buildEvent("dispatched", 2, `Transport dispatch status is ${dispatch.status}.`));
      }
      if (response) {
        events.push(buildEvent("acknowledged", 3, response.explanation));
      }
      if (receipt) {
        events.push(buildEvent("receipt-recorded", 4, receipt.message));
      }
      if (dispatch?.status === "runner-blocked") {
        events.push(buildEvent("runner-blocked", 5, "Request blocked before transport dispatch."));
      }
      if (dispatch?.status === "transport-failed") {
        events.push(
          buildEvent(
            "transport-failed",
            6,
            dispatch.failure?.explanation ?? "Transport failed without detailed explanation."
          )
        );
      }

      return {
        auditId: `audit-${(index + 1).toString().padStart(4, "0")}`,
        transportId: envelope.transportId,
        requestId: envelope.request.requestId,
        correlationId: envelope.correlationId,
        packageId: envelope.packageId,
        sourceSignature: envelope.sourceSignature,
        reviewSignature: envelope.reviewSignature,
        events,
        latestStatus: dispatch?.status ?? envelope.dispatchStatus,
      };
    })
    .sort((a, b) => a.transportId.localeCompare(b.transportId));
}

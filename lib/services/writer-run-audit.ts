import type {
  WriterRunAuditEvent,
  WriterRunAuditEventType,
  WriterRunAuditRecord,
  WriterRunDispatchRecord,
  WriterRunReceiptIngestionResult,
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
  receiptIngestion?: WriterRunReceiptIngestionResult[];
}): WriterRunAuditRecord[] {
  const { envelopes, dispatchRecords, transportResponses, transportReceipts, receiptIngestion = [] } = params;

  return envelopes
    .map((envelope, index) => {
      const dispatch = dispatchRecords.find((record) => record.transportId === envelope.transportId);
      const response = transportResponses.find((item) => item.transportId === envelope.transportId);
      const receipt = transportReceipts.find((item) => item.transportId === envelope.transportId);
      const ingested = receiptIngestion.find((item) => item.matchedTransportId === envelope.transportId);
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
      if (ingested?.status === "receipt-imported") {
        events.push(buildEvent("receipt-imported", 5, ingested.message));
        events.push(buildEvent(ingested.nextDispatchStatus ?? "partial", 6, `Receipt outcome ${ingested.nextDispatchStatus}.`));
      }
      if (ingested?.status === "receipt-duplicate") events.push(buildEvent("receipt-duplicate", 7, ingested.message));
      if (ingested?.status === "receipt-stale") events.push(buildEvent("receipt-stale", 8, ingested.message));
      if (ingested?.status === "receipt-superseded") events.push(buildEvent("receipt-superseded", 8, ingested.message));
      if (ingested?.status === "receipt-partial") events.push(buildEvent("receipt-partial", 8, ingested.message));
      if (ingested?.status === "receipt-unmatched") events.push(buildEvent("receipt-unmatched", 9, ingested.message));
      if (ingested?.status === "receipt-invalid") events.push(buildEvent("receipt-invalid", 10, ingested.message));
      if (ingested?.status === "receipt-incompatible") events.push(buildEvent("receipt-incompatible", 10, ingested.message));
      if (dispatch?.status === "runner-blocked") {
        events.push(buildEvent("runner-blocked", 11, "Request blocked before transport dispatch."));
      }
      if (dispatch?.status === "transport-failed" || dispatch?.status === "dispatch-failed") {
        events.push(
          buildEvent(
            "transport-failed",
            12,
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

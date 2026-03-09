import type {
  WriterRunAttemptHistory,
  WriterRunAuditRecord,
  WriterRunDispatchRecord,
  WriterRunTransportEnvelope,
} from "../types";

export function buildWriterRunAttemptHistory(params: {
  envelopes: WriterRunTransportEnvelope[];
  dispatchRecords: WriterRunDispatchRecord[];
  auditLog: WriterRunAuditRecord[];
}): WriterRunAttemptHistory[] {
  const { envelopes, dispatchRecords, auditLog } = params;

  return envelopes
    .map((envelope) => {
      const dispatch = dispatchRecords.find((record) => record.transportId === envelope.transportId);
      const audit = auditLog.find((record) => record.transportId === envelope.transportId);
      const superseded =
        envelope.request.sourceSignature.signature !== envelope.sourceSignature.signature ||
        envelope.request.reviewSignature.revision !== envelope.reviewSignature.revision;

      return {
        historyId: `history-${envelope.transportId}`,
        transportId: envelope.transportId,
        requestId: envelope.request.requestId,
        correlationId: envelope.correlationId,
        statusTimeline: (audit?.events ?? []).map((event) => ({
          sequence: event.sequence,
          eventType: event.eventType,
          explanation: event.explanation,
        })),
        retryState: dispatch?.retryState ?? envelope.retryState,
        cancellationState: dispatch?.cancellationState ?? envelope.cancellationState,
        timeoutState: dispatch?.timeoutState ?? "none",
        staleState: superseded ? "superseded" : (dispatch?.staleState ?? "current"),
      };
    })
    .sort((a, b) => a.transportId.localeCompare(b.transportId));
}

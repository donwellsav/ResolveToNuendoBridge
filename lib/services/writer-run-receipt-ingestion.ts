import type {
  WriterRunDispatchRecord,
  WriterRunReceiptEnvelope,
  WriterRunReceiptIngestionResult,
  WriterRunTransportEnvelope,
} from "../types";

function mapOutcome(outcome: WriterRunReceiptEnvelope["outcome"]): "completed" | "failed" | "partial" {
  if (outcome === "completed") return "completed";
  if (outcome === "failed") return "failed";
  return "partial";
}

export function ingestWriterRunReceipts(params: {
  receipts: WriterRunReceiptEnvelope[];
  envelopes: WriterRunTransportEnvelope[];
  dispatchRecords: WriterRunDispatchRecord[];
}): WriterRunReceiptIngestionResult[] {
  const { receipts, envelopes, dispatchRecords } = params;
  const seenReceiptIds = new Set<string>();
  const seenTransportIds = new Set<string>();

  return receipts.map((receipt) => {
    if (seenReceiptIds.has(receipt.receiptId)) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "duplicate",
        validationStatus: "valid",
        status: "receipt-duplicate",
        matchedTransportId: receipt.transportId,
        matchedCorrelationId: receipt.correlationId,
        message: "Duplicate receipt id already ingested.",
      };
    }
    seenReceiptIds.add(receipt.receiptId);

    const envelope = envelopes.find((item) => item.transportId === receipt.transportId);
    const dispatch = dispatchRecords.find((item) => item.transportId === receipt.transportId);

    if (!envelope || !dispatch) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "unmatched",
        validationStatus: "valid",
        status: "receipt-unmatched",
        message: "Receipt did not match a known transport dispatch.",
      };
    }

    if (receipt.receiptVersion !== "phase3h.v1") {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "matched",
        validationStatus: "version-unsupported",
        status: "receipt-invalid",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        message: "Receipt version is unsupported.",
      };
    }

    if (
      receipt.packageSignature !== envelope.packageSignature ||
      receipt.sourceSignature !== envelope.sourceSignature.signature ||
      receipt.reviewSignature !== envelope.reviewSignature.revision
    ) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "matched",
        validationStatus: "signature-mismatch",
        status: "receipt-invalid",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        message: "Receipt signature mismatch.",
      };
    }

    if (seenTransportIds.has(envelope.transportId)) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "stale",
        validationStatus: "valid",
        status: "receipt-stale",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        message: "Receipt superseded by earlier imported receipt for transport id.",
      };
    }
    seenTransportIds.add(envelope.transportId);

    return {
      receiptId: receipt.receiptId,
      source: "filesystem-inbound",
      matchStatus: "matched",
      validationStatus: "valid",
      status: "receipt-imported",
      matchedTransportId: envelope.transportId,
      matchedCorrelationId: envelope.correlationId,
      nextDispatchStatus: mapOutcome(receipt.outcome),
      message: receipt.details,
    };
  });
}

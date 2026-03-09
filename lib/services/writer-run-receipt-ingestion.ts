import type {
  WriterRunDispatchRecord,
  WriterRunReceiptIngestionResult,
  WriterRunTransportEnvelope,
} from "../types";
import { ingestWriterRunReceiptsCompatibility } from "./receipt-compatibility";

export function ingestWriterRunReceipts(params: {
  receipts: unknown[];
  envelopes: WriterRunTransportEnvelope[];
  dispatchRecords: WriterRunDispatchRecord[];
}): WriterRunReceiptIngestionResult[] {
  return ingestWriterRunReceiptsCompatibility(params);
}

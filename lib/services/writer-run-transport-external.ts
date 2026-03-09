import type { WriterRunDispatchRecord, WriterRunTransportBundle } from "../types";
import { buildWriterRunAuditLog } from "./writer-run-audit";
import { buildWriterRunAttemptHistory } from "./writer-run-history";
import { ingestWriterRunReceipts } from "./writer-run-receipt-ingestion";
import { createWriterRunTransportRegistry } from "./writer-run-transport-registry";

export function applyExternalTransportAdapter(bundle: WriterRunTransportBundle, rootPath: string): WriterRunTransportBundle {
  const registry = createWriterRunTransportRegistry(rootPath);
  const adapter = registry.resolveAdapter("node.filesystem");
  const dispatchResults = adapter.dispatch(bundle.envelopes);
  const dispatchByTransport = new Map(dispatchResults.map((item) => [item.transportId, item.status]));

  const dispatchRecords: WriterRunDispatchRecord[] = bundle.dispatchRecords.map((record) => ({
    ...record,
    status: (dispatchByTransport.get(record.transportId) === "dispatch-failed" ? "dispatch-failed" : "dispatched") as WriterRunDispatchRecord["status"],
  }));

  const importedReceipts = adapter.readReceipts();
  const receiptIngestion = ingestWriterRunReceipts({
    receipts: importedReceipts,
    envelopes: bundle.envelopes,
    dispatchRecords,
  });

  const auditLog = buildWriterRunAuditLog({
    envelopes: bundle.envelopes,
    dispatchRecords,
    transportResponses: bundle.transportResponses,
    transportReceipts: bundle.transportReceipts,
    receiptIngestion,
  });
  const history = buildWriterRunAttemptHistory({ envelopes: bundle.envelopes, dispatchRecords, auditLog });

  return {
    ...bundle,
    transportAdapter: {
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      endpoint: adapter.endpoint,
    },
    dispatchResults,
    dispatchRecords,
    importedReceipts,
    receiptIngestion,
    auditLog,
    history,
  };
}

import type {
  ExternalExecutionPackage,
  WriterAdapterRegistryReport,
  WriterRunBundle,
  WriterRunTransportBundle,
} from "../types";
import { buildWriterRunAuditLog } from "./writer-run-audit";
import { buildWriterRunAttemptHistory } from "./writer-run-history";
import { buildWriterRunTransportEnvelopes, dispatchWriterRunTransportReference } from "./writer-run-transport";

export function buildWriterRunTransportBundle(params: {
  pkg: ExternalExecutionPackage;
  writerRunBundle: WriterRunBundle;
  adapterReport: WriterAdapterRegistryReport;
}): WriterRunTransportBundle {
  const { pkg, writerRunBundle, adapterReport } = params;
  const envelopes = buildWriterRunTransportEnvelopes({
    pkg,
    adapterReport,
    requests: writerRunBundle.requests,
    responses: writerRunBundle.responses,
  });

  const { dispatchRecords, transportResponses, transportReceipts } = dispatchWriterRunTransportReference(envelopes);
  const dispatchResults = dispatchRecords.map((record, index) => ({
    dispatchId: record.recordId,
    adapterId: "reference.noop-transport" as const,
    adapterVersion: "phase3h.v1" as const,
    transportId: record.transportId,
    requestId: record.requestId,
    correlationId: record.correlationId,
    packageId: envelopes[index]?.packageId ?? "unknown",
    packageSignature: envelopes[index]?.packageSignature ?? "unknown",
    status: record.status === "transport-failed" ? ("dispatch-failed" as const) : ("dispatched" as const),
    dispatchedAtIso: `1970-01-01T00:00:${(index + 1).toString().padStart(2, "0")}.000Z`,
    outboundPath: "reference://noop",
  }));

  const auditLog = buildWriterRunAuditLog({ envelopes, dispatchRecords, transportResponses, transportReceipts, receiptIngestion: [] });
  const history = buildWriterRunAttemptHistory({ envelopes, dispatchRecords, auditLog });

  const files: WriterRunTransportBundle["files"] = [
    {
      artifactId: "writer-run-transport-envelopes",
      fileName: "writer-run-transport-envelopes.json",
      relativePath: "handoff/writer-run-transport-envelopes.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(envelopes, null, 2)}\n`,
    },
    {
      artifactId: "writer-run-dispatch-records",
      fileName: "writer-run-dispatch-records.json",
      relativePath: "handoff/writer-run-dispatch-records.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(dispatchRecords, null, 2)}\n`,
    },
    {
      artifactId: "writer-run-audit-log",
      fileName: "writer-run-audit-log.json",
      relativePath: "handoff/writer-run-audit-log.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(auditLog, null, 2)}\n`,
    },
    {
      artifactId: "writer-run-history",
      fileName: "writer-run-history.json",
      relativePath: "handoff/writer-run-history.json",
      mediaType: "application/json",
      contentPreview: `${JSON.stringify(history, null, 2)}\n`,
    },
  ];

  return {
    stage: "writer-run-transport",
    transportVersion: "phase3g.v1",
    envelopes,
    dispatchRecords,
    transportResponses,
    transportReceipts,
    transportAdapter: {
      adapterId: "reference.noop-transport",
      adapterVersion: "phase3h.v1",
      endpoint: { rootPath: pkg.rootPath, outboundPath: "reference://noop", inboundPath: "reference://noop" },
    },
    dispatchResults,
    importedReceipts: [],
    receiptIngestion: [],
    auditLog,
    history,
    files,
  };
}

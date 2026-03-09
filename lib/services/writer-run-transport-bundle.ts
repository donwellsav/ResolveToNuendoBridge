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
  const auditLog = buildWriterRunAuditLog({ envelopes, dispatchRecords, transportResponses, transportReceipts });
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
    auditLog,
    history,
    files,
  };
}

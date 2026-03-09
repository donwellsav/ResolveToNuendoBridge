import type {
  DispatchReceiptCorrelationResult,
  ReceiptSignatureMatchResult,
  WriterRunDispatchRecord,
  WriterRunReceiptEnvelope,
  WriterRunReceiptIngestionResult,
  WriterRunTransportEnvelope,
} from "../types";
import { normalizeReceiptPayload } from "./receipt-normalization";

function mapOutcome(outcome: WriterRunReceiptEnvelope["outcome"]): "completed" | "failed" | "partial" {
  if (outcome === "completed") return "completed";
  if (outcome === "failed") return "failed";
  return "partial";
}

function computeCorrelation(receipt: WriterRunReceiptEnvelope, envelope?: WriterRunTransportEnvelope, dispatch?: WriterRunDispatchRecord): DispatchReceiptCorrelationResult {
  return {
    correlation: envelope && receipt.correlationId === envelope.correlationId ? "matched" : "unmatched",
    dispatch: dispatch && receipt.transportId === dispatch.transportId ? "matched" : "unmatched",
    package: envelope && receipt.packageId === envelope.packageId ? "matched" : "unmatched",
  };
}

function computeSignatureMatch(receipt: WriterRunReceiptEnvelope, envelope: WriterRunTransportEnvelope): ReceiptSignatureMatchResult {
  return {
    packageSignature: receipt.packageSignature === envelope.packageSignature ? "match" : "mismatch",
    sourceSignature: receipt.sourceSignature === envelope.sourceSignature.signature ? "match" : "mismatch",
    reviewSignature: receipt.reviewSignature === envelope.reviewSignature.revision ? "match" : "mismatch",
    artifactIdentity: receipt.requestId === envelope.request.requestId ? "match" : "mismatch",
    adapterPath: receipt.adapterId === "node.filesystem" || receipt.adapterId === "reference.noop-transport" ? "match" : "mismatch",
    runnerPath: envelope.runnerPath.runnerReadiness === "ready" ? "match" : "mismatch",
  };
}

export function ingestWriterRunReceiptsCompatibility(params: {
  receipts: unknown[];
  envelopes: WriterRunTransportEnvelope[];
  dispatchRecords: WriterRunDispatchRecord[];
}): WriterRunReceiptIngestionResult[] {
  const { receipts, envelopes, dispatchRecords } = params;
  const seenReceiptIds = new Set<string>();
  const seenFingerprints = new Set<string>();
  const importedByTransport = new Set<string>();

  return receipts.map((rawPayload) => {
    const normalized = normalizeReceiptPayload(rawPayload);

    if (!normalized.normalizedReceipt) {
      return {
        receiptId: "unknown",
        source: "filesystem-inbound",
        matchStatus: "unmatched",
        validationStatus: normalized.status === "incompatible" ? "incompatible" : "invalid",
        status: normalized.status === "incompatible" ? "receipt-incompatible" : "receipt-invalid",
        normalizationStatus: normalized.status,
        compatibilityVersion: normalized.compatibilityVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        warnings: normalized.warnings,
        problems: normalized.problems,
        message: "Receipt payload could not be normalized.",
      };
    }

    const receipt = normalized.normalizedReceipt;
    const envelope = envelopes.find((item) => item.transportId === receipt.transportId);
    const dispatch = dispatchRecords.find((item) => item.transportId === receipt.transportId);
    const correlationResult = computeCorrelation(receipt, envelope, dispatch);

    if (seenReceiptIds.has(receipt.receiptId)) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "duplicate",
        validationStatus: "valid",
        status: "receipt-duplicate",
        matchedTransportId: receipt.transportId,
        matchedCorrelationId: receipt.correlationId,
        normalizationStatus: "duplicate",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: normalized.problems,
        message: "Duplicate receipt id already ingested.",
      };
    }
    seenReceiptIds.add(receipt.receiptId);

    if (seenFingerprints.has(normalized.fingerprint.value)) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "duplicate",
        validationStatus: "valid",
        status: "receipt-duplicate",
        matchedTransportId: receipt.transportId,
        matchedCorrelationId: receipt.correlationId,
        normalizationStatus: "duplicate",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: normalized.problems,
        message: "Duplicate receipt payload fingerprint already ingested.",
      };
    }
    seenFingerprints.add(normalized.fingerprint.value);

    if (!envelope || !dispatch || correlationResult.correlation === "unmatched") {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "unmatched",
        validationStatus: "valid",
        status: "receipt-unmatched",
        normalizationStatus: "unmatched",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: normalized.problems,
        message: "Receipt did not match a known dispatch/correlation context.",
      };
    }

    if (!envelope.receiptCompatibilityProfile.supportedVersions.includes(receipt.receiptVersion)) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "matched",
        validationStatus: "incompatible",
        status: "receipt-incompatible",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        normalizationStatus: "incompatible",
        compatibilityProfileId: envelope.receiptCompatibilityProfile.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: [{ code: "unsupported-version", reason: "Receipt version is unsupported for declared profile." }],
        message: "Receipt version is incompatible with dispatch profile.",
      };
    }

    const signatureMatch = computeSignatureMatch(receipt, envelope);
    const matches = Object.values(signatureMatch).filter((state) => state === "match").length;

    if (importedByTransport.has(envelope.transportId)) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "stale",
        validationStatus: "valid",
        status: "receipt-stale",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        normalizationStatus: "stale",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        signatureMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: normalized.problems,
        message: "Receipt superseded by earlier imported receipt for transport id.",
      };
    }

    if (dispatch.staleState === "superseded") {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "superseded",
        validationStatus: "valid",
        status: "receipt-superseded",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        normalizationStatus: "superseded",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        signatureMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: normalized.problems,
        message: "Receipt maps to a superseded dispatch record.",
      };
    }

    if (matches < 6 && matches >= 3) {
      importedByTransport.add(envelope.transportId);
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "partial",
        validationStatus: "partially-compatible",
        status: "receipt-partial",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        nextDispatchStatus: "partial",
        normalizationStatus: "partially-compatible",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        signatureMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: [{ code: "signature-drift", reason: "Receipt correlated but has signature drift." }],
        message: "Receipt partially matched correlation context with signature drift.",
      };
    }

    if (matches < 3) {
      return {
        receiptId: receipt.receiptId,
        source: "filesystem-inbound",
        matchStatus: "matched",
        validationStatus: "invalid",
        status: "receipt-invalid",
        matchedTransportId: envelope.transportId,
        matchedCorrelationId: envelope.correlationId,
        normalizationStatus: "invalid",
        compatibilityProfileId: receipt.profileId,
        compatibilityVersion: receipt.receiptVersion,
        payloadFingerprint: normalized.fingerprint,
        schemaMatch: normalized.schemaMatch,
        signatureMatch,
        correlationResult,
        warnings: normalized.warnings,
        problems: [{ code: "signature-mismatch", reason: "Receipt signature mismatch." }],
        message: "Receipt signature mismatch.",
      };
    }

    importedByTransport.add(envelope.transportId);
    return {
      receiptId: receipt.receiptId,
      source: "filesystem-inbound",
      matchStatus: "matched",
      validationStatus: "valid",
      status: "receipt-imported",
      matchedTransportId: envelope.transportId,
      matchedCorrelationId: envelope.correlationId,
      nextDispatchStatus: mapOutcome(receipt.outcome),
      normalizationStatus: normalized.status === "migrated" ? "migrated" : "matched",
      compatibilityProfileId: receipt.profileId,
      compatibilityVersion: receipt.receiptVersion,
      payloadFingerprint: normalized.fingerprint,
      schemaMatch: normalized.schemaMatch,
      signatureMatch,
      correlationResult,
      warnings: normalized.warnings,
      problems: normalized.problems,
      message: receipt.details,
    };
  });
}

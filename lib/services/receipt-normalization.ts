import type {
  ReceiptCompatibilityProfileId,
  ReceiptNormalizationResult,
  ReceiptPayloadFingerprint,
  WriterRunReceiptEnvelope,
} from "../types";
import { matchReceiptSchema } from "./receipt-schema-registry";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
}

function fingerprintPayload(payload: unknown): ReceiptPayloadFingerprint {
  const text = stableStringify(payload);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return { algorithm: "fnv1a32", value: (hash >>> 0).toString(16).padStart(8, "0") };
}

function normalizeCanonicalReceipt(payload: Record<string, unknown>): WriterRunReceiptEnvelope {
  return {
    receiptId: String(payload.receiptId),
    receiptVersion: (payload.receiptVersion as "phase3h.v1" | "phase3i.v1") ?? "phase3i.v1",
    profileId: (payload.profileId as ReceiptCompatibilityProfileId | undefined) ?? "canonical-filesystem-transport-v1",
    adapterId: payload.adapterId as WriterRunReceiptEnvelope["adapterId"],
    transportId: String(payload.transportId),
    correlationId: String(payload.correlationId),
    requestId: String(payload.requestId),
    packageId: String(payload.packageId),
    packageSignature: String(payload.packageSignature),
    sourceSignature: String(payload.sourceSignature),
    reviewSignature: String(payload.reviewSignature),
    outcome: payload.outcome as WriterRunReceiptEnvelope["outcome"],
    details: String(payload.details ?? ""),
    importedFrom: "canonical",
  };
}

function normalizeCompatibilityReceipt(payload: Record<string, unknown>): WriterRunReceiptEnvelope {
  const receipt = payload.receipt as Record<string, unknown>;
  const context = payload.context as Record<string, unknown>;
  return {
    receiptId: String(receipt.id),
    receiptVersion: "phase3i.v1",
    profileId: "compatibility-filesystem-receipt-v1",
    adapterId: String(context.adapterId) as WriterRunReceiptEnvelope["adapterId"],
    transportId: String(context.transportId),
    correlationId: String(context.correlationId),
    requestId: String(context.requestId),
    packageId: String(context.packageId),
    packageSignature: String(context.packageSignature),
    sourceSignature: String(context.sourceSignature),
    reviewSignature: String(context.reviewSignature),
    outcome: receipt.outcome as WriterRunReceiptEnvelope["outcome"],
    details: String(receipt.details ?? ""),
    importedFrom: "compatibility",
  };
}

export function normalizeReceiptPayload(payload: unknown, expectedProfileId?: ReceiptCompatibilityProfileId): ReceiptNormalizationResult {
  const fingerprint = fingerprintPayload(payload);

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      status: "invalid",
      payloadSource: "canonical",
      schemaMatch: { matched: false, unsupportedReasons: ["payload-not-object"] },
      fingerprint,
      warnings: [],
      problems: [{ code: "payload-not-object", reason: "Receipt payload must be an object." }],
    };
  }

  const record = payload as Record<string, unknown>;
  const payloadSource = "receipt" in record && "context" in record ? "compatibility" : "canonical";
  const schemaMatch = matchReceiptSchema({
    payload: record,
    payloadSource,
    requestedProfileId: expectedProfileId,
    requestedVersion: String(record.receiptVersion ?? record.version ?? "phase3i.v1"),
  });

  if (!schemaMatch.matched || !schemaMatch.profileId) {
    return {
      status: "incompatible",
      payloadSource,
      schemaMatch,
      fingerprint,
      warnings: [],
      problems: schemaMatch.unsupportedReasons.map((reason) => ({ code: reason, reason })),
    };
  }

  const normalizedReceipt = payloadSource === "compatibility" ? normalizeCompatibilityReceipt(record) : normalizeCanonicalReceipt(record);
  normalizedReceipt.payloadFingerprint = fingerprint;

  const warnings = [] as ReceiptNormalizationResult["warnings"];
  if (payloadSource === "compatibility" && !(record.meta && typeof record.meta === "object")) {
    warnings.push({ code: "optional-meta-missing", reason: "Compatibility receipt is missing optional meta block." });
  }

  const migrated = payloadSource === "canonical" && normalizedReceipt.receiptVersion === "phase3h.v1";
  if (migrated) normalizedReceipt.receiptVersion = "phase3i.v1";

  return {
    status: migrated ? "migrated" : "normalized",
    payloadSource,
    schemaMatch,
    fingerprint,
    warnings,
    problems: [],
    normalizedReceipt,
    compatibilityVersion: normalizedReceipt.receiptVersion,
  };
}

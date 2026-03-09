import path from "node:path";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";

import type {
  WriterRunDispatchResult,
  WriterRunTransportAdapter,
  WriterRunTransportEndpoint,
  WriterRunTransportEnvelope,
} from "../types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
}

function writeJson(targetPath: string, value: unknown) {
  mkdirSync(path.dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function dispatchIdForEnvelope(envelope: WriterRunTransportEnvelope): string {
  return `dispatch-${envelope.transportId}`;
}

export function createReferenceNoopTransportAdapter(endpoint: WriterRunTransportEndpoint): WriterRunTransportAdapter {
  return {
    id: "reference.noop-transport",
    version: "phase3h.v1",
    capabilities: ["dispatch-envelope", "receipt-ingestion"],
    endpoint,
    dispatch(envelopes) {
      return envelopes.map((envelope, index) => ({
        dispatchId: dispatchIdForEnvelope(envelope),
        adapterId: "reference.noop-transport",
        adapterVersion: "phase3h.v1",
        transportId: envelope.transportId,
        requestId: envelope.request.requestId,
        correlationId: envelope.correlationId,
        packageId: envelope.packageId,
        packageSignature: envelope.packageSignature,
        status: "dispatched",
        dispatchedAtIso: `1970-01-01T00:00:${(index + 1).toString().padStart(2, "0")}.000Z`,
        outboundPath: "reference://noop",
      }));
    },
    readReceipts() {
      return [];
    },
  };
}

export function createNodeFilesystemTransportAdapter(endpoint: WriterRunTransportEndpoint): WriterRunTransportAdapter {
  return {
    id: "node.filesystem",
    version: "phase3h.v1",
    capabilities: ["dispatch-envelope", "receipt-ingestion"],
    endpoint,
    dispatch(envelopes) {
      return envelopes.map((envelope, index) => {
        const dispatchId = dispatchIdForEnvelope(envelope);
        const dispatchRoot = path.join(endpoint.outboundPath, dispatchId);
        const envelopePath = path.join(dispatchRoot, "envelope.json");
        const summaryPath = path.join(dispatchRoot, "dispatch-summary.json");
        const readyPath = path.join(dispatchRoot, "READY.marker");

        writeJson(envelopePath, envelope);
        writeJson(summaryPath, {
          dispatchId,
          adapterId: "node.filesystem",
          adapterVersion: "phase3h.v1",
          packageId: envelope.packageId,
          packageSignature: envelope.packageSignature,
          requestId: envelope.request.requestId,
          correlationId: envelope.correlationId,
          sourceSignature: envelope.sourceSignature.signature,
          reviewSignature: envelope.reviewSignature.revision,
          dispatchStatus: "dispatched",
          transportProfileId: envelope.request.packageReadiness === "blocked" ? "canonical-filesystem-transport-v1" : "filesystem-strict-export-v1",
          executorCompatibilityProfileId: envelope.executorCompatibilityProfileId,
        });
        writeFileSync(readyPath, `${stableStringify({ dispatchId, correlationId: envelope.correlationId })}\n`, "utf8");
        writeJson(path.join(dispatchRoot, "receipt-compatibility.json"), {
          profileId: envelope.receiptCompatibilityProfile.profileId,
          supportedVersions: envelope.receiptCompatibilityProfile.supportedVersions,
          expectedReceiptFiles: envelope.receiptCompatibilityProfile.expectedReceiptFiles,
          requiredFields: envelope.receiptCompatibilityProfile.requiredFields,
          optionalFields: envelope.receiptCompatibilityProfile.optionalFields,
          normalizationRules: envelope.receiptCompatibilityProfile.normalizationRules,
        });

        return {
          dispatchId,
          adapterId: "node.filesystem",
          adapterVersion: "phase3h.v1",
          transportId: envelope.transportId,
          requestId: envelope.request.requestId,
          correlationId: envelope.correlationId,
          packageId: envelope.packageId,
          packageSignature: envelope.packageSignature,
          status: "dispatched",
          dispatchedAtIso: `1970-01-01T00:00:${(index + 1).toString().padStart(2, "0")}.000Z`,
          outboundPath: path.relative(process.cwd(), dispatchRoot),
        } satisfies WriterRunDispatchResult;
      });
    },
    readReceipts() {
      mkdirSync(endpoint.inboundPath, { recursive: true });
      const files = readdirSync(endpoint.inboundPath)
        .filter((fileName) => fileName.endsWith(".json"))
        .sort((a, b) => a.localeCompare(b));

      return files.map((fileName) => {
        const payload = readFileSync(path.join(endpoint.inboundPath, fileName), "utf8");
        return JSON.parse(payload) as unknown;
      });
    },
  };
}

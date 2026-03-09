import type {
  ReceiptCompatibilityProfile,
  ReceiptCompatibilityProfileId,
  ReceiptSchemaDescriptor,
  ReceiptSchemaMatchResult,
  ReceiptPayloadSource,
  ReceiptCompatibilityVersion,
} from "../types";

const PROFILES: ReceiptCompatibilityProfile[] = [
  {
    profileId: "canonical-filesystem-transport-v1",
    expectedEnvelopeFiles: ["envelope.json", "dispatch-summary.json", "READY.marker"],
    expectedReceiptFiles: ["receipt.json"],
    requiredFields: [
      "receiptId",
      "receiptVersion",
      "adapterId",
      "transportId",
      "correlationId",
      "requestId",
      "packageId",
      "packageSignature",
      "sourceSignature",
      "reviewSignature",
      "outcome",
      "details",
    ],
    optionalFields: ["profileId", "payloadFingerprint", "importedFrom"],
    supportedVersions: ["phase3h.v1", "phase3i.v1"],
    normalizationRules: [
      "canonical payload keeps identity fields unchanged",
      "phase3h.v1 payloads migrate to phase3i.v1 compatibility version",
    ],
    unsupportedReasons: ["missing-required-field", "unsupported-version"],
  },
  {
    profileId: "compatibility-filesystem-receipt-v1",
    expectedEnvelopeFiles: ["envelope.json", "dispatch-summary.json", "READY.marker"],
    expectedReceiptFiles: ["receipt.compat.json"],
    requiredFields: ["receipt", "context"],
    optionalFields: ["meta"],
    supportedVersions: ["phase3i.v1"],
    normalizationRules: [
      "compatibility wrapper maps receipt/context into canonical receipt envelope",
      "missing optional fields are accepted with warnings",
    ],
    unsupportedReasons: ["schema-not-recognized", "missing-context"],
  },
  {
    profileId: "future-service-transport-placeholder",
    expectedEnvelopeFiles: ["service-dispatch.json"],
    expectedReceiptFiles: ["service-receipt.json"],
    requiredFields: ["receiptId", "correlationId", "signatureBundle"],
    optionalFields: ["links", "adapterPath", "runnerPath"],
    supportedVersions: ["phase3i.v1"],
    normalizationRules: ["placeholder profile for future transport adapters"],
    unsupportedReasons: ["profile-not-enabled"],
  },
];

const SCHEMAS: ReceiptSchemaDescriptor[] = [
  {
    schemaId: "canonical-receipt-envelope.v1",
    profileId: "canonical-filesystem-transport-v1",
    payloadSource: "canonical",
    supportedVersions: ["phase3h.v1", "phase3i.v1"],
    requiredFields: PROFILES[0]!.requiredFields,
    optionalFields: PROFILES[0]!.optionalFields,
  },
  {
    schemaId: "compatibility-filesystem-wrapper.v1",
    profileId: "compatibility-filesystem-receipt-v1",
    payloadSource: "compatibility",
    supportedVersions: ["phase3i.v1"],
    requiredFields: PROFILES[1]!.requiredFields,
    optionalFields: PROFILES[1]!.optionalFields,
  },
];

export function listReceiptCompatibilityProfiles(): ReceiptCompatibilityProfile[] {
  return PROFILES.map((profile) => ({ ...profile }));
}

export function resolveReceiptCompatibilityProfile(profileId: ReceiptCompatibilityProfileId): ReceiptCompatibilityProfile {
  const profile = PROFILES.find((item) => item.profileId === profileId);
  if (!profile) throw new Error(`Unknown receipt compatibility profile: ${profileId}`);
  return { ...profile };
}

export function listReceiptSchemas(): ReceiptSchemaDescriptor[] {
  return SCHEMAS.map((schema) => ({ ...schema }));
}

function includesAllFields(payload: Record<string, unknown>, fields: string[]): boolean {
  return fields.every((field) => field in payload);
}

export function matchReceiptSchema(params: {
  payload: Record<string, unknown>;
  payloadSource: ReceiptPayloadSource;
  requestedProfileId?: ReceiptCompatibilityProfileId;
  requestedVersion?: string;
}): ReceiptSchemaMatchResult {
  const { payload, payloadSource, requestedProfileId, requestedVersion } = params;
  const candidates = SCHEMAS.filter((schema) => schema.payloadSource === payloadSource);

  for (const descriptor of candidates) {
    if (requestedProfileId && descriptor.profileId !== requestedProfileId) continue;
    if (!includesAllFields(payload, descriptor.requiredFields)) continue;

    const version = (payload.receiptVersion ?? payload.version ?? requestedVersion ?? "phase3i.v1") as ReceiptCompatibilityVersion;
    if (!descriptor.supportedVersions.includes(version)) {
      return {
        matched: false,
        unsupportedReasons: ["unsupported-version"],
      };
    }

    return {
      matched: true,
      profileId: descriptor.profileId,
      descriptorId: descriptor.schemaId,
      matchedVersion: version,
      unsupportedReasons: [],
    };
  }

  return {
    matched: false,
    unsupportedReasons: ["schema-not-recognized"],
  };
}

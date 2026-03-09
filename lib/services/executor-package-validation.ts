import type {
  ExecutorCompatibilityIssue,
  ExecutorCompatibilityProfile,
  ExecutorPackageCompatibilityResult,
  ExecutorPackageReadiness,
  ExecutorSupportedTransportProfile,
  ExternalExecutionPackage,
  ReceiptCompatibilityProfileId,
  WriterRunTransportEnvelope,
} from "../types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([key, val]) => `${JSON.stringify(key)}:${stableStringify(val)}`).join(",")}}`;
}

function hashSignature(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function issue(severity: ExecutorCompatibilityIssue["severity"], code: ExecutorCompatibilityIssue["code"], message: string, extra?: Partial<ExecutorCompatibilityIssue>): ExecutorCompatibilityIssue {
  return {
    issueId: `compat-${hashSignature(`${severity}:${code}:${message}`).replace("fnv1a32:", "")}`,
    severity,
    code,
    message,
    ...extra,
  };
}

function determineReadiness(issues: ExecutorCompatibilityIssue[]): ExecutorPackageReadiness {
  const blocking = issues.some((item) => item.severity === "blocking");
  if (blocking) return "blocked";
  const errors = issues.some((item) => item.severity === "error");
  if (errors) return "incompatible";
  const warnings = issues.some((item) => item.severity === "warning");
  if (warnings) return "ready-with-warnings";
  return "ready";
}

function determineStatus(readiness: ExecutorPackageReadiness): ExecutorPackageCompatibilityResult["status"] {
  if (readiness === "blocked") return "blocked";
  if (readiness === "incompatible") return "incompatible";
  if (readiness === "unsupported") return "unsupported";
  if (readiness === "partial") return "partial";
  if (readiness === "ready-with-warnings") return "compatible-with-warnings";
  return "compatible";
}

type CompatibilityPackageView = Pick<ExternalExecutionPackage, "packageVersion" | "manifest" | "index" | "summary" | "files">;

export function validateExecutorPackageCompatibility(params: {
  pkg: CompatibilityPackageView;
  profile: ExecutorCompatibilityProfile;
  transportProfileId: ExecutorSupportedTransportProfile;
  receiptProfileId: ReceiptCompatibilityProfileId;
  handoffManifestVersion: "phase3c.v1";
  envelopes?: WriterRunTransportEnvelope[];
}): ExecutorPackageCompatibilityResult {
  const { pkg, profile, transportProfileId, receiptProfileId, handoffManifestVersion, envelopes = [] } = params;
  const issues: ExecutorCompatibilityIssue[] = [];

  if (!profile.capabilityMatrix.packageVersions.includes(pkg.packageVersion)) {
    issues.push(issue("blocking", "unsupported-package-version", "External execution package version is unsupported.", { expected: profile.capabilityMatrix.packageVersions.join(","), actual: pkg.packageVersion }));
  }
  if (!profile.capabilityMatrix.handoffVersions.includes(handoffManifestVersion)) {
    issues.push(issue("blocking", "unsupported-handoff-version", "Handoff manifest version is unsupported.", { expected: profile.capabilityMatrix.handoffVersions.join(","), actual: handoffManifestVersion }));
  }
  if (!profile.capabilityMatrix.transportProfiles.includes(transportProfileId)) {
    issues.push(issue("blocking", "unsupported-transport-profile", "Transport profile is unsupported by selected executor.", { expected: profile.capabilityMatrix.transportProfiles.join(","), actual: transportProfileId }));
  }
  if (!profile.capabilityMatrix.receiptProfiles.includes(receiptProfileId)) {
    issues.push(issue("blocking", "unsupported-receipt-profile", "Receipt profile is unsupported by selected executor.", { expected: profile.capabilityMatrix.receiptProfiles.join(","), actual: receiptProfileId }));
  }

  const entryPaths = new Set(pkg.index.entries.map((entry) => entry.relativePath));
  for (const required of profile.requiredMembers) {
    if (!entryPaths.has(required) && !pkg.files.some((file) => file.relativePath === required)) {
      issues.push(issue("blocking", "missing-required-member", `Required package member is missing: ${required}.`));
    }
  }

  for (const entry of pkg.index.entries) {
    if (!profile.capabilityMatrix.artifactKinds.includes(entry.artifactKind as (typeof profile.capabilityMatrix.artifactKinds)[number])) {
      issues.push(issue("warning", "unsupported-artifact-kind", `Executor profile does not declare artifact kind ${entry.artifactKind}.`, { artifactId: entry.artifactId }));
    }
    if (entry.classification === "generated" && entry.status !== "generated") {
      issues.push(issue("error", "missing-required-payload", `Generated payload ${entry.relativePath} is not marked generated.`, { artifactId: entry.artifactId }));
    }
  }

  const expectedSignature = hashSignature(
    stableStringify({
      packageId: pkg.summary.packageId,
      packageVersion: pkg.packageVersion,
      packageSignature: pkg.summary.packageSignature,
      sourceSignature: pkg.manifest.sourceSignature.signature,
      reviewSignature: pkg.manifest.reviewSignature.revision,
      transportProfileId,
      receiptProfileId,
    })
  );

  if (!expectedSignature.startsWith("fnv1a32:")) {
    issues.push(issue("error", "signature-mismatch", "Compatibility signature hashing failed."));
  }

  const envelopeMismatches = envelopes.filter((envelope) => envelope.receiptCompatibilityProfile.profileId !== receiptProfileId);
  if (envelopeMismatches.length > 0) {
    issues.push(issue("warning", "version-mismatch", `Envelope receipt profile drift detected (${envelopeMismatches.length}).`));
  }

  if (pkg.summary.sourceSignature !== pkg.manifest.sourceSignature.signature || pkg.summary.reviewSignature !== pkg.manifest.reviewSignature.revision) {
    issues.push(issue("error", "signature-mismatch", "Package summary signatures drifted from manifest signatures."));
  }

  if (pkg.summary.status === "blocked") {
    issues.push(issue("blocking", "profile-constraint", "Package was already blocked before executor dispatch."));
  } else if (pkg.summary.status === "partial") {
    issues.push(issue("warning", "warning", "Package is partial and may require operator follow-up before dispatch."));
  }

  const readiness = determineReadiness(issues);
  const status = determineStatus(readiness);

  const warnings = issues.filter((item) => item.severity === "warning").map((item) => item.message);
  const blockers = issues.filter((item) => item.severity === "blocking" || item.severity === "error").map((item) => item.message);

  return {
    compatibilityId: `compatibility-${hashSignature(stableStringify({ packageId: pkg.summary.packageId, profileId: profile.profileId, status })).replace("fnv1a32:", "")}`,
    packageId: pkg.summary.packageId,
    packageVersion: pkg.packageVersion,
    packageSignature: pkg.summary.packageSignature,
    handoffManifestVersion,
    transportProfileId,
    receiptProfileId,
    status,
    readiness,
    issues,
    summary: {
      selectedProfileId: profile.profileId,
      compatibilityVersion: profile.profileVersion,
      status,
      readiness,
      matchedCapabilities: [
        `package:${pkg.packageVersion}`,
        `handoff:${handoffManifestVersion}`,
        `transport:${transportProfileId}`,
        `receipt:${receiptProfileId}`,
      ],
      warnings,
      blockers,
      requiredFollowUps: [...warnings, ...blockers].sort((a, b) => a.localeCompare(b)),
    },
    signatures: {
      sourceSignature: pkg.manifest.sourceSignature.signature,
      reviewSignature: pkg.manifest.reviewSignature.revision,
      packageSignature: pkg.summary.packageSignature,
    },
  };
}

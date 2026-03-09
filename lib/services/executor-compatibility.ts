import type {
  DeferredWriterInputVersion,
  ExecutorCompatibilityArtifacts,
  ExecutorCompatibilityProfileId,
  ExecutorSupportedTransportProfile,
  ExternalExecutionPackage,
  ReceiptCompatibilityProfileId,
  WriterRunTransportEnvelope,
} from "../types";
import { resolveExecutorCompatibilityProfile } from "./executor-profile-registry";
import { validateExecutorPackageCompatibility } from "./executor-package-validation";

type CompatibilityPackageView = Pick<ExternalExecutionPackage, "packageVersion" | "transportProfileId" | "receiptProfileId" | "manifest" | "index" | "summary" | "files">;

export function buildExecutorCompatibilityArtifacts(params: {
  pkg: CompatibilityPackageView;
  profileId?: ExecutorCompatibilityProfileId;
  transportProfileId?: ExecutorSupportedTransportProfile;
  receiptProfileId?: ReceiptCompatibilityProfileId;
  handoffManifestVersion?: DeferredWriterInputVersion;
  envelopes?: WriterRunTransportEnvelope[];
}): ExecutorCompatibilityArtifacts {
  const {
    pkg,
    profileId = "canonical-filesystem-executor-v1",
    transportProfileId = pkg.transportProfileId,
    receiptProfileId = pkg.receiptProfileId,
    handoffManifestVersion = "phase3c.v1",
    envelopes,
  } = params;

  const profile = resolveExecutorCompatibilityProfile(profileId);
  const report = validateExecutorPackageCompatibility({
    pkg,
    profile,
    transportProfileId,
    receiptProfileId,
    handoffManifestVersion,
    envelopes,
  });

  return {
    profileResolution: {
      profileId: profile.profileId,
      profileVersion: profile.profileVersion,
      packageId: pkg.summary.packageId,
      packageSignature: pkg.summary.packageSignature,
      packageVersion: pkg.packageVersion,
      handoffManifestVersion,
      transportProfileId,
      receiptProfileId,
    },
    report,
    summary: report.summary,
  };
}

export type JobStatus = "draft" | "queued" | "processing" | "needs_review" | "completed" | "failed";

export type AssetStage = "intake" | "delivery";

export type AssetOrigin = "resolve" | "editorial" | "production-audio" | "conform-bridge" | "nuendo";

export type FileKind =
  | "aaf"
  | "fcpxml"
  | "xml"
  | "edl"
  | "csv"
  | "wav"
  | "bwf"
  | "mov"
  | "mp4"
  | "json"
  | "txt"
  | "otio"
  | "otioz";

export type FileRole =
  | "timeline_exchange"
  | "marker_export"
  | "metadata_export"
  | "reference_video"
  | "production_audio"
  | "delivery_manifest"
  | "delivery_readme"
  | "field_recorder_report";

export type IntakeAsset = {
  id: string;
  stage: "intake";
  origin: AssetOrigin;
  fileKind: FileKind;
  fileRole: FileRole;
  fileName: string;
  pathHint: string;
  channelCount?: number;
  channelLayout?: string;
  durationTimecode?: string;
  durationFrames?: number;
  sampleRate?: number;
  isPolyWav?: boolean;
  hasBwf?: boolean;
  hasIXml?: boolean;
  status?: "ready" | "missing" | "offline" | "needs_review";
  note?: string;
};

export type DeliveryArtifact = {
  id: string;
  stage: "delivery";
  origin: AssetOrigin;
  fileKind: FileKind;
  fileRole: FileRole;
  fileName: string;
  pathHint: string;
  status: "planned" | "blocked" | "placeholder";
  note?: string;
};

export type Marker = {
  id: string;
  timelineTc: string;
  timelineFrame: number;
  label: string;
  color: "blue" | "green" | "yellow" | "red";
};

export type ClipEvent = {
  id: string;
  recordIn: string;
  recordOut: string;
  sourceIn: string;
  sourceOut: string;
  recordInFrames: number;
  recordOutFrames: number;
  sourceInFrames: number;
  sourceOutFrames: number;
  clipName: string;
  sourceFileName: string;
  reel: string;
  tape?: string;
  scene?: string;
  take?: string;
  eventDescription?: string;
  clipNotes?: string;
  sourceAssetId: string;
  channelCount: number;
  channelLayout: string;
  isPolyWav: boolean;
  hasBwf: boolean;
  hasIXml: boolean;
  isOffline: boolean;
  isNested: boolean;
  isFlattened: boolean;
  hasSpeedEffect: boolean;
  hasFadeIn: boolean;
  hasFadeOut: boolean;
};

export type NormalizedTrack = {
  id: string;
  name: string;
  role: "DX" | "MX" | "FX" | "BG" | "VO";
  clips: ClipEvent[];
};

export type NormalizedTimeline = {
  id: string;
  name: string;
  startTimecode: string;
  durationTimecode: string;
  startFrame: number;
  durationFrames: number;
  fps: 23.976 | 24 | 25 | 29.97;
  sampleRate: 48000 | 96000;
  dropFrame: boolean;
  tracks: NormalizedTrack[];
  markers: Marker[];
};

export type SourceBundle = {
  id: string;
  stage: "intake";
  origin: "resolve" | "editorial";
  bundleName: string;
  resolveProject: string;
  resolveTimelineVersion: string;
  importedAtIso: string;
  intakeAssets: IntakeAsset[];
};

export type MappingRule = {
  id: string;
  sourceTrackRole: NormalizedTrack["role"];
  targetNuendoTrack: string;
  condition: string;
};

export type TrackMappingDecision = {
  trackId: string;
  sourceRole: NormalizedTrack["role"];
  sourceName: string;
  targetNuendoTrack: string;
  state: "mapped" | "needs_review";
};

export type MarkerMappingDecision = {
  markerId: string;
  sourceLabel: string;
  exportLabel: string;
  includeInEdl: boolean;
  includeInCsv: boolean;
  state: "mapped" | "needs_review";
};

export type MetadataMappingDecision = {
  clipId: string;
  sourceFileName: string;
  reel: string;
  tape: string;
  scene: string;
  take: string;
  state: "resolved" | "unresolved";
};

export type FieldRecorderDecision = {
  candidateId: string;
  clipEventId: string;
  candidateFile: string;
  strategy: FieldRecorderCandidate["strategy"];
  selected: boolean;
  state: "matched" | "needs_review";
};

export type MappingWorkspace = {
  trackMappings: TrackMappingDecision[];
  markerMappings: MarkerMappingDecision[];
  metadataMappings: MetadataMappingDecision[];
  fieldRecorderMappings: FieldRecorderDecision[];
};

export type PreservationIssue = {
  id: string;
  category: "preserved" | "downgraded" | "dropped" | "manual-review";
  severity: "info" | "warning" | "critical";
  scope: "timeline" | "track" | "clip" | "marker" | "metadata" | "delivery";
  title: string;
  description: string;
  sourceLocation: string;
  targetArtifactId?: string;
  targetArtifactName?: string;
  recommendedAction: string;
};

export type ReConformChange = {
  id: string;
  jobId: string;
  changeType: "insert" | "delete" | "move" | "trim" | "replace";
  oldTimecode?: string;
  newTimecode?: string;
  oldFrame?: number;
  newFrame?: number;
  note: string;
};

export type FieldRecorderCandidate = {
  id: string;
  clipEventId: string;
  candidateFile: string;
  matchScore: number;
  strategy: "scene_take" | "soundroll_tc" | "filename_tc";
  matched: boolean;
};

export type OutputPreset = {
  id: string;
  name: string;
  sampleRate: 48000 | 96000;
  bitDepth: 24 | 32;
  pullMode: "none" | "pull_up" | "pull_down";
  includeReferenceVideo: boolean;
};

export type AnalysisReport = {
  tracksTotal: number;
  clipsTotal: number;
  markersTotal: number;
  offlineAssetsTotal: number;
  highRiskCount: number;
  warningCount: number;
  blockedCount: number;
  intakeCompletenessSummary: string;
  deliveryReadinessSummary: string;
};

export type TranslationModel = {
  id: string;
  stage: "canonical";
  sourceBundleId: string;
  timeline: NormalizedTimeline;
};

export type DeliveryPackage = {
  id: string;
  stage: "delivery";
  target: "nuendo";
  packageName: string;
  outputPresetId: string;
  artifacts: DeliveryArtifact[];
};

export type GeneratedManifestPayload = {
  artifactId: string;
  artifactKind: "manifest";
  fileName: string;
  pathHint: string;
  mediaType: "application/json";
  content: string;
};

export type GeneratedReadmePayload = {
  artifactId: string;
  artifactKind: "readme";
  fileName: string;
  pathHint: string;
  mediaType: "text/plain";
  content: string;
};

export type GeneratedMarkerCsvPayload = {
  artifactId: string;
  artifactKind: "marker_csv";
  fileName: string;
  pathHint: string;
  mediaType: "text/csv";
  content: string;
  rowCount: number;
};

export type GeneratedMarkerEdlPayload = {
  artifactId: string;
  artifactKind: "marker_edl";
  fileName: string;
  pathHint: string;
  mediaType: "text/plain";
  content: string;
  markerCount: number;
};

export type GeneratedMetadataCsvPayload = {
  artifactId: string;
  artifactKind: "metadata_csv";
  fileName: string;
  pathHint: string;
  mediaType: "text/csv";
  content: string;
  rowCount: number;
};

export type GeneratedFieldRecorderReportPayload = {
  artifactId: string;
  artifactKind: "field_recorder_report";
  fileName: string;
  pathHint: string;
  mediaType: "text/csv";
  content: string;
  rowCount: number;
};

export type GeneratedReferenceVideoInstructionPayload = {
  artifactId: string;
  artifactKind: "reference_video_instruction";
  fileName: string;
  pathHint: string;
  mediaType: "text/plain";
  content: string;
};

export type DeferredBinaryArtifactPayload = {
  artifactId: string;
  artifactKind: "deferred_binary";
  fileName: string;
  pathHint: string;
  deferredReason: string;
};

export type GeneratedArtifactPayload =
  | GeneratedManifestPayload
  | GeneratedReadmePayload
  | GeneratedMarkerCsvPayload
  | GeneratedMarkerEdlPayload
  | GeneratedMetadataCsvPayload
  | GeneratedFieldRecorderReportPayload
  | GeneratedReferenceVideoInstructionPayload;

export type DeliveryExecutionArtifact = {
  artifact: DeliveryArtifact;
  executionStatus: "planned" | "generated" | "deferred" | "unavailable";
  generatedPayload?: GeneratedArtifactPayload;
  deferredPayload?: DeferredBinaryArtifactPayload;
  note?: string;
};

export type DeliveryExecutionPlan = {
  packageId: string;
  generatedAtIso: string;
  artifacts: DeliveryExecutionArtifact[];
};

export type DeferredArtifactDescriptor = {
  artifactId: string;
  fileName: string;
  deferredPath: string;
  status: DeliveryArtifact["status"];
  deferredReason: string;
  writerBoundary: "nuendo_writer" | "reference_video_writer";
  sourceDependencies: string[];
};

export type StagedDeliveryFile = {
  artifactId: string;
  fileName: string;
  relativePath: string;
  category: "generated" | "deferred";
  mediaType: string;
  contentPreview: string;
};

export type StagedDeliveryDirectory = {
  relativePath: string;
};

export type DeliveryStagingSummary = {
  jobId: string;
  deliveryPackageId: string;
  sourceSignature: string;
  generatedArtifacts: number;
  deferredArtifacts: number;
  unavailableArtifacts: number;
  unresolvedBlockers: string[];
  reviewInfluence: {
    trackOverrides: number;
    markerOverrides: number;
    metadataOverrides: number;
    fieldRecorderOverrides: number;
    validationAcknowledgements: number;
    reconformDecisions: number;
  };
  artifactPaths: Array<{ artifactId: string; relativePath: string; category: "generated" | "deferred" }>;
};

export type DeliveryStagingBundle = {
  stage: "delivery-staging";
  rootLabel: string;
  rootPath: string;
  directories: StagedDeliveryDirectory[];
  files: StagedDeliveryFile[];
  deferredArtifacts: DeferredArtifactDescriptor[];
  summary: DeliveryStagingSummary;
};

export type DeferredWriterInputVersion = "phase3c.v1";

export type WriterDependencyStatus = "satisfied" | "missing" | "blocked";

export type WriterDependencyKind =
  | "canonical"
  | "staged-artifact"
  | "intake-asset"
  | "review-decision"
  | "preservation"
  | "execution-prerequisite"
  | "writer-capability";

export type WriterCapability = "nuendo_writer.aaf" | "video_writer.reference" | "nuendo_writer.session";

export type WriterReadinessStatus = "ready-for-writer" | "blocked" | "partial" | "deferred-with-known-gaps";

export type WriterDependency = {
  id: string;
  kind: WriterDependencyKind;
  reference: string;
  status: WriterDependencyStatus;
  reason?: string;
};

export type DeliverySourceSignature = {
  sourceBundleId: string;
  resolveTimelineVersion: string;
  importedAtIso: string;
  translationModelId: string;
  signature: string;
};

export type DeliveryReviewSignature = {
  revision: string;
  influence: {
    trackOverrides: number;
    markerOverrides: number;
    metadataOverrides: number;
    fieldRecorderOverrides: number;
    validationAcknowledgements: number;
    reconformDecisions: number;
  };
};

export type DeferredWriterArtifact = {
  artifactId: string;
  artifactKind: "nuendo_ready_aaf" | "reference_video_binary" | "nuendo_session";
  plannedOutputPath: string;
  stagedDescriptorPath: string;
  requiredWriterCapability: WriterCapability;
  dependencies: WriterDependency[];
  unresolvedBlockers: string[];
  readinessStatus: WriterReadinessStatus;
  explanation: string;
  machinePayload: Record<string, unknown>;
};

export type DeferredWriterInput = {
  inputId: string;
  inputVersion: DeferredWriterInputVersion;
  packageId: string;
  packageSignature: string;
  sourceSignature: DeliverySourceSignature;
  reviewSignature: DeliveryReviewSignature;
  artifact: DeferredWriterArtifact;
};

export type DeliveryHandoffArtifact = {
  artifactId: string;
  fileName: string;
  category: "generated" | "deferred";
  relativePath: string;
  executionStatus: DeliveryExecutionArtifact["executionStatus"];
};

export type DeliveryHandoffSummary = {
  packageId: string;
  packageName: string;
  packageVersion: DeferredWriterInputVersion;
  packageSignature: string;
  sourceSignature: DeliverySourceSignature;
  reviewSignature: DeliveryReviewSignature;
  generatedArtifacts: number;
  deferredArtifacts: number;
  readyForWriter: number;
  blocked: number;
  partial: number;
  deferredWithKnownGaps: number;
  unresolvedBlockers: string[];
  blockedArtifacts: string[];
  supportedCapabilities: WriterCapability[];
};

export type DeliveryHandoffManifest = {
  manifestVersion: DeferredWriterInputVersion;
  generatedAtIso: string;
  artifacts: DeliveryHandoffArtifact[];
  deferredWriterInputs: DeferredWriterInput[];
  summary: DeliveryHandoffSummary;
};

export type DeliveryHandoffBundle = {
  stage: "delivery-handoff";
  writerInputVersion: DeferredWriterInputVersion;
  writerInputs: DeferredWriterInput[];
  manifest: DeliveryHandoffManifest;
  summary: DeliveryHandoffSummary;
  files: Array<{
    artifactId: "handoff-writer-inputs" | "handoff-manifest" | "handoff-summary";
    fileName: string;
    relativePath: string;
    mediaType: "application/json";
    contentPreview: string;
  }>;
};


export type ExternalExecutionPackageVersion = "phase3d.v1";

export type ExternalExecutionStatus = "ready" | "partial" | "blocked";

export type ExternalExecutionChecksum = {
  algorithm: "fnv1a32";
  value: string;
};

export type ExternalExecutionDeferredInput = {
  inputId: string;
  artifactId: string;
  readinessStatus: WriterReadinessStatus;
  requiredWriterCapability: WriterCapability;
  unresolvedBlockers: string[];
};

export type ExternalExecutionEntry = {
  entryId: string;
  sourceStage: "staged" | "handoff" | "package";
  artifactId: string;
  artifactKind: string;
  classification: "generated" | "deferred-contract" | "package-metadata";
  relativePath: string;
  mediaType: string;
  sizeBytes: number;
  checksum: ExternalExecutionChecksum;
  status: "generated" | "contract-only" | "missing";
  reason?: string;
};

export type ExternalExecutionManifest = {
  manifestVersion: ExternalExecutionPackageVersion;
  packageId: string;
  packageSignature: string;
  generatedAtIso: string;
  sourceSignature: DeliverySourceSignature;
  reviewSignature: DeliveryReviewSignature;
  status: ExternalExecutionStatus;
  reasons: string[];
};

export type ExternalExecutionIndex = {
  indexVersion: ExternalExecutionPackageVersion;
  packageId: string;
  entries: ExternalExecutionEntry[];
  generatedCount: number;
  deferredContractCount: number;
  packageMetadataCount: number;
};

export type ExternalExecutionPackageSummary = {
  packageId: string;
  packageVersion: ExternalExecutionPackageVersion;
  packageSignature: string;
  status: ExternalExecutionStatus;
  reasons: string[];
  sourceSignature: string;
  reviewSignature: string;
  stagedGeneratedArtifacts: number;
  stagedDeferredArtifacts: number;
  handoffDeferredInputs: number;
  blockedDeferredInputs: number;
  partialDeferredInputs: number;
};

export type ExternalExecutionPackage = {
  stage: "external-execution-package";
  packageVersion: ExternalExecutionPackageVersion;
  rootLabel: string;
  rootPath: string;
  manifest: ExternalExecutionManifest;
  index: ExternalExecutionIndex;
  summary: ExternalExecutionPackageSummary;
  deferredInputs: ExternalExecutionDeferredInput[];
  checksums: Array<{ relativePath: string; checksum: ExternalExecutionChecksum; sizeBytes: number }>;
  files: Array<{
    artifactId: string;
    fileName: string;
    relativePath: string;
    mediaType: string;
    contentPreview: string;
  }>;
};



export type WriterAdapterId = "reference.noop" | "future.nuendo-aaf" | "future.reference-video";

export type WriterAdapterVersion = "phase3e.v1";

export type WriterAdapterArtifactKind = DeferredWriterArtifact["artifactKind"];

export type WriterAdapterCapability = {
  capabilityId: WriterCapability;
  artifactKinds: WriterAdapterArtifactKind[];
  supported: boolean;
  note?: string;
};

export type WriterAdapterUnsupportedReasonCode =
  | "capability-mismatch"
  | "readiness-blocked"
  | "readiness-partial"
  | "known-gap"
  | "dependency-blocked"
  | "missing-contract"
  | "adapter-placeholder";

export type WriterAdapterUnsupportedReason = {
  code: WriterAdapterUnsupportedReasonCode;
  message: string;
  artifactId?: string;
  dependencyReference?: string;
};

export type WriterAdapterArtifactInput = {
  artifactId: string;
  inputId: string;
  artifactKind: WriterAdapterArtifactKind;
  plannedOutputPath: string;
  stagedDescriptorPath: string;
  requiredWriterCapability: WriterCapability;
  readinessStatus: WriterReadinessStatus;
  unresolvedBlockers: string[];
  dependencySummary: {
    satisfied: number;
    missing: number;
    blocked: number;
  };
};

export type WriterAdapterInput = {
  schemaVersion: WriterAdapterVersion;
  packageId: string;
  packageVersion: ExternalExecutionPackageVersion;
  packageSignature: string;
  packageReadiness: ExternalExecutionStatus;
  sourceSignature: DeliverySourceSignature;
  reviewSignature: DeliveryReviewSignature;
  handoffManifestVersion: DeferredWriterInputVersion;
  artifacts: WriterAdapterArtifactInput[];
  entries: Array<{
    artifactId: string;
    artifactKind: string;
    classification: ExternalExecutionEntry["classification"];
    relativePath: string;
    status: ExternalExecutionEntry["status"];
  }>;
};

export type WriterAdapterReadiness = "ready" | "partial" | "blocked";

export type WriterAdapterValidationResult = {
  adapterId: WriterAdapterId;
  adapterVersion: WriterAdapterVersion;
  readiness: WriterAdapterReadiness;
  reasons: string[];
  unsupported: WriterAdapterUnsupportedReason[];
};

export type WriterAdapterExecutionPlan = {
  adapterId: WriterAdapterId;
  adapterVersion: WriterAdapterVersion;
  readyArtifacts: string[];
  deferredArtifacts: string[];
  blockedArtifacts: string[];
  dependencySummary: {
    satisfied: number;
    missing: number;
    blocked: number;
  };
};

export type WriterAdapterDryRunResult = {
  adapterId: WriterAdapterId;
  adapterVersion: WriterAdapterVersion;
  validation: WriterAdapterValidationResult;
  executionPlan: WriterAdapterExecutionPlan;
  unsupported: WriterAdapterUnsupportedReason[];
};

export type WriterAdapter = {
  id: WriterAdapterId;
  version: WriterAdapterVersion;
  capabilities: WriterAdapterCapability[];
  validate(input: WriterAdapterInput): WriterAdapterValidationResult;
  dryRun(input: WriterAdapterInput): WriterAdapterDryRunResult;
};

export type WriterAdapterArtifactMatch = {
  artifactId: string;
  artifactKind: WriterAdapterArtifactKind;
  requiredWriterCapability: WriterCapability;
  readinessStatus: WriterReadinessStatus;
  adapterId?: WriterAdapterId;
  adapterVersion?: WriterAdapterVersion;
  state: "ready" | "blocked" | "unsupported" | "deferred";
  reason: string;
  unsupported: WriterAdapterUnsupportedReason[];
};

export type WriterAdapterRegistryReport = {
  packageId: string;
  packageSignature: string;
  schemaVersion: WriterAdapterVersion;
  matches: WriterAdapterArtifactMatch[];
  adapters: Array<{
    adapterId: WriterAdapterId;
    version: WriterAdapterVersion;
    capabilities: WriterAdapterCapability[];
  }>;
};

export type WriterRunnerId = "reference.noop-runner";

export type WriterRunRequestVersion = "phase3f.v1";

export type WriterRunRequestId = string;

export type WriterRunResponseStatus = "simulated" | "partial" | "blocked" | "unsupported";

export type WriterRunnerReadiness = "ready" | "partial" | "blocked" | "unsupported";

export type WriterRunnerUnsupportedReasonCode =
  | "missing-adapter"
  | "adapter-unsupported"
  | "dependency-blocked"
  | "readiness-blocked"
  | "readiness-partial"
  | "known-gap"
  | "package-not-ready";

export type WriterRunnerUnsupportedReason = {
  code: WriterRunnerUnsupportedReasonCode;
  message: string;
  artifactId: string;
  machineCode: string;
};

export type WriterRunBlockedReason = {
  code: "dependency-blocked" | "readiness-blocked" | "readiness-partial" | "adapter-unsupported" | "missing-adapter";
  message: string;
  dependencyReferences: string[];
};

export type WriterRunnerCapability = WriterCapability;

export type WriterRunArtifactRequest = {
  artifactId: string;
  inputId: string;
  artifactKind: WriterAdapterArtifactKind;
  plannedOutputPath: string;
  stagedDescriptorPath: string;
  requiredWriterCapability: WriterCapability;
  readinessStatus: WriterReadinessStatus;
  dependencySummary: WriterAdapterArtifactInput["dependencySummary"];
  unresolvedBlockers: string[];
  dependencyReferences: string[];
};

export type WriterRunAttempt = {
  attemptSequence: number;
  attemptedResponseStatus: WriterRunResponseStatus;
  message: string;
};

export type WriterRunRequest = {
  requestId: WriterRunRequestId;
  requestVersion: WriterRunRequestVersion;
  requestSequence: number;
  packageId: string;
  packageVersion: ExternalExecutionPackageVersion;
  packageSignature: string;
  packageReadiness: ExternalExecutionStatus;
  sourceSignature: DeliverySourceSignature;
  reviewSignature: DeliveryReviewSignature;
  adapterId?: WriterAdapterId;
  adapterVersion?: WriterAdapterVersion;
  runnerId?: WriterRunnerId;
  runnerReadiness: WriterRunnerReadiness;
  unsupportedReasons: WriterRunnerUnsupportedReason[];
  blockedReasons: WriterRunBlockedReason[];
  artifact: WriterRunArtifactRequest;
};

export type WriterRunResponse = {
  requestId: WriterRunRequestId;
  requestVersion: WriterRunRequestVersion;
  responseStatus: WriterRunResponseStatus;
  responseSequence: number;
  runnerId?: WriterRunnerId;
  message: string;
  attempts: WriterRunAttempt[];
  materialWrite: "none";
};

export type WriterRunReceiptArtifact = {
  artifactId: string;
  requestId: WriterRunRequestId;
  responseStatus: WriterRunResponseStatus;
  runnerReadiness: WriterRunnerReadiness;
  adapterId?: WriterAdapterId;
  adapterVersion?: WriterAdapterVersion;
  runnerId?: WriterRunnerId;
  dryRunPlan: {
    readyArtifacts: string[];
    deferredArtifacts: string[];
    blockedArtifacts: string[];
  };
  dependencyState: {
    unresolvedBlockers: string[];
    dependencySummary: WriterAdapterArtifactInput["dependencySummary"];
  };
  signatures: {
    source: string;
    review: string;
  };
  resultKind: "simulated/no-op" | "partial" | "blocked" | "unsupported";
  reasons: string[];
};

export type WriterRunReceiptSummary = {
  packageId: string;
  packageSignature: string;
  totalRequests: number;
  runnableRequests: number;
  blockedRequests: number;
  unsupportedRequests: number;
  partialRequests: number;
  simulatedRequests: number;
};

export type WriterRunReceipt = {
  receiptVersion: WriterRunRequestVersion;
  generatedSequence: number;
  artifacts: WriterRunReceiptArtifact[];
  summary: WriterRunReceiptSummary;
};

export type WriterRunner = {
  id: WriterRunnerId;
  capabilities: WriterRunnerCapability[];
  run(request: WriterRunRequest): WriterRunResponse;
};

export type WriterRunBundle = {
  stage: "writer-runner";
  requestVersion: WriterRunRequestVersion;
  requests: WriterRunRequest[];
  responses: WriterRunResponse[];
  receipt: WriterRunReceipt;
  files: Array<{
    artifactId: "writer-run-requests" | "writer-run-responses" | "writer-run-receipts";
    fileName: string;
    relativePath: string;
    mediaType: "application/json";
    contentPreview: string;
  }>;
};

export type TranslationJob = {
  id: string;
  jobName: string;
  status: JobStatus;
  createdAtIso: string;
  updatedAtIso: string;
  sourceBundle: SourceBundle;
  translationModel: TranslationModel;
  mappingRules: MappingRule[];
  mappingWorkspace: MappingWorkspace;
  fieldRecorderCandidates: FieldRecorderCandidate[];
  preservationIssues: PreservationIssue[];
  reconformChanges: ReConformChange[];
  analysisReport: AnalysisReport;
  outputPreset: OutputPreset;
  deliveryPackage: DeliveryPackage;
  deliveryExecution?: DeliveryExecutionPlan;
  deliveryStaging?: DeliveryStagingBundle;
  deliveryHandoff?: DeliveryHandoffBundle;
  externalExecutionPackage?: ExternalExecutionPackage;
  writerAdapterReport?: WriterAdapterRegistryReport;
  writerRunBundle?: WriterRunBundle;
};

export type ImportAnalysisResult = Omit<
  TranslationJob,
  "id" | "jobName" | "status" | "createdAtIso" | "updatedAtIso" | "outputPreset" | "deliveryPackage"
>;

export type AppSettings = {
  density: "compact" | "comfortable";
  defaultPresetId: string;
  showFrameCounts: boolean;
};

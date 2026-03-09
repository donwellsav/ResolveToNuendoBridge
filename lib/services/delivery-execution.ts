import type {
  DeferredBinaryArtifactPayload,
  DeliveryArtifact,
  DeliveryExecutionArtifact,
  DeliveryExecutionPlan,
  DeliveryPackage,
  GeneratedArtifactPayload,
  MappingWorkspace,
  TranslationJob,
} from "../types";

type ExecutionInputs = {
  job: TranslationJob;
  packagePlan: DeliveryPackage;
  effectiveWorkspace?: MappingWorkspace;
};

function toCsvCell(value: string): string {
  if (value.includes(",") || value.includes("\n") || value.includes('"')) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function toCsvRow(values: string[]): string {
  return values.map(toCsvCell).join(",");
}

function isDeferredBinaryArtifact(artifact: DeliveryArtifact): boolean {
  return artifact.fileKind === "aaf" || artifact.fileKind === "mov" || artifact.fileKind === "mp4";
}

function buildDeferredPayload(artifact: DeliveryArtifact): DeferredBinaryArtifactPayload {
  return {
    artifactId: artifact.id,
    artifactKind: "deferred_binary",
    fileName: artifact.fileName,
    pathHint: artifact.pathHint,
    deferredReason:
      artifact.fileKind === "aaf"
        ? "AAF writing requires the future Nuendo writer boundary and is intentionally deferred in Phase 3A."
        : "Reference video generation requires future binary export orchestration and is intentionally deferred in Phase 3A.",
  };
}

function generatePayload(
  artifact: DeliveryArtifact,
  job: TranslationJob,
  effectiveWorkspace: MappingWorkspace,
  executionSummary: { generated: number; deferred: number; unavailable: number }
): GeneratedArtifactPayload | undefined {
  const timeline = job.translationModel.timeline;

  if (artifact.id === "out-manifest") {
    const manifest = {
      packageId: job.deliveryPackage.id,
      packageName: job.deliveryPackage.packageName,
      target: job.deliveryPackage.target,
      sourceBundleId: job.sourceBundle.id,
      sourceBundleName: job.sourceBundle.bundleName,
      resolveTimelineVersion: job.sourceBundle.resolveTimelineVersion,
      outputPresetId: job.outputPreset.id,
      plannerStage: "delivery-planning",
      executionPrepStage: "delivery-execution-prep",
      summary: {
        timelineName: timeline.name,
        fps: timeline.fps,
        sampleRate: timeline.sampleRate,
        markers: timeline.markers.length,
        tracks: timeline.tracks.length,
        clips: timeline.tracks.flatMap((track) => track.clips).length,
      },
      artifacts: job.deliveryPackage.artifacts.map((plannedArtifact) => ({
        id: plannedArtifact.id,
        fileName: plannedArtifact.fileName,
        pathHint: plannedArtifact.pathHint,
        status: plannedArtifact.status,
        execution: plannedArtifact.id === artifact.id ? "generated" : "planned",
      })),
      executionPrep: executionSummary,
    };

    return {
      artifactId: artifact.id,
      artifactKind: "manifest",
      fileName: artifact.fileName,
      pathHint: artifact.pathHint,
      mediaType: "application/json",
      content: `${JSON.stringify(manifest, null, 2)}\n`,
    };
  }

  if (artifact.id === "out-readme") {
    const lines = [
      "Resolve -> Nuendo Delivery Execution Prep",
      "",
      `Package: ${job.deliveryPackage.packageName}`,
      `Timeline: ${timeline.name}`,
      `Preset: ${job.outputPreset.name} (${job.outputPreset.sampleRate} Hz / ${job.outputPreset.bitDepth} bit / ${job.outputPreset.pullMode})`,
      "",
      "Artifacts generated in Phase 3A execution prep:",
      "- manifest.json",
      "- README_IMPORT.txt",
      "- MARKERS.edl (if markers are included for EDL)",
      "- MARKERS.csv (if markers are included for CSV)",
      "- METADATA.csv (if clip metadata rows are available)",
      "- FIELD_RECORDER_REPORT.csv (if matched recorder rows are available)",
      "",
      "Artifacts deferred behind writer boundary:",
      "- NUENDO_EXPORT.aaf",
      "- REFERENCE.mov",
      "",
      "Nuendo writer boundary remains intentionally unimplemented in this phase.",
    ];

    return {
      artifactId: artifact.id,
      artifactKind: "readme",
      fileName: artifact.fileName,
      pathHint: artifact.pathHint,
      mediaType: "text/plain",
      content: `${lines.join("\n")}\n`,
    };
  }

  if (artifact.id === "out-marker-csv") {
    const included = timeline.markers.filter((marker) => {
      const decision = effectiveWorkspace.markerMappings.find((mapping) => mapping.markerId === marker.id);
      return decision?.includeInCsv ?? true;
    });
    const rows = [toCsvRow(["timeline_tc", "timeline_frame", "label", "color"])];
    for (const marker of included) {
      rows.push(toCsvRow([marker.timelineTc, String(marker.timelineFrame), marker.label, marker.color]));
    }
    return {
      artifactId: artifact.id,
      artifactKind: "marker_csv",
      fileName: artifact.fileName,
      pathHint: artifact.pathHint,
      mediaType: "text/csv",
      content: `${rows.join("\n")}\n`,
      rowCount: included.length,
    };
  }

  if (artifact.id === "out-marker-edl") {
    const included = timeline.markers.filter((marker) => {
      const decision = effectiveWorkspace.markerMappings.find((mapping) => mapping.markerId === marker.id);
      return decision?.includeInEdl ?? true;
    });

    const rows = [
      "TITLE: MARKERS",
      "FCM: NON-DROP FRAME",
      ...included.map(
        (marker, index) =>
          `${String(index + 1).padStart(3, "0")}  AX       V     C        ${marker.timelineTc} ${marker.timelineTc} ${marker.timelineTc} ${marker.timelineTc}\n* FROM CLIP NAME: ${marker.label}`
      ),
    ];

    return {
      artifactId: artifact.id,
      artifactKind: "marker_edl",
      fileName: artifact.fileName,
      pathHint: artifact.pathHint,
      mediaType: "text/plain",
      content: `${rows.join("\n")}\n`,
      markerCount: included.length,
    };
  }

  if (artifact.id === "out-metadata-csv") {
    const clips = timeline.tracks.flatMap((track) => track.clips);
    const rows = [toCsvRow(["clip_id", "source_file", "reel", "tape", "scene", "take", "record_in", "record_out"])];
    for (const clip of clips) {
      const decision = effectiveWorkspace.metadataMappings.find((mapping) => mapping.clipId === clip.id);
      rows.push(
        toCsvRow([
          clip.id,
          clip.sourceFileName,
          decision?.reel ?? clip.reel,
          decision?.tape ?? clip.tape ?? "",
          decision?.scene ?? clip.scene ?? "",
          decision?.take ?? clip.take ?? "",
          clip.recordIn,
          clip.recordOut,
        ])
      );
    }

    return {
      artifactId: artifact.id,
      artifactKind: "metadata_csv",
      fileName: artifact.fileName,
      pathHint: artifact.pathHint,
      mediaType: "text/csv",
      content: `${rows.join("\n")}\n`,
      rowCount: clips.length,
    };
  }

  if (artifact.id === "out-field-recorder") {
    const selectedIds = new Set(
      effectiveWorkspace.fieldRecorderMappings.filter((mapping) => mapping.selected).map((mapping) => mapping.candidateId)
    );
    const selected = job.fieldRecorderCandidates.filter((candidate) => selectedIds.has(candidate.id));
    const rows = [toCsvRow(["clip_event_id", "candidate_file", "strategy", "match_score", "selected"])];
    for (const candidate of selected) {
      rows.push(
        toCsvRow([
          candidate.clipEventId,
          candidate.candidateFile,
          candidate.strategy,
          String(candidate.matchScore),
          "yes",
        ])
      );
    }

    return {
      artifactId: artifact.id,
      artifactKind: "field_recorder_report",
      fileName: artifact.fileName,
      pathHint: artifact.pathHint,
      mediaType: "text/csv",
      content: `${rows.join("\n")}\n`,
      rowCount: selected.length,
    };
  }

  return undefined;
}

export function prepareDeliveryExecution({ job, packagePlan, effectiveWorkspace }: ExecutionInputs): DeliveryExecutionPlan {
  const workspace = effectiveWorkspace ?? job.mappingWorkspace;
  const summary = {
    generated: 0,
    deferred: 0,
    unavailable: 0,
  };

  const artifacts: DeliveryExecutionArtifact[] = packagePlan.artifacts.map((artifact) => {
    if (artifact.status !== "planned") {
      summary.unavailable += 1;
      return {
        artifact,
        executionStatus: "unavailable",
        note: artifact.note ?? "Artifact is not in a planned state and cannot be prepared.",
      };
    }

    if (isDeferredBinaryArtifact(artifact)) {
      summary.deferred += 1;
      return {
        artifact,
        executionStatus: "deferred",
        deferredPayload: buildDeferredPayload(artifact),
      };
    }

    const generatedPayload = generatePayload(artifact, { ...job, deliveryPackage: packagePlan }, workspace, summary);

    if (!generatedPayload) {
      summary.unavailable += 1;
      return {
        artifact,
        executionStatus: "unavailable",
        note: "No deterministic payload generator is available for this planned artifact.",
      };
    }

    const generatedRows =
      generatedPayload.artifactKind === "marker_csv" ||
      generatedPayload.artifactKind === "metadata_csv" ||
      generatedPayload.artifactKind === "field_recorder_report"
        ? generatedPayload.rowCount
        : generatedPayload.artifactKind === "marker_edl"
          ? generatedPayload.markerCount
          : undefined;

    if (generatedRows === 0) {
      summary.unavailable += 1;
      return {
        artifact,
        executionStatus: "unavailable",
        note: "No rows available from current canonical/review state.",
      };
    }

    summary.generated += 1;
    return {
      artifact,
      executionStatus: "generated",
      generatedPayload,
    };
  });

  return {
    packageId: packagePlan.id,
    generatedAtIso: job.sourceBundle.importedAtIso,
    artifacts,
  };
}

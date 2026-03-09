import type {
  ClipEvent,
  FieldRecorderCandidate,
  MappingWorkspace,
  Marker,
  MappingRule,
  NormalizedTrack,
  PreservationIssue,
} from "../types";

export function buildMappingWorkspace(
  tracks: NormalizedTrack[],
  markers: Marker[],
  clips: ClipEvent[],
  mappingRules: MappingRule[],
  fieldRecorderCandidates: FieldRecorderCandidate[]
): MappingWorkspace {
  const trackMappings: MappingWorkspace["trackMappings"] = tracks.map((track) => {
    const rule = mappingRules.find((candidate) => candidate.sourceTrackRole === track.role);
    return {
      trackId: track.id,
      sourceRole: track.role,
      sourceName: track.name,
      targetNuendoTrack: rule?.targetNuendoTrack ?? "UNASSIGNED",
      state: rule ? "mapped" : "needs_review",
    };
  });

  const markerMappings: MappingWorkspace["markerMappings"] = markers.map((marker) => ({
    markerId: marker.id,
    sourceLabel: marker.label,
    exportLabel: marker.label,
    includeInEdl: true,
    includeInCsv: true,
    state: "mapped",
  }));

  const metadataMappings: MappingWorkspace["metadataMappings"] = clips.map((clip) => ({
    clipId: clip.id,
    sourceFileName: clip.sourceFileName,
    reel: clip.reel || "",
    tape: clip.tape || "",
    scene: clip.scene || "",
    take: clip.take || "",
    state: clip.reel && clip.tape && clip.scene && clip.take ? "resolved" : "unresolved",
  }));

  const fieldRecorderMappings: MappingWorkspace["fieldRecorderMappings"] = fieldRecorderCandidates.map((candidate) => ({
    candidateId: candidate.id,
    clipEventId: candidate.clipEventId,
    candidateFile: candidate.candidateFile,
    strategy: candidate.strategy,
    selected: candidate.matched,
    state: candidate.matched ? "matched" : "needs_review",
  }));

  return {
    trackMappings,
    markerMappings,
    metadataMappings,
    fieldRecorderMappings,
  };
}

export function applyBulkTrackTarget(workspace: MappingWorkspace, role: NormalizedTrack["role"], targetNuendoTrack: string): MappingWorkspace {
  return {
    ...workspace,
    trackMappings: workspace.trackMappings.map((track) =>
      track.sourceRole === role
        ? {
            ...track,
            targetNuendoTrack,
            state: targetNuendoTrack === "UNASSIGNED" ? "needs_review" : "mapped",
          }
        : track
    ),
  };
}

export function toggleAllMarkers(workspace: MappingWorkspace, include: boolean): MappingWorkspace {
  return {
    ...workspace,
    markerMappings: workspace.markerMappings.map((marker) => ({
      ...marker,
      includeInEdl: include,
      includeInCsv: include,
      state: include ? "mapped" : "needs_review",
    })),
  };
}

export function selectFieldRecorderCandidates(workspace: MappingWorkspace, minScore: number, allCandidates: FieldRecorderCandidate[]): MappingWorkspace {
  const candidateById = new Map(allCandidates.map((candidate) => [candidate.id, candidate]));
  return {
    ...workspace,
    fieldRecorderMappings: workspace.fieldRecorderMappings.map((item) => {
      const candidate = candidateById.get(item.candidateId);
      const selected = candidate ? candidate.matchScore >= minScore : item.selected;
      return {
        ...item,
        selected,
        state: selected ? "matched" : "needs_review",
      };
    }),
  };
}

export function summarizeUnresolved(workspace: MappingWorkspace) {
  const unresolvedTrackMappings = workspace.trackMappings.filter((item) => item.state !== "mapped").length;
  const unresolvedMarkerMappings = workspace.markerMappings.filter((item) => item.state !== "mapped").length;
  const unresolvedMetadataMappings = workspace.metadataMappings.filter((item) => item.state !== "resolved").length;
  const unresolvedFieldRecorderMappings = workspace.fieldRecorderMappings.filter((item) => item.state !== "matched").length;
  const totalUnresolved =
    unresolvedTrackMappings + unresolvedMarkerMappings + unresolvedMetadataMappings + unresolvedFieldRecorderMappings;

  return {
    unresolvedTrackMappings,
    unresolvedMarkerMappings,
    unresolvedMetadataMappings,
    unresolvedFieldRecorderMappings,
    totalUnresolved,
  };
}

export function workspaceIssues(workspace: MappingWorkspace): PreservationIssue[] {
  const issues: PreservationIssue[] = [];

  workspace.trackMappings.filter((item) => item.state !== "mapped").forEach((item) => {
    issues.push({
      id: `issue-track-unresolved-${item.trackId}`,
      category: "manual-review",
      severity: "warning",
      scope: "track",
      title: `Unresolved track mapping: ${item.sourceName}`,
      description: `Track ${item.sourceName} (${item.sourceRole}) has no approved Nuendo target.`,
      sourceLocation: `Track ${item.sourceName}`,
      recommendedAction: "Set target Nuendo track in mapping editor.",
    });
  });

  workspace.metadataMappings.filter((item) => item.state === "unresolved").forEach((item) => {
    issues.push({
      id: `issue-metadata-unresolved-${item.clipId}`,
      category: "manual-review",
      severity: "warning",
      scope: "metadata",
      title: `Unresolved metadata fields: ${item.sourceFileName}`,
      description: "Reel/tape/scene/take remains incomplete after mapping review.",
      sourceLocation: `Clip ${item.clipId}`,
      recommendedAction: "Backfill reel, tape, scene and take values before delivery planning.",
    });
  });

  if (workspace.fieldRecorderMappings.some((item) => item.state !== "matched")) {
    issues.push({
      id: "issue-field-recorder-unresolved",
      category: "manual-review",
      severity: "warning",
      scope: "metadata",
      title: "Unresolved field recorder candidates",
      description: "One or more clips do not have approved field recorder matches.",
      sourceLocation: "Field Recorder Mapping",
      recommendedAction: "Review candidate matches and approve best production audio references.",
    });
  }

  if (workspace.markerMappings.some((item) => !item.includeInCsv && !item.includeInEdl)) {
    issues.push({
      id: "issue-marker-export-suppressed",
      category: "downgraded",
      severity: "info",
      scope: "marker",
      title: "Marker exports partially suppressed",
      description: "At least one marker is excluded from both EDL and CSV marker exports.",
      sourceLocation: "Marker Mapping",
      recommendedAction: "Confirm intentional marker exclusions for handoff package.",
    });
  }

  return issues;
}

"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  buildEffectiveDeliveryPreview,
  overlayMappingWorkspace,
  summarizeOperatorProgress,
  type ReviewState,
} from "@/lib/review-state";
import { useReviewState } from "@/lib/use-review-state";
import type { NormalizedTrack, TranslationJob } from "@/lib/types";
import { summarizeUnresolved } from "@/lib/services/mapping-workspace";

function applyBulkTrackOverride(reviewState: ReviewState, role: NormalizedTrack["role"], workspace: TranslationJob["mappingWorkspace"]) {
  const next = { ...reviewState, trackTargetOverrides: { ...reviewState.trackTargetOverrides } };
  workspace.trackMappings.forEach((track) => {
    if (track.sourceRole === role) {
      next.trackTargetOverrides[track.trackId] = `${role}_MAIN`;
    }
  });
  return next;
}

export function MappingWorkspaceEditor({ job }: { job: TranslationJob }) {
  const { hydrated, reviewState, setReviewState, reset } = useReviewState(job);
  const [reconformFilter, setReconformFilter] = useState<"all" | "unresolved" | "acknowledged" | "risky">("all");

  const effectiveWorkspace = useMemo(
    () => overlayMappingWorkspace(job.mappingWorkspace, reviewState),
    [job.mappingWorkspace, reviewState]
  );
  const unresolved = useMemo(() => summarizeUnresolved(effectiveWorkspace), [effectiveWorkspace]);
  const progress = useMemo(() => summarizeOperatorProgress(job, reviewState), [job, reviewState]);
  const deliveryPreview = useMemo(() => buildEffectiveDeliveryPreview(job, effectiveWorkspace), [job, effectiveWorkspace]);

  const filteredReconformChanges = useMemo(() => {
    return job.reconformChanges.filter((change) => {
      if (reconformFilter === "all") return true;
      const status = reviewState.reconformDecisions[change.id]?.status ?? "unresolved";
      return status === reconformFilter;
    });
  }, [job.reconformChanges, reconformFilter, reviewState.reconformDecisions]);

  const roles: NormalizedTrack["role"][] = ["DX", "MX", "FX", "BG", "VO"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Badge variant={hydrated ? "success" : "accent"}>{hydrated ? "Review state hydrated" : "Imported base state"}</Badge>
        <Badge variant="warning">Unresolved mappings: {unresolved.totalUnresolved}</Badge>
        <Badge variant="accent">Validation unresolved: {progress.validation.unresolved}</Badge>
        <Badge variant="accent">Reconform unresolved: {progress.reconform.unresolved}</Badge>
        <Button size="sm" variant="secondary" onClick={reset}>Reset to imported state</Button>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Track Mapping Editor</h4>
          <div className="flex gap-2">
            {roles.map((role) => (
              <Button
                key={role}
                size="sm"
                variant="secondary"
                onClick={() => setReviewState((prev) => applyBulkTrackOverride(prev, role, job.mappingWorkspace))}
              >
                Bulk {role} → {role}_MAIN
              </Button>
            ))}
          </div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted"><tr><th className="px-2 py-1 text-left">Source Track</th><th className="px-2 py-1 text-left">Nuendo Target</th><th className="px-2 py-1 text-left">Origin</th></tr></thead>
          <tbody>
            {effectiveWorkspace.trackMappings.map((item) => (
              <tr key={item.trackId} className="border-t border-border">
                <td className="px-2 py-1">{item.sourceName}</td>
                <td className="px-2 py-1 font-mono text-[11px]">{item.targetNuendoTrack}</td>
                <td className="px-2 py-1">
                  <Badge variant={reviewState.trackTargetOverrides[item.trackId] ? "warning" : "accent"}>
                    {reviewState.trackTargetOverrides[item.trackId] ? "operator-edited" : "imported/base"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Validation Acknowledgements</h4>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted"><tr><th className="px-2 py-1 text-left">Issue</th><th className="px-2 py-1 text-left">Severity</th><th className="px-2 py-1 text-left">Review</th></tr></thead>
          <tbody>
            {job.preservationIssues.map((issue) => {
              const decision = reviewState.validationAcknowledgements[issue.id];
              return (
                <tr key={issue.id} className="border-t border-border">
                  <td className="px-2 py-1">{issue.title}</td>
                  <td className="px-2 py-1">{issue.severity}</td>
                  <td className="px-2 py-1 flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setReviewState((prev) => ({
                          ...prev,
                          validationAcknowledgements: {
                            ...prev.validationAcknowledgements,
                            [issue.id]: { issueId: issue.id, status: "acknowledged" },
                          },
                        }))
                      }
                    >
                      Acknowledge
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setReviewState((prev) => ({
                          ...prev,
                          validationAcknowledgements: {
                            ...prev.validationAcknowledgements,
                            [issue.id]: { issueId: issue.id, status: "dismissed" },
                          },
                        }))
                      }
                    >
                      Dismiss
                    </Button>
                    <Badge variant={!decision ? "warning" : decision.status === "dismissed" ? "accent" : "success"}>
                      {!decision ? "unresolved" : decision.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">ReConform Review</h4>
          <div className="flex gap-1">
            {(["all", "unresolved", "acknowledged", "risky"] as const).map((filter) => (
              <Button key={filter} size="sm" variant="secondary" onClick={() => setReconformFilter(filter)}>{filter}</Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 text-xs">
          <Badge variant="warning">Unresolved {progress.reconform.unresolved}</Badge>
          <Badge variant="success">Acknowledged {progress.reconform.acknowledged}</Badge>
          <Badge variant="danger">Risky {progress.reconform.risky}</Badge>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted"><tr><th className="px-2 py-1 text-left">Change</th><th className="px-2 py-1 text-left">Note</th><th className="px-2 py-1 text-left">Decision</th></tr></thead>
          <tbody>
            {filteredReconformChanges.map((change) => {
              const status = reviewState.reconformDecisions[change.id]?.status ?? "unresolved";
              return (
                <tr key={change.id} className="border-t border-border">
                  <td className="px-2 py-1 font-mono">{change.changeType} {change.oldTimecode ?? "--"} → {change.newTimecode ?? "--"}</td>
                  <td className="px-2 py-1">{change.note}</td>
                  <td className="px-2 py-1 flex gap-1">
                    {(["acknowledged", "risky", "unresolved"] as const).map((decision) => (
                      <Button key={decision} size="sm" variant="secondary" onClick={() => setReviewState((prev) => ({ ...prev, reconformDecisions: { ...prev.reconformDecisions, [change.id]: { changeId: change.id, status: decision } } }))}>{decision}</Button>
                    ))}
                    <Badge variant={status === "acknowledged" ? "success" : status === "risky" ? "danger" : "warning"}>{status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Delivery Preview (effective overlay state)</h4>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted"><tr><th className="px-2 py-1 text-left">Artifact</th><th className="px-2 py-1 text-left">Status</th></tr></thead>
          <tbody>
            {deliveryPreview.map((artifact) => (
              <tr key={artifact.id} className="border-t border-border">
                <td className="px-2 py-1 font-mono">{artifact.fileName}</td>
                <td className="px-2 py-1"><Badge variant={artifact.status === "planned" ? "success" : artifact.status === "blocked" ? "danger" : "warning"}>{artifact.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

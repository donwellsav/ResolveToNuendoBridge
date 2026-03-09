"use client";

import Link from "next/link";

import { JobStatusBadge } from "@/components/domain/job-status-badge";
import { useReviewState } from "@/lib/use-review-state";
import { summarizeOperatorProgress } from "@/lib/review-state";
import type { TranslationJob } from "@/lib/types";

function Row({ job }: { job: TranslationJob }) {
  const { reviewState } = useReviewState(job);
  const progress = summarizeOperatorProgress(job, reviewState);

  return (
    <tr className="border-t border-border">
      <td className="px-3 py-2"><Link className="underline decoration-border underline-offset-2" href={`/jobs/${job.id}`}>{job.jobName}</Link></td>
      <td className="px-3 py-2 font-mono text-[11px]">{job.sourceBundle.resolveTimelineVersion}</td>
      <td className="px-3 py-2">{job.outputPreset.name}</td>
      <td className="px-3 py-2"><JobStatusBadge status={job.status} /></td>
      <td className="px-3 py-2 text-right font-mono">{progress.unresolvedMappings + progress.validation.unresolved + progress.reconform.unresolved}</td>
      <td className="px-3 py-2 text-right font-mono">{job.deliveryPackage.artifacts.length}</td>
    </tr>
  );
}

export function ReviewAwareJobTable({ jobs }: { jobs: TranslationJob[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead className="bg-panelAlt text-muted">
        <tr>
          <th className="px-3 py-2 text-left">Job</th>
          <th className="px-3 py-2 text-left">Resolve Timeline</th>
          <th className="px-3 py-2 text-left">Preset</th>
          <th className="px-3 py-2 text-left">Status</th>
          <th className="px-3 py-2 text-right">Unresolved</th>
          <th className="px-3 py-2 text-right">Artifacts</th>
        </tr>
      </thead>
      <tbody>{jobs.map((job) => <Row key={job.id} job={job} />)}</tbody>
    </table>
  );
}

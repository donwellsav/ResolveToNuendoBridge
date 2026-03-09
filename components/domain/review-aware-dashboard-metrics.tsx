"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeOperatorProgress } from "@/lib/review-state";
import { useReviewState } from "@/lib/use-review-state";
import type { TranslationJob } from "@/lib/types";

function MetricsWithPrimary({ jobs, primary }: { jobs: TranslationJob[]; primary: TranslationJob }) {
  const { reviewState } = useReviewState(primary);
  const progress = summarizeOperatorProgress(primary, reviewState);

  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.status === "processing" || job.status === "needs_review").length;
  const pendingArtifacts = jobs.reduce(
    (sum, job) => sum + job.deliveryPackage.artifacts.filter((artifact) => artifact.status === "planned").length,
    0
  );

  return (
    <div className="grid grid-cols-5 gap-4">
      <Card><CardHeader><CardTitle>Total Jobs</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{totalJobs}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Active Jobs</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{activeJobs}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Preservation Issues</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-warning">{jobs.reduce((sum, job) => sum + job.preservationIssues.length, 0)}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Unresolved Review</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-warning">{progress.unresolvedMappings + progress.validation.unresolved + progress.reconform.unresolved}</p></CardContent></Card>
      <Card><CardHeader><CardTitle>Planned Artifacts</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{pendingArtifacts}</p></CardContent></Card>
    </div>
  );
}

export function ReviewAwareDashboardMetrics({ jobs }: { jobs: TranslationJob[] }) {
  if (!jobs.length) {
    return <div className="text-xs text-muted">No jobs available.</div>;
  }

  return <MetricsWithPrimary jobs={jobs} primary={jobs[0]} />;
}

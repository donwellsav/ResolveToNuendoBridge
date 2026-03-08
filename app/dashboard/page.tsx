import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translationJobs } from "@/lib/mock-data";

export default function DashboardPage() {
  const totalJobs = translationJobs.length;
  const activeJobs = translationJobs.filter((job) => job.status === "processing" || job.status === "needs_review").length;
  const totalIssues = translationJobs.reduce((sum, job) => sum + job.preservationIssues.length, 0);
  const pendingArtifacts = translationJobs.reduce(
    (sum, job) => sum + job.exportArtifacts.filter((artifact) => artifact.status === "queued").length,
    0
  );

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardHeader><CardTitle>Total Jobs</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{totalJobs}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Active Jobs</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{activeJobs}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Preservation Issues</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-warning">{totalIssues}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Queued Artifacts</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold">{pendingArtifacts}</p></CardContent></Card>
      </div>
    </AppShell>
  );
}

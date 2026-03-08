import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jobs } from "@/lib/mock/data";

export default function DashboardPage() {
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((job) => job.status === "processing" || job.status === "needs_review").length;
  const totalWarnings = jobs.reduce((sum, job) => sum + job.summary.conformWarnings, 0);

  return (
    <AppShell title="Dashboard">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Review / Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeJobs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Conform Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-warning">{totalWarnings}</p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

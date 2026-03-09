import { notFound } from "next/navigation";

import { MappingWorkspaceEditor } from "@/components/domain/mapping-workspace-editor";
import { PreservationReportTable } from "@/components/domain/preservation-report-table";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslationJobs } from "@/lib/job-source";

type Params = { id: string };

export default async function JobDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const jobs = await getTranslationJobs();
  const job = jobs.find((item) => item.id === id);

  if (!job) notFound();

  return (
    <AppShell title={`Job Detail · ${job.jobName}`}>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Mapping Editors</CardTitle>
          </CardHeader>
          <CardContent>
            <MappingWorkspaceEditor job={job} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preservation Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <PreservationReportTable issues={job.preservationIssues} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

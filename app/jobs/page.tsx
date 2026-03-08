import { MappingTable } from "@/components/domain/mapping-table";
import { PreservationReportTable } from "@/components/domain/preservation-report-table";
import { JobStatusBadge } from "@/components/domain/job-status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { jobs } from "@/lib/mock/data";

const primaryJob = jobs[0];

export default function JobsPage() {
  return (
    <AppShell title="Jobs">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Job Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-panelAlt text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Timeline</th>
                  <th className="px-3 py-2 text-left">Template</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Mapped/Total</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-t border-border">
                    <td className="px-3 py-2">{job.name}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{job.source.timelineName}</td>
                    <td className="px-3 py-2">{job.templateId}</td>
                    <td className="px-3 py-2"><JobStatusBadge status={job.status} /></td>
                    <td className="px-3 py-2 text-right font-mono">{job.summary.mappedEvents}/{job.summary.totalEvents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapping Inspector — {primaryJob.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <MappingTable mappings={primaryJob.mappings} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preservation Report — {primaryJob.report.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <PreservationReportTable report={primaryJob.report} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

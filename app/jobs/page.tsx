import { MappingTable } from "@/components/domain/mapping-table";
import { PreservationReportTable } from "@/components/domain/preservation-report-table";
import { JobStatusBadge } from "@/components/domain/job-status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translationJobs } from "@/lib/mock-data";

const primaryJob = translationJobs[0];
const allClips = primaryJob.sourceBundle.timeline.tracks.flatMap((track) => track.clips);

export default function JobsPage() {
  return (
    <AppShell title="Jobs">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Translation Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full border-collapse text-xs">
              <thead className="bg-panelAlt text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Job</th>
                  <th className="px-3 py-2 text-left">Resolve Timeline</th>
                  <th className="px-3 py-2 text-left">Preset</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Artifacts</th>
                </tr>
              </thead>
              <tbody>
                {translationJobs.map((job) => (
                  <tr key={job.id} className="border-t border-border">
                    <td className="px-3 py-2">{job.jobName}</td>
                    <td className="px-3 py-2 font-mono text-[11px]">{job.sourceBundle.resolveTimelineVersion}</td>
                    <td className="px-3 py-2">{job.outputPreset.name}</td>
                    <td className="px-3 py-2"><JobStatusBadge status={job.status} /></td>
                    <td className="px-3 py-2 text-right font-mono">{job.exportArtifacts.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mapping Inspector — {primaryJob.jobName}</CardTitle>
          </CardHeader>
          <CardContent>
            <MappingTable clips={allClips} mappingRules={primaryJob.mappingRules} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Preservation Issues — {primaryJob.id}</CardTitle>
          </CardHeader>
          <CardContent>
            <PreservationReportTable issues={primaryJob.preservationIssues} />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

import { MappingTable } from "@/components/domain/mapping-table";
import { PreservationReportTable } from "@/components/domain/preservation-report-table";
import { JobStatusBadge } from "@/components/domain/job-status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslationJobs } from "@/lib/job-source";

export default async function JobsPage() {
  const translationJobs = await getTranslationJobs();
  const primaryJob = translationJobs[0];
  const allClips = primaryJob.translationModel.timeline.tracks.flatMap((track) => track.clips);
  return (
    <AppShell title="Jobs">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Translation Queue (Imported or Mock Fallback)</CardTitle>
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
                    <td className="px-3 py-2 text-right font-mono">{job.deliveryPackage.artifacts.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Intake Package — {primaryJob.sourceBundle.bundleName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-panelAlt text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">File</th>
                    <th className="px-3 py-2 text-left">Kind/Role</th>
                    <th className="px-3 py-2 text-left">Origin</th>
                  </tr>
                </thead>
                <tbody>
                  {primaryJob.sourceBundle.intakeAssets.map((asset) => (
                    <tr key={asset.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-[11px]">{asset.fileName}</td>
                      <td className="px-3 py-2">{asset.fileKind} / {asset.fileRole}</td>
                      <td className="px-3 py-2"><Badge variant="accent">{asset.origin}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Package — {primaryJob.deliveryPackage.packageName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full border-collapse text-xs">
                <thead className="bg-panelAlt text-muted">
                  <tr>
                    <th className="px-3 py-2 text-left">Artifact</th>
                    <th className="px-3 py-2 text-left">Kind/Role</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {primaryJob.deliveryPackage.artifacts.map((artifact) => (
                    <tr key={artifact.id} className="border-t border-border">
                      <td className="px-3 py-2 font-mono text-[11px]">{artifact.fileName}</td>
                      <td className="px-3 py-2">{artifact.fileKind} / {artifact.fileRole}</td>
                      <td className="px-3 py-2"><Badge variant={artifact.status === "ready" ? "success" : artifact.status === "blocked" ? "danger" : "warning"}>{artifact.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

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

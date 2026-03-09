import { MappingWorkspaceEditor } from "@/components/domain/mapping-workspace-editor";
import { PreservationReportTable } from "@/components/domain/preservation-report-table";
import { ReviewAwareJobTable } from "@/components/domain/review-aware-job-table";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslationJobs } from "@/lib/job-source";

export default async function JobsPage() {
  const translationJobs = await getTranslationJobs();
  const primaryJob = translationJobs[0];

  if (!primaryJob) {
    return (
      <AppShell title="Jobs">
        <Card>
          <CardHeader>
            <CardTitle>Translation Queue</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted">No translation jobs are available.</CardContent>
        </Card>
      </AppShell>
    );
  }

  const executionByArtifactId = new Map(
    (primaryJob.deliveryExecution?.artifacts ?? []).map((artifact) => [artifact.artifact.id, artifact])
  );


  const stagedFiles = primaryJob.deliveryStaging?.files ?? [];
  const deferredDescriptors = primaryJob.deliveryStaging?.deferredArtifacts ?? [];

  const generatedPayloadPreviews = (primaryJob.deliveryExecution?.artifacts ?? [])
    .filter((artifact) => artifact.generatedPayload)
    .map((artifact) => ({
      fileName: artifact.artifact.fileName,
      preview: artifact.generatedPayload?.content.slice(0, 300) ?? "",
    }));

  return (
    <AppShell title="Jobs">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Translation Queue</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ReviewAwareJobTable jobs={translationJobs} />
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
                      <td className="px-3 py-2">
                        {asset.fileKind} / {asset.fileRole}
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="accent">{asset.origin}</Badge>
                      </td>
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
                    <th className="px-3 py-2 text-left">Execution Prep</th>
                  </tr>
                </thead>
                <tbody>
                  {primaryJob.deliveryPackage.artifacts.map((artifact) => {
                    const execution = executionByArtifactId.get(artifact.id);
                    const executionStatus = execution?.executionStatus ?? "planned";
                    return (
                      <tr key={artifact.id} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-[11px]">{artifact.fileName}</td>
                        <td className="px-3 py-2">
                          {artifact.fileKind} / {artifact.fileRole}
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={artifact.status === "planned" ? "success" : artifact.status === "blocked" ? "danger" : "warning"}
                          >
                            {artifact.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <Badge
                            variant={
                              executionStatus === "generated"
                                ? "success"
                                : executionStatus === "deferred"
                                  ? "warning"
                                  : executionStatus === "unavailable"
                                    ? "danger"
                                    : "accent"
                            }
                          >
                            {executionStatus}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        {generatedPayloadPreviews.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Execution Prep Payload Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedPayloadPreviews.map((payload) => (
                <div key={payload.fileName} className="rounded border border-border bg-panelAlt p-3">
                  <div className="mb-2 text-xs font-semibold">{payload.fileName}</div>
                  <pre className="overflow-x-auto text-[11px] text-muted">{payload.preview}</pre>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {stagedFiles.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Staged Delivery Bundle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="font-mono text-muted">{primaryJob.deliveryStaging?.rootPath}</div>
              <table className="w-full border-collapse text-xs">
                <thead className="bg-panelAlt text-muted"><tr><th className="px-2 py-1 text-left">Path</th><th className="px-2 py-1 text-left">Category</th></tr></thead>
                <tbody>
                  {stagedFiles.map((file) => (
                    <tr key={file.relativePath} className="border-t border-border">
                      <td className="px-2 py-1 font-mono">{file.relativePath}</td>
                      <td className="px-2 py-1"><Badge variant={file.category === "generated" ? "success" : "warning"}>{file.category}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {deferredDescriptors.length > 0 ? (
                <div className="space-y-1">
                  {deferredDescriptors.map((artifact) => (
                    <div key={artifact.artifactId} className="rounded border border-border p-2">
                      <div className="font-mono">{artifact.deferredPath}</div>
                      <div className="text-muted">{artifact.deferredReason}</div>
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Mapping Inspector — {primaryJob.jobName}</CardTitle>
          </CardHeader>
          <CardContent>
            <MappingWorkspaceEditor job={primaryJob} />
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

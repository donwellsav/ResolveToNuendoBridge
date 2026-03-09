import { MappingWorkspaceEditor } from "@/components/domain/mapping-workspace-editor";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getTranslationJobs } from "@/lib/job-source";

export default async function ReConformPage() {
  const translationJobs = await getTranslationJobs();
  const primaryJob = translationJobs[0];

  return (
    <AppShell title="ReConform">
      <Card>
        <CardHeader><CardTitle>ReConform Review Workspace</CardTitle></CardHeader>
        <CardContent>
          {primaryJob ? <MappingWorkspaceEditor job={primaryJob} /> : <p className="text-xs text-muted">No reconform events available.</p>}
        </CardContent>
      </Card>
    </AppShell>
  );
}

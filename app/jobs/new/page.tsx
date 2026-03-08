import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { outputPresets, templateMappingRules } from "@/lib/mock-data";
import { getTranslationJobs } from "@/lib/job-source";

export default async function NewJobPage() {
  const translationJobs = await getTranslationJobs();
  const importedJob = translationJobs[0];

  return (
    <AppShell title="New Job">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Step 1 — Intake Package</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Importer boundary currently loads local fixture turnover from <span className="font-mono">fixtures/turnover-basic</span>.</p>
            <p>Detected intake assets: <span className="font-mono">{importedJob.sourceBundle.intakeAssets.length}</span> files.</p>
            <p className="font-mono text-xs">{importedJob.analysisReport.intakeCompletenessSummary}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Step 2 — Mapping Rules</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            {templateMappingRules.map((rule) => (
              <div key={rule.id} className="rounded border border-border bg-panelAlt px-3 py-2 font-mono">
                {rule.sourceTrackRole} → {rule.targetNuendoTrack} <span className="text-muted">({rule.condition})</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Step 3 — Delivery Package Plan</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            {outputPresets.map((preset) => (
              <div key={preset.id} className="rounded border border-border bg-panelAlt px-3 py-2">
                <p>{preset.name}</p>
                <p className="font-mono text-muted">{preset.sampleRate} Hz / {preset.bitDepth} bit / {preset.pullMode}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Button variant="default">Create Draft Translation Job</Button>
      </div>
    </AppShell>
  );
}

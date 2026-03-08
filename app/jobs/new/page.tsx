import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { outputPresets, templateMappingRules } from "@/lib/mock-data";

export default function NewJobPage() {
  return (
    <AppShell title="New Job">
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Step 1 — Intake Package</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Resolve bundle parsing is intentionally stubbed in phase 1.</p>
            <p>Operator chooses inbound assets only: AAF/XML/EDL, metadata CSV, reference video, and production audio.</p>
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

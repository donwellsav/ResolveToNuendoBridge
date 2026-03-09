import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { templateMappingRules } from "@/lib/mock-data";

export default function TemplatesPage() {
  return (
    <AppShell title="Templates">
      <Card>
        <CardHeader><CardTitle>Mapping Template Library</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-xs">
          {templateMappingRules.map((rule) => (
            <div key={rule.id} className="rounded border border-border bg-panelAlt px-3 py-2">
              <p className="font-medium">{rule.sourceTrackRole} routing</p>
              <p className="font-mono text-muted">target={rule.targetNuendoTrack}</p>
              <p className="text-muted">{rule.condition}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppShell>
  );
}

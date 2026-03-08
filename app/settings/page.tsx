import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appSettings } from "@/lib/mock/data";

export default function SettingsPage() {
  return (
    <AppShell title="Settings">
      <Card>
        <CardHeader>
          <CardTitle>Application Defaults (Mock)</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-xs">
          <p>Theme: <span className="font-mono">{appSettings.theme}</span></p>
          <p>Density: <span className="font-mono">{appSettings.density}</span></p>
          <p>Show Frame Counts: <span className="font-mono">{String(appSettings.showFrameCounts)}</span></p>
          <p>Default Pull Mode: <span className="font-mono">{appSettings.defaultPullMode}</span></p>
        </CardContent>
      </Card>
    </AppShell>
  );
}

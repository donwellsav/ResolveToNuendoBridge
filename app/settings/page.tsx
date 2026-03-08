import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { appSettings, outputPresets } from "@/lib/mock-data";

export default function SettingsPage() {
  const defaultPreset = outputPresets.find((preset) => preset.id === appSettings.defaultPresetId);

  return (
    <AppShell title="Settings">
      <Card>
        <CardHeader><CardTitle>Operator Defaults (Mock)</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-xs">
          <p>Density: <span className="font-mono">{appSettings.density}</span></p>
          <p>Show Frame Counts: <span className="font-mono">{String(appSettings.showFrameCounts)}</span></p>
          <p>Default Preset ID: <span className="font-mono">{appSettings.defaultPresetId}</span></p>
          <p>Default Preset Name: <span className="font-mono">{defaultPreset?.name ?? "n/a"}</span></p>
        </CardContent>
      </Card>
    </AppShell>
  );
}

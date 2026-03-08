import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { reconformPresets } from "@/lib/mock/data";

export default function ReConformPage() {
  return (
    <AppShell title="ReConform">
      <div className="grid grid-cols-2 gap-4">
        {reconformPresets.map((preset) => (
          <Card key={preset.id}>
            <CardHeader>
              <CardTitle>{preset.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <p>Change Detection: <span className="font-mono">{preset.changeDetection}</span></p>
              <p>Preserve Manual Edits: <span className="font-mono">{preset.preserveManualEdits ? "true" : "false"}</span></p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

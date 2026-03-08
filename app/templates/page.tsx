import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { templates } from "@/lib/mock/data";

export default function TemplatesPage() {
  return (
    <AppShell title="Templates">
      <div className="space-y-4">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted">{template.description}</p>
              <p>Frame Rate: <span className="font-mono">{template.defaultFrameRate}</span> | Sample Rate: <span className="font-mono">{template.defaultSampleRate}</span></p>
              <ul className="space-y-1">
                {template.trackMappings.map((track) => (
                  <li key={`${template.id}-${track.resolveBus}`} className="font-mono text-[11px] text-muted">
                    {track.resolveBus} → {track.nuendoBus}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

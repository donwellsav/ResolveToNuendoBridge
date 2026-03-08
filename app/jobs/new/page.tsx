import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { templates } from "@/lib/mock/data";

export default function NewJobPage() {
  return (
    <AppShell title="New Job Wizard">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Source Selection (Mock)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted">
            <p>Resolve bundle input is not implemented in this phase.</p>
            <p>Use structured mock payload references from the bundle spec contract.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Template + Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {templates.map((template) => (
                <div key={template.id} className="rounded-md border border-border bg-panelAlt px-3 py-2">
                  <p className="font-medium">{template.name}</p>
                  <p className="text-xs text-muted">{template.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <Button variant="default">Create Draft Job</Button>
        </div>
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reconformPlaceholders = [
  {
    id: "rc-pass-1",
    title: "Change List Intake",
    note: "EDL/ALE diff ingestion is the next reconform-focused planning step; this panel shows the upcoming review gate.",
  },
  {
    id: "rc-pass-2",
    title: "Conflict Resolution",
    note: "Manual editor change preservation matrix remains planned while persistence and review tooling mature.",
  },
];

export default function ReConformPage() {
  return (
    <AppShell title="ReConform">
      <div className="grid grid-cols-2 gap-4">
        {reconformPlaceholders.map((item) => (
          <Card key={item.id}>
            <CardHeader><CardTitle>{item.title}</CardTitle></CardHeader>
            <CardContent className="text-xs text-muted">{item.note}</CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}

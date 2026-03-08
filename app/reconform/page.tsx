import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reconformPlaceholders = [
  {
    id: "rc-pass-1",
    title: "Change List Intake",
    note: "EDL/ALE diff ingestion planned for phase 2. Placeholder displays expected review gate.",
  },
  {
    id: "rc-pass-2",
    title: "Conflict Resolution",
    note: "Manual editor change preservation matrix will land after parser/export plumbing.",
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

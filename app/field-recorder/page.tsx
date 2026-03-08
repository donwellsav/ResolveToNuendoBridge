import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fieldRecorderProfiles } from "@/lib/mock/data";

export default function FieldRecorderPage() {
  return (
    <AppShell title="Field Recorder">
      <Card>
        <CardHeader>
          <CardTitle>Match Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border-collapse text-xs">
            <thead className="bg-panelAlt text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2 text-left">Strategy</th>
                <th className="px-3 py-2 text-right">Channels/Poly</th>
                <th className="px-3 py-2 text-left">State</th>
              </tr>
            </thead>
            <tbody>
              {fieldRecorderProfiles.map((profile) => (
                <tr key={profile.id} className="border-t border-border">
                  <td className="px-3 py-2">{profile.name}</td>
                  <td className="px-3 py-2 font-mono">{profile.matchStrategy}</td>
                  <td className="px-3 py-2 text-right font-mono">{profile.channelsPerPoly}</td>
                  <td className="px-3 py-2">
                    <Badge variant={profile.enabled ? "success" : "neutral"}>{profile.enabled ? "enabled" : "disabled"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AppShell>
  );
}

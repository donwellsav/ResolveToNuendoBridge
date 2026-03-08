import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { translationJobs } from "@/lib/mock-data";

const candidates = translationJobs[0].fieldRecorderCandidates;

export default function FieldRecorderPage() {
  return (
    <AppShell title="Field Recorder">
      <Card>
        <CardHeader><CardTitle>Candidate Matches</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full border-collapse text-xs">
            <thead className="bg-panelAlt text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Clip Event</th>
                <th className="px-3 py-2 text-left">Candidate File</th>
                <th className="px-3 py-2 text-left">Strategy</th>
                <th className="px-3 py-2 text-right">Score</th>
                <th className="px-3 py-2 text-left">Result</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr key={candidate.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono">{candidate.clipEventId}</td>
                  <td className="px-3 py-2">{candidate.candidateFile}</td>
                  <td className="px-3 py-2">{candidate.strategy}</td>
                  <td className="px-3 py-2 text-right font-mono">{candidate.matchScore}</td>
                  <td className="px-3 py-2">
                    <Badge variant={candidate.matched ? "success" : "warning"}>{candidate.matched ? "matched" : "review"}</Badge>
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

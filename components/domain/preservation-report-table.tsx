import { Badge } from "@/components/ui/badge";
import type { PreservationIssue } from "@/lib/types";

export function PreservationReportTable({ issues }: { issues: PreservationIssue[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-panelAlt text-muted">
          <tr>
            <th className="px-3 py-2 text-left">Category</th>
            <th className="px-3 py-2 text-left">Scope</th>
            <th className="px-3 py-2 text-left">Issue</th>
            <th className="px-3 py-2 text-left">Severity</th>
            <th className="px-3 py-2 text-left">Recommended Action</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-t border-border bg-panel">
              <td className="px-3 py-2 text-muted">{issue.category}</td>
              <td className="px-3 py-2 text-muted">{issue.scope}</td>
              <td className="px-3 py-2">
                <p className="font-medium">{issue.title}</p>
                <p className="text-muted">{issue.description}</p>
              </td>
              <td className="px-3 py-2">
                <Badge variant={issue.severity === "info" ? "accent" : issue.severity === "warning" ? "warning" : "danger"}>
                  {issue.severity}
                </Badge>
              </td>
              <td className="px-3 py-2 text-muted">{issue.recommendedAction}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

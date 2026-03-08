import { Badge } from "@/components/ui/badge";
import type { PreservationIssue } from "@/lib/types";

export function PreservationReportTable({ issues }: { issues: PreservationIssue[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-panelAlt text-muted">
          <tr>
            <th className="px-3 py-2 text-left">Category</th>
            <th className="px-3 py-2 text-left">Detail</th>
            <th className="px-3 py-2 text-left">Severity</th>
            <th className="px-3 py-2 text-left">Recommendation</th>
          </tr>
        </thead>
        <tbody>
          {issues.map((issue) => (
            <tr key={issue.id} className="border-t border-border bg-panel">
              <td className="px-3 py-2 text-muted">{issue.category}</td>
              <td className="px-3 py-2">{issue.detail}</td>
              <td className="px-3 py-2">
                <Badge
                  variant={
                    issue.severity === "info" ? "accent" : issue.severity === "warning" ? "warning" : "danger"
                  }
                >
                  {issue.severity}
                </Badge>
              </td>
              <td className="px-3 py-2 text-muted">{issue.recommendation}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

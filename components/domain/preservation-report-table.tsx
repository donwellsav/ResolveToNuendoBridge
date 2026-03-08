import { Badge } from "@/components/ui/badge";
import type { PreservationReport } from "@/lib/domain";

export function PreservationReportTable({ report }: { report: PreservationReport }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-panelAlt text-muted">
          <tr>
            <th className="px-3 py-2 text-left">Category</th>
            <th className="px-3 py-2 text-left">Item</th>
            <th className="px-3 py-2 text-left">Source</th>
            <th className="px-3 py-2 text-left">Translated</th>
            <th className="px-3 py-2 text-left">Result</th>
          </tr>
        </thead>
        <tbody>
          {report.entries.map((entry) => (
            <tr key={entry.id} className="border-t border-border bg-panel">
              <td className="px-3 py-2 text-muted">{entry.category}</td>
              <td className="px-3 py-2">{entry.item}</td>
              <td className="px-3 py-2 font-mono">{entry.sourceValue}</td>
              <td className="px-3 py-2 font-mono">{entry.translatedValue}</td>
              <td className="px-3 py-2">
                <Badge
                  variant={
                    entry.result === "preserved"
                      ? "success"
                      : entry.result === "adjusted"
                        ? "warning"
                        : "danger"
                  }
                >
                  {entry.result}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";
import type { ClipMapping } from "@/lib/domain";

export function MappingTable({ mappings }: { mappings: ClipMapping[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-panelAlt text-muted">
          <tr>
            <th className="px-3 py-2 text-left">Resolve Clip</th>
            <th className="px-3 py-2 text-left">In/Out</th>
            <th className="px-3 py-2 text-left">Channels</th>
            <th className="px-3 py-2 text-left">Nuendo Track</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Notes</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((mapping) => (
            <tr key={mapping.id} className="border-t border-border bg-panel">
              <td className="px-3 py-2">{mapping.resolveClipName}</td>
              <td className="px-3 py-2 font-mono">{mapping.timecodeIn} → {mapping.timecodeOut}</td>
              <td className="px-3 py-2">{mapping.sourceChannelLayout}</td>
              <td className="px-3 py-2">{mapping.nuendoTrackName || "—"}</td>
              <td className="px-3 py-2">
                <Badge
                  variant={
                    mapping.mappingStatus === "mapped"
                      ? "success"
                      : mapping.mappingStatus === "fallback"
                        ? "warning"
                        : "danger"
                  }
                >
                  {mapping.mappingStatus}
                </Badge>
              </td>
              <td className="px-3 py-2 text-muted">{mapping.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

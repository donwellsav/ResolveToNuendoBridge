import { Badge } from "@/components/ui/badge";
import type { ClipEvent, MappingRule } from "@/lib/types";

function resolveTrackTarget(channelLayout: string, rules: MappingRule[]) {
  if (channelLayout.includes("C")) return rules.find((rule) => rule.sourceTrackRole === "DX")?.targetNuendoTrack ?? "UNASSIGNED";
  if (channelLayout.includes("L,R")) return rules.find((rule) => rule.sourceTrackRole === "FX")?.targetNuendoTrack ?? "UNASSIGNED";
  return "UNASSIGNED";
}

export function MappingTable({ clips, mappingRules }: { clips: ClipEvent[]; mappingRules: MappingRule[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full border-collapse text-xs">
        <thead className="bg-panelAlt text-muted">
          <tr>
            <th className="px-3 py-2 text-left">Resolve Clip</th>
            <th className="px-3 py-2 text-left">Record In/Out</th>
            <th className="px-3 py-2 text-left">Reel</th>
            <th className="px-3 py-2 text-left">Channels</th>
            <th className="px-3 py-2 text-left">Nuendo Target</th>
            <th className="px-3 py-2 text-left">State</th>
          </tr>
        </thead>
        <tbody>
          {clips.map((clip) => {
            const targetTrack = resolveTrackTarget(clip.channelLayout, mappingRules);
            const mapped = targetTrack !== "UNASSIGNED";

            return (
              <tr key={clip.id} className="border-t border-border bg-panel">
                <td className="px-3 py-2">{clip.clipName}</td>
                <td className="px-3 py-2 font-mono">{clip.recordIn} → {clip.recordOut}</td>
                <td className="px-3 py-2 font-mono">{clip.reel}</td>
                <td className="px-3 py-2">{clip.channelLayout}</td>
                <td className="px-3 py-2">{targetTrack}</td>
                <td className="px-3 py-2">
                  <Badge variant={mapped ? "success" : "warning"}>{mapped ? "mapped" : "needs rule"}</Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

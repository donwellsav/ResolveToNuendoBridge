"use client";

import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  applyBulkTrackTarget,
  selectFieldRecorderCandidates,
  summarizeUnresolved,
  toggleAllMarkers,
} from "@/lib/services/mapping-workspace";
import type { FieldRecorderCandidate, MappingWorkspace, NormalizedTrack } from "@/lib/types";

export function MappingWorkspaceEditor({
  workspace,
  fieldRecorderCandidates,
}: {
  workspace: MappingWorkspace;
  fieldRecorderCandidates: FieldRecorderCandidate[];
}) {
  const [state, setState] = useState(workspace);
  const unresolved = useMemo(() => summarizeUnresolved(state), [state]);

  const roles: NormalizedTrack["role"][] = ["DX", "MX", "FX", "BG", "VO"];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs">
        <Badge variant="warning">Unresolved: {unresolved.totalUnresolved}</Badge>
        <Badge variant="accent">Track {unresolved.unresolvedTrackMappings}</Badge>
        <Badge variant="accent">Marker {unresolved.unresolvedMarkerMappings}</Badge>
        <Badge variant="accent">Metadata {unresolved.unresolvedMetadataMappings}</Badge>
        <Badge variant="accent">Field Recorder {unresolved.unresolvedFieldRecorderMappings}</Badge>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Track Mapping Editor</h4>
          <div className="flex gap-2">
            {roles.map((role) => (
              <Button key={role} size="sm" variant="secondary" onClick={() => setState((prev) => applyBulkTrackTarget(prev, role, `${role}_MAIN`))}>
                Bulk {role} → {role}_MAIN
              </Button>
            ))}
          </div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted">
            <tr>
              <th className="px-2 py-1 text-left">Source Track</th>
              <th className="px-2 py-1 text-left">Role</th>
              <th className="px-2 py-1 text-left">Nuendo Target</th>
              <th className="px-2 py-1 text-left">State</th>
            </tr>
          </thead>
          <tbody>
            {state.trackMappings.map((item) => (
              <tr key={item.trackId} className="border-t border-border">
                <td className="px-2 py-1">{item.sourceName}</td>
                <td className="px-2 py-1">{item.sourceRole}</td>
                <td className="px-2 py-1 font-mono text-[11px]">{item.targetNuendoTrack}</td>
                <td className="px-2 py-1"><Badge variant={item.state === "mapped" ? "success" : "warning"}>{item.state}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Marker Mapping / Review</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setState((prev) => toggleAllMarkers(prev, true))}>Include all markers</Button>
            <Button size="sm" variant="secondary" onClick={() => setState((prev) => toggleAllMarkers(prev, false))}>Exclude all markers</Button>
          </div>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted">
            <tr>
              <th className="px-2 py-1 text-left">Source Label</th>
              <th className="px-2 py-1 text-left">Export Label</th>
              <th className="px-2 py-1 text-left">EDL/CSV</th>
              <th className="px-2 py-1 text-left">State</th>
            </tr>
          </thead>
          <tbody>
            {state.markerMappings.map((item) => (
              <tr key={item.markerId} className="border-t border-border">
                <td className="px-2 py-1">{item.sourceLabel}</td>
                <td className="px-2 py-1">{item.exportLabel}</td>
                <td className="px-2 py-1">{item.includeInEdl ? "EDL" : "-"} / {item.includeInCsv ? "CSV" : "-"}</td>
                <td className="px-2 py-1"><Badge variant={item.state === "mapped" ? "success" : "warning"}>{item.state}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm font-semibold">Metadata Mapping Editor</h4>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted">
            <tr>
              <th className="px-2 py-1 text-left">Source File</th>
              <th className="px-2 py-1 text-left">Reel/Tape/Scene/Take</th>
              <th className="px-2 py-1 text-left">State</th>
            </tr>
          </thead>
          <tbody>
            {state.metadataMappings.map((item) => (
              <tr key={item.clipId} className="border-t border-border">
                <td className="px-2 py-1 font-mono text-[11px]">{item.sourceFileName}</td>
                <td className="px-2 py-1">{item.reel || "—"} / {item.tape || "—"} / {item.scene || "—"} / {item.take || "—"}</td>
                <td className="px-2 py-1"><Badge variant={item.state === "resolved" ? "success" : "warning"}>{item.state}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Field Recorder Candidate Review</h4>
          <Button size="sm" variant="secondary" onClick={() => setState((prev) => selectFieldRecorderCandidates(prev, 80, fieldRecorderCandidates))}>
            Bulk select score ≥ 80
          </Button>
        </div>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-panelAlt text-muted">
            <tr>
              <th className="px-2 py-1 text-left">Candidate</th>
              <th className="px-2 py-1 text-left">Strategy</th>
              <th className="px-2 py-1 text-left">Selected</th>
              <th className="px-2 py-1 text-left">State</th>
            </tr>
          </thead>
          <tbody>
            {state.fieldRecorderMappings.map((item) => (
              <tr key={item.candidateId} className="border-t border-border">
                <td className="px-2 py-1 font-mono text-[11px]">{item.candidateFile}</td>
                <td className="px-2 py-1">{item.strategy}</td>
                <td className="px-2 py-1">{item.selected ? "yes" : "no"}</td>
                <td className="px-2 py-1"><Badge variant={item.state === "matched" ? "success" : "warning"}>{item.state}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

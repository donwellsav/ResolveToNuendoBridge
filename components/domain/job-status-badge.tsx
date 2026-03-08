import { Badge } from "@/components/ui/badge";
import type { JobStatus } from "@/lib/types";

const statusVariant: Record<JobStatus, "neutral" | "success" | "warning" | "danger" | "accent"> = {
  draft: "neutral",
  queued: "accent",
  processing: "accent",
  needs_review: "warning",
  completed: "success",
  failed: "danger",
};

export function JobStatusBadge({ status }: { status: JobStatus }) {
  return <Badge variant={statusVariant[status]}>{status.replace("_", " ")}</Badge>;
}

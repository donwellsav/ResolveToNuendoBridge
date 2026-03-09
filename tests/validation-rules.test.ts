import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { importTurnoverFolder } from "../lib/services/importer";

const fixture = path.join(process.cwd(), "fixtures", "intake/rvr-205-aaf-only");

test("validation rules generate preservation issues for missing expected intake files and blocked delivery", async () => {
  const imported = await importTurnoverFolder(fixture);

  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-missing-reference_video"));
  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-missing-marker_export"));
  assert.ok(imported.preservationIssues.some((issue) => issue.id === "issue-delivery-blocked"));
});

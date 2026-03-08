import path from "node:path";

import { translationJobs as fallbackJobs } from "./mock-data";
import { importTurnoverFolder } from "./services/importer";
import type { TranslationJob } from "./types";

const fixtureFolder = path.join(process.cwd(), "fixtures", "turnover-basic");

export async function getTranslationJobs(): Promise<TranslationJob[]> {
  try {
    const imported = await importTurnoverFolder(fixtureFolder);
    return [imported];
  } catch {
    return fallbackJobs;
  }
}

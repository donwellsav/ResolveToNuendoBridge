import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import type { ExternalExecutionPackage } from "../types";

export async function materializeExternalExecutionPackage(bundle: ExternalExecutionPackage): Promise<string[]> {
  const writtenPaths: string[] = [];

  for (const file of bundle.files) {
    const absoluteFile = path.join(process.cwd(), bundle.rootPath, file.relativePath);
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    await writeFile(absoluteFile, file.contentPreview, "utf8");
    writtenPaths.push(path.relative(process.cwd(), absoluteFile));
  }

  return writtenPaths.sort((a, b) => a.localeCompare(b));
}

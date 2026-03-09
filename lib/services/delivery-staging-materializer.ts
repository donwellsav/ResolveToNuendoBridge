import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import type { DeliveryStagingBundle } from "../types";

export async function materializeStagedDeliveryBundle(bundle: DeliveryStagingBundle): Promise<string[]> {
  const writtenPaths: string[] = [];
  for (const directory of bundle.directories) {
    const absoluteDir = path.join(process.cwd(), bundle.rootPath, directory.relativePath);
    await mkdir(absoluteDir, { recursive: true });
  }

  for (const file of bundle.files) {
    const absoluteFile = path.join(process.cwd(), bundle.rootPath, file.relativePath);
    const absoluteDir = path.dirname(absoluteFile);
    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absoluteFile, file.contentPreview, "utf8");
    writtenPaths.push(path.relative(process.cwd(), absoluteFile));
  }

  return writtenPaths.sort((a, b) => a.localeCompare(b));
}

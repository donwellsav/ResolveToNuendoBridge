import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";

import type { WriterRunBundle } from "../types";

export async function materializeWriterRunBundle(bundle: WriterRunBundle, rootPath: string): Promise<string[]> {
  const writtenPaths: string[] = [];
  for (const file of bundle.files) {
    const absoluteFile = path.join(process.cwd(), rootPath, file.relativePath);
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    await writeFile(absoluteFile, file.contentPreview, "utf8");
    writtenPaths.push(path.relative(process.cwd(), absoluteFile));
  }
  return writtenPaths.sort((a, b) => a.localeCompare(b));
}

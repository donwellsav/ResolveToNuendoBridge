import type { TranslationJob } from "@/lib/types";

export interface ResolveImportService {
  validateBundle(input: unknown): Promise<{ valid: boolean; issues: string[] }>;
  previewBundle(input: unknown): Promise<{ timelineName: string; events: number }>;
}

export interface NuendoExportService {
  buildExport(job: TranslationJob): Promise<{ artifactName: string; warnings: string[] }>;
}

export interface PersistenceService {
  saveJobs(jobs: TranslationJob[]): Promise<void>;
  loadJobs(): Promise<TranslationJob[]>;
}

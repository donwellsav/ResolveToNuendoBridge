import type { Job } from "@/lib/domain";

export interface ResolveImportService {
  validateBundle(input: unknown): Promise<{ valid: boolean; issues: string[] }>;
  previewBundle(input: unknown): Promise<{ timelineName: string; events: number }>;
}

export interface NuendoExportService {
  buildExport(job: Job): Promise<{ artifactName: string; warnings: string[] }>;
}

export interface PersistenceService {
  saveJobs(jobs: Job[]): Promise<void>;
  loadJobs(): Promise<Job[]>;
}

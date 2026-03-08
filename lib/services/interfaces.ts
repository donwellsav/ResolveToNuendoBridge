import type { DeliveryPackage, SourceBundle, TranslationJob, TranslationModel } from "../types";

export interface ResolveImportService {
  importFolder(folderPath: string): Promise<TranslationJob>;
  validateBundle(input: SourceBundle): Promise<{ valid: boolean; issues: string[] }>;
  previewBundle(input: SourceBundle): Promise<{ timelineName: string; events: number }>;
}

export interface NuendoExportService {
  buildExport(job: TranslationJob, model: TranslationModel): Promise<{ packagePlan: DeliveryPackage; warnings: string[] }>;
}

export interface PersistenceService {
  saveJobs(jobs: TranslationJob[]): Promise<void>;
  loadJobs(): Promise<TranslationJob[]>;
}

import type { NuendoExportService, PersistenceService, ResolveImportService } from "@/lib/services/interfaces";

export const resolveImportStub: ResolveImportService = {
  async validateBundle(input) {
    return {
      valid: input.intakeAssets.length > 0,
      issues: input.intakeAssets.length > 0 ? [] : ["No intake assets found. Importer cannot proceed."],
    };
  },
  async previewBundle(input) {
    return {
      timelineName: input.resolveTimelineVersion,
      events: 0,
    };
  },
};

export const nuendoExportStub: NuendoExportService = {
  async buildExport(job) {
    return {
      packagePlan: job.deliveryPackage,
      warnings: ["Stub mode: Nuendo export writer is not implemented in Phase 1."],
    };
  },
};

export const persistenceStub: PersistenceService = {
  async saveJobs() {
    return;
  },
  async loadJobs() {
    return [];
  },
};

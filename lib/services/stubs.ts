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
      warnings: ["Planner mode: Nuendo export writer is not implemented in the current phase."],
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

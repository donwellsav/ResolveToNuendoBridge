import type { TranslationJob } from "@/lib/types";
import type { NuendoExportService, PersistenceService, ResolveImportService } from "@/lib/services/interfaces";

export const resolveImportStub: ResolveImportService = {
  async validateBundle() {
    return {
      valid: true,
      issues: ["Stub mode: Resolve parser is not implemented in Phase 1."],
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

import type { Job } from "@/lib/domain";
import type {
  NuendoExportService,
  PersistenceService,
  ResolveImportService,
} from "@/lib/services/interfaces";

export const resolveImportStub: ResolveImportService = {
  async validateBundle() {
    return {
      valid: true,
      issues: ["Stub mode: parser not implemented in Phase 1."],
    };
  },
  async previewBundle() {
    return {
      timelineName: "Stub Timeline",
      events: 0,
    };
  },
};

export const nuendoExportStub: NuendoExportService = {
  async buildExport(job: Job) {
    return {
      artifactName: `${job.id}.nuendo.stub.json`,
      warnings: ["Stub mode: export writer not implemented in Phase 1."],
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

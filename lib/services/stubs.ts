import type { TranslationJob } from "../types";
import type { NuendoExportService, PersistenceService, ResolveImportService } from "./interfaces";
import { planNuendoDelivery } from "./exporter";
import { importTurnoverFolder } from "./importer";

export const resolveImportStub: ResolveImportService = {
  async importFolder(folderPath) {
    return importTurnoverFolder(folderPath);
  },
  async validateBundle(input) {
    return {
      valid: input.intakeAssets.length > 0,
      issues: input.intakeAssets.length > 0 ? [] : ["No intake assets found."],
    };
  },
  async previewBundle(input) {
    return {
      timelineName: input.resolveTimelineVersion,
      events: input.intakeAssets.length,
    };
  },
};

export const nuendoExportStub: NuendoExportService = {
  async buildExport(job, model) {
    return planNuendoDelivery(job, model);
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

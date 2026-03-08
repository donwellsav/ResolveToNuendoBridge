import type { DeliveryPackage, TranslationJob, TranslationModel } from "../types";

export async function planNuendoDelivery(job: TranslationJob, _model: TranslationModel): Promise<{ packagePlan: DeliveryPackage; warnings: string[] }> {
  return {
    packagePlan: job.deliveryPackage,
    warnings: ["Stub mode: Nuendo export writing is not implemented in Phase 2A."],
  };
}

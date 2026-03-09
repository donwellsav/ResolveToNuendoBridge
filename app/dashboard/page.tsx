import { ReviewAwareDashboardMetrics } from "@/components/domain/review-aware-dashboard-metrics";
import { AppShell } from "@/components/layout/app-shell";
import { getTranslationJobs } from "@/lib/job-source";

export default async function DashboardPage() {
  const translationJobs = await getTranslationJobs();

  return (
    <AppShell title="Dashboard">
      <ReviewAwareDashboardMetrics jobs={translationJobs} />
    </AppShell>
  );
}

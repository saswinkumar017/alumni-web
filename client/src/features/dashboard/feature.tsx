import type { SessionUser } from "@/types";
import { AlumniDashboardClient } from "./_components/alumni-dashboard-client";
import { MetricsSection } from "./_sections/metrics-section";
import { PendingRequestsSection } from "./_sections/pending-requests-section";
import { QuickActionsSection } from "./_sections/quick-actions-section";
import { WelcomeSection } from "./_sections/welcome-section";

export function AlumniDashboard({ user }: { user: SessionUser }) {
  return <AlumniDashboardClient user={user} />;
}

export function AdminDashboard({ user }: { user: SessionUser }) {
  return (
    <div>
      <WelcomeSection
        user={user}
        heading="Admin Dashboard"
        description="System-wide metrics and pending actions."
      />
      <MetricsSection metrics={[]} />
      <PendingRequestsSection requests={[]} />
      <QuickActionsSection actions={[]} />
    </div>
  );
}

import { DashboardHeader } from "../components/dashboard-header";
import { KpiStatsGrid } from "../components/kpi-stats-grid";
import { PipelineStatusCards } from "../components/pipeline-status-cards";
import { RecentQuotesTable } from "../components/recent-quotes-table";
import { DealHealthWidget } from "../components/deal-health-widget";

export function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* 1. Header with Greetings, Role, and Action Buttons */}
      <DashboardHeader />

      {/* 2. Executive 4-Card KPI Grid */}
      <KpiStatsGrid />

      {/* 3. 6-Stage Quote-to-Cash Pipeline Tracker */}
      <PipelineStatusCards />

      {/* 4. Split Section: Recent Quotations Feed & Deal Health Radar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <RecentQuotesTable />
        </div>
        <div className="lg:col-span-4">
          <DealHealthWidget />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;

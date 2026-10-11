/**
 * Analytics charts for the dashboard. Receives the dashboard stats from the page
 * (one shared query) instead of fetching them again.
 */
import { Badge, Panel } from '../ui';
import { LeadStatusChart, InquiryStatusChart, ConversionRateCard, RevenueTrendChart } from './DashboardCharts';

export default function AdminStatsSection({ stats }) {
    const leadStats = {
        total: stats.totalLeads,
        newLeads: stats.newLeads,
        qualified: stats.qualifiedLeads,
        won: stats.wonLeads,
        totalValue: stats.leadTotalValue,
        ...stats.leadsByStatus, // status counts for the charts
    };
    const inquiryStats = { total: stats.totalInquiries, ...stats.inquiriesByStatus };

    return (
        <div className="space-y-4">
            <Panel title="Conversion">
                <ConversionRateCard inquiryStats={inquiryStats} leadStats={leadStats} />
            </Panel>

            <Panel title="Revenue" actions={<Badge>Last 6 months</Badge>}>
                <RevenueTrendChart />
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Leads by status" actions={<span className="text-xs text-fg-subtle">Total <span className="font-mono tabular-nums text-fg">{leadStats.total || 0}</span></span>}>
                    <LeadStatusChart data={leadStats} />
                </Panel>
                <Panel title="Inquiries by status" actions={<span className="text-xs text-fg-subtle">Total <span className="font-mono tabular-nums text-fg">{inquiryStats.total || 0}</span></span>}>
                    <InquiryStatusChart data={inquiryStats} />
                </Panel>
            </div>
        </div>
    );
}

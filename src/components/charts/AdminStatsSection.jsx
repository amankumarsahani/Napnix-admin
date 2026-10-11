/**
 * Analytics charts for the dashboard. Receives the dashboard stats from the page
 * (one shared query) instead of fetching them again. The old Revenue panel was removed:
 * it never received data (there is no revenue-trend endpoint), so it always read empty.
 */
import { Panel } from '../ui';
import { LeadStatusChart, InquiryStatusChart, ConversionRateCard } from './DashboardCharts';

export default function AdminStatsSection({ stats }) {
    const leadStats = {
        total: stats.totalLeads,
        newLeads: stats.newLeads,
        qualified: stats.qualifiedLeads,
        won: stats.wonLeads,
        totalValue: stats.leadTotalValue,
        ...stats.leadsByStatus, // status counts for the charts
    };
    // API groups inquiries by status name ({ new, contacted, resolved, converted }); the charts
    // read *Count keys, which were never present, so the donut was empty and conversion showed 0%
    const byStatus = stats.inquiriesByStatus || {};
    const inquiryStats = {
        total: stats.totalInquiries,
        newCount: byStatus.new || 0,
        contactedCount: byStatus.contacted || 0,
        resolvedCount: byStatus.resolved || 0,
        convertedCount: byStatus.converted || 0,
    };

    return (
        <div className="space-y-4">
            <Panel title="Conversion">
                <ConversionRateCard inquiryStats={inquiryStats} leadStats={leadStats} />
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

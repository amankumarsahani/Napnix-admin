import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiBriefcase, FiInbox, FiUsers } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import AdminStatsSection from '../components/charts/AdminStatsSection';
import { dashboardAPI } from '../api';
import { Avatar, DataTable, PageHeader, Panel, QueryState, Skeleton, StatCard, StatusBadge, cx } from '../components/ui';

const inr = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

// Which real stat cards each role sees (no deltas: the API has no previous-period comparison)
const CARDS_BY_ROLE = {
    admin: ['revenue', 'projects', 'leads', 'inquiries'],
    manager: ['revenue', 'projects', 'leads'],
    sales_operator: ['leads', 'inquiries'],
    user: ['projects'],
};

function ScoreBar({ score }) {
    const value = Math.max(0, Math.min(100, Number(score) || 0));
    const tone = value > 80 ? 'bg-success' : value > 50 ? 'bg-warning' : 'bg-danger';
    return (
        <span className="inline-flex items-center justify-end gap-2">
            <span className="w-16 h-1.5 rounded-full bg-surface-3 overflow-hidden" aria-hidden="true">
                <span className={cx('block h-full rounded-full', tone)} style={{ width: `${value}%` }} />
            </span>
            <span className="font-mono tabular-nums w-7 text-right">{value}</span>
        </span>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const role = user?.role || 'user';
    const showAnalytics = role === 'admin' || role === 'sales_operator';

    const statsQuery = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: () => dashboardAPI.getStats(),
        staleTime: 2 * 60 * 1000,
    });
    const activityQuery = useQuery({
        queryKey: ['dashboard-recent-activity'],
        queryFn: () => dashboardAPI.getRecentActivity(),
        staleTime: 2 * 60 * 1000,
    });

    const s = statsQuery.data || {};
    const cards = {
        revenue: <StatCard key="revenue" label="Total revenue" value={inr(s.revenue)} hint="From projects" />,
        projects: <StatCard key="projects" label="Active projects" value={s.activeProjects || 0} icon={<FiBriefcase className="size-4" />} />,
        leads: <StatCard key="leads" label="New leads" value={s.newLeads || 0} hint={`${s.totalLeads || 0} leads in total`} icon={<FiUsers className="size-4" />} />,
        inquiries: <StatCard key="inquiries" label="New inquiries" value={s.pendingInquiries || 0} hint="Waiting for a first reply" icon={<FiInbox className="size-4" />} />,
    };
    const visible = CARDS_BY_ROLE[role] || CARDS_BY_ROLE.user;

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader
                title={`Welcome back, ${user?.firstName || 'there'}`}
                description="Here's what needs attention today."
            />

            <QueryState
                query={statsQuery}
                isEmpty={() => false}
                skeleton={
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {visible.map(k => <Skeleton key={k} className="h-[104px] rounded-md" />)}
                    </div>
                }
            >
                {() => (
                    <div className={cx('grid grid-cols-1 sm:grid-cols-2 gap-4', visible.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3')}>
                        {visible.map(k => cards[k])}
                    </div>
                )}
            </QueryState>

            {showAnalytics && statsQuery.data && (
                <section aria-labelledby="analytics-heading" className="space-y-3">
                    <h2 id="analytics-heading" className="text-base font-semibold text-fg">
                        {role === 'admin' ? 'Analytics' : 'My performance'}
                    </h2>
                    <AdminStatsSection stats={statsQuery.data} />
                </section>
            )}

            <Panel
                title="Recent leads"
                flush
                actions={<Link to="/leads" className="text-sm font-medium text-accent hover:underline">View all</Link>}
            >
                <DataTable
                    caption="Five most recent leads"
                    loading={activityQuery.isLoading}
                    error={activityQuery.error}
                    onRetry={activityQuery.refetch}
                    rows={activityQuery.data?.recentLeads || []}
                    onRowClick={lead => navigate(`/leads/${lead.id}`)}
                    columns={[
                        {
                            key: 'name', header: 'Contact',
                            render: lead => (
                                <span className="flex items-center gap-2.5">
                                    <Avatar name={lead.name} size="sm" />
                                    <span>
                                        <span className="block font-medium">{lead.name}</span>
                                        {lead.company && <span className="block text-xs text-fg-subtle">{lead.company}</span>}
                                    </span>
                                </span>
                            ),
                        },
                        { key: 'value', header: 'Value', align: 'right', mono: true, render: lead => inr(lead.value || lead.estimatedValue) },
                        { key: 'status', header: 'Status', render: lead => <StatusBadge entity="lead" status={lead.status} /> },
                        { key: 'score', header: 'Heat score', align: 'right', render: lead => <ScoreBar score={lead.score} /> },
                    ]}
                />
            </Panel>
        </div>
    );
}

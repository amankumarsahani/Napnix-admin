import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiFileText, FiMail, FiPlus, FiSettings, FiUpload, FiZap } from 'react-icons/fi';
import { nmAnalyticsAPI } from '../../api/nexmail';
import { useChartTheme } from '../../components/charts/useChartTheme';
import { Button, ErrorState, PageHeader, Panel, Skeleton, StatCard } from '../../components/ui';

const ZERO = { contacts: { total: 0, subscribed: 0 }, campaigns: { total: 0, sent: 0, active: 0 }, emails_30d: { total_sent: 0, open_rate: 0, click_rate: 0, total_bounced: 0 } };
const settled = r => (r.status === 'fulfilled' && r.value?.data ? r.value.data : null);

const QUICK = [
    { label: 'New campaign', path: '/email-marketing/campaigns/new', Icon: FiMail },
    { label: 'Import contacts', path: '/email-marketing/contacts', Icon: FiUpload },
    { label: 'Build template', path: '/email-marketing/templates/new', Icon: FiFileText },
    { label: 'New automation', path: '/email-marketing/automations/new', Icon: FiZap },
    { label: 'SMTP setup', path: '/email-marketing/smtp', Icon: FiSettings },
];

export default function EmailMarketingDashboard() {
    const navigate = useNavigate();
    const t = useChartTheme();
    const query = useQuery({
        queryKey: ['nexmail-dashboard'],
        queryFn: async () => {
            const [dash, volume, growth] = await Promise.allSettled([nmAnalyticsAPI.getDashboard(), nmAnalyticsAPI.getSendVolume(30), nmAnalyticsAPI.getGrowth(90)]);
            // The three are independent: one failing does not blank the page, but all three failing is an error
            if (!settled(dash) && !settled(volume) && !settled(growth)) throw new Error('NexMail analytics are unavailable. Check that the NexMail service is running.');
            return { stats: settled(dash) || ZERO, sendVolume: settled(volume) || [], growth: settled(growth) || [] };
        },
        staleTime: 2 * 60 * 1000,
    });

    if (query.isLoading) return <div className="max-w-7xl space-y-4"><Skeleton className="h-8 w-56" /><div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-24 rounded-md" />)}</div><Skeleton className="h-64 rounded-md" /></div>;
    if (query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;

    const { stats, sendVolume, growth } = query.data;
    const e30 = stats.emails_30d || {};
    const tick = { ...t.axisTick, fontSize: 10 };

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <PageHeader
                title="NexMail"
                description="Email marketing analytics"
                actions={<Button variant="primary" onClick={() => navigate('/email-marketing/campaigns/new')}><FiPlus className="size-4" />New campaign</Button>}
            />

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <button type="button" onClick={() => navigate('/email-marketing/contacts')} className="text-left"><StatCard label="Contacts" value={(stats.contacts?.total || 0).toLocaleString('en-IN')} hint={`${(stats.contacts?.subscribed || 0).toLocaleString('en-IN')} subscribed`} /></button>
                <button type="button" onClick={() => navigate('/email-marketing/campaigns')} className="text-left"><StatCard label="Campaigns sent" value={stats.campaigns?.sent || 0} hint={`${stats.campaigns?.total || 0} total`} /></button>
                <StatCard label="Emails sent (30d)" value={(e30.total_sent || 0).toLocaleString('en-IN')} />
                <StatCard label="Open rate" value={`${e30.open_rate || 0}%`} hint="Last 30 days" />
                <StatCard label="Click rate" value={`${e30.click_rate || 0}%`} hint="Last 30 days" />
                <StatCard label="Bounced" value={(e30.total_bounced || 0).toLocaleString('en-IN')} hint="Last 30 days" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Send volume" description="Last 30 days">
                    <ResponsiveContainer width="100%" height={240}>
                        <AreaChart data={sendVolume} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={{ stroke: t.grid }} tickFormatter={v => v?.slice?.(5) || v} />
                            <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip {...t.tooltip} />
                            <Legend iconType="circle" iconSize={9} {...t.legend} />
                            <Area type="monotone" dataKey="sent" name="Sent" stroke={t.series[0]} fill={t.series[0]} fillOpacity={0.15} strokeWidth={2} />
                            <Area type="monotone" dataKey="opened" name="Opened" stroke={t.series[2]} fill="none" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </Panel>
                <Panel title="Subscriber growth" description="Last 90 days">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={growth} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="date" tick={tick} tickLine={false} axisLine={{ stroke: t.grid }} />
                            <YAxis tick={tick} tickLine={false} axisLine={false} allowDecimals={false} />
                            <Tooltip {...t.tooltip} />
                            <Legend iconType="circle" iconSize={9} {...t.legend} />
                            <Bar dataKey="subscribed" name="Subscribed" fill={t.series[0]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="unsubscribed" name="Unsubscribed" fill={t.series[1]} radius={[4, 4, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
            </div>

            <Panel title="Quick actions">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {QUICK.map(item => {
                        const Icon = item.Icon;
                        return (
                            <button key={item.label} type="button" onClick={() => navigate(item.path)}
                                className="flex items-center gap-2.5 rounded-sm border border-border p-3 text-left text-sm font-medium text-fg hover:bg-surface-2">
                                <Icon aria-hidden="true" className="size-4 text-fg-subtle" />{item.label}
                            </button>
                        );
                    })}
                </div>
            </Panel>
        </div>
    );
}

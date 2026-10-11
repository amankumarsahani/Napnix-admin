import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiMonitor, FiRefreshCw, FiSmartphone } from 'react-icons/fi';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { telemetryAdminAPI } from '../../api/admin';
import { useChartTheme } from '../../components/charts/useChartTheme';
import { Badge, Button, DataTable, EmptyState, ErrorState, PageHeader, Panel, Skeleton, StatCard, cx } from '../../components/ui';

// Registry stores SQLite UTC strings ("2026-10-11 07:03:00")
const parseUtc = s => (s ? new Date(s.includes('T') ? s : `${s.replace(' ', 'T')}Z`) : null);
const dayKey = d => d.toLocaleDateString('en-CA'); // local YYYY-MM-DD
const MAX_SLICES = 5; // more categories fold into "Other"

const platformOf = p => {
    const v = String(p || '').toLowerCase();
    return v.includes('ios') ? 'iOS' : v.includes('android') ? 'Android' : v.includes('web') ? 'Web' : 'Other';
};

function topN(counts) {
    const sorted = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    if (sorted.length <= MAX_SLICES + 1) return sorted;
    const rest = sorted.slice(MAX_SLICES).reduce((s, x) => s + x.value, 0);
    return [...sorted.slice(0, MAX_SLICES), { name: 'Other', value: rest }];
}

function Donut({ data, colorFor }) {
    const t = useChartTheme();
    if (!data.length) return <div className="h-64 grid place-items-center text-sm text-fg-subtle">No data yet</div>;
    return (
        <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke={t.surface} strokeWidth={2}>
                    {data.map((d, i) => <Cell key={d.name} fill={colorFor(d, i, t)} />)}
                </Pie>
                <Tooltip {...t.tooltip} />
                <Legend iconType="circle" iconSize={9} {...t.legend} />
            </PieChart>
        </ResponsiveContainer>
    );
}

// Platform keeps a fixed colour per platform; versions take slots in order, "Other" is neutral
const PLATFORM_SLOT = { iOS: 0, Android: 2, Web: 1, Other: null };

export default function Telemetry() {
    const t = useChartTheme();
    const query = useQuery({
        queryKey: ['telemetry-stats'],
        queryFn: telemetryAdminAPI.getStats,
        refetchInterval: 30000,
    });
    const data = query.data;

    const parsed = useMemo(() => {
        if (!data?.devices) return null;
        const platforms = {};
        const versions = {};
        const emails = new Set();
        const tenants = new Set();
        const lastSeenByDay = {};
        let identified = 0;

        for (const d of data.devices) {
            const plat = platformOf(d.platform);
            platforms[plat] = (platforms[plat] || 0) + 1;
            const ver = `${plat === 'Web' ? 'Web' : 'App'} v${d.app_version}${d.build_number ? ` (b${d.build_number})` : ''}`;
            versions[ver] = (versions[ver] || 0) + 1;
            if (d.emails?.length) identified += 1;
            for (const email of d.emails || []) {
                emails.add(email.toLowerCase());
                for (const tn of d.tenants?.[email] || []) tenants.add(tn.slug);
            }
            const seen = parseUtc(d.last_seen_at);
            if (seen) lastSeenByDay[dayKey(seen)] = (lastSeenByDay[dayKey(seen)] || 0) + 1;
        }

        // Last 7 calendar days, including days with no devices
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return { key: dayKey(d), label: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) };
        });
        return {
            platforms: topN(platforms),
            versions: topN(versions),
            lastSeen: days.map(d => ({ day: d.label, devices: lastSeenByDay[d.key] || 0 })),
            users: emails.size,
            tenants: tenants.size,
            identified,
        };
    }, [data]);

    if (query.isLoading) {
        return (
            <div className="max-w-7xl mx-auto space-y-4">
                <Skeleton className="h-8 w-56" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[104px] rounded-md" />)}</div>
                <Skeleton className="h-72 rounded-md" />
            </div>
        );
    }
    if (query.isError || !parsed) {
        return (
            <ErrorState
                error={{ message: 'Could not reach the registry service. Check REGISTRY_URL / REGISTRY_API_KEY on the server and that the registry is running.' }}
                onRetry={query.refetch}
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <PageHeader
                title="Telemetry"
                description="Mobile and web app installs reporting to the registry. Refreshes every 30 seconds."
                actions={
                    <Button onClick={() => query.refetch()} disabled={query.isFetching}>
                        <FiRefreshCw className={cx('size-4', query.isFetching && 'animate-spin')} />Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Devices" value={(data.total_devices ?? data.devices.length).toLocaleString('en-IN')} />
                <StatCard label="Signed-in devices" value={parsed.identified.toLocaleString('en-IN')} hint="At least one account linked" />
                <StatCard label="Unique users" value={parsed.users.toLocaleString('en-IN')} hint="Distinct emails across devices" />
                <StatCard label="Tenants in use" value={parsed.tenants.toLocaleString('en-IN')} hint="Distinct tenants linked" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel title="Platforms">
                    <Donut data={parsed.platforms} colorFor={(d, _i, th) => (PLATFORM_SLOT[d.name] == null ? th.subtle : th.series[PLATFORM_SLOT[d.name]])} />
                </Panel>
                <Panel title="App versions" description={`Top ${MAX_SLICES}; the rest grouped as Other`}>
                    <Donut data={parsed.versions} colorFor={(d, i, th) => (d.name === 'Other' ? th.subtle : th.series[i % th.series.length])} />
                </Panel>
                <Panel title="Devices by last-seen day" description="Each device counts once, on the day it last reported (last 7 days)" className="lg:col-span-2">
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={parsed.lastSeen} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid vertical={false} stroke={t.grid} />
                            <XAxis dataKey="day" tickLine={false} axisLine={{ stroke: t.grid }} tick={t.axisTick} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={t.axisTick} />
                            <Tooltip {...t.tooltip} />
                            <Bar dataKey="devices" name="Devices" fill={t.series[0]} radius={[4, 4, 0, 0]} maxBarSize={36} />
                        </BarChart>
                    </ResponsiveContainer>
                </Panel>
            </div>

            <Panel title="Devices" flush>
                <DataTable
                    caption="Devices"
                    rows={data.devices || []}
                    rowKey={d => d.device_id}
                    empty={<EmptyState title="No devices have reported yet" />}
                    columns={[
                        {
                            key: 'device', header: 'Device',
                            render: d => (
                                <span className="flex items-center gap-3">
                                    {['iOS', 'Android'].includes(platformOf(d.platform))
                                        ? <FiSmartphone aria-hidden="true" className="size-4 text-fg-subtle" />
                                        : <FiMonitor aria-hidden="true" className="size-4 text-fg-subtle" />}
                                    <span>
                                        <span className="block font-mono text-xs" title={d.device_id}>{d.device_id?.split('-')[0]}…</span>
                                        <span className="block text-xs text-fg-subtle truncate max-w-40">{d.device_model}</span>
                                    </span>
                                </span>
                            ),
                        },
                        {
                            key: 'client', header: 'Client',
                            render: d => (
                                <span className="flex flex-col items-start gap-1">
                                    <Badge>{platformOf(d.platform)}</Badge>
                                    <span className="font-mono text-xs text-fg-subtle">v{d.app_version}{d.build_number ? ` (b${d.build_number})` : ''}</span>
                                </span>
                            ),
                        },
                        {
                            key: 'users', header: 'Accounts and tenants',
                            render: d => (d.emails?.length ? (
                                <ul className="space-y-1.5">
                                    {d.emails.map(email => (
                                        <li key={email}>
                                            <span className="block text-sm">{email}</span>
                                            <span className="flex flex-wrap gap-1 mt-0.5">
                                                {(d.tenants?.[email] || []).length
                                                    ? d.tenants[email].map(tn => <Badge key={tn.slug} tone="info">{tn.name}<span className="text-fg-subtle">· {tn.industry}</span></Badge>)
                                                    : <span className="text-xs text-fg-subtle">No tenants linked</span>}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <span className="text-xs text-fg-subtle">Not signed in</span>),
                        },
                        {
                            key: 'seen', header: 'Last seen', align: 'right', className: 'whitespace-nowrap text-fg-muted',
                            render: d => {
                                const seen = parseUtc(d.last_seen_at);
                                return seen ? seen.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
                            },
                        },
                    ]}
                />
            </Panel>
        </div>
    );
}

import { useQuery } from '@tanstack/react-query';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { tenantMonitorAPI } from '../../../api/admin';
import { EmptyState, Panel, StatCard } from '../../../components/ui';
import { useChartTheme } from '../../../components/charts/useChartTheme';
import { EventsTable, HealthBadge } from '../../system/monitor/shared';
import { timeAgo } from '../../system/monitor/monitorUtils';

const FEED_LABEL = { ok: 'Receiving', unsupported: 'Tenant not migrated (run migrate:tenants)', error: 'Unreadable', unknown: 'Not checked yet' };

export default function MonitoringTab({ tenant }) {
    const chart = useChartTheme();
    const checks = useQuery({
        queryKey: ['tenant-monitor', 'checks', String(tenant.id)],
        queryFn: () => tenantMonitorAPI.getChecks(tenant.id, 24),
        staleTime: 60 * 1000,
        refetchInterval: 60 * 1000,
    });
    const events = useQuery({
        queryKey: ['tenant-monitor', 'events', { tenantId: tenant.id }],
        queryFn: () => tenantMonitorAPI.getEvents({ tenantId: tenant.id, limit: 50 }),
        staleTime: 60 * 1000,
    });

    const state = checks.data?.state;
    const series = (checks.data?.checks || []).map(c => ({
        t: new Date(c.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        latency: c.ok ? c.latency_ms : null,
        failed: c.ok ? null : 1,
    }));
    const total = series.length;
    const okCount = series.filter(s => s.failed === null).length;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Health" value={<HealthBadge health={state?.health || 'unknown'} />} hint={state?.last_error || (state ? `checked ${timeAgo(state.last_check_at)}` : 'Not checked yet')} />
                <StatCard label="Uptime 24h" value={total ? `${((100 * okCount) / total).toFixed(okCount === total ? 0 : 2)}%` : '—'} hint={`${total} checks`} />
                <StatCard label="PM2" value={state?.pm2_status || '—'} hint={state?.pm2_restarts != null ? `${state.pm2_restarts} restarts · ${state.pm2_memory_mb ?? '?'} MB` : undefined} />
                <StatCard label="Security log" value={state?.security_feed || '—'} hint={FEED_LABEL[state?.security_feed || 'unknown']} />
            </div>

            <Panel title="Response time, last 24 h" description="Gaps are failed checks">
                {total === 0 ? <EmptyState title="No checks yet" description="The monitor checks every minute." /> : (
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke={chart.grid} strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="t" tick={chart.axisTick} minTickGap={40} />
                            <YAxis tick={chart.axisTick} unit=" ms" width={64} />
                            <Tooltip {...chart.tooltip} formatter={v => [`${v} ms`, 'Latency']} />
                            <Area type="monotone" dataKey="latency" stroke={chart.accent} fill={chart.accent} fillOpacity={0.15} connectNulls={false} isAnimationActive={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </Panel>

            <Panel title="Alerts" description="Health and security events for this tenant" flush>
                <EventsTable query={events} showTenant={false} empty={<EmptyState title="No alerts" description="Nothing suspicious seen for this tenant." />} />
            </Panel>
        </div>
    );
}

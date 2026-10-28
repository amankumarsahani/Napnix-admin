import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiRefreshCw } from 'react-icons/fi';
import { tenantMonitorAPI } from '../../api/admin';
import { Button, DataTable, ErrorState, PageHeader, Panel, Select, Skeleton, StatCard, Switch, cx } from '../../components/ui';
import { useChartTheme } from '../../components/charts/useChartTheme';
import { AlertsPanel, MetricPanel, StateTimeline } from './monitor/charts';
import { HealthBadge } from './monitor/shared';
import {
    buildAxis, eventRows, formatDuration, num, pivot, serverRows, seriesFor, tenantSummary, timeline,
} from './monitor/metricsData';

const RANGES = [
    { id: '1h', label: '1h' },
    { id: '6h', label: '6h' },
    { id: '24h', label: '24h' },
    { id: '7d', label: '7d' },
];
const REFRESH_MS = 30 * 1000;

const pct = v => (v === null || v === undefined ? '—' : `${Number(v).toFixed(v >= 99.995 ? 0 : 2)}%`);
const orDash = (v, unit = '') => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString()}${unit}`);

export default function Monitoring() {
    const [range, setRange] = useState('6h');
    const [tenantId, setTenantId] = useState('');
    const [auto, setAuto] = useState(true);
    const chart = useChartTheme();

    const query = useQuery({
        queryKey: ['tenant-monitor', 'metrics', range, tenantId],
        queryFn: () => tenantMonitorAPI.getMetrics({ range, tenantId: tenantId || undefined }),
        refetchInterval: auto ? REFRESH_MS : false,
        staleTime: 15 * 1000,
        placeholderData: prev => prev, // keep the frame while a new range loads
    });
    const data = query.data;
    const fetching = query.isFetching && !query.isLoading;

    const view = useMemo(() => {
        if (!data) return null;
        const allTenants = data.tenants || [];
        const tenants = tenantId ? allTenants.filter(t => String(t.id) === String(tenantId)) : allTenants;
        // Colour by position in the unfiltered list, so filtering never repaints a tenant.
        const allDefs = seriesFor(allTenants, chart.series, chart.subtle);
        const defs = tenantId ? allDefs.filter(d => d.ids.includes(Number(tenantId))).map(d => ({ ...d, ids: [Number(tenantId)] })) : allDefs;
        const axis = buildAxis(data.from, data.to, data.bucket);
        const serverAxis = buildAxis(data.from, data.to, data.server_bucket);
        const rows = data.tenant_series || [];
        const summary = tenantSummary(rows, tenants);
        const checks = summary.reduce((s, t) => s + t.checks, 0);
        const okChecks = summary.reduce((s, t) => s + (t.uptime === null ? 0 : (t.uptime * t.checks) / 100), 0);
        const lat = summary.map(t => t.latency_ms).filter(v => v !== null);
        return {
            tenants, defs, axis, summary,
            uptime: checks ? (100 * okChecks) / checks : null,
            latency: lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : null,
            latencyRows: pivot(rows, axis, defs, 'latency_ms'),
            requestRows: pivot(rows, axis, defs, 'requests_5m', 'sum'),
            e5Rows: pivot(rows, axis, defs, 'errors_5xx_5m', 'sum'),
            e4Rows: pivot(rows, axis, defs, 'errors_4xx_5m', 'sum'),
            memRows: pivot(rows, axis, defs, 'memory_mb'),
            dbRows: pivot(rows, axis, defs, 'db_latency_ms'),
            timeline: timeline(rows, axis, tenants),
            events: eventRows(data.event_series || [], axis),
            servers: (data.servers || []).map(s => ({ ...s, rows: serverRows(data.server_series || [], serverAxis, s.server_name) })),
        };
    }, [data, tenantId, chart]);

    const common = view && { from: data.from, to: data.to, range: data.range, fetching };
    const alertCount = view ? view.events.reduce((s, r) => s + r.critical + r.high + r.medium + r.low + r.info, 0) : null;
    const up = view ? view.tenants.filter(t => t.health === 'up').length : null;

    return (
        <div>
            <PageHeader
                title="Monitoring"
                description="Tenant and server metrics. Health every minute, server and PM2 every 5 minutes."
                actions={<>
                    <Link to="/monitor-events" className="inline-flex h-8 items-center rounded-sm border border-border-strong px-2.5 text-sm text-fg hover:bg-surface-2">Alerts</Link>
                    <Link to="/tenant-health" className="inline-flex h-8 items-center rounded-sm border border-border-strong px-2.5 text-sm text-fg hover:bg-surface-2">Tenant health</Link>
                </>}
            />

            {/* Filters: one row, scope everything below */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <div role="group" aria-label="Time range" className="inline-flex rounded-sm border border-border-strong p-0.5">
                    {RANGES.map(r => (
                        <button key={r.id} type="button" aria-pressed={range === r.id} onClick={() => setRange(r.id)}
                            className={cx('h-7 rounded-[3px] px-3 text-sm font-medium',
                                range === r.id ? 'bg-accent text-accent-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg')}>
                            {r.label}
                        </button>
                    ))}
                </div>
                <Select aria-label="Tenant" value={tenantId} onChange={e => setTenantId(e.target.value)} className="w-56">
                    <option value="">All tenants</option>
                    {(data?.tenants || []).map(t => <option key={t.id} value={t.id}>{t.slug}</option>)}
                </Select>
                <Switch checked={auto} onChange={setAuto} label="Auto-refresh 30s" />
                <Button size="sm" variant="secondary" onClick={() => query.refetch()} disabled={query.isFetching}>
                    <FiRefreshCw className={cx('size-4', query.isFetching && 'animate-spin')} />Refresh
                </Button>
                {query.dataUpdatedAt > 0 && (
                    <span className="text-xs text-fg-subtle">Updated {new Date(query.dataUpdatedAt).toLocaleTimeString()}</span>
                )}
            </div>

            {query.isError && !data ? <ErrorState error={query.error} onRetry={query.refetch} /> : !view ? (
                <div className="grid gap-4 md:grid-cols-2">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-64" />)}</div>
            ) : (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                        <StatCard label="Tenants up" value={`${up}/${view.tenants.length}`} hint="Current state" />
                        <StatCard label="Uptime" value={pct(view.uptime)} hint={`Over ${data.range}`} />
                        <StatCard label="Avg response" value={orDash(view.latency, ' ms')} hint="Health check, OK only" />
                        <StatCard label="New alerts" value={alertCount} hint={`Over ${data.range}`} />
                        {view.servers.slice(0, 1).map(s => (
                            <ServerStats key={s.server_name} server={s} />
                        ))}
                    </div>

                    <StateTimeline rows={view.timeline} fetching={fetching} />

                    <div className="grid gap-4 xl:grid-cols-2">
                        <MetricPanel title="Response time" description="Average health-check latency, ms" unit="ms" rows={view.latencyRows} series={view.defs} {...common} />
                        <MetricPanel title="Requests" description="Requests in the trailing 5 minutes" rows={view.requestRows} series={view.defs} {...common} />
                        <MetricPanel title="Server errors (5xx)" description="5xx responses in the trailing 5 minutes" rows={view.e5Rows} series={view.defs} {...common} />
                        <MetricPanel title="Client errors (4xx)" description="4xx responses in the trailing 5 minutes — spikes can mean scanning" rows={view.e4Rows} series={view.defs} {...common} />
                        <MetricPanel title="Process memory" description="Tenant process RSS, MB" unit="MB" rows={view.memRows} series={view.defs} {...common} />
                        <MetricPanel title="Database latency" description="SELECT 1 round trip from the tenant, ms" unit="ms" rows={view.dbRows} series={view.defs} {...common} />
                    </div>

                    <AlertsPanel rows={view.events} {...common} />

                    {view.servers.map(s => (
                        <div key={s.server_name} className="space-y-4">
                            <h2 className="pt-2 text-sm font-semibold text-fg">Server · {s.server_name}</h2>
                            <div className="grid gap-4 xl:grid-cols-3">
                                <MetricPanel title="Load average (1 min)" rows={s.rows}
                                    series={[{ key: 'load1', label: 'load 1m', color: chart.series[0] }]}
                                    reference={s.cpu_count ? { value: num(s.cpu_count), label: `${s.cpu_count} cores` } : undefined}
                                    {...common} />
                                <MetricPanel title="Memory used" unit="%" rows={s.rows} yDomain={[0, 100]}
                                    series={[{ key: 'mem_pct', label: 'memory %', color: chart.series[1] }]} {...common} />
                                <MetricPanel title="Disk used (/)" unit="%" rows={s.rows} yDomain={[0, 100]}
                                    series={[{ key: 'disk_pct', label: 'disk %', color: chart.series[2] }]} {...common} />
                            </div>
                            <ProcessTable server={s} />
                        </div>
                    ))}

                    <Panel title="Tenants" description={`Totals over ${data.range}`} flush>
                        <DataTable
                            caption="Tenant metrics"
                            rowKey={r => r.id}
                            rows={view.summary}
                            columns={[
                                { key: 'health', header: 'Now', render: r => <HealthBadge health={r.health} /> },
                                { key: 'slug', header: 'Tenant', render: r => <Link to={`/tenants/${r.id}?tab=monitoring`} className="text-accent hover:underline">{r.slug}</Link> },
                                { key: 'uptime', header: 'Uptime', align: 'right', mono: true, render: r => pct(r.uptime) },
                                { key: 'latency_ms', header: 'Avg response', align: 'right', mono: true, render: r => orDash(r.latency_ms, ' ms') },
                                { key: 'max_5xx', header: 'Peak 5xx', align: 'right', mono: true, render: r => orDash(r.max_5xx) },
                                { key: 'max_4xx', header: 'Peak 4xx', align: 'right', mono: true, render: r => orDash(r.max_4xx) },
                                { key: 'memory_mb', header: 'Avg memory', align: 'right', mono: true, render: r => orDash(r.memory_mb, ' MB') },
                                { key: 'checks', header: 'Checks', align: 'right', mono: true },
                            ]}
                        />
                    </Panel>
                </div>
            )}
        </div>
    );
}

function ServerStats({ server: s }) {
    const memPct = num(s.mem_total_mb) ? (100 * num(s.mem_used_mb)) / num(s.mem_total_mb) : null;
    const diskPct = num(s.disk_total_gb) ? (100 * num(s.disk_used_gb)) / num(s.disk_total_gb) : null;
    return <>
        <StatCard label="Server load" value={orDash(num(s.load1))} hint={s.cpu_count ? `${s.cpu_count} cores · ${s.server_name}` : s.server_name}
            className={num(s.load1) > num(s.cpu_count) ? 'border-warning' : undefined} />
        <StatCard label="Memory used" value={memPct === null ? '—' : `${memPct.toFixed(0)}%`} hint={`${orDash(num(s.mem_used_mb))} / ${orDash(num(s.mem_total_mb))} MB`}
            className={memPct > 90 ? 'border-warning' : undefined} />
        <StatCard label="Disk used" value={diskPct === null ? '—' : `${diskPct.toFixed(0)}%`} hint={`${orDash(num(s.disk_used_gb))} / ${orDash(num(s.disk_total_gb))} GB`}
            className={diskPct > 85 ? 'border-warning' : undefined} />
    </>;
}

function ProcessTable({ server }) {
    const procs = [...(server.processes || [])].sort((a, b) => (b.mem_mb || 0) - (a.mem_mb || 0));
    return (
        <Panel title="PM2 processes" description={`Latest sample · ${procs.length} processes`} flush>
            <DataTable
                caption="PM2 processes"
                rowKey={r => r.name}
                rows={procs}
                columns={[
                    { key: 'name', header: 'Process', render: r => <span className="font-mono text-xs">{r.name}</span> },
                    { key: 'status', header: 'Status', render: r => (
                        <span className={cx('text-xs font-medium', r.status === 'online' ? 'text-success' : r.status === 'stopped' ? 'text-fg-subtle' : 'text-danger')}>{r.status}</span>
                    ) },
                    { key: 'cpu', header: 'CPU', align: 'right', mono: true, render: r => (r.cpu === null ? '—' : `${r.cpu}%`) },
                    { key: 'mem_mb', header: 'Memory', align: 'right', mono: true, render: r => orDash(r.mem_mb, ' MB') },
                    { key: 'restarts', header: 'Restarts', align: 'right', mono: true },
                    { key: 'uptime_s', header: 'Uptime', align: 'right', mono: true, render: r => formatDuration(r.uptime_s) },
                ]}
            />
        </Panel>
    );
}

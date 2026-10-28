import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FiRefreshCw } from 'react-icons/fi';
import { tenantMonitorAPI } from '../../api/admin';
import { Button, DataTable, EmptyState, PageHeader, Panel, StatCard, cx } from '../../components/ui';
import { HealthBadge } from './monitor/shared';
import { timeAgo } from './monitor/monitorUtils';

const fmtPct = v => (v === null || v === undefined ? '—' : `${Number(v).toFixed(Number(v) === 100 ? 0 : 2)}%`);

export default function TenantHealth() {
    const navigate = useNavigate();
    const query = useQuery({
        queryKey: ['tenant-monitor', 'overview'],
        queryFn: tenantMonitorAPI.getOverview,
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
    });
    const summary = query.data?.summary || {};
    const tenants = query.data?.tenants || [];

    const columns = [
        { key: 'health', header: 'Health', render: r => <HealthBadge health={r.health} /> },
        { key: 'name', header: 'Tenant', render: r => (
            <span className="flex flex-col">
                <span className="font-medium">{r.name}</span>
                <span className="text-xs text-fg-subtle">{r.slug} · {r.industry_type}</span>
            </span>
        ) },
        { key: 'uptime_24h', header: 'Uptime 24h', align: 'right', mono: true, render: r => fmtPct(r.uptime_24h) },
        { key: 'last_latency_ms', header: 'Latency', align: 'right', mono: true, render: r => (r.last_latency_ms != null ? `${r.last_latency_ms} ms` : '—') },
        { key: 'pm2', header: 'PM2', render: r => (
            <span className={cx('text-xs', r.pm2_status && r.pm2_status !== 'online' && 'text-danger font-medium')}>
                {r.pm2_status || '—'}{r.pm2_restarts != null && <span className="text-fg-subtle"> · {r.pm2_restarts} restarts</span>}
            </span>
        ) },
        { key: 'memory', header: 'Memory', align: 'right', mono: true, render: r => {
            const mb = r.pm2_memory_mb ?? r.memory_rss_mb;
            return mb != null ? `${mb} MB` : '—';
        } },
        { key: 'errors', header: '5xx / 4xx (5m)', align: 'right', mono: true, render: r => (
            r.errors_5xx_5m == null ? '—' : <span><span className={cx(r.errors_5xx_5m > 0 && 'text-danger')}>{r.errors_5xx_5m}</span> / {r.errors_4xx_5m}</span>
        ) },
        { key: 'open_events', header: 'Open alerts', align: 'right', mono: true, render: r => (
            Number(r.open_events) > 0 ? <span className="font-semibold text-danger">{r.open_events}</span> : '0'
        ) },
        { key: 'last_check_at', header: 'Checked', render: r => (
            <span className="whitespace-nowrap text-fg-muted" title={r.last_error || undefined}>
                {timeAgo(r.last_check_at)}{r.health === 'down' && r.last_ok_at && <span className="block text-xs text-danger">last OK {timeAgo(r.last_ok_at)}</span>}
            </span>
        ) },
    ];

    return (
        <div>
            <PageHeader
                title="Tenant health"
                description="Live status of every trial/active NapCRM tenant. Checked every minute; PM2 and security every 5 minutes."
                actions={<>
                    <Link to="/monitor-events" className="inline-flex h-8 items-center rounded-sm border border-border-strong px-2.5 text-sm text-fg hover:bg-surface-2">All alerts</Link>
                    <Button size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
                        <FiRefreshCw className={cx('size-4', query.isFetching && 'animate-spin')} />Refresh
                    </Button>
                </>}
            />

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Up" value={summary.up ?? '—'} />
                <StatCard label="Degraded" value={summary.degraded ?? '—'} hint="1–2 failed checks or slow" />
                <StatCard label="Down" value={summary.down ?? '—'} hint="3+ failed checks in a row" className={summary.down > 0 ? 'border-danger' : undefined} />
                <StatCard label="Open alerts" value={summary.open_events ?? '—'} hint="Medium and above, not acknowledged" />
            </div>

            <Panel flush>
                <DataTable
                    caption="Tenant health"
                    columns={columns}
                    rows={tenants}
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    onRowClick={r => navigate(`/tenants/${r.id}?tab=monitoring`)}
                    empty={<EmptyState title="No live tenants" description="Trial and active tenants appear here once the monitor has checked them." />}
                />
            </Panel>
        </div>
    );
}

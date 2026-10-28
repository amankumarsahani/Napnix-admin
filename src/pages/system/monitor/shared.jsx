import { Badge, Button, DataTable } from '../../../components/ui';
import { HEALTH_TONE, RULE_LABELS, SEVERITY_TONE, timeAgo, useAcknowledge } from './monitorUtils';

export function HealthBadge({ health }) {
    return <Badge tone={HEALTH_TONE[health] || 'neutral'}>{health || 'unknown'}</Badge>;
}

export function SeverityBadge({ severity }) {
    return <Badge tone={SEVERITY_TONE[severity] || 'neutral'} className={severity === 'critical' ? 'font-semibold uppercase' : undefined}>{severity}</Badge>;
}

/** Event list shared by the Monitor Events page and the tenant Monitoring tab. */
export function EventsTable({ query, showTenant = true, empty }) {
    const ack = useAcknowledge();
    const rows = query.data?.events || [];
    const columns = [
        { key: 'severity', header: 'Severity', render: r => <SeverityBadge severity={r.severity} /> },
        ...(showTenant ? [{ key: 'tenant', header: 'Tenant', render: r => r.tenant_slug || (r.server_name ? `server: ${r.server_name}` : 'monitor host') }] : []),
        { key: 'rule', header: 'Rule', render: r => <span className="whitespace-nowrap">{RULE_LABELS[r.rule] || r.rule}</span> },
        { key: 'summary', header: 'What happened', className: 'min-w-[16rem]', render: r => (
            <span>{r.summary}{r.occurrences > 1 && <span className="ml-1 text-fg-subtle">×{r.occurrences}</span>}</span>
        ) },
        { key: 'last_seen_at', header: 'Last seen', render: r => <span className="whitespace-nowrap text-fg-muted" title={new Date(r.last_seen_at).toLocaleString()}>{timeAgo(r.last_seen_at)}</span> },
    ];
    return (
        <DataTable
            caption="Monitor events"
            columns={columns}
            rows={rows}
            loading={query.isLoading}
            error={query.error}
            onRetry={query.refetch}
            empty={empty}
            actions={r => r.acknowledged_at
                ? <span className="text-xs text-fg-subtle whitespace-nowrap">Acked{r.acknowledged_by_name ? ` by ${r.acknowledged_by_name}` : ''}</span>
                : <Button size="sm" variant="ghost" disabled={ack.isPending} onClick={() => ack.mutate([r.id])}>Acknowledge</Button>}
        />
    );
}

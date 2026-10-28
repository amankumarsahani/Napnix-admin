import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tenantMonitorAPI } from '../../api/admin';
import { Button, Checkbox, EmptyState, PageHeader, Panel, Select } from '../../components/ui';
import { EventsTable } from './monitor/shared';
import { RULE_LABELS, useAcknowledge } from './monitor/monitorUtils';

const LIMIT = 50;

export default function MonitorEvents() {
    const [filters, setFilters] = useState({ category: '', severity: '', rule: '', open: true });
    const [page, setPage] = useState(1);
    const set = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };

    const params = {
        category: filters.category || undefined,
        severity: filters.severity || undefined,
        rule: filters.rule || undefined,
        open: filters.open ? '1' : undefined,
        page, limit: LIMIT,
    };
    const query = useQuery({
        queryKey: ['tenant-monitor', 'events', params],
        queryFn: () => tenantMonitorAPI.getEvents(params),
        staleTime: 30 * 1000,
        refetchInterval: 60 * 1000,
        placeholderData: prev => prev,
    });
    const ack = useAcknowledge();
    const events = query.data?.events || [];
    const total = query.data?.pagination?.total || 0;
    const openIds = events.filter(e => !e.acknowledged_at).map(e => e.id);

    return (
        <div>
            <PageHeader
                title="Monitor alerts"
                description="Health and security rule hits across all tenants. High and critical alerts are also emailed."
                actions={openIds.length > 0 && (
                    <Button size="sm" onClick={() => ack.mutate(openIds)} disabled={ack.isPending}>
                        Acknowledge {openIds.length} on this page
                    </Button>
                )}
            />

            <div className="mb-3 flex flex-wrap items-center gap-3">
                <Select aria-label="Category" value={filters.category} onChange={e => set('category', e.target.value)} className="w-44">
                    <option value="">All categories</option>
                    <option value="health">Health</option>
                    <option value="security">Security</option>
                </Select>
                <Select aria-label="Severity" value={filters.severity} onChange={e => set('severity', e.target.value)} className="w-44">
                    <option value="">All severities</option>
                    {['critical', 'high', 'medium', 'low', 'info'].map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Select aria-label="Rule" value={filters.rule} onChange={e => set('rule', e.target.value)} className="w-64">
                    <option value="">All rules</option>
                    {Object.entries(RULE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
                <Checkbox label="Open only" checked={filters.open} onChange={e => set('open', e.target.checked)} />
            </div>

            <Panel flush>
                <EventsTable
                    query={query}
                    empty={<EmptyState title={filters.open ? 'No open alerts' : 'No alerts'} description="Nothing matched these filters." />}
                />
                {total > LIMIT && (
                    <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-2 text-sm text-fg-muted">
                        <span>Page {page} of {Math.ceil(total / LIMIT)} · {total} alerts</span>
                        <span className="flex gap-2">
                            <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                            <Button size="sm" variant="secondary" disabled={page * LIMIT >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
                        </span>
                    </div>
                )}
            </Panel>
        </div>
    );
}

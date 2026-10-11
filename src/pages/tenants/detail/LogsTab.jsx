import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FiExternalLink, FiRefreshCw } from 'react-icons/fi';
import { tenantsAPI } from '../../../api';
import { Button, Checkbox, ErrorState, Panel, cx } from '../../../components/ui';
import { BASE_DOMAIN } from './helpers';

export default function LogsTab({ tenant }) {
    const [auto, setAuto] = useState(false);
    const boxRef = useRef(null);
    const query = useQuery({
        queryKey: ['tenant-logs', String(tenant.id)],
        queryFn: () => tenantsAPI.getLogs(tenant.id, 150).then(r => r.data?.logs || ''),
        refetchInterval: auto ? 5000 : false,
    });

    // Follow the tail like a terminal
    useEffect(() => {
        if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }, [query.data]);

    return (
        <Panel
            title="PM2 logs"
            description="Last 150 lines from the tenant's process"
            actions={
                <span className="flex items-center gap-3">
                    <Checkbox label="Auto-refresh" checked={auto} onChange={e => setAuto(e.target.checked)} />
                    <Button size="sm" onClick={() => query.refetch()} disabled={query.isFetching}>
                        <FiRefreshCw className={cx('size-4', query.isFetching && 'animate-spin')} />Refresh
                    </Button>
                    <a href={`https://${tenant.slug}-crm.${BASE_DOMAIN}`} target="_blank" rel="noreferrer"
                        className="inline-flex h-8 items-center gap-1.5 rounded-sm border border-border-strong px-2.5 text-sm text-fg hover:bg-surface-2">
                        <FiExternalLink className="size-4" />Open CRM
                    </a>
                </span>
            }
        >
            {query.isError ? <ErrorState error={query.error} onRetry={query.refetch} /> : (
                <pre ref={boxRef} tabIndex={0} aria-label="Process logs" className="h-80 overflow-auto whitespace-pre-wrap break-words rounded-sm border border-border bg-surface-2 p-3 font-mono text-xs text-fg-muted">
                    {query.isLoading ? 'Loading logs…' : (query.data || 'No logs available')}
                </pre>
            )}
        </Panel>
    );
}

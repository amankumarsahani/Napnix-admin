import { useQuery } from '@tanstack/react-query';
import { FiBox } from 'react-icons/fi';
import { toolsAPI } from '../../api';
import { Badge, EmptyState, ErrorState, PageHeader, Panel, Skeleton } from '../../components/ui';

const STATUS_TONE = { active: 'success', beta: 'warning', deprecated: 'danger', maintenance: 'neutral' };

export default function ToolRegistry() {
    const query = useQuery({ queryKey: ['tools'], queryFn: () => toolsAPI.getAll().then(r => r.data || []), staleTime: 5 * 60 * 1000 });
    const tools = query.data || [];

    let body;
    if (query.isLoading) body = <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-md" />)}</div>;
    else if (query.isError) body = <ErrorState error={query.error} onRetry={query.refetch} />;
    else if (!tools.length) body = <Panel><EmptyState title="No tools registered" /></Panel>;
    else {
        body = (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tools.map(tool => (
                    <Panel key={tool.id}>
                        <div className="flex items-start gap-3">
                            <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-sm bg-surface-3 text-fg-subtle"><FiBox className="size-5" /></span>
                            <div className="min-w-0">
                                <h2 className="font-semibold text-fg">{tool.name}</h2>
                                <p className="mt-0.5 flex items-center gap-2 text-xs text-fg-muted">
                                    <span className="font-mono">v{tool.version}</span>
                                    <Badge tone={STATUS_TONE[tool.status] || 'neutral'} className="capitalize">{tool.status}</Badge>
                                </p>
                            </div>
                        </div>
                        {tool.description && <p className="mt-3 text-sm text-fg-muted">{tool.description}</p>}
                        {tool.base_url_pattern && (
                            <p className="mt-4 border-t border-border pt-3 text-xs text-fg-muted">
                                URL pattern <code className="ml-1 rounded-sm bg-surface-3 px-1.5 py-0.5 font-mono">{tool.base_url_pattern}</code>
                            </p>
                        )}
                    </Panel>
                ))}
            </div>
        );
    }

    return (
        <div className="max-w-6xl space-y-4">
            <PageHeader title="Tool registry" description="Napnix platform tools and services" />
            {body}
        </div>
    );
}

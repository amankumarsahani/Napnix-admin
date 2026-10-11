import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiPlay } from 'react-icons/fi';
import { workflowsAPI } from '../../api';
import Pagination from '../../components/common/Pagination';
import { nodeKindLabel } from './workflow/palette';
import {
    Badge, Button, ConfirmDialog, DataTable, Drawer, EmptyState, ErrorState, PageHeader, Panel, Select, Skeleton,
    StatCard, StatusBadge, Switch, Tabs, cx,
} from '../../components/ui';

const PAGE_SIZE = 20;
const LIVE = ['pending', 'running', 'waiting'];
const TABS = [{ id: 'runs', label: 'Runs' }, { id: 'steps', label: 'Steps' }];
const STATUS_FILTERS = [['', 'All runs'], ['completed', 'Completed'], ['failed', 'Failed'], ['running', 'Running'], ['waiting', 'Waiting']];

// MySQL timestamps arrive as ISO strings; JSON columns arrive parsed or as strings depending on the driver
const asDate = v => (v ? new Date(v) : null);
const asJson = v => { if (v == null || v === '') return null; if (typeof v !== 'string') return v; try { return JSON.parse(v); } catch { return v; } };
const when = v => { const d = asDate(v); return d ? d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; };
function duration(start, end) {
    const a = asDate(start), b = asDate(end);
    if (!a || !b) return '—';
    const ms = Math.max(0, b - a);
    if (ms < 1000) return `${ms} ms`;
    const s = Math.round(ms / 1000);
    return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
const seconds = n => (n == null ? '—' : n < 60 ? `${Math.round(n)}s` : `${Math.floor(n / 60)}m ${Math.round(n % 60)}s`);
const ago = v => {
    const d = asDate(v);
    if (!d) return 'Never';
    const m = Math.round((Date.now() - d) / 60000);
    return m < 1 ? 'Just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

function JsonBlock({ label, value }) {
    const data = asJson(value);
    if (data == null || (typeof data === 'object' && !Object.keys(data).length)) return null;
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return (
        <details className="mt-2 group">
            <summary className="cursor-pointer text-xs text-fg-muted hover:text-fg select-none">{label}</summary>
            <pre className="mt-1 max-h-64 overflow-auto rounded-sm border border-border bg-surface-2 p-2 font-mono text-2xs text-fg-muted whitespace-pre-wrap break-words">
                {text.length > 6000 ? `${text.slice(0, 6000)}\n… truncated` : text}
            </pre>
        </details>
    );
}

function RunDrawer({ run, onClose }) {
    const query = useQuery({
        queryKey: ['workflow-run-logs', run?.id],
        queryFn: () => workflowsAPI.getExecutionLogs(run.id).then(r => r.data),
        enabled: !!run,
        refetchInterval: q => (LIVE.includes(q.state.data?.execution?.status) ? 4000 : false),
    });
    const logs = query.data?.logs || [];
    const execution = query.data?.execution || run;
    return (
        <Drawer open={!!run} onClose={onClose} title={run ? `Run #${run.id}` : ''} description={run ? `Started ${when(run.started_at)}` : undefined}>
            {run && (
                <div className="p-5 space-y-4 overflow-y-auto">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge entity="execution" status={execution.status} />
                        <span className="text-sm text-fg-muted">Took <span className="font-mono tabular-nums text-fg">{duration(execution.started_at, execution.completed_at)}</span></span>
                    </div>
                    {execution.error_message && (
                        <p role="alert" className="rounded-sm border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger whitespace-pre-wrap break-words">{execution.error_message}</p>
                    )}
                    <JsonBlock label="Trigger data" value={execution.trigger_data} />

                    <div>
                        <h3 className="mb-2 text-sm font-semibold text-fg">Steps</h3>
                        {query.isLoading ? <Skeleton className="h-24 rounded-md" />
                            : query.isError ? <ErrorState error={query.error} onRetry={query.refetch} />
                                : !logs.length ? <p className="text-sm text-fg-subtle">No steps recorded for this run.</p> : (
                                    <ol className="space-y-2">
                                        {logs.map((log, i) => (
                                            <li key={log.id} className="rounded-sm border border-border p-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="font-mono text-2xs text-fg-subtle">{i + 1}</span>
                                                    <span className="text-sm font-medium text-fg">{log.label || nodeKindLabel(log.action_type || log.node_type)}</span>
                                                    <StatusBadge entity="execution" status={log.status} />
                                                    <span className="ml-auto font-mono tabular-nums text-xs text-fg-subtle">{duration(log.started_at, log.completed_at)}</span>
                                                </div>
                                                {log.error_message && <p className="mt-2 text-sm text-danger whitespace-pre-wrap break-words">{log.error_message}</p>}
                                                <JsonBlock label="Input" value={log.input_data} />
                                                <JsonBlock label="Output" value={log.output_data} />
                                            </li>
                                        ))}
                                    </ol>
                                )}
                    </div>
                </div>
            )}
        </Drawer>
    );
}

// Walk the graph from the trigger so steps read in run order; anything unreachable goes last
function orderedNodes(nodes = [], connections = []) {
    const byId = new Map(nodes.map(n => [n.id, n]));
    const next = new Map();
    connections.forEach(c => next.set(c.source_node_id, [...(next.get(c.source_node_id) || []), c.target_node_id]));
    const seen = new Set();
    const out = [];
    const queue = nodes.filter(n => n.node_type === 'trigger').map(n => n.id);
    while (queue.length) {
        const id = queue.shift();
        if (seen.has(id) || !byId.has(id)) continue;
        seen.add(id);
        out.push(byId.get(id));
        queue.push(...(next.get(id) || []));
    }
    return [...out, ...nodes.filter(n => !seen.has(n.id))];
}

const KIND_TONE = { trigger: 'success', action: 'info', condition: 'warning', delay: 'neutral', whatsapp: 'success' };

export default function WorkflowDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [params, setParams] = useSearchParams();
    const tab = TABS.some(t => t.id === params.get('tab')) ? params.get('tab') : 'runs';
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('');
    const [openRun, setOpenRun] = useState(null);
    const [confirmRun, setConfirmRun] = useState(false);

    const wfQuery = useQuery({
        queryKey: ['workflow', id],
        queryFn: () => workflowsAPI.getById(id).then(r => r.data || r),
        staleTime: 30 * 1000,
    });
    const runsParams = { page, limit: PAGE_SIZE, ...(status && { status }) };
    const runsQuery = useQuery({
        queryKey: ['workflow-runs', id, runsParams],
        queryFn: () => workflowsAPI.getExecutions(id, runsParams),
        placeholderData: keepPreviousData,
        refetchInterval: q => ((q.state.data?.data || []).some(r => LIVE.includes(r.status)) ? 5000 : false),
    });

    const refreshAll = () => {
        queryClient.invalidateQueries({ queryKey: ['workflow', id] });
        queryClient.invalidateQueries({ queryKey: ['workflow-runs', id] });
        queryClient.invalidateQueries({ queryKey: ['workflows'] });
    };
    const toggle = useMutation({
        mutationFn: () => workflowsAPI.toggle(id),
        onSuccess: () => { toast.success('Status updated'); refreshAll(); },
        onError: () => toast.error('Failed to update status'),
    });
    const run = useMutation({
        mutationFn: () => workflowsAPI.test(id),
        onSuccess: () => { toast.success('Run started'); setConfirmRun(false); setStatus(''); setPage(1); setParams({ tab: 'runs' }, { replace: true }); refreshAll(); },
        onError: err => { toast.error(err.response?.data?.error || 'Could not start the run'); setConfirmRun(false); },
    });

    if (wfQuery.isLoading) return <div className="max-w-6xl space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-24 rounded-md" /><Skeleton className="h-64 rounded-md" /></div>;
    if (wfQuery.isError || !wfQuery.data) return <ErrorState error={wfQuery.error || { message: 'Workflow not found' }} onRetry={wfQuery.refetch} />;

    const wf = wfQuery.data;
    const stats = wf.stats || {};
    const total = Number(stats.execution_count || 0);
    const ok = Number(stats.success_count || 0);
    const failed = Number(stats.failed_count || 0);
    const runs = runsQuery.data?.data || [];
    const pagination = runsQuery.data?.pagination;
    const steps = orderedNodes(wf.nodes, wf.connections);

    return (
        <div className="max-w-6xl space-y-4">
            <PageHeader
                back={{ to: '/workflows', label: 'Workflows' }}
                title={wf.name}
                description={wf.description || undefined}
                actions={
                    <>
                        <Switch checked={!!wf.is_active} onChange={() => toggle.mutate()} disabled={toggle.isPending} label={wf.is_active ? 'Active' : 'Inactive'} />
                        <Button onClick={() => setConfirmRun(true)}><FiPlay className="size-4" />Run now</Button>
                        <Button variant="primary" onClick={() => navigate(`/workflows/${id}/edit`)}><FiEdit2 className="size-4" />Edit</Button>
                    </>
                }
            />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard label="Runs" value={total.toLocaleString('en-IN')} hint={failed ? `${failed} failed` : 'None failed'} />
                <StatCard label="Success rate" value={total ? `${Math.round((ok / total) * 100)}%` : '—'} hint={total ? `${ok} of ${total}` : 'No runs yet'} />
                <StatCard label="Last run" value={ago(stats.last_run_at)} hint={stats.last_run_at ? when(stats.last_run_at) : undefined} />
                <StatCard label="Avg duration" value={seconds(stats.avg_seconds == null ? null : Number(stats.avg_seconds))} hint="Finished runs" />
            </div>

            <Tabs label="Workflow sections" tabs={[{ ...TABS[0], count: total }, { ...TABS[1], count: steps.length }]} value={tab} onChange={t => setParams({ tab: t }, { replace: true })} />

            {tab === 'runs' ? (
                <div className="space-y-3">
                    <div className="max-w-44">
                        <Select aria-label="Filter runs by status" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                            {STATUS_FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </Select>
                    </div>
                    <Panel flush>
                        <DataTable
                            caption="Workflow runs"
                            loading={runsQuery.isLoading}
                            error={runsQuery.error}
                            onRetry={runsQuery.refetch}
                            rows={runs}
                            onRowClick={setOpenRun}
                            className={cx(runsQuery.isPlaceholderData && 'opacity-60')}
                            empty={<EmptyState title={status ? 'No runs with this status' : 'No runs yet'} description={status ? undefined : 'Runs appear here when the trigger fires or you use Run now.'} />}
                            columns={[
                                { key: 'id', header: 'Run', mono: true, render: r => `#${r.id}` },
                                { key: 'status', header: 'Status', render: r => <StatusBadge entity="execution" status={r.status} /> },
                                { key: 'trigger', header: 'Trigger', className: 'text-fg-muted', render: r => r.trigger_type || r.trigger_entity_type || 'trigger' },
                                { key: 'started', header: 'Started', className: 'whitespace-nowrap text-fg-muted', render: r => when(r.started_at) },
                                { key: 'duration', header: 'Duration', align: 'right', mono: true, render: r => (LIVE.includes(r.status) ? '…' : duration(r.started_at, r.completed_at)) },
                                { key: 'error', header: 'Error', render: r => (r.error_message ? <span className="block max-w-xs truncate text-danger" title={r.error_message}>{r.error_message}</span> : <span className="text-fg-subtle">—</span>) },
                            ]}
                        />
                        {pagination && pagination.pages > 1 && (
                            <div className="border-t border-border">
                                <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                            </div>
                        )}
                    </Panel>
                </div>
            ) : (
                <Panel title="Steps in run order" description="Edit the workflow to change them" actions={<Link to={`/workflows/${id}/edit`} className="text-sm text-accent hover:underline">Open editor</Link>}>
                    {steps.length ? (
                        <ol className="space-y-2">
                            {steps.map((n, i) => (
                                <li key={n.id} className="flex flex-wrap items-center gap-2 rounded-sm border border-border px-3 py-2">
                                    <span className="font-mono text-2xs text-fg-subtle w-5">{i + 1}</span>
                                    <Badge tone={KIND_TONE[n.node_type] || 'neutral'} className="capitalize">{n.node_type}</Badge>
                                    <span className="text-sm font-medium text-fg">{n.label || nodeKindLabel(n.action_type)}</span>
                                    {n.action_type && <span className="text-xs text-fg-subtle">{nodeKindLabel(n.action_type)}</span>}
                                </li>
                            ))}
                        </ol>
                    ) : <EmptyState title="No steps yet" description="Open the editor to build this workflow." />}
                </Panel>
            )}

            <RunDrawer run={openRun} onClose={() => setOpenRun(null)} />

            <ConfirmDialog
                open={confirmRun}
                onClose={() => setConfirmRun(false)}
                onConfirm={() => run.mutate()}
                loading={run.isPending}
                variant="primary"
                title="Run this workflow now?"
                message="This is a real run: emails, posts and other actions it contains will happen."
                confirmText="Run now"
            />
        </div>
    );
}

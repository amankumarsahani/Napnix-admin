import { useState } from 'react';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { toolsAPI } from '../../../api';
import { Badge, Button, EmptyState, ErrorState, Field, Input, Panel, Select, Skeleton } from '../../../components/ui';
import { apiError, daysUntil, fmtDate } from './helpers';

function ToolCard({ tool, tenant, assignment, plans }) {
    const qc = useQueryClient();
    const isCrm = tool.slug === 'nexcrm';
    const enabled = Boolean(assignment) && !['suspended', 'cancelled'].includes(assignment.status);
    const [planId, setPlanId] = useState(assignment?.tool_plan_id ? String(assignment.tool_plan_id) : '');
    const [trialDays, setTrialDays] = useState(() => {
        const d = assignment?.status === 'trial' ? daysUntil(assignment.trial_ends_at) : null;
        return d ? String(Math.max(1, d)) : '';
    });

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['tenant-tools', String(tenant.id)] });
        qc.invalidateQueries({ queryKey: ['tenant', String(tenant.id)] });
    };
    const enable = useMutation({
        mutationFn: () => (isCrm
            // CRM provisioning uses the tenant's saved plan and server
            ? toolsAPI.enableCRM(tenant.id, { plan_id: tenant.plan_id, server_id: tenant.server_id || undefined })
            : toolsAPI.enableTool(tenant.id, { tool_id: tool.id, tool_plan_id: planId ? Number(planId) : null, trial_days: trialDays ? Number(trialDays) : null })),
        onSuccess: r => { toast.success(r.message || (isCrm ? 'CRM provisioning started.' : `${tool.name} enabled.`)); refresh(); },
        onError: err => toast.error(apiError(err, `Failed to enable ${tool.name}`)),
    });
    const disable = useMutation({
        mutationFn: () => toolsAPI.disableTool(tenant.id, { tool_id: tool.id }),
        onSuccess: r => { toast.success(r.message || `${tool.name} disabled.`); refresh(); },
        onError: err => toast.error(apiError(err, `Failed to disable ${tool.name}`)),
    });

    return (
        <div className="space-y-4 rounded-sm border border-border p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-fg">{tool.name}</h3>
                        <Badge tone={enabled ? 'success' : 'neutral'}>{assignment?.status || 'not enabled'}</Badge>
                    </div>
                    {tool.description && <p className="mt-1 text-sm text-fg-muted">{tool.description}</p>}
                    {assignment?.plan_name && <p className="mt-1 text-xs text-fg-muted">Plan: <span className="font-medium text-fg">{assignment.plan_name}</span></p>}
                </div>
                {!isCrm && enabled && <Button variant="danger" onClick={() => disable.mutate()} loading={disable.isPending}>Disable</Button>}
                {!enabled && <Button variant="primary" onClick={() => enable.mutate()} loading={enable.isPending}>{isCrm ? 'Provision CRM' : 'Enable'}</Button>}
            </div>

            {isCrm ? (
                <p className="text-xs text-fg-muted">CRM uses the tenant&apos;s saved plan and server, and is managed separately from add-on tools.</p>
            ) : (
                <div className="grid gap-4 md:grid-cols-3">
                    <Field label="Tool plan">
                        <Select value={planId} onChange={e => setPlanId(e.target.value)} disabled={!plans.length}>
                            <option value="">No plan</option>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.name} · ₹{p.price_monthly}/mo</option>)}
                        </Select>
                    </Field>
                    <Field label="Trial days" hint="Empty = active immediately">
                        <Input type="number" min="1" value={trialDays} onChange={e => setTrialDays(e.target.value)} className="font-mono" />
                    </Field>
                    <p className="self-end pb-2 text-xs text-fg-muted">
                        {assignment?.trial_ends_at ? `Trial ends ${fmtDate(assignment.trial_ends_at)}` : 'Enable with a trial or straight to active.'}
                    </p>
                </div>
            )}
        </div>
    );
}

export default function ToolsTab({ tenant }) {
    const id = String(tenant.id);
    const toolsQuery = useQuery({ queryKey: ['tools'], queryFn: () => toolsAPI.getAll().then(r => r.data || []), staleTime: 5 * 60 * 1000 });
    const assignQuery = useQuery({ queryKey: ['tenant-tools', id], queryFn: () => toolsAPI.getTenantTools(id).then(r => r.data || []) });
    const tools = toolsQuery.data || [];
    const planQueries = useQueries({
        queries: tools.map(t => ({ queryKey: ['tool-plans', t.id], queryFn: () => toolsAPI.getPlans(t.id).then(r => r.data || []), staleTime: 5 * 60 * 1000 })),
    });

    if (toolsQuery.isLoading || assignQuery.isLoading) return <Skeleton className="h-64 rounded-md" />;
    if (toolsQuery.isError) return <ErrorState error={toolsQuery.error} onRetry={toolsQuery.refetch} />;
    const byTool = Object.fromEntries((assignQuery.data || []).map(a => [a.tool_id, a]));

    return (
        <Panel title="Tools" description="Enable or suspend add-on products for this tenant.">
            {!tools.length ? <EmptyState title="No tools configured" /> : (
                <div className="grid gap-4">
                    {tools.map((tool, i) => {
                        const a = byTool[tool.id];
                        // remount when the stored assignment changes so the form shows what is saved
                        return <ToolCard key={`${tool.id}|${a?.status}|${a?.tool_plan_id}|${a?.trial_ends_at}`} tool={tool} tenant={tenant} assignment={a} plans={planQueries[i]?.data || []} />;
                    })}
                </div>
            )}
        </Panel>
    );
}

import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, MarkerType, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiX } from 'react-icons/fi';
import { nmAutomationsAPI, nmListsAPI, nmTemplatesAPI } from '../../api/nexmail';
import { useTheme } from '../../contexts/ThemeContext';
import { useChartTheme } from '../../components/charts/useChartTheme';
import { Badge, Button, ConfirmDialog, ErrorState, Field, IconButton, Input, Select, Skeleton, Switch, cx } from '../../components/ui';
import { buildSteps, stepsToGraph } from './automationGraph';

// This editor's Save used to say "Automation saved! (Connect API to persist)" and keep nothing.
const TRIGGERS = [
    ['contact_subscribed', 'Contact subscribes'], ['tag_added', 'Tag added'], ['list_added', 'Added to a list'], ['campaign_opened', 'Campaign opened'],
    ['campaign_clicked', 'Link clicked'], ['inactivity', 'Inactivity'], ['date_based', 'Date field'], ['webhook', 'Webhook'], ['manual', 'Manual enrol'],
];
const ACTIONS = [
    ['send_email', 'Send email'], ['wait', 'Wait / delay'], ['condition', 'If / else'], ['add_tag', 'Add tag'], ['remove_tag', 'Remove tag'],
    ['update_field', 'Update field'], ['move_to_list', 'Add to list'], ['remove_from_list', 'Remove from list'], ['webhook', 'Webhook'], ['notify', 'Notify team'], ['end', 'End'],
];
const labelOf = (list, type) => list.find(([t]) => t === type)?.[1] || type;
const KINDS = {
    trigger: { name: 'Trigger', chip: 'bg-success-soft text-success', handle: '!bg-success', border: 'border-success/60' },
    action: { name: 'Action', chip: 'bg-accent-soft text-accent', handle: '!bg-accent', border: 'border-accent/50' },
    condition: { name: 'Condition', chip: 'bg-warning-soft text-warning', handle: '!bg-warning', border: 'border-warning/60' },
};
const HANDLE = 'size-2.5 !border-2 !border-surface';

function summary(d) {
    const c = d.config || {};
    if (d.actionType === 'wait') return c.duration ? `Wait ${c.duration} ${c.unit || 'hours'}` : '';
    if (d.actionType === 'send_email') return c.subject || (c.template_id ? `Template #${c.template_id}` : '');
    if (d.actionType === 'add_tag' || d.actionType === 'remove_tag' || d.triggerType === 'tag_added') return c.tag ? `Tag: ${c.tag}` : '';
    if (d.actionType === 'condition') return c.field ? `${c.field} ${String(c.operator || '').replace(/_/g, ' ')} ${c.value ?? ''}` : '';
    if (d.triggerType === 'inactivity') return `${c.days || 30} days inactive`;
    return '';
}

function Card({ kind, data, selected }) {
    const k = KINDS[kind];
    const sub = summary(data);
    return (
        <div className={cx('w-52 rounded-md border bg-surface px-3 py-2.5 shadow-pop', selected ? 'border-accent outline outline-2 outline-accent/40' : k.border)}>
            {kind !== 'trigger' && <Handle type="target" position={Position.Top} className={cx(HANDLE, k.handle)} />}
            <span className={cx('inline-block rounded-sm px-1.5 py-0.5 text-2xs font-medium uppercase tracking-wide', k.chip)}>{k.name}</span>
            <p className="mt-1.5 truncate text-sm font-medium text-fg" title={data.label}>{data.label}</p>
            {sub && <p className="mt-0.5 line-clamp-2 text-xs text-fg-muted">{sub}</p>}
            {kind === 'condition' ? (
                <>
                    <div className="mt-2 flex justify-between text-2xs font-medium"><span className="text-success">Yes</span><span className="text-danger">No</span></div>
                    <Handle type="source" position={Position.Bottom} id="yes" style={{ left: '25%' }} className={cx(HANDLE, '!bg-success')} />
                    <Handle type="source" position={Position.Bottom} id="no" style={{ left: '75%' }} className={cx(HANDLE, '!bg-danger')} />
                </>
            ) : <Handle type="source" position={Position.Bottom} className={cx(HANDLE, k.handle)} />}
        </div>
    );
}
// Module-level so React Flow keeps stable component identities
const nodeTypes = {
    trigger: props => <Card kind="trigger" {...props} />,
    action: props => <Card kind="action" {...props} />,
    condition: props => <Card kind="condition" {...props} />,
};

const EDGE = { type: 'smoothstep', animated: true, style: { strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed } };
const START = { id: 'trigger-1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: 'Contact subscribes', triggerType: 'contact_subscribed', config: {} } };
const serialize = (name, nodes, edges) => JSON.stringify([name, nodes.map(n => [n.id, n.type, n.data, Math.round(n.position.x), Math.round(n.position.y)]), edges.map(e => [e.source, e.target, e.sourceHandle || null])]);
let seq = 0;
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;

function Settings({ node, onLabel, onConfig, templates, lists }) {
    const d = node.data;
    const c = d.config || {};
    const f = (label, key, props = {}) => <Field label={label}><Input value={c[key] ?? ''} onChange={e => onConfig(key, e.target.value)} {...props} /></Field>;
    return (
        <div className="space-y-3 p-4">
            <Field label="Label"><Input value={d.label || ''} onChange={e => onLabel(e.target.value)} /></Field>
            {d.actionType === 'send_email' && (
                <>
                    <Field label="Template">
                        <Select value={c.template_id ?? ''} onChange={e => onConfig('template_id', e.target.value ? Number(e.target.value) : '')}>
                            <option value="">Select a template</option>
                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </Select>
                    </Field>
                    {f('Subject override', 'subject')}
                </>
            )}
            {d.actionType === 'wait' && (
                <div className="grid grid-cols-2 gap-2">
                    {f('Duration', 'duration', { type: 'number', min: 1 })}
                    <Field label="Unit"><Select value={c.unit || 'hours'} onChange={e => onConfig('unit', e.target.value)}>{['minutes', 'hours', 'days', 'weeks'].map(u => <option key={u} value={u}>{u}</option>)}</Select></Field>
                </div>
            )}
            {(d.actionType === 'add_tag' || d.actionType === 'remove_tag' || d.triggerType === 'tag_added') && f('Tag name', 'tag')}
            {d.actionType === 'condition' && (
                <>
                    <Field label="Field"><Select value={c.field || ''} onChange={e => onConfig('field', e.target.value)}><option value="">Select field</option>{[['email_score', 'Email score'], ['open_count', 'Open count'], ['click_count', 'Click count'], ['tags', 'Tags'], ['source', 'Source']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
                    <Field label="Operator"><Select value={c.operator || 'equals'} onChange={e => onConfig('operator', e.target.value)}>{[['equals', 'Equals'], ['not_equals', 'Not equals'], ['greater_than', 'Greater than'], ['less_than', 'Less than'], ['contains', 'Contains']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></Field>
                    {f('Value', 'value')}
                </>
            )}
            {(d.actionType === 'move_to_list' || d.actionType === 'remove_from_list') && (
                <Field label="List"><Select value={c.list_id ?? ''} onChange={e => onConfig('list_id', e.target.value ? Number(e.target.value) : '')}><option value="">Select a list</option>{lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</Select></Field>
            )}
            {d.actionType === 'webhook' && (
                <>
                    {f('URL', 'url', { type: 'url', placeholder: 'https://…' })}
                    <Field label="Method"><Select value={c.method || 'POST'} onChange={e => onConfig('method', e.target.value)}>{['POST', 'GET', 'PUT'].map(m => <option key={m}>{m}</option>)}</Select></Field>
                </>
            )}
            {d.triggerType === 'inactivity' && f('Inactive days', 'days', { type: 'number', min: 1, placeholder: '30' })}
        </div>
    );
}

function Editor({ record, isEdit }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { theme } = useTheme();
    const chart = useChartTheme();

    const initial = (() => {
        if (!record) return { nodes: [START], edges: [] };
        const cfg = typeof record.trigger_config === 'string' ? (() => { try { return JSON.parse(record.trigger_config); } catch { return {}; } })() : (record.trigger_config || {});
        const trig = { id: 'trigger-1', type: 'trigger', position: { x: 300, y: 50 }, data: { label: labelOf(TRIGGERS, record.trigger_type), triggerType: record.trigger_type, config: Object.fromEntries(Object.entries(cfg).filter(([k]) => k !== 'graph')) } };
        if (cfg.graph?.nodes?.length) return { nodes: cfg.graph.nodes, edges: cfg.graph.edges.map(e => ({ ...EDGE, ...e })) };
        return stepsToGraph(record.steps || [], trig);
    })();

    const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges);
    const [name, setName] = useState(record?.name || 'New automation');
    const [active, setActive] = useState(record?.status === 'active');
    const [selectedId, setSelectedId] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [baseline, setBaseline] = useState(() => serialize(record?.name || 'New automation', initial.nodes, initial.edges));
    const dirty = serialize(name, nodes, edges) !== baseline;

    const templates = useQuery({ queryKey: ['nexmail-templates', { all: true }], queryFn: () => nmTemplatesAPI.getAll({ limit: 200 }).then(r => r.data || []), staleTime: 5 * 60 * 1000 }).data || [];
    const lists = useQuery({ queryKey: ['nexmail-lists'], queryFn: () => nmListsAPI.getAll().then(r => r.data || []), staleTime: 5 * 60 * 1000 }).data || [];
    const selected = nodes.find(n => n.id === selectedId);

    useEffect(() => {
        if (!dirty) return undefined;
        const warn = e => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const onConnect = useCallback(params => setEdges(eds => addEdge({ ...params, ...EDGE }, eds)), [setEdges]);

    const addNode = (kind, type) => {
        seq += 1;
        const isTrigger = kind === 'trigger';
        if (isTrigger) {
            // a workflow has one trigger: change it in place
            setNodes(nds => nds.map(n => (n.type === 'trigger' ? { ...n, data: { ...n.data, label: labelOf(TRIGGERS, type), triggerType: type, config: {} } } : n)));
            return;
        }
        const id = `${kind}-${seq}-${Math.random().toString(36).slice(2, 6)}`;
        setNodes(nds => [...nds, { id, type: kind, position: { x: 300, y: 80 + nds.length * 120 }, data: { label: labelOf(ACTIONS, type), actionType: type, config: {} } }]);
    };
    const patch = fn => setNodes(nds => nds.map(n => (n.id === selectedId ? { ...n, data: fn(n.data) } : n)));
    const removeNode = () => {
        setNodes(nds => nds.filter(n => n.id !== selectedId));
        setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
        setSelectedId(null);
        setDeleting(false);
    };

    const save = async () => {
        if (!name.trim()) return toast.error('Give the automation a name');
        const { steps, error } = buildSteps(nodes, edges);
        if (error) return toast.error(error);
        const trig = nodes.find(n => n.type === 'trigger');
        const graph = { nodes: nodes.map(n => ({ id: n.id, type: n.type, position: n.position, data: n.data })), edges: edges.map(e => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle || null })) };
        const payload = { name: name.trim(), trigger_type: trig.data.triggerType, trigger_config: { ...(trig.data.config || {}), graph }, steps };
        setSaving(true);
        try {
            const r = isEdit ? await nmAutomationsAPI.update(record.id, payload) : await nmAutomationsAPI.create(payload);
            const id = isEdit ? record.id : r.automationId;
            if (!isEdit && active) await nmAutomationsAPI.activate(id);
            setBaseline(serialize(name, nodes, edges));
            queryClient.invalidateQueries({ queryKey: ['nexmail-automations'] });
            queryClient.invalidateQueries({ queryKey: ['nexmail-automation', String(id)] });
            toast.success(isEdit ? 'Saved' : 'Automation created');
            if (!isEdit) navigate(`/email-marketing/automations/${id}/edit`, { replace: true });
        } catch (err) {
            toast.error(apiErr(err, 'Failed to save the automation'));
        } finally { setSaving(false); }
    };

    const toggleActive = async () => {
        const next = !active;
        setActive(next);
        if (!isEdit) return;
        try {
            await (next ? nmAutomationsAPI.activate(record.id) : nmAutomationsAPI.pause(record.id));
            queryClient.invalidateQueries({ queryKey: ['nexmail-automations'] });
            toast.success(next ? 'Automation activated' : 'Automation paused');
        } catch (err) { setActive(!next); toast.error(apiErr(err, 'Could not change the status')); }
    };

    const leave = () => { if (!dirty || window.confirm('Discard unsaved changes?')) navigate('/email-marketing/automations'); };
    const minimap = n => ({ trigger: chart.success, action: chart.accent, condition: chart.warning }[n.type] || chart.subtle);

    return (
        <div className="-m-4 flex h-[calc(100dvh-52px)] flex-col lg:-m-6">
            <h1 className="sr-only">Automation editor</h1>
            <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
                <IconButton label="Back to automations" onClick={leave}><FiArrowLeft className="size-4" /></IconButton>
                <input aria-label="Automation name" value={name} onChange={e => setName(e.target.value)} className="h-8 w-64 rounded-sm bg-transparent px-1.5 text-base font-semibold text-fg hover:bg-surface-2 focus:bg-surface-2 focus:outline-2 focus:outline-accent" />
                {dirty && <Badge tone="warning">Unsaved</Badge>}
                <div className="ml-auto flex items-center gap-3">
                    <Switch checked={active} onChange={toggleActive} label={active ? 'Active' : 'Draft'} />
                    <Button variant="primary" onClick={save} loading={saving}>Save</Button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1">
                <aside aria-label="Nodes" className="hidden w-56 shrink-0 overflow-y-auto border-r border-border bg-surface p-3 md:block">
                    {[['Triggers', 'trigger', TRIGGERS, 'Replaces the current trigger'], ['Actions', 'action', ACTIONS]].map(([title, kind, list, hint]) => (
                        <section key={title} className="mb-4">
                            <p className="mb-1 px-2 text-xs font-medium text-fg-muted">{title}</p>
                            {hint && <p className="mb-1 px-2 text-2xs text-fg-subtle">{hint}</p>}
                            {list.map(([type, label]) => (
                                <button key={type} type="button" onClick={() => addNode(type === 'condition' ? 'condition' : kind, type)}
                                    className="block w-full rounded-sm px-2 py-1.5 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg">{label}</button>
                            ))}
                        </section>
                    ))}
                </aside>

                <div className="min-w-0 flex-1">
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect}
                        onNodeClick={(_, n) => setSelectedId(n.id)} onPaneClick={() => setSelectedId(null)} nodeTypes={nodeTypes}
                        colorMode={theme === 'dark' ? 'dark' : 'light'} fitView fitViewOptions={{ maxZoom: 1, padding: 0.3 }} className="!bg-surface-2">
                        <Controls showInteractive={false} />
                        <MiniMap nodeColor={minimap} maskColor="rgba(0,0,0,0.12)" pannable zoomable />
                        <Background gap={16} size={1} color={chart.border} />
                    </ReactFlow>
                </div>

                <aside aria-label="Node settings" className="w-72 shrink-0 overflow-y-auto border-l border-border bg-surface">
                    {selected ? (
                        <>
                            <div className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-surface px-4">
                                <h2 className="text-sm font-semibold text-fg">Node settings</h2>
                                <span className="flex gap-0.5">
                                    {selected.type !== 'trigger' && <IconButton size="sm" variant="danger" label="Delete node" onClick={() => setDeleting(true)}><FiTrash2 className="size-4" /></IconButton>}
                                    <IconButton size="sm" label="Close settings" onClick={() => setSelectedId(null)}><FiX className="size-4" /></IconButton>
                                </span>
                            </div>
                            <Settings node={selected} templates={templates} lists={lists}
                                onLabel={label => patch(d => ({ ...d, label }))} onConfig={(k, v) => patch(d => ({ ...d, config: { ...d.config, [k]: v } }))} />
                        </>
                    ) : (
                        <p className="p-6 text-center text-sm text-fg-subtle">Click a node to edit it. Add steps from the left, then connect them by dragging between handles.</p>
                    )}
                </aside>
            </div>

            <ConfirmDialog open={deleting} onClose={() => setDeleting(false)} onConfirm={removeNode} title="Delete this node?" message="The node and its connections are removed. Save to make it permanent." confirmText="Delete node" />
        </div>
    );
}

export default function AutomationEditor() {
    const { id } = useParams();
    const query = useQuery({ queryKey: ['nexmail-automation', id], queryFn: () => nmAutomationsAPI.getById(id).then(r => r.data), enabled: !!id, staleTime: 0 });
    if (id && query.isLoading) return <div className="space-y-4"><Skeleton className="h-10 rounded-md" /><Skeleton className="h-96 rounded-md" /></div>;
    if (id && query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
    return <Editor key={id || 'new'} record={query.data} isEdit={!!id} />;
}

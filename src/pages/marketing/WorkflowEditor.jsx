import { useState, useCallback, useEffect } from 'react';
import { NODE_PALETTE } from './workflow/palette';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useChartTheme } from '../../components/charts/useChartTheme';
import { Badge, Button, ConfirmDialog, Field, IconButton, Input, Switch, cx } from '../../components/ui';
import { nodeTypes } from './workflow/nodeTypes';
import NodeSettings from './workflow/settings/NodeSettings';

import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType,
    Handle,
    Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { workflowsAPI, templatesAPI, documentTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';

// ============================================
// MAIN EDITOR COMPONENT
// ============================================


const PALETTE_GROUPS = [
    ['triggers', 'Triggers', 'bg-success'], ['actions', 'Actions', 'bg-accent'], ['conditions', 'Conditions', 'bg-warning'],
    ['aiBlog', 'AI and SEO', 'bg-accent'], ['whatsapp', 'WhatsApp', 'bg-success'], ['delays', 'Timing', 'bg-fg-subtle'],
];

// What "unsaved" means: anything the save payload contains
const serialize = (name, description, nodes, edges) => JSON.stringify([
    name, description,
    nodes.map(n => [n.id, n.type, n.data, Math.round(n.position.x), Math.round(n.position.y)]),
    edges.map(e => [e.source, e.target, e.sourceHandle || null]),
]);

const WorkflowEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id || id === 'new';


    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [showNodeConfig, setShowNodeConfig] = useState(false);
    const [localConfig, setLocalConfig] = useState({});
    const [localLabel, setLocalLabel] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [paletteSearch, setPaletteSearch] = useState('');
    const [collapsed, setCollapsed] = useState({});
    const [leaveTo, setLeaveTo] = useState(null);
    const [deletingNode, setDeletingNode] = useState(false);
    const [baseline, setBaseline] = useState(() => (isNew ? serialize('New Workflow', '', [{ id: 'trigger-1', type: 'trigger', position: { x: 250, y: 50 }, data: { label: 'Lead Created', triggerType: 'lead_created', config: {} } }], []) : null));
    const queryClient = useQueryClient();
    const { theme } = useTheme();
    const chart = useChartTheme();



    const [emailTemplates, setEmailTemplates] = useState([]);
    const [documentTemplates, setDocumentTemplates] = useState([]);
    const [waAccounts, setWaAccounts] = useState([]);

    // Fetch email templates, document templates, and WA accounts on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await templatesAPI.getAll({ limit: 100 });
                setEmailTemplates(res.data || res.templates || []);
            } catch {
                // silently ignore
            }
            try {
                const res = await documentTemplatesAPI.getAll();
                setDocumentTemplates(res.data || []);
            } catch {
                // silently ignore
            }
            try {
                const { whatsappApi } = await import('../../api/whatsapp');
                const accounts = await whatsappApi.getAccounts();
                setWaAccounts(accounts.filter(a => a.status === 'connected'));
            } catch {
                // silently ignore
            }
        };
        fetchTemplates();
    }, []);

    // Fetch workflow data if editing existing
    useEffect(() => {
        if (!isNew && id && id !== 'undefined') {
            fetchWorkflow();
        } else if (id === 'undefined') {
            toast.error('Invalid workflow access');
            navigate('/workflows');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isNew]);

    // Synchronize local state when selected node changes
    useEffect(() => {
        if (selectedNodeId) {
            const node = nodes.find(n => n.id === selectedNodeId);
            if (node) {
                setLocalConfig(node.data.config || {});
                setLocalLabel(node.data.label || '');
            }
        } else {
            setLocalConfig({});
            setLocalLabel('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNodeId]);

    // Auto-apply config changes to node (debounced) - only when user changes config
    useEffect(() => {
        if (!selectedNodeId) return;

        // Skip initial sync - only apply on actual user changes
        const currentNode = nodes.find(n => n.id === selectedNodeId);
        if (!currentNode) return;

        // Check if values actually changed from what's in the node
        const configChanged = JSON.stringify(currentNode.data.config) !== JSON.stringify(localConfig);
        const labelChanged = currentNode.data.label !== localLabel;

        if (!configChanged && !labelChanged) return;

        const timeoutId = setTimeout(() => {
            setNodes(nds => nds.map(n =>
                n.id === selectedNodeId
                    ? { ...n, data: { ...n.data, label: localLabel, config: localConfig } }
                    : n
            ));
        }, 300);

        return () => clearTimeout(timeoutId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localConfig, localLabel]);


    const fetchWorkflow = async () => {
        try {
            setIsLoading(true);
            const res = await workflowsAPI.getById(id);
            const data = res.data || res;

            setWorkflowName(data.name || 'Untitled Workflow');
            setWorkflowDescription(data.description || '');
            setIsActive(!!data.is_active);
            let loadedNodes = [];
            let loadedEdges = [];

            if (data.canvas_data) {
                loadedNodes = data.canvas_data.nodes || [];
                loadedEdges = data.canvas_data.edges || [];
                setNodes(loadedNodes);
                setEdges(loadedEdges);
            } else if (data.nodes) {
                // Map legacy structure to React Flow format if needed
                const formattedNodes = data.nodes.map(n => {
                    // Safety check for config JSON
                    let nodeConfig = {};
                    try {
                        if (n.config) {
                            nodeConfig = typeof n.config === 'string' ? JSON.parse(n.config) : n.config;
                        } else if (n.data?.config) {
                            nodeConfig = typeof n.data.config === 'string' ? JSON.parse(n.data.config) : n.data.config;
                        }
                    } catch {

                        nodeConfig = {};
                    }

                    return {
                        id: String(n.node_uid || `${n.node_type}-${n.id}`),
                        type: n.node_type || 'action',
                        position: {
                            x: parseFloat(n.position_x) || 250,
                            y: parseFloat(n.position_y) || 100
                        },
                        data: {
                            label: n.label || n.data?.label || '',
                            actionType: n.action_type || n.data?.actionType || null,
                            triggerType: n.trigger_type || n.data?.triggerType || (n.node_type === 'trigger' ? (n.action_type || n.trigger_type) : null),
                            config: nodeConfig
                        }
                    };
                });
                loadedNodes = formattedNodes;
                setNodes(formattedNodes);

                // Map connections to edges
                if (data.connections && data.connections.length > 0) {
                    const formattedEdges = data.connections.map((c, idx) => ({
                        id: String(c.id || `edge-${c.source}-${c.target}-${idx}`),
                        source: String(c.source),
                        target: String(c.target),
                        sourceHandle: c.source_handle === 'default' ? null : c.source_handle,
                        type: 'smoothstep',
                        animated: true,
                        style: { strokeWidth: 2 },
                        markerEnd: { type: MarkerType.ArrowClosed }
                    }));
                    loadedEdges = formattedEdges;
                    setEdges(formattedEdges);
                }
            }
            setBaseline(serialize(data.name || 'Untitled Workflow', data.description || '', loadedNodes, loadedEdges));
        } catch {
            toast.error('Failed to load workflow data');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial nodes and edges
    const initialNodes = isNew ? [
        {
            id: 'trigger-1',
            type: 'trigger',
            position: { x: 250, y: 50 },
            data: { label: 'Lead Created', triggerType: 'lead_created', config: {} }
        }
    ] : [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    // Derive selectedNode from nodes to keep it in sync
    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 }
        }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((event, node) => {
        if (selectedNodeId && selectedNodeId !== node.id) {
            setNodes(nds => nds.map(n => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label: localLabel, config: localConfig } } : n)));
        }
        // sync the panel state in the same batch so the unsaved check never sees a half-switched node
        setLocalConfig(node.data.config || {});
        setLocalLabel(node.data.label || '');
        setSelectedNodeId(node.id);
        setShowNodeConfig(true);
    }, [selectedNodeId, localLabel, localConfig, setNodes]);

    // Add node from palette
    const addNode = (paletteItem) => {
        const nodeId = `${paletteItem.type}-${Date.now()}`;
        const newNode = {
            id: nodeId,
            type: paletteItem.type,
            position: { x: 250, y: nodes.length * 120 + 50 },
            data: {
                label: paletteItem.label,
                actionType: paletteItem.actionType,
                triggerType: paletteItem.id,
                config: {}
            }
        };
        setNodes((nds) => [...nds, newNode]);
    };

    // Delete selected node
    const deleteSelectedNode = () => {
        if (selectedNodeId) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
            setSelectedNodeId(null);
            setShowNodeConfig(false);
        }
        setDeletingNode(false);
    };

    // The config panel debounces edits into `nodes` (300 ms). Merge the pending edit so Save never loses it.
    const liveNodes = selectedNodeId
        ? nodes.map(n => (n.id === selectedNodeId ? { ...n, data: { ...n.data, label: localLabel, config: localConfig } } : n))
        : nodes;
    const key = serialize(workflowName, workflowDescription, liveNodes, edges);
    const dirty = baseline !== null && key !== baseline;

    const saveWorkflow = async () => {
        if (!workflowName.trim()) {
            toast.error('Give the workflow a name');
            return;
        }
        const triggerNode = liveNodes.find(n => n.type === 'trigger');
        if (!triggerNode) {
            toast.error('Workflow must have a trigger node');
            return;
        }

        setSaving(true);
        try {
            const workflowData = {
                name: workflowName.trim(),
                description: workflowDescription,
                trigger_type: triggerNode.data.triggerType || 'lead_created',
                nodes: liveNodes.map(n => ({
                    node_uid: n.id,
                    node_type: n.type,
                    action_type: n.data.actionType || null,
                    trigger_type: n.data.triggerType || null,
                    label: n.data.label,
                    config: n.data.config || {},
                    position_x: Math.round(n.position.x),
                    position_y: Math.round(n.position.y)
                })),
                connections: edges.map((e, idx) => ({
                    id: e.id || `edge-${idx}`,
                    source: e.source,
                    target: e.target,
                    source_handle: e.sourceHandle || 'default'
                })),
                is_active: isActive
            };

            const res = isNew ? await workflowsAPI.create(workflowData) : await workflowsAPI.update(id, workflowData);
            setBaseline(key);
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            queryClient.invalidateQueries({ queryKey: ['workflow'] });
            queryClient.invalidateQueries({ queryKey: ['workflow-runs'] });
            toast.success(isNew ? 'Workflow created' : 'Saved');
            // Stay in the editor after saving an existing workflow; a new one opens its detail page
            if (isNew) navigate(`/workflows/${res.workflowId || res.data?.id}`, { replace: true });
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    // Ctrl/Cmd+S saves; closing the tab with unsaved work asks first
    useEffect(() => {
        const onKey = e => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
                e.preventDefault();
                if (!saving) saveWorkflow();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });
    useEffect(() => {
        if (!dirty) return undefined;
        const warn = e => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const leave = to => (dirty ? setLeaveTo(to) : navigate(to));
    const backTo = isNew ? '/workflows' : `/workflows/${id}`;

    const toggleActive = async () => {
        const next = !isActive;
        setIsActive(next);
        if (isNew) return;
        try {
            await workflowsAPI.toggle(id);
            queryClient.invalidateQueries({ queryKey: ['workflows'] });
            queryClient.invalidateQueries({ queryKey: ['workflow', id] });
            toast.success(next ? 'Workflow activated' : 'Workflow deactivated');
        } catch {
            setIsActive(!next);
            toast.error('Failed to update workflow status');
        }
    };

    const search = paletteSearch.trim().toLowerCase();

    if (isLoading) {
        return (
            <div className="-m-4 lg:-m-6 grid h-[calc(100dvh-52px)] place-items-center">
                <p role="status" className="flex items-center gap-2 text-sm text-fg-muted">
                    <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-accent border-r-transparent" />
                    Loading workflow…
                </p>
            </div>
        );
    }

    const minimapColor = n => ({ trigger: chart.success, action: chart.accent, condition: chart.warning, whatsapp: chart.success }[n.type] || chart.subtle);

    return (
        <div className="-m-4 lg:-m-6 flex h-[calc(100dvh-52px)] overflow-hidden bg-surface-2">
            <h1 className="sr-only">{isNew ? 'New workflow' : `Edit workflow: ${workflowName}`}</h1>

            {/* Node palette */}
            <aside aria-label="Node palette" className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
                <div className="border-b border-border p-3">
                    <div className="relative">
                        <FiSearch aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
                        <Input value={paletteSearch} onChange={e => setPaletteSearch(e.target.value)} placeholder="Search nodes" aria-label="Search nodes" className="pl-8" />
                    </div>
                </div>
                <div className="flex-1 space-y-1 overflow-y-auto p-2">
                    {PALETTE_GROUPS.map(([groupKey, title, dot]) => {
                        const items = NODE_PALETTE[groupKey].filter(i => !search || i.label.toLowerCase().includes(search));
                        if (!items.length) return null;
                        const open = !!search || !collapsed[groupKey];
                        return (
                            <section key={groupKey}>
                                <button
                                    type="button"
                                    aria-expanded={open}
                                    onClick={() => setCollapsed(c => ({ ...c, [groupKey]: !c[groupKey] }))}
                                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-2"
                                >
                                    <span aria-hidden="true" className={cx('size-1.5 rounded-full', dot)} />
                                    {title}
                                    <span className="ml-auto font-mono tabular-nums text-2xs text-fg-subtle">{items.length}</span>
                                </button>
                                {open && (
                                    <ul className="mt-0.5 mb-2">
                                        {items.map(item => (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => addNode(item)}
                                                    className="w-full rounded-sm px-2 py-1.5 pl-6 text-left text-sm text-fg-muted hover:bg-surface-2 hover:text-fg"
                                                >
                                                    {item.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        );
                    })}
                    {search && !PALETTE_GROUPS.some(([k]) => NODE_PALETTE[k].some(i => i.label.toLowerCase().includes(search))) && (
                        <p className="px-2 py-4 text-sm text-fg-subtle">No node matches “{paletteSearch}”.</p>
                    )}
                </div>
            </aside>

            {/* Canvas */}
            <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface px-3">
                    <IconButton label={isNew ? 'Back to workflows' : 'Back to workflow'} onClick={() => leave(backTo)}>
                        <FiArrowLeft className="size-4" />
                    </IconButton>
                    <input
                        aria-label="Workflow name"
                        value={workflowName}
                        onChange={e => setWorkflowName(e.target.value)}
                        placeholder="Workflow name"
                        className="h-8 min-w-0 max-w-md flex-1 rounded-sm bg-transparent px-1.5 text-base font-semibold text-fg placeholder:text-fg-subtle hover:bg-surface-2 focus:bg-surface-2 focus:outline-2 focus:outline-accent"
                    />
                    {dirty && <Badge tone="warning">Unsaved</Badge>}
                    <div className="ml-auto flex items-center gap-3">
                        <Switch checked={isActive} onChange={toggleActive} label={isActive ? 'Active' : 'Inactive'} />
                        {!isNew && <Button onClick={() => leave(`/workflows/${id}?tab=runs`)}>Run history</Button>}
                        <Button variant="primary" onClick={saveWorkflow} loading={saving} title="Save (Ctrl+S)">Save</Button>
                    </div>
                </div>

                <div className="min-h-0 flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        colorMode={theme === 'dark' ? 'dark' : 'light'}
                        fitView
                        fitViewOptions={{ maxZoom: 1, padding: 0.3 }}
                        className="!bg-surface-2"
                    >
                        <Controls showInteractive={false} />
                        <MiniMap nodeColor={minimapColor} maskColor="rgba(0, 0, 0, 0.12)" pannable zoomable />
                        <Background gap={16} size={1} color={chart.border} />
                    </ReactFlow>
                </div>
            </div>

            {/* Node settings */}
            {showNodeConfig && selectedNode && (
                <aside aria-label="Node settings" className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface [&_input[type=checkbox]]:accent-accent [&_input[type=radio]]:accent-accent">
                    <div className="sticky top-0 z-10 flex h-12 items-center justify-between gap-2 border-b border-border bg-surface px-4">
                        <div className="min-w-0">
                            <p className="text-2xs font-medium uppercase tracking-wide text-fg-subtle">{selectedNode.type}</p>
                            <h2 className="truncate text-sm font-semibold text-fg">Node settings</h2>
                        </div>
                        <span className="flex gap-0.5">
                            <IconButton size="sm" variant="danger" label="Delete node" onClick={() => setDeletingNode(true)}><FiTrash2 className="size-4" /></IconButton>
                            <IconButton size="sm" label="Close settings" onClick={() => setShowNodeConfig(false)}><FiX className="size-4" /></IconButton>
                        </span>
                    </div>

                    <div className="space-y-4 p-4">
                        <Field label="Label">
                            <Input value={localLabel} onChange={e => setLocalLabel(e.target.value)} />
                        </Field>

                        <NodeSettings
                            selectedNode={selectedNode}
                            localConfig={localConfig}
                            setLocalConfig={setLocalConfig}
                            id={id}
                            isNew={isNew}
                            emailTemplates={emailTemplates}
                            documentTemplates={documentTemplates}
                            waAccounts={waAccounts}
                        />

                    </div>
                </aside>
            )}

            <ConfirmDialog
                open={deletingNode}
                onClose={() => setDeletingNode(false)}
                onConfirm={deleteSelectedNode}
                title="Delete this node?"
                message={selectedNode && `${selectedNode.data.label || 'This node'} and its connections are removed. Save to make it permanent.`}
                confirmText="Delete node"
            />
            <ConfirmDialog
                open={!!leaveTo}
                onClose={() => setLeaveTo(null)}
                onConfirm={() => navigate(leaveTo)}
                title="Discard unsaved changes?"
                message="You have changes that haven't been saved."
                confirmText="Discard"
            />
        </div>
    );
};

export default WorkflowEditor;

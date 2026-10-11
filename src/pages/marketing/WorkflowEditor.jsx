import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { NODE_PALETTE } from './workflow/palette';
import { useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { FiArrowLeft, FiSearch, FiTrash2, FiX } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useChartTheme } from '../../components/charts/useChartTheme';
import { Badge, Button, ConfirmDialog, Field, IconButton, Input, Switch, cx } from '../../components/ui';
import { nodeTypes } from './workflow/nodeTypes';

// Searchable dropdown component — filters locally, no API calls on type
const SearchableSelect = ({ options, value, onChange, placeholder, emptyLabel, renderOption, getOptionLabel, getOptionValue, hint }) => {
    const [search, setSearch] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = options.find(o => getOptionValue(o) === value);

    const filtered = useMemo(() => {
        if (!search.trim()) return options;
        const q = search.toLowerCase();
        return options.filter(o => getOptionLabel(o).toLowerCase().includes(q));
    }, [options, search, getOptionLabel]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearch('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg cursor-pointer flex items-center justify-between min-h-[38px]"
            >
                <span className={selectedOption ? 'text-fg' : 'text-fg-subtle'}>
                    {selectedOption ? getOptionLabel(selectedOption) : (emptyLabel || placeholder || 'Select...')}
                </span>
                <svg className={`w-4 h-4 text-fg-subtle transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-surface border border-border rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-border">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-2.5 py-1.5 text-sm border border-border rounded-md bg-surface-2 text-fg placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        <button
                            type="button"
                            onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors ${!value ? 'bg-surface-2 font-medium' : 'text-fg-muted'}`}
                        >
                            {emptyLabel || 'None'}
                        </button>
                        {filtered.length === 0 && (
                            <div className="px-3 py-4 text-sm text-fg-subtle text-center">No results found</div>
                        )}
                        {filtered.map((option) => {
                            const optValue = getOptionValue(option);
                            const isSelected = optValue === value;
                            return (
                                <button
                                    type="button"
                                    key={optValue}
                                    onClick={() => { onChange(optValue, option); setIsOpen(false); setSearch(''); }}
                                    className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-2 transition-colors flex items-center justify-between ${isSelected ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400 font-medium' : 'text-fg'}`}
                                >
                                    <span>{renderOption ? renderOption(option) : getOptionLabel(option)}</span>
                                    {isSelected && (
                                        <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            {hint && <p className={HINT_CLS}>{hint}</p>}
        </div>
    );
};
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

const LABEL_CLS = 'block text-sm font-medium text-fg mb-1';
const CONTROL_CLS = 'w-full min-h-9 px-3 py-1.5 rounded-sm border border-border-strong bg-surface text-fg text-sm placeholder:text-fg-subtle focus:outline-none focus-visible:outline-2 focus-visible:outline-accent';
const HINT_CLS = 'text-xs text-fg-subtle mt-1';

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
                <aside aria-label="Node settings" className="w-80 shrink-0 overflow-y-auto border-l border-border bg-surface">
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

                        {/* Trigger-specific config: Lead Created */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'lead_created' || selectedNode.data.label === 'Lead Created') && (
                            <>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        Triggers when a new lead is created
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Source
                                    </label>
                                    <select
                                        value={localConfig?.source_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Sources</option>
                                        <option value="website">Website</option>
                                        <option value="referral">Referral</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="cold_outreach">Cold Outreach</option>
                                        <option value="advertisement">Advertisement</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <p className={HINT_CLS}>Leave empty to trigger for all leads</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Initial Status
                                    </label>
                                    <select
                                        value={localConfig?.status_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, status_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Client Created */}
                        {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'client_created' && (
                            <>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        Triggers when a new client is created
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Client Type
                                    </label>
                                    <select
                                        value={localConfig?.client_type_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Client Types</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                    <p className={HINT_CLS}>Leave empty to trigger for all clients</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Source
                                    </label>
                                    <select
                                        value={localConfig?.source_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Sources</option>
                                        <option value="conversion">Lead Conversion</option>
                                        <option value="direct">Direct Signup</option>
                                        <option value="referral">Referral</option>
                                        <option value="import">Imported</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Lead Status Changed */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'lead_status_changed' || selectedNode.data.label === 'Lead Status Changed') && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Triggers when a lead's status changes
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the lead is changing FROM</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the lead is changing TO</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Client Status Changed */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'client_status_changed' || selectedNode.data.label === 'Client Status Changed') && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Triggers when a client's status changes
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the client is changing FROM</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <p className={HINT_CLS}>The status the client is changing TO</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Client Type
                                    </label>
                                    <select
                                        value={localConfig?.client_type_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All Client Types</option>
                                        <option value="individual">Individual</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Inquiry Created */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'inquiry_created' || selectedNode.data.label === 'Inquiry Created') && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                        Triggers when a new inquiry is submitted
                                    </p>
                                </div>
                                <div className="text-xs text-fg-muted mt-2 italic text-center p-4 border border-dashed border-border-strong rounded-lg">
                                    No additional filters needed for this trigger.
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Inquiry Status Updated */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'inquiry_status_updated' || selectedNode.data.label === 'Inquiry Status Updated') && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Triggers when an inquiry's status changes
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Scheduled */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'scheduled' || selectedNode.data.label === 'Scheduled') && (
                            <>
                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                                    <p className="text-sm text-purple-700 dark:text-purple-400 font-medium">
                                        Triggers on a scheduled time
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Schedule Type
                                    </label>
                                    <select
                                        value={localConfig?.schedule_type || 'daily'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, schedule_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="once">One-time</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Time (24-hour format)
                                    </label>
                                    <input
                                        type="time"
                                        value={localConfig?.schedule_time || '09:00'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, schedule_time: e.target.value })}
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                {localConfig?.schedule_type === 'weekly' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Day of Week
                                        </label>
                                        <select
                                            value={localConfig?.day_of_week || 'monday'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, day_of_week: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="monday">Monday</option>
                                            <option value="tuesday">Tuesday</option>
                                            <option value="wednesday">Wednesday</option>
                                            <option value="thursday">Thursday</option>
                                            <option value="friday">Friday</option>
                                            <option value="saturday">Saturday</option>
                                            <option value="sunday">Sunday</option>
                                        </select>
                                    </div>
                                )}
                                {localConfig?.schedule_type === 'monthly' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Day of Month
                                        </label>
                                        <select
                                            value={localConfig?.day_of_month || '1'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, day_of_month: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            {[...Array(28)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                            ))}
                                        </select>
                                        <p className={HINT_CLS}>Limited to 28 to avoid issues with short months</p>
                                    </div>
                                )}
                                {localConfig?.schedule_type === 'once' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={localConfig?.schedule_date || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, schedule_date: e.target.value })}
                                            className={CONTROL_CLS}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>
                                        Target Entities
                                    </label>
                                    <select
                                        value={localConfig?.target_entity || 'all_leads'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, target_entity: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="all_leads">All Active Leads</option>
                                        <option value="all_clients">All Active Clients</option>
                                        <option value="new_leads">New Leads (last 7 days)</option>
                                        <option value="inactive_leads">Inactive Leads (30+ days)</option>
                                    </select>
                                    <p className={HINT_CLS}>Which entities to run this workflow on</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Stripe Events */}
                        {selectedNode.type === 'trigger' && (
                            ['stripe_payment_received', 'stripe_subscription_created', 'stripe_subscription_cancelled', 'stripe_invoice_paid'].includes(selectedNode.data.triggerType) ||
                            selectedNode.data.label.toLowerCase().includes('stripe')
                        ) && (
                                <>
                                    <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                                        <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                                            Stripe Event: {selectedNode.data.label}
                                        </p>
                                        <p className="text-xs text-fg-muted mt-1">
                                            Trigger automations based on real payment events.
                                        </p>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Filter by Plan
                                        </label>
                                        <select
                                            value={localConfig?.plan_id || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, plan_id: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="">All Plans</option>
                                            <option value="starter">Starter Plan</option>
                                            <option value="growth">Growth Plan</option>
                                            <option value="business">Business Plan</option>
                                        </select>
                                        <p className={HINT_CLS}>Leave empty to trigger for all plans</p>
                                    </div>
                                    {selectedNode.data.triggerType === 'stripe_invoice_paid' && (
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Minimum Amount (USD)
                                            </label>
                                            <input
                                                type="number"
                                                value={localConfig?.min_amount || ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, min_amount: e.target.value })}
                                                className={CONTROL_CLS}
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                        {/* Trigger-specific config: Incoming Webhook */}
                        {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'webhook_received' && (
                            <>
                                <div className="p-3 bg-surface-3 rounded-lg border border-border-strong">
                                    <p className="text-sm text-fg font-medium">Incoming Webhook</p>
                                    <p className="text-xs text-fg-muted mt-1">
                                        Any app can start this workflow by POSTing JSON to the URL below. Its fields become variables, e.g. {'{{email}}'}.
                                    </p>
                                </div>
                                {localConfig?.webhook_secret ? (
                                    <div>
                                        <label className={LABEL_CLS}>Webhook URL</label>
                                        {isNew ? (
                                            <p className="text-xs text-amber-600">Save the workflow first; the URL includes its ID.</p>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input readOnly value={`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api')}/workflows/hooks/${id}/${localConfig.webhook_secret}`} className="flex-1 min-w-0 px-3 py-2 border border-border-strong rounded-lg bg-surface-2 text-fg text-xs font-mono" />
                                                <button type="button" onClick={() => { navigator.clipboard.writeText(`${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api')}/workflows/hooks/${id}/${localConfig.webhook_secret}`); toast.success('Webhook URL copied'); }} className="px-3 py-2 text-xs font-medium rounded-lg border border-border-strong text-fg">Copy</button>
                                            </div>
                                        )}
                                        <p className="text-xs text-fg-muted mt-1">Treat this URL like a password. The workflow must be active.</p>
                                    </div>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => setLocalConfig({ ...localConfig, webhook_secret: crypto.randomUUID().replace(/-/g, '') })}
                                    className="w-full px-3 py-2 text-sm font-medium rounded-lg border border-border-strong text-fg hover:bg-surface-2"
                                >
                                    {localConfig?.webhook_secret ? 'Regenerate secret (old URL stops working)' : 'Generate webhook URL'}
                                </button>
                            </>
                        )}

                        {/* Trigger-specific config: Manual */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'manual' || selectedNode.data.label === 'Manual Trigger') && (
                            <>
                                <div className="p-3 bg-surface-3 rounded-lg border border-border-strong">
                                    <p className="text-sm text-fg font-medium">
                                        Manually triggered workflow
                                    </p>
                                    <p className="text-xs text-fg-muted mt-1">
                                        Run this workflow on-demand from the workflows list
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Target Entity Type
                                    </label>
                                    <select
                                        value={localConfig?.target_type || 'leads'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, target_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="leads">Leads</option>
                                        <option value="clients">Clients</option>
                                        <option value="selected">Selected Entities Only</option>
                                    </select>
                                    <p className={HINT_CLS}>When triggered, run on these entities</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter Query (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.filter_query || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, filter_query: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="status:qualified AND source:website"
                                    />
                                    <p className={HINT_CLS}>Filter entities before running</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: WhatsApp Message Received */}
                        {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'whatsapp_message_received' && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                        Triggers when a WhatsApp message is received
                                    </p>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                                        Available in next nodes: {'{{from_phone}}'}, {'{{from_name}}'}, {'{{message_text}}'}, {'{{account_id}}'}
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Filter by Account (Optional)
                                    </label>
                                    <select
                                        value={localConfig?.account_id_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, account_id_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">All accounts</option>
                                        {waAccounts.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.label} {a.phone ? `(${a.phone})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                    <p className={HINT_CLS}>Leave empty to trigger for messages on any account</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Keyword Filter (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.keyword_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, keyword_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="e.g. pricing, help, demo"
                                    />
                                    <p className={HINT_CLS}>Only trigger if message contains this word (comma-separated for multiple)</p>
                                </div>
                            </>
                        )}

                        {/* Action-specific config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'send_email' && (
                            <>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Email Template
                                    </label>
                                    <SearchableSelect
                                        options={emailTemplates}
                                        value={localConfig?.template_id || ''}
                                        onChange={(val, template) => {
                                            if (val && template) {
                                                setLocalConfig({
                                                    ...localConfig,
                                                    template_id: parseInt(val),
                                                    subject: template.subject,
                                                    body: template.body || template.html_content || template.content
                                                });
                                            } else {
                                                setLocalConfig({ ...localConfig, template_id: null });
                                            }
                                        }}
                                        placeholder="Search email templates..."
                                        emptyLabel="Custom (enter below)"
                                        getOptionLabel={(t) => t.name || t.subject || 'Untitled'}
                                        getOptionValue={(t) => t.id}
                                        renderOption={(t) => (
                                            <span className="flex items-center gap-2">
                                                <span>{t.name}</span>
                                                {t.category && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-fg-muted">{t.category}</span>}
                                            </span>
                                        )}
                                        hint={emailTemplates.length === 0 ? 'No templates found. Go to Templates to create one.' : 'Type to search or select a template'}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        To Email (Recipient)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.to_email || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_email: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="{{email}}"
                                    />
                                    <p className={HINT_CLS}>Use {"{{email}}"} for the inquiry/lead email address</p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        Email Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.subject || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, subject: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Welcome {{contact_name}}!"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Email Body
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={localConfig?.body || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Hello {{contact_name}}, ..."
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Attach Document as PDF
                                    </label>
                                    <SearchableSelect
                                        options={documentTemplates}
                                        value={localConfig?.document_slug || ''}
                                        onChange={(val, doc) => {
                                            if (val && doc) {
                                                setLocalConfig({
                                                    ...localConfig,
                                                    document_slug: val,
                                                    attachment_filename: `Napnix-${(doc.name || val).replace(/\s+/g, '-')}-{{slug}}.pdf`
                                                });
                                            } else {
                                                setLocalConfig({ ...localConfig, document_slug: '', attachment_filename: '' });
                                            }
                                        }}
                                        placeholder="Search document templates..."
                                        emptyLabel="None (no attachment)"
                                        getOptionLabel={(d) => `${d.name} (${d.category || 'general'})`}
                                        getOptionValue={(d) => d.slug}
                                        renderOption={(d) => (
                                            <span className="flex items-center gap-2">
                                                <svg className="w-3.5 h-3.5 text-fg-subtle flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span>{d.name}</span>
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-600 text-fg-muted">{d.category}</span>
                                            </span>
                                        )}
                                        hint={localConfig?.document_slug
                                            ? undefined
                                            : 'Optionally attach a document template as a PDF file'
                                        }
                                    />
                                    {localConfig?.document_slug && (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                            This document will be rendered as PDF and attached to the email.
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Action: Update Lead */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_lead' && (
                            <>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                        Updates fields on the lead
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Update Status To
                                    </label>
                                    <select
                                        value={localConfig?.new_status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_status: e.target.value,
                                            updates: { ...localConfig?.updates, status: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="proposal_sent">Proposal Sent</option>
                                        <option value="negotiating">Negotiating</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Update Source To
                                    </label>
                                    <select
                                        value={localConfig?.new_source || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_source: e.target.value,
                                            updates: { ...localConfig?.updates, source: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="website">Website</option>
                                        <option value="referral">Referral</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="cold_outreach">Cold Outreach</option>
                                        <option value="advertisement">Advertisement</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Add Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.add_tags || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="hot-lead, follow-up"
                                    />
                                </div>
                            </>
                        )}

                        {/* Action: Update Client */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_client' && (
                            <>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                        Updates fields on the client
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Update Status To
                                    </label>
                                    <select
                                        value={localConfig?.new_status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_status: e.target.value,
                                            updates: { ...localConfig?.updates, status: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Update Client Type To
                                    </label>
                                    <select
                                        value={localConfig?.new_client_type || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_client_type: e.target.value,
                                            updates: { ...localConfig?.updates, client_type: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Add Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.add_tags || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                        className={CONTROL_CLS}
                                    />
                                </div>
                            </>
                        )}

                        {/* Action: Update Inquiry */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_inquiry' && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                                        Updates the status of the inquiry
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Set Status to
                                    </label>
                                    <select
                                        value={localConfig?.updates?.status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            updates: { ...localConfig.updates, status: e.target.value }
                                        })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Action: Create Task */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'create_task' && (
                            <>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">
                                        Creates a new task
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.title || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Follow up with {{contact_name}}"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Task Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={localConfig?.description || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Task details..."
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Priority
                                    </label>
                                    <select
                                        value={localConfig?.priority || 'medium'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, priority: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Due In
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={localConfig?.due_in_value || 1}
                                            onChange={(e) => setLocalConfig({ ...localConfig, due_in_value: parseInt(e.target.value) })}
                                            className={CONTROL_CLS}
                                        />
                                        <select
                                            value={localConfig?.due_in_unit || 'days'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, due_in_unit: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="hours">Hours</option>
                                            <option value="days">Days</option>
                                            <option value="weeks">Weeks</option>
                                        </select>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Action: Assign User */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'assign_user' && (
                            <>
                                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                                    <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                                        Assigns an owner/user to the entity
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Assignment Method
                                    </label>
                                    <select
                                        value={localConfig?.assignment_method || 'round_robin'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, assignment_method: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="round_robin">Round Robin</option>
                                        <option value="least_busy">Least Busy</option>
                                        <option value="specific_user">Specific User</option>
                                        <option value="random">Random</option>
                                    </select>
                                </div>
                                {localConfig?.assignment_method === 'specific_user' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            User ID or Email
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.specific_user || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, specific_user: e.target.value })}
                                            className={CONTROL_CLS}
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>
                                        Team/Department Filter
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.team_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, team_filter: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="sales"
                                    />
                                    <p className={HINT_CLS}>Only assign to users in this team</p>
                                </div>
                            </>
                        )}

                        {/* Action: Assign Inquiry */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'assign_inquiry' && (
                            <>
                                <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-800">
                                    <p className="text-sm text-brand-700 dark:text-brand-400 font-medium">
                                        Assigns the inquiry to a specific user
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.user_id || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, user_id: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="User ID"
                                    />
                                </div>
                            </>
                        )}

                        {/* Action: Add Note */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'add_note' && (
                            <>
                                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                                    <p className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                                        Adds a note to the entity
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Note Content
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={localConfig?.content || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, content: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Automated note: {{contact_name}} was qualified via workflow"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Note Type
                                    </label>
                                    <select
                                        value={localConfig?.note_type || 'general'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, note_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="general">General</option>
                                        <option value="call">Call Note</option>
                                        <option value="meeting">Meeting Note</option>
                                        <option value="system">System Note</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Activity Summary (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.summary || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, summary: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="Automated Note"
                                    />
                                    <p className={HINT_CLS}>This will show up in the activity timeline header.</p>
                                </div>
                            </>
                        )}

                        {/* Action: Send Notification */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'send_notification' && (
                            <>
                                <div className="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800">
                                    <p className="text-sm text-pink-700 dark:text-pink-400 font-medium">
                                        Sends an in-app or push notification
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Notification Title
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.title || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="New lead assigned to you"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Notification Message
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={localConfig?.message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="{{contact_name}} from {{company}} needs follow-up"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Send To
                                    </label>
                                    <select
                                        value={localConfig?.send_to || 'assigned_user'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, send_to: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="assigned_user">Assigned User</option>
                                        <option value="all_admins">All Admins</option>
                                        <option value="team">Specific Team</option>
                                        <option value="specific_user">Specific User</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {/* Action: Webhook */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'webhook' && (
                            <>
                                <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                                        Sends data to an external URL
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Webhook URL
                                    </label>
                                    <input
                                        type="url"
                                        value={localConfig?.url || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder="https://api.example.com/webhook"
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        HTTP Method
                                    </label>
                                    <select
                                        value={localConfig?.method || 'POST'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="PATCH">PATCH</option>
                                        <option value="GET">GET</option>
                                    </select>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Headers (JSON)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={localConfig?.headers_json || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, headers_json: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                        placeholder='{"Authorization": "Bearer xxx"}'
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Custom Payload (JSON)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={localConfig?.custom_payload || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, custom_payload: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                        placeholder="Leave empty to send entity data"
                                    />
                                    <p className={HINT_CLS}>Leave empty to send all entity data automatically</p>
                                </div>
                            </>
                        )}

                        {/* Action: AI Assistant */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_assistant' && (
                            <>
                                <div className="p-3 bg-brand-50 dark:bg-brand-900/30 rounded-lg border border-brand-100 dark:border-brand-800">
                                    <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="font-semibold text-sm">AI Assistant</span>
                                    </div>
                                    <p className="text-xs text-brand-600 dark:text-brand-400">
                                        Use AI to analyze data, score leads, or generate content.
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        AI Prompt / Instructions
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={localConfig?.prompt || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, prompt: e.target.value })}
                                        placeholder="e.g. Analyze this lead: {{name}} from {{company}}"
                                        className={CONTROL_CLS}
                                    />
                                    <p className="mt-1 text-[10px] text-fg-subtle">
                                        Use {'{{variable}}'} to inject dynamic data.
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        System Message
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.system_message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, system_message: e.target.value })}
                                        placeholder="e.g. You are an expert sales analyst."
                                        className={CONTROL_CLS}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>
                                            AI Model
                                        </label>
                                        <select
                                            value={localConfig?.model || 'gpt-4o-mini'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <optgroup label="Google Gemini (Free Tier)">
                                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Latest)</option>
                                                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                                            </optgroup>
                                            <optgroup label="OpenAI">
                                                <option value="gpt-4o-mini">GPT-4o Mini</option>
                                                <option value="gpt-4o">GPT-4o</option>
                                                <option value="o1-mini">o1 Mini (Reasoning)</option>
                                                <option value="o1-preview">o1 Preview</option>
                                            </optgroup>
                                            <optgroup label="Groq / Open Source (Speed)">
                                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B</option>
                                                <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                                                <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                            </optgroup>
                                            <optgroup label="xAI Grok">
                                                <option value="grok-beta">Grok Beta</option>
                                                <option value="grok-4">Grok 4 (Flagship)</option>
                                                <option value="grok-3-mini">Grok 3 Mini</option>
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Store Result In
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.output_variable || 'ai_response'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, output_variable: e.target.value })}
                                            placeholder="variable_name"
                                            className={CONTROL_CLS}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="strict_mode"
                                        checked={localConfig?.strict_mode || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, strict_mode: e.target.checked })}
                                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <label htmlFor="strict_mode" className="text-sm text-fg-muted">
                                        Strict Mode (Fail workflow on AI error)
                                    </label>
                                </div>
                            </>
                        )}

                        {/* AI Pick Topic Config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_pick_topic' && (
                            <>
                                <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg border border-pink-100 dark:border-pink-800">
                                    <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                        <span className="font-semibold text-sm">AI Pick Topic</span>
                                    </div>
                                    <p className="text-xs text-pink-600 dark:text-pink-400">
                                        Uses AI to generate a blog topic with SEO keywords.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Blog Niche / Category
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.niche || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, niche: e.target.value })}
                                        placeholder="Default: CRM, lead follow-up and sales process for Indian service businesses"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Brand Context / Instructions
                                    </label>
                                    <textarea
                                        rows={6}
                                        value={localConfig?.brand_context || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, brand_context: e.target.value })}
                                        placeholder="Real facts about Napnix the writer may use (products, audience, real customer stories) plus any extra instructions. Leave empty to use the default Napnix context."
                                        className={CONTROL_CLS}
                                    />
                                    <p className="text-[11px] text-fg-muted mt-1">
                                        Passed to AI Write Blog too. The AI only states facts written here; it never invents stats, quotes or clients.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        AI Model
                                    </label>
                                    <select
                                        value={localConfig?.model || 'llama-3.3-70b-versatile'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <optgroup label="Groq / Open Source (Fast)">
                                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Default)</option>
                                            <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                        </optgroup>
                                        <optgroup label="Google Gemini">
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        </optgroup>
                                        <optgroup label="OpenAI">
                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                        </optgroup>
                                        <optgroup label="xAI Grok">
                                            <option value="grok-beta">Grok Beta</option>
                                            <option value="grok-4">Grok 4</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> blog_topic, blog_keywords[], blog_image_query, blog_outline[]
                                </div>
                            </>
                        )}

                        {/* AI Write Blog Config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_write_blog' && (
                            <>
                                <div className="p-3 bg-pink-50 dark:bg-pink-900/30 rounded-lg border border-pink-100 dark:border-pink-800">
                                    <div className="flex items-center gap-2 text-pink-700 dark:text-pink-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        <span className="font-semibold text-sm">AI Write Blog</span>
                                    </div>
                                    <p className="text-xs text-pink-600 dark:text-pink-400">
                                        Generates full blog content in HTML format.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Word Count
                                        </label>
                                        <input
                                            type="number"
                                            value={localConfig?.word_count || 1000}
                                            onChange={(e) => setLocalConfig({ ...localConfig, word_count: parseInt(e.target.value) || 1000 })}
                                            className={CONTROL_CLS}
                                        />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Tone
                                        </label>
                                        <select
                                            value={localConfig?.tone || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, tone: e.target.value })}
                                            className={CONTROL_CLS}
                                        >
                                            <option value="">Auto (rotate styles)</option>
                                            <option value="professional">Professional</option>
                                            <option value="casual">Casual</option>
                                            <option value="technical">Technical</option>
                                            <option value="friendly">Friendly</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        AI Model
                                    </label>
                                    <select
                                        value={localConfig?.model || 'llama-3.3-70b-versatile'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <optgroup label="Groq / Open Source (Fast)">
                                            <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Default)</option>
                                            <option value="llama-3.1-8b-instant">Llama 3.1 8B</option>
                                            <option value="mixtral-8x7b-32768">Mixtral 8x7B</option>
                                        </optgroup>
                                        <optgroup label="Google Gemini">
                                            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                        </optgroup>
                                        <optgroup label="OpenAI">
                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                        </optgroup>
                                        <optgroup label="xAI Grok">
                                            <option value="grok-beta">Grok Beta</option>
                                            <option value="grok-4">Grok 4</option>
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Uses:</strong> blog_topic, blog_keywords, blog_outline<br />
                                    <strong>Outputs:</strong> blog_title, blog_excerpt, blog_content
                                </div>
                            </>
                        )}

                        {/* AI Fetch Image Config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_fetch_image' && (
                            <>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-100 dark:border-orange-800">
                                    <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="font-semibold text-sm">Fetch Image (Unsplash)</span>
                                    </div>
                                    <p className="text-xs text-orange-600 dark:text-orange-400">
                                        Gets a relevant image from Unsplash based on the AI-generated query.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Query Override (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.query || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, query: e.target.value })}
                                        placeholder="Leave empty to use AI-generated query"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Uses:</strong> blog_image_query<br />
                                    <strong>Outputs:</strong> blog_image, blog_image_credit
                                </div>
                            </>
                        )}

                        {/* AI Post Blog Config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_post_blog' && (
                            <>
                                <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-lg border border-red-100 dark:border-red-800">
                                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        <span className="font-semibold text-sm">Post Blog</span>
                                    </div>
                                    <p className="text-xs text-red-600 dark:text-red-400">
                                        Publishes the generated blog to Napnix website.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Category
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.category || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, category: e.target.value })}
                                        placeholder="General"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.author || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, author: e.target.value })}
                                        placeholder="AI Writer"
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Publish Status
                                    </label>
                                    <select
                                        value={localConfig?.status || 'draft'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, status: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="draft">Draft (Review First)</option>
                                        <option value="published">Published (Auto-Publish)</option>
                                    </select>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Uses:</strong> blog_title, blog_excerpt, blog_content, blog_image<br />
                                    <strong>Outputs:</strong> blog_posted, blog_id, blog_slug
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_agent' && (
                            <>
                                <div className="p-3 bg-violet-50 dark:bg-violet-900/30 rounded-lg border border-violet-100 dark:border-violet-800">
                                    <span className="font-semibold text-sm text-violet-700 dark:text-violet-300">AI Agent</span>
                                    <p className="text-xs text-violet-600 dark:text-violet-400">
                                        Give it a goal. It decides which tools to call, reads the results and repeats until done.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Goal</label>
                                    <textarea rows={5} value={localConfig?.goal || ''} onChange={(e) => setLocalConfig({ ...localConfig, goal: e.target.value })} placeholder="Find one keyword clinic owners search that we rank 8-20 for or don't cover yet, check our existing posts to avoid duplicates, then write one draft targeting it." className={CONTROL_CLS} />
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Tools</label>
                                    {[
                                        ['keyword_research', 'Keyword research (Google Autocomplete)'],
                                        ['gsc_opportunities', 'Search Console opportunities'],
                                        ['list_blog_posts', 'List our blog posts'],
                                        ['write_blog_draft', 'Write blog post'],
                                        ['http_get', 'HTTP GET (allowlisted hosts only)'],
                                    ].map(([id, label]) => {
                                        const tools = localConfig?.tools || ['keyword_research', 'gsc_opportunities', 'list_blog_posts', 'write_blog_draft'];
                                        const required = localConfig?.require_tools || [];
                                        return (
                                            <div key={id} className="flex items-center justify-between gap-2 text-sm text-fg">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={tools.includes(id)}
                                                        onChange={(e) => setLocalConfig({ ...localConfig, tools: e.target.checked ? [...tools, id] : tools.filter(t => t !== id) })}
                                                    />
                                                    {label}
                                                </label>
                                                {tools.includes(id) && (
                                                    <label className="flex items-center gap-1 text-xs text-fg-muted" title="The agent cannot finish until this tool has run successfully">
                                                        <input
                                                            type="checkbox"
                                                            checked={required.includes(id)}
                                                            onChange={(e) => setLocalConfig({ ...localConfig, require_tools: e.target.checked ? [...required, id] : required.filter(t => t !== id) })}
                                                        />
                                                        must use
                                                    </label>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                {(localConfig?.tools || []).includes('http_get') && (
                                    <div>
                                        <label className={LABEL_CLS}>Allowed Hosts</label>
                                        <input type="text" value={localConfig?.allowed_hosts || ''} onChange={(e) => setLocalConfig({ ...localConfig, allowed_hosts: e.target.value })} placeholder="api.napnix.in, napnix.in" className={CONTROL_CLS} />
                                        <p className="text-xs text-fg-muted mt-1">Fetched pages can contain instructions aimed at the agent; only list sites you trust.</p>
                                    </div>
                                )}
                                {(localConfig?.tools || ['write_blog_draft']).includes('write_blog_draft') && (
                                    <label className="flex items-start gap-2 text-sm text-fg">
                                        <input type="checkbox" className="mt-0.5" checked={localConfig?.publish === true} onChange={(e) => setLocalConfig({ ...localConfig, publish: e.target.checked })} />
                                        <span>
                                            Publish blog posts automatically
                                            <span className="block text-xs text-fg-muted">Off = saved as drafts for review. On = live on the website immediately and submitted for indexing.</span>
                                        </span>
                                    </label>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>Brand Context (for blog posts)</label>
                                    <textarea rows={4} value={localConfig?.brand_context || ''} onChange={(e) => setLocalConfig({ ...localConfig, brand_context: e.target.value })} placeholder="Leave empty to use the default Napnix context." className={CONTROL_CLS} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Max Steps</label>
                                        <input type="number" min={1} max={15} value={localConfig?.max_steps || 6} onChange={(e) => setLocalConfig({ ...localConfig, max_steps: parseInt(e.target.value) || 6 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Max Posts</label>
                                        <input type="number" min={1} max={5} value={localConfig?.max_drafts || 1} onChange={(e) => setLocalConfig({ ...localConfig, max_drafts: parseInt(e.target.value) || 1 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Save As</label>
                                        <input type="text" value={localConfig?.output_variable || ''} onChange={(e) => setLocalConfig({ ...localConfig, output_variable: e.target.value })} placeholder="agent_result" className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>AI Model (optional)</label>
                                    <input type="text" value={localConfig?.model || ''} onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })} placeholder="Default model with provider fallback" className={CONTROL_CLS} />
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> {'{{agent_result}}'} (final answer), {'{{agent_result_steps}}'} (every tool call and result, also in the run log)
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'http_request' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">HTTP Request</span>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Call any API. Every field accepts {'{{variables}}'} from earlier nodes, e.g. {'{{email}}'} or {'{{api.items.0.title}}'}.
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Method</label>
                                        <select value={localConfig?.method || 'GET'} onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })} className={CONTROL_CLS}>
                                            {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className={LABEL_CLS}>URL</label>
                                        <input type="text" value={localConfig?.url || ''} onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })} placeholder="https://api.example.com/items?q={{company}}" className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Headers (one per line)</label>
                                    <textarea rows={3} value={typeof localConfig?.headers === 'string' ? localConfig.headers : ''} onChange={(e) => setLocalConfig({ ...localConfig, headers: e.target.value })} placeholder="Authorization: Bearer YOUR_TOKEN" className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                    <p className="text-xs text-amber-600 mt-1">Stored in the workflow config as plain text. Use a scoped, revocable token.</p>
                                </div>
                                {(localConfig?.method || 'GET') !== 'GET' && (
                                    <div>
                                        <label className={LABEL_CLS}>Body</label>
                                        <select value={localConfig?.body_mode || 'custom'} onChange={(e) => setLocalConfig({ ...localConfig, body_mode: e.target.value })} className="w-full mb-2 px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-sm">
                                            <option value="custom">Custom body</option>
                                            <option value="context">Send all workflow data as JSON</option>
                                        </select>
                                        {(localConfig?.body_mode || 'custom') === 'custom' && (
                                            <textarea rows={5} value={localConfig?.body || ''} onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })} placeholder={'{"email": "{{email}}", "name": "{{name}}"}'} className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                        )}
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Save Response As</label>
                                        <input type="text" value={localConfig?.response_variable || ''} onChange={(e) => setLocalConfig({ ...localConfig, response_variable: e.target.value })} placeholder="http_response" className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Timeout (sec)</label>
                                        <input type="number" value={localConfig?.timeout_seconds || 30} onChange={(e) => setLocalConfig({ ...localConfig, timeout_seconds: parseInt(e.target.value) || 30 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-fg">
                                    <input type="checkbox" checked={localConfig?.fail_on_error !== false} onChange={(e) => setLocalConfig({ ...localConfig, fail_on_error: e.target.checked })} />
                                    Stop workflow on non-2xx response
                                </label>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> {'{{<name>}}'} (parsed JSON or text), {'{{<name>_status}}'}
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'keyword_research' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">Keyword Research</span>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Pulls real Google Autocomplete searches for your seed keywords. Free, no API key.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Seed Keywords (one per line)</label>
                                    <textarea
                                        rows={5}
                                        value={localConfig?.seeds || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, seeds: e.target.value })}
                                        placeholder={'crm for clinic\nlead follow up\nrestaurant billing software'}
                                        className={CONTROL_CLS}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Country</label>
                                        <input type="text" value={localConfig?.country || 'in'} onChange={(e) => setLocalConfig({ ...localConfig, country: e.target.value })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Max Ideas</label>
                                        <input type="number" value={localConfig?.limit || 40} onChange={(e) => setLocalConfig({ ...localConfig, limit: parseInt(e.target.value) || 40 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> keyword_suggestions[], seo_keyword_ideas[] (used by AI Pick Topic)
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'gsc_opportunities' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-300">Search Console Opportunities</span>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Queries Google already shows your site for at positions 4 to 20. Uses the global Google service account; add its email as a user on the Search Console property.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Property</label>
                                    <input type="text" value={localConfig?.property || ''} onChange={(e) => setLocalConfig({ ...localConfig, property: e.target.value })} placeholder="Default: sc-domain:<website host>" className={CONTROL_CLS} />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Days</label>
                                        <input type="number" value={localConfig?.days || 28} onChange={(e) => setLocalConfig({ ...localConfig, days: parseInt(e.target.value) || 28 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Min Impr.</label>
                                        <input type="number" value={localConfig?.min_impressions || 5} onChange={(e) => setLocalConfig({ ...localConfig, min_impressions: parseInt(e.target.value) || 5 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Max Pos.</label>
                                        <input type="number" value={localConfig?.max_position || 20} onChange={(e) => setLocalConfig({ ...localConfig, max_position: parseInt(e.target.value) || 20 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Outputs:</strong> gsc_opportunities[] (query, page, impressions, position), seo_keyword_ideas[]
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'index_url' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg border border-cyan-100 dark:border-cyan-800">
                                    <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        <span className="font-semibold text-sm">Search Engine Indexing</span>
                                    </div>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-400">
                                        Submits URLs to Google, Bing, Yandex for faster indexing.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        URL to Index (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.url || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                        placeholder="https://yoursite.com/page or {{blog_slug}}"
                                        className={CONTROL_CLS}
                                    />
                                    <p className="text-xs text-fg-muted mt-1">Leave blank to auto-detect from previous nodes (blog_slug, page_slug).</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Search Engines
                                    </label>
                                    <div className="space-y-2 mt-1">
                                        {[
                                            { key: 'indexnow', label: 'IndexNow (Bing, Yandex, Naver)' },
                                            { key: 'google', label: 'Google Indexing API' },
                                            { key: 'websub', label: 'WebSub (RSS notification)' },
                                        ].map(engine => (
                                            <label key={engine.key} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={(localConfig?.engines || ['indexnow', 'google', 'websub']).includes(engine.key)}
                                                    onChange={(e) => {
                                                        const current = localConfig?.engines || ['indexnow', 'google', 'websub'];
                                                        const updated = e.target.checked ? [...current, engine.key] : current.filter(k => k !== engine.key);
                                                        setLocalConfig({ ...localConfig, engines: updated });
                                                    }}
                                                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                                                />
                                                <span className="text-sm text-fg">{engine.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="p-2 bg-surface-2 rounded text-xs text-fg-muted">
                                    <strong>Auto-detects:</strong> blog_slug, page_slug, product_id<br />
                                    <strong>Best after:</strong> Post Blog
                                </div>
                                <div className="border-t border-border pt-3 mt-1">
                                    <label className="block text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wider">Credentials (optional — falls back to global settings)</label>
                                    <div className="space-y-3">
                                        <div>
                                            <label className={LABEL_CLS}>Website URL</label>
                                            <input type="text" value={localConfig?.websiteUrl || ''} onChange={(e) => setLocalConfig({ ...localConfig, websiteUrl: e.target.value })} placeholder="https://yoursite.com (uses global if empty)" className={CONTROL_CLS} />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>IndexNow API Key</label>
                                            <input type="text" value={localConfig?.indexnowKey || ''} onChange={(e) => setLocalConfig({ ...localConfig, indexnowKey: e.target.value })} placeholder="Uses global key if empty" className={CONTROL_CLS} />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>Google Service Account JSON</label>
                                            <textarea value={localConfig?.googleServiceAccountJson || ''} onChange={(e) => setLocalConfig({ ...localConfig, googleServiceAccountJson: e.target.value })} placeholder='Paste service account JSON (uses global if empty)' rows={3} className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-xs font-mono" />
                                            <p className="text-xs text-fg-muted mt-1">Required for Google Indexing API. Add the service account as a site owner in Google Search Console.</p>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {selectedNode.type === 'delay' && (
                            <>
                                <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border border-cyan-200 dark:border-cyan-800">
                                    <p className="text-sm text-cyan-700 dark:text-cyan-400 font-medium">
                                        Pauses workflow execution
                                    </p>
                                    <p className="text-xs text-cyan-600 dark:text-cyan-500 mt-1">
                                        The workflow will wait before continuing to the next step
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Delay Type
                                    </label>
                                    <select
                                        value={localConfig?.delay_type || 'duration'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, delay_type: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="duration">Wait for duration</option>
                                        <option value="until_time">Wait until specific time</option>
                                        <option value="until_day">Wait until day of week</option>
                                    </select>
                                </div>

                                {(!localConfig?.delay_type || localConfig?.delay_type === 'duration') && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Duration
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={localConfig?.value || 1}
                                                onChange={(e) => setLocalConfig({ ...localConfig, value: parseInt(e.target.value) })}
                                                className={CONTROL_CLS}
                                            />
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Unit
                                            </label>
                                            <select
                                                value={localConfig?.unit || 'hours'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, unit: e.target.value })}
                                                className={CONTROL_CLS}
                                            >
                                                <option value="minutes">Minutes</option>
                                                <option value="hours">Hours</option>
                                                <option value="days">Days</option>
                                                <option value="weeks">Weeks</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {localConfig?.delay_type === 'until_time' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Wait Until Time
                                        </label>
                                        <input
                                            type="time"
                                            value={localConfig?.until_time || '09:00'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, until_time: e.target.value })}
                                            className={CONTROL_CLS}
                                        />
                                        <p className={HINT_CLS}>Wait until this time (next occurrence if already passed)</p>
                                    </div>
                                )}

                                {localConfig?.delay_type === 'until_day' && (
                                    <>
                                        <div>
                                            <label className={LABEL_CLS}>
                                                Wait Until Day
                                            </label>
                                            <select
                                                value={localConfig?.until_day || 'monday'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, until_day: e.target.value })}
                                                className={CONTROL_CLS}
                                            >
                                                <option value="monday">Monday</option>
                                                <option value="tuesday">Tuesday</option>
                                                <option value="wednesday">Wednesday</option>
                                                <option value="thursday">Thursday</option>
                                                <option value="friday">Friday</option>
                                                <option value="saturday">Saturday</option>
                                                <option value="sunday">Sunday</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={LABEL_CLS}>
                                                At Time
                                            </label>
                                            <input
                                                type="time"
                                                value={localConfig?.at_time || '09:00'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, at_time: e.target.value })}
                                                className={CONTROL_CLS}
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 p-2 bg-surface-3 rounded">
                                    <input
                                        type="checkbox"
                                        id="skip_weekends"
                                        checked={localConfig?.skip_weekends || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, skip_weekends: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <label htmlFor="skip_weekends" className="text-sm text-fg-muted">
                                        Skip weekends (resume on Monday)
                                    </label>
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'condition' && (
                            <>
                                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                                        Splits workflow based on condition
                                    </p>
                                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                                        TRUE path continues, FALSE path stops or takes alternate route
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>
                                        Field to Check
                                    </label>
                                    <select
                                        value={localConfig?.field || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, field: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">-- Select Field --</option>
                                        <optgroup label="Lead/Client Fields">
                                            <option value="status">Status</option>
                                            <option value="source">Source</option>
                                            <option value="email">Email</option>
                                            <option value="company">Company</option>
                                            <option value="contact_name">Contact Name</option>
                                            <option value="phone">Phone</option>
                                            <option value="client_type">Client Type</option>
                                        </optgroup>
                                        <optgroup label="Numeric Fields">
                                            <option value="value">Deal Value</option>
                                            <option value="score">Lead Score</option>
                                            <option value="days_since_created">Days Since Created</option>
                                            <option value="days_since_contact">Days Since Last Contact</option>
                                        </optgroup>
                                        <optgroup label="Custom">
                                            <option value="custom">Custom Field...</option>
                                        </optgroup>
                                    </select>
                                </div>
                                {localConfig?.field === 'custom' && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            Custom Field Name
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.custom_field || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, custom_field: e.target.value })}
                                            className={CONTROL_CLS}
                                            placeholder="custom_field_name"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className={LABEL_CLS}>
                                        Operator
                                    </label>
                                    <select
                                        value={localConfig?.operator || 'equals'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, operator: e.target.value })}
                                        className={CONTROL_CLS}
                                    >
                                        <optgroup label="Text Comparisons">
                                            <option value="equals">Equals</option>
                                            <option value="not_equals">Not Equals</option>
                                            <option value="contains">Contains</option>
                                            <option value="not_contains">Does Not Contain</option>
                                            <option value="starts_with">Starts With</option>
                                            <option value="ends_with">Ends With</option>
                                        </optgroup>
                                        <optgroup label="Numeric Comparisons">
                                            <option value="greater_than">Greater Than</option>
                                            <option value="less_than">Less Than</option>
                                            <option value="greater_or_equal">Greater or Equal</option>
                                            <option value="less_or_equal">Less or Equal</option>
                                        </optgroup>
                                        <optgroup label="Existence Checks">
                                            <option value="is_empty">Is Empty</option>
                                            <option value="is_not_empty">Is Not Empty</option>
                                            <option value="is_null">Is Null</option>
                                            <option value="is_not_null">Is Not Null</option>
                                        </optgroup>
                                        <optgroup label="List Checks">
                                            <option value="in_list">In List</option>
                                            <option value="not_in_list">Not In List</option>
                                        </optgroup>
                                    </select>
                                </div>
                                {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(localConfig?.operator) && (
                                    <div>
                                        <label className={LABEL_CLS}>
                                            {['in_list', 'not_in_list'].includes(localConfig?.operator)
                                                ? 'Values (comma-separated)'
                                                : 'Value'}
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.value || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, value: e.target.value })}
                                            className={CONTROL_CLS}
                                            placeholder={['in_list', 'not_in_list'].includes(localConfig?.operator)
                                                ? 'qualified, proposal_sent, won'
                                                : 'qualified'}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 p-2 bg-surface-3 rounded">
                                    <input
                                        type="checkbox"
                                        id="case_insensitive"
                                        checked={localConfig?.case_insensitive || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, case_insensitive: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <label htmlFor="case_insensitive" className="text-sm text-fg-muted">
                                        Case insensitive comparison
                                    </label>
                                </div>
                                <div className="p-3 bg-surface-2 rounded-lg border border-border mt-2">
                                    <p className="text-xs font-medium text-fg-muted mb-2">Branch Paths:</p>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-xs text-fg-muted">TRUE - Condition met</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-xs text-fg-muted">FALSE - Not met</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div className="text-xs text-fg-muted mt-4">
                            <p className="font-medium mb-1">Available Variables:</p>
                            <code className="block bg-surface-3 p-2 rounded text-xs">
                                {'{{id}}, {{email}}, {{contact_name}}, {{company}}, {{status}}, {{source}}, {{last_email_subject}}, {{last_email_body}}'}
                            </code>
                        </div>

                        {/* Action: Send WhatsApp / Reply on WhatsApp */}
                        {selectedNode.type === 'whatsapp' && (
                            <>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 mb-1">
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                                        </svg>
                                        <span className="font-semibold text-sm">
                                            {selectedNode.data.actionType === 'send_whatsapp_reply' ? 'Reply on WhatsApp' : 'Send WhatsApp Message'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                        {selectedNode.data.actionType === 'send_whatsapp_reply'
                                            ? 'Replies to the person who sent the incoming message. Use {{from_phone}} to reply back.'
                                            : 'Sends a WhatsApp message via a connected account. Use {{variable}} to inject dynamic data.'}
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        WhatsApp Account
                                    </label>
                                    <select
                                        value={localConfig?.account_id || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, account_id: parseInt(e.target.value) || '' })}
                                        className={CONTROL_CLS}
                                    >
                                        <option value="">Select connected account…</option>
                                        {waAccounts.map(a => (
                                            <option key={a.id} value={a.id}>
                                                {a.label} {a.phone ? `(${a.phone})` : ''} — {a.channel === 'baileys' ? 'Personal' : 'Meta API'}
                                            </option>
                                        ))}
                                    </select>
                                    {waAccounts.length === 0 && (
                                        <p className="text-xs text-amber-500 mt-1">No connected accounts. Go to WhatsApp settings to connect one.</p>
                                    )}
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        To Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.to_phone || (selectedNode.data.actionType === 'send_whatsapp_reply' ? '{{from_phone}}' : '{{phone}}')}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_phone: e.target.value })}
                                        className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-sm font-mono"
                                        placeholder={selectedNode.data.actionType === 'send_whatsapp_reply' ? '{{from_phone}}' : '{{phone}} or +919876543210'}
                                    />
                                    <p className="text-[10px] text-fg-subtle mt-1">
                                        {selectedNode.data.actionType === 'send_whatsapp_reply'
                                            ? 'Use {{from_phone}} to reply to the sender'
                                            : 'Lead variables: {{phone}}, {{contact_phone}}'}
                                    </p>
                                </div>

                                <div>
                                    <label className={LABEL_CLS}>
                                        Message
                                    </label>
                                    <textarea
                                        rows={5}
                                        value={localConfig?.message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                                        className={CONTROL_CLS}
                                        placeholder={selectedNode.data.actionType === 'send_whatsapp_reply'
                                            ? 'Hi {{from_name}}, {{ai_reply}}'
                                            : 'Hi {{name}}, {{wa_message}}'}
                                    />
                                    <div className="mt-1.5 p-2 bg-surface-2 rounded text-[10px] text-fg-muted space-y-0.5">
                                        {selectedNode.data.actionType === 'send_whatsapp_reply' ? (
                                            <>
                                                <div><strong className="text-fg-muted">Incoming message:</strong> {'{{from_name}}'}, {'{{from_phone}}'}, {'{{message_text}}'}</div>
                                                <div><strong className="text-fg-muted">AI output:</strong> {'{{ai_reply}}'} (set in AI node's "Store Result In" field)</div>
                                            </>
                                        ) : (
                                            <>
                                                <div><strong className="text-fg-muted">Lead variables:</strong> {'{{name}}'}, {'{{email}}'}, {'{{phone}}'}, {'{{company}}'}</div>
                                                <div><strong className="text-fg-muted">AI output:</strong> {'{{wa_message}}'}, {'{{wa_followup}}'}, {'{{ai_response}}'}</div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Loop Over Items */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'loop_items' && (
                            <>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <span className="font-semibold text-sm text-indigo-700 dark:text-indigo-300">Loop Over Items</span>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                        Runs every node connected after this one once per item. Inside the loop use {'{{item}}'}, {'{{item.title}}'}, {'{{item_index}}'}.
                                    </p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Items</label>
                                    <input type="text" value={localConfig?.items || ''} onChange={(e) => setLocalConfig({ ...localConfig, items: e.target.value })} placeholder="{{keyword_suggestions}}" className="w-full px-3 py-2 border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 text-sm font-mono" />
                                    <p className="text-xs text-fg-muted mt-1">A list from an earlier node, or one value per line.</p>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>Max Items</label>
                                    <input type="number" min={1} max={200} value={localConfig?.max_items || 50} onChange={(e) => setLocalConfig({ ...localConfig, max_items: parseInt(e.target.value) || 50 })} className={CONTROL_CLS} />
                                </div>
                            </>
                        )}

                        {/* Node settings shared by every action: retry + error handling */}
                        {(selectedNode.type === 'action' || selectedNode.type === 'whatsapp') && (
                            <div className="pt-3 mt-1 border-t border-border space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">If this step fails</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={LABEL_CLS}>Retries</label>
                                        <input type="number" min={0} max={5} value={localConfig?.retry_count || 0} onChange={(e) => setLocalConfig({ ...localConfig, retry_count: parseInt(e.target.value) || 0 })} className={CONTROL_CLS} />
                                    </div>
                                    <div>
                                        <label className={LABEL_CLS}>Wait (sec)</label>
                                        <input type="number" min={1} max={60} value={localConfig?.retry_delay_seconds || 5} onChange={(e) => setLocalConfig({ ...localConfig, retry_delay_seconds: parseInt(e.target.value) || 5 })} className={CONTROL_CLS} />
                                    </div>
                                </div>
                                <div>
                                    <label className={LABEL_CLS}>After retries run out</label>
                                    <select value={localConfig?.on_error || 'stop'} onChange={(e) => setLocalConfig({ ...localConfig, on_error: e.target.value })} className={CONTROL_CLS}>
                                        <option value="stop">Stop the workflow</option>
                                        <option value="continue">Continue to next steps</option>
                                        <option value="branch">Follow the red "error" connection</option>
                                    </select>
                                    <p className="text-xs text-fg-muted mt-1">The error message is available as {'{{last_error.message}}'}.</p>
                                </div>
                            </div>
                        )}

                        {/* Generic / No Settings Fallback */}
                        {!['trigger', 'action', 'condition', 'delay', 'whatsapp'].includes(selectedNode.type) ||
                            (selectedNode.type === 'action' && !['send_email', 'update_lead', 'update_client', 'update_inquiry', 'create_task', 'assign_user', 'assign_inquiry', 'add_note', 'send_notification', 'webhook', 'ai_assistant', 'ai_pick_topic', 'ai_write_blog', 'ai_fetch_image', 'ai_post_blog', 'index_url', 'keyword_research', 'gsc_opportunities', 'http_request', 'ai_agent', 'loop_items'].includes(selectedNode.data.actionType)) ? (
                            <div className="p-4 border border-dashed border-border-strong rounded-lg text-center">
                                <p className="text-sm text-fg-muted">No specific configuration available for this node type.</p>
                                <p className="text-[10px] text-fg-subtle mt-2">ID: {selectedNode.id}</p>
                            </div>
                        ) : null}

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

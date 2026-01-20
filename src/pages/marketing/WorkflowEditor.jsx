import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import { workflowsAPI, emailTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';

// ============================================
// CUSTOM NODE COMPONENTS
// ============================================

const TriggerNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-green-500'
        } bg-white dark:bg-slate-800`}>
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="5 3 19 12 5 21 5 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Trigger</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

const ActionNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-blue-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase">Action</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>
        {data.actionType && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{data.actionType}</div>
        )}
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-blue-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

const ConditionNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-amber-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-amber-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase">Condition</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>
        <div className="flex justify-between mt-2 text-xs">
            <span className="text-green-600 font-medium">Yes</span>
            <span className="text-red-600 font-medium">No</span>
        </div>
        <Handle
            type="source"
            position={Position.Bottom}
            id="yes"
            style={{ left: '25%' }}
            className="w-3 h-3 !bg-green-500 !border-2 !border-white dark:!border-slate-800"
        />
        <Handle
            type="source"
            position={Position.Bottom}
            id="no"
            style={{ left: '75%' }}
            className="w-3 h-3 !bg-red-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

const DelayNode = ({ data, selected }) => (
    <div className={`px-4 py-3 rounded-lg shadow-lg border-2 min-w-[180px] ${selected ? 'border-brand-500' : 'border-purple-500'
        } bg-white dark:bg-slate-800`}>
        <Handle
            type="target"
            position={Position.Top}
            className="w-3 h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-800"
        />
        <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <polyline points="12 6 12 12 16 14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase">Delay</span>
        </div>
        <div className="font-medium text-slate-800 dark:text-white text-sm">{data.label}</div>
        <Handle
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 !bg-purple-500 !border-2 !border-white dark:!border-slate-800"
        />
    </div>
);

// ============================================
// NODE TYPES CONFIG
// ============================================

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    condition: ConditionNode,
    delay: DelayNode
};

// ============================================
// NODE PALETTE
// ============================================

const NODE_PALETTE = {
    triggers: [
        { id: 'lead_created', label: 'Lead Created', type: 'trigger' },
        { id: 'client_created', label: 'Client Created', type: 'trigger' },
        { id: 'lead_status_changed', label: 'Lead Status Changed', type: 'trigger' },
        { id: 'client_status_changed', label: 'Client Status Changed', type: 'trigger' },
        { id: 'scheduled', label: 'Scheduled', type: 'trigger' },
        { id: 'manual', label: 'Manual Trigger', type: 'trigger' }
    ],
    actions: [
        { id: 'send_email', label: 'Send Email', type: 'action', actionType: 'send_email' },
        { id: 'update_lead', label: 'Update Lead', type: 'action', actionType: 'update_lead' },
        { id: 'update_client', label: 'Update Client', type: 'action', actionType: 'update_client' },
        { id: 'create_task', label: 'Create Task', type: 'action', actionType: 'create_task' },
        { id: 'assign_user', label: 'Assign User', type: 'action', actionType: 'assign_user' },
        { id: 'add_note', label: 'Add Note', type: 'action', actionType: 'add_note' },
        { id: 'send_notification', label: 'Send Notification', type: 'action', actionType: 'send_notification' },
        { id: 'webhook', label: 'Webhook', type: 'action', actionType: 'webhook' }
    ],
    conditions: [
        { id: 'condition', label: 'If/Else Condition', type: 'condition' }
    ],
    delays: [
        { id: 'delay', label: 'Wait/Delay', type: 'delay' }
    ]
};

// ============================================
// MAIN EDITOR COMPONENT
// ============================================

const WorkflowEditor = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id || id === 'new';
    console.log('WorkflowEditor: id =', id, 'isNew =', isNew);

    const [workflowName, setWorkflowName] = useState('New Workflow');
    const [workflowDescription, setWorkflowDescription] = useState('');
    const [saving, setSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(!isNew);
    const [selectedNode, setSelectedNode] = useState(null);
    const [showNodeConfig, setShowNodeConfig] = useState(false);
    const [emailTemplates, setEmailTemplates] = useState([]);

    // Fetch email templates on mount
    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await emailTemplatesAPI.getAll();
                setEmailTemplates(res.data || res.templates || []);
            } catch (error) {
                console.log('Failed to fetch templates');
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
    }, [id, isNew]);

    const fetchWorkflow = async () => {
        try {
            setIsLoading(true);
            const res = await workflowsAPI.getById(id);
            const data = res.data || res;

            setWorkflowName(data.name || 'Untitled Workflow');
            setWorkflowDescription(data.description || '');

            if (data.canvas_data) {
                setNodes(data.canvas_data.nodes || []);
                setEdges(data.canvas_data.edges || []);
            } else if (data.nodes) {
                // Map legacy structure to React Flow format if needed
                const formattedNodes = data.nodes.map(n => ({
                    id: n.node_uid || `${n.node_type}-${n.id}`,
                    type: n.node_type,
                    position: { x: n.position_x || 250, y: n.position_y || 100 },
                    data: {
                        label: n.label,
                        actionType: n.action_type,
                        triggerType: n.trigger_type,
                        config: n.config || {}
                    }
                }));
                setNodes(formattedNodes);

                // Map connections to edges
                if (data.connections) {
                    const formattedEdges = data.connections.map((c, idx) => ({
                        id: `edge-${idx}`,
                        source: c.source,
                        target: c.target,
                        sourceHandle: c.source_handle,
                        markerEnd: { type: MarkerType.ArrowClosed }
                    }));
                    setEdges(formattedEdges);
                }
            }
        } catch (error) {
            console.error('Failed to fetch workflow:', error);
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
            data: { label: 'Lead Created', triggerType: 'lead_created' }
        }
    ] : [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 }
        }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((event, node) => {
        setSelectedNode(node);
        setShowNodeConfig(true);
    }, []);

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
        if (selectedNode) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
            setShowNodeConfig(false);
        }
    };

    // Save workflow
    const saveWorkflow = async () => {
        if (id === 'undefined') {
            toast.error('Cannot save: Invalid ID');
            return;
        }
        if (!workflowName.trim()) {
            toast.error('Please enter a workflow name');
            return;
        }

        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) {
            toast.error('Workflow must have a trigger node');
            return;
        }

        setSaving(true);
        try {
            const workflowData = {
                name: workflowName,
                description: workflowDescription,
                trigger_type: triggerNode.data.triggerType || 'lead_created',
                nodes: nodes.map(n => ({
                    node_uid: n.id,
                    node_type: n.type,
                    action_type: n.data.actionType || null,
                    label: n.data.label,
                    config: n.data.config || {},
                    position_x: Math.round(n.position.x),
                    position_y: Math.round(n.position.y)
                })),
                connections: edges.map(e => ({
                    source: e.source,
                    target: e.target,
                    source_handle: e.sourceHandle || 'default'
                }))
            };

            if (isNew) {
                await workflowsAPI.create(workflowData);
                toast.success('Workflow created!');
            } else {
                await workflowsAPI.update(id, workflowData);
                toast.success('Workflow saved!');
            }
            navigate('/workflows');
        } catch (error) {
            console.error('Save workflow error:', error);
            toast.error('Failed to save workflow');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                    <p className="text-slate-500 font-medium">Loading Workflow...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-80px)] overflow-hidden">
            {/* Left Sidebar - Node Palette */}
            <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Nodes</h3>

                {/* Triggers */}
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Triggers</h4>
                    <div className="space-y-2">
                        {NODE_PALETTE.triggers.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addNode(item)}
                                className="w-full text-left px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Actions</h4>
                    <div className="space-y-2">
                        {NODE_PALETTE.actions.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addNode(item)}
                                className="w-full text-left px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Conditions */}
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Conditions</h4>
                    <div className="space-y-2">
                        {NODE_PALETTE.conditions.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addNode(item)}
                                className="w-full text-left px-3 py-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Delays */}
                <div className="mb-4">
                    <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Timing</h4>
                    <div className="space-y-2">
                        {NODE_PALETTE.delays.map(item => (
                            <button
                                key={item.id}
                                onClick={() => addNode(item)}
                                className="w-full text-left px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col relative">
                {/* Top Bar */}
                <div className="h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/workflows')}
                            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <input
                            type="text"
                            value={workflowName}
                            onChange={(e) => setWorkflowName(e.target.value)}
                            className="text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0 text-slate-900 dark:text-white"
                            placeholder="Workflow Name"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedNode && (
                            <button
                                onClick={deleteSelectedNode}
                                className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium border border-red-200 dark:border-red-900/50"
                            >
                                Delete Node
                            </button>
                        )}
                        <button
                            onClick={saveWorkflow}
                            disabled={saving}
                            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium shadow-sm"
                        >
                            {saving ? 'Saving...' : 'Save Workflow'}
                        </button>
                    </div>
                </div>

                {/* React Flow Canvas */}
                <div className="flex-1">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        colorMode="system"
                        fitView
                        className="bg-slate-50 dark:bg-[#0f172a]"
                    >
                        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg rounded-lg overflow-hidden" />
                        <MiniMap
                            className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !shadow-lg rounded-lg"
                            nodeColor={(node) => {
                                switch (node.type) {
                                    case 'trigger': return '#22c55e';
                                    case 'action': return '#3b82f6';
                                    case 'condition': return '#f59e0b';
                                    case 'delay': return '#a855f7';
                                    default: return '#eee';
                                }
                            }}
                            maskColor="rgba(0, 0, 0, 0.1)"
                        />
                        <Background
                            variant="dots"
                            gap={16}
                            size={1}
                            color="#94a3b8"
                            className="opacity-20 dark:opacity-10"
                        />
                    </ReactFlow>
                </div>
            </div>

            {/* Right Sidebar - Node Configuration */}
            {showNodeConfig && selectedNode && (
                <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Configure Node</h3>
                        <button
                            onClick={() => setShowNodeConfig(false)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Label
                            </label>
                            <input
                                type="text"
                                value={selectedNode.data.label}
                                onChange={(e) => {
                                    setNodes(nds => nds.map(n =>
                                        n.id === selectedNode.id
                                            ? { ...n, data: { ...n.data, label: e.target.value } }
                                            : n
                                    ));
                                }}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            />
                        </div>

                        {/* Action-specific config */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'send_email' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email Template
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.template_id || ''}
                                        onChange={(e) => {
                                            const templateId = e.target.value;
                                            if (templateId) {
                                                const template = emailTemplates.find(t => t.id == templateId);
                                                if (template) {
                                                    setNodes(nds => nds.map(n =>
                                                        n.id === selectedNode.id
                                                            ? {
                                                                ...n, data: {
                                                                    ...n.data, config: {
                                                                        ...n.data.config,
                                                                        template_id: parseInt(templateId),
                                                                        subject: template.subject,
                                                                        body: template.body || template.html_content || template.content
                                                                    }
                                                                }
                                                            }
                                                            : n
                                                    ));
                                                }
                                            } else {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, template_id: null } } }
                                                        : n
                                                ));
                                            }
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Custom (enter below)</option>
                                        {emailTemplates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    {emailTemplates.length === 0 ? (
                                        <p className="text-xs text-amber-500 mt-1">No templates found. Go to Templates to create one.</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 mt-1">Select a template or write custom content</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.subject || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, subject: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Welcome {{contact_name}}!"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email Body
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={selectedNode.data.config?.body || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, body: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Hello {{contact_name}}, ..."
                                    />
                                </div>
                            </>
                        )}

                        {selectedNode.type === 'delay' && (
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Duration
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={selectedNode.data.config?.value || 1}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, value: parseInt(e.target.value) } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Unit
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.unit || 'hours'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, unit: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="minutes">Minutes</option>
                                        <option value="hours">Hours</option>
                                        <option value="days">Days</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {selectedNode.type === 'condition' && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Field
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.field || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, field: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="status"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Operator
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.operator || 'equals'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, operator: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="equals">Equals</option>
                                        <option value="not_equals">Not Equals</option>
                                        <option value="contains">Contains</option>
                                        <option value="greater_than">Greater Than</option>
                                        <option value="less_than">Less Than</option>
                                        <option value="is_empty">Is Empty</option>
                                        <option value="is_not_empty">Is Not Empty</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Value
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.value || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, value: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="qualified"
                                    />
                                </div>
                            </>
                        )}

                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                            <p className="font-medium mb-1">Available Variables:</p>
                            <code className="block bg-slate-100 dark:bg-slate-700 p-2 rounded text-xs">
                                {'{{id}}, {{email}}, {{contact_name}}, {{company}}, {{status}}, {{source}}'}
                            </code>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowEditor;

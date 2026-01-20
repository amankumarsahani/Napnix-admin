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
        { id: 'webhook', label: 'Webhook', type: 'action', actionType: 'webhook' },
        { id: 'ai_assistant', label: 'AI Assistant', type: 'action', actionType: 'ai_assistant' }
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
    const [selectedNodeId, setSelectedNodeId] = useState(null);
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
                if (data.connections && data.connections.length > 0) {
                    const formattedEdges = data.connections.map((c, idx) => ({
                        id: c.id || `edge-${c.source}-${c.target}-${idx}`,
                        source: c.source,
                        target: c.target,
                        sourceHandle: c.source_handle || 'default',
                        type: 'smoothstep',
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#10b981' },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
                    }));
                    console.log('Loaded edges:', formattedEdges);
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
        setSelectedNodeId(node.id);
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
        if (selectedNodeId) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
            setSelectedNodeId(null);
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

                        {/* Debug: Log selectedNode when it's a trigger */}
                        {selectedNode.type === 'trigger' && console.log('Trigger node selected:', selectedNode.id, 'triggerType:', selectedNode.data.triggerType, 'data:', selectedNode.data)}

                        {/* Trigger-specific config: Lead Created */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'lead_created' || selectedNode.data.label === 'Lead Created') && (
                            <>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                                        Triggers when a new lead is created
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Filter by Source
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.source_filter || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, source_filter: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">All Sources</option>
                                        <option value="website">Website</option>
                                        <option value="referral">Referral</option>
                                        <option value="linkedin">LinkedIn</option>
                                        <option value="cold_outreach">Cold Outreach</option>
                                        <option value="advertisement">Advertisement</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Leave empty to trigger for all leads</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Filter by Initial Status
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.status_filter || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, status_filter: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Filter by Client Type
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.client_type_filter || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, client_type_filter: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">All Client Types</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Leave empty to trigger for all clients</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Filter by Source
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.source_filter || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, source_filter: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        From Status
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.from_status || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, from_status: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <p className="text-xs text-slate-400 mt-1">The status the lead is changing FROM</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        To Status
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.to_status || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, to_status: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <p className="text-xs text-slate-400 mt-1">The status the lead is changing TO</p>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        From Status
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.from_status || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, from_status: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Any Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">The status the client is changing FROM</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        To Status
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.to_status || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, to_status: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Any Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending">Pending</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="churned">Churned</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">The status the client is changing TO</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Filter by Client Type
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.client_type_filter || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, client_type_filter: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">All Client Types</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Schedule Type
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.schedule_type || 'daily'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, schedule_type: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="once">One-time</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Time (24-hour format)
                                    </label>
                                    <input
                                        type="time"
                                        value={selectedNode.data.config?.schedule_time || '09:00'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, schedule_time: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                {selectedNode.data.config?.schedule_type === 'weekly' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Day of Week
                                        </label>
                                        <select
                                            value={selectedNode.data.config?.day_of_week || 'monday'}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, day_of_week: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                {selectedNode.data.config?.schedule_type === 'monthly' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Day of Month
                                        </label>
                                        <select
                                            value={selectedNode.data.config?.day_of_month || '1'}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, day_of_month: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        >
                                            {[...Array(28)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1">Limited to 28 to avoid issues with short months</p>
                                    </div>
                                )}
                                {selectedNode.data.config?.schedule_type === 'once' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={selectedNode.data.config?.schedule_date || ''}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, schedule_date: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Target Entities
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.target_entity || 'all_leads'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, target_entity: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="all_leads">All Active Leads</option>
                                        <option value="all_clients">All Active Clients</option>
                                        <option value="new_leads">New Leads (last 7 days)</option>
                                        <option value="inactive_leads">Inactive Leads (30+ days)</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">Which entities to run this workflow on</p>
                                </div>
                            </>
                        )}

                        {/* Trigger-specific config: Manual */}
                        {selectedNode.type === 'trigger' && (selectedNode.data.triggerType === 'manual' || selectedNode.data.label === 'Manual Trigger') && (
                            <>
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg border border-slate-300 dark:border-slate-600">
                                    <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                        Manually triggered workflow
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                        Run this workflow on-demand from the workflows list
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Target Entity Type
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.target_type || 'leads'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, target_type: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="leads">Leads</option>
                                        <option value="clients">Clients</option>
                                        <option value="selected">Selected Entities Only</option>
                                    </select>
                                    <p className="text-xs text-slate-400 mt-1">When triggered, run on these entities</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Filter Query (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.filter_query || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, filter_query: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="status:qualified AND source:website"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Filter entities before running</p>
                                </div>
                            </>
                        )}

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

                        {/* Action: Update Lead */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'update_lead' && (
                            <>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">
                                        Updates fields on the lead
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Update Status To
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.new_status || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, new_status: e.target.value, updates: { ...n.data.config?.updates, status: e.target.value } } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Update Source To
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.new_source || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, new_source: e.target.value, updates: { ...n.data.config?.updates, source: e.target.value } } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Add Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.add_tags || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, add_tags: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Update Status To
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.new_status || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, new_status: e.target.value, updates: { ...n.data.config?.updates, status: e.target.value } } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Update Client Type To
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.new_client_type || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, new_client_type: e.target.value, updates: { ...n.data.config?.updates, client_type: e.target.value } } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">-- No change --</option>
                                        <option value="individual">Individual</option>
                                        <option value="business">Business</option>
                                        <option value="enterprise">Enterprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Add Tags (comma-separated)
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.add_tags || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, add_tags: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="vip, priority"
                                    />
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.title || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, title: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Follow up with {{contact_name}}"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Task Description
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={selectedNode.data.config?.description || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, description: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Task details..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.priority || 'medium'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, priority: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Due In
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="number"
                                            min="1"
                                            value={selectedNode.data.config?.due_in_value || 1}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, due_in_value: parseInt(e.target.value) } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        />
                                        <select
                                            value={selectedNode.data.config?.due_in_unit || 'days'}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, due_in_unit: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">
                                        Assigns an owner/user to the entity
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Assignment Method
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.assignment_method || 'round_robin'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, assignment_method: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="round_robin">Round Robin</option>
                                        <option value="least_busy">Least Busy</option>
                                        <option value="specific_user">Specific User</option>
                                        <option value="random">Random</option>
                                    </select>
                                </div>
                                {selectedNode.data.config?.assignment_method === 'specific_user' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            User ID or Email
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedNode.data.config?.specific_user || ''}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, specific_user: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            placeholder="user@example.com"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Team/Department Filter
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.team_filter || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, team_filter: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="sales"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Only assign to users in this team</p>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Note Content
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={selectedNode.data.config?.content || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, content: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Automated note: {{contact_name}} was qualified via workflow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Note Type
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.note_type || 'general'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, note_type: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="general">General</option>
                                        <option value="call">Call Note</option>
                                        <option value="meeting">Meeting Note</option>
                                        <option value="system">System Note</option>
                                    </select>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Notification Title
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.title || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, title: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="New lead assigned to you"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Notification Message
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={selectedNode.data.config?.message || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, message: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="{{contact_name}} from {{company}} needs follow-up"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Send To
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.send_to || 'assigned_user'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, send_to: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Webhook URL
                                    </label>
                                    <input
                                        type="url"
                                        value={selectedNode.data.config?.url || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, url: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="https://api.example.com/webhook"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        HTTP Method
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.method || 'POST'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, method: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="POST">POST</option>
                                        <option value="PUT">PUT</option>
                                        <option value="PATCH">PATCH</option>
                                        <option value="GET">GET</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Headers (JSON)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={selectedNode.data.config?.headers_json || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, headers_json: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                        placeholder='{"Authorization": "Bearer xxx"}'
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Custom Payload (JSON)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={selectedNode.data.config?.custom_payload || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, custom_payload: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                                        placeholder="Leave empty to send entity data"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Leave empty to send all entity data automatically</p>
                                </div>
                            </>
                        )}

                        {/* Action: AI Assistant */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'ai_assistant' && (
                            <>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 mb-1">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="font-semibold text-sm">AI Assistant</span>
                                    </div>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400">
                                        Use AI to analyze data, score leads, or generate content.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        AI Prompt / Instructions
                                    </label>
                                    <textarea
                                        rows={4}
                                        value={selectedNode.data.config?.prompt || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, prompt: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        placeholder="e.g. Analyze this lead: {{name}} from {{company}}"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                    />
                                    <p className="mt-1 text-[10px] text-slate-400">
                                        Use {'{{variable}}'} to inject dynamic data.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        System Message
                                    </label>
                                    <input
                                        type="text"
                                        value={selectedNode.data.config?.system_message || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, system_message: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        placeholder="e.g. You are an expert sales analyst."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            AI Model
                                        </label>
                                        <select
                                            value={selectedNode.data.config?.model || 'gpt-4o-mini'}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, model: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                        >
                                            <option value="gpt-4o-mini">GPT-4o Mini</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                            <option value="gemini-1.5-flash">Gemini Flash</option>
                                            <option value="gemini-1.5-pro">Gemini Pro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Store Result In
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedNode.data.config?.output_variable || 'ai_response'}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, output_variable: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            placeholder="variable_name"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="strict_mode"
                                        checked={selectedNode.data.config?.strict_mode || false}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, strict_mode: e.target.checked } } }
                                                    : n
                                            ));
                                        }}
                                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                    />
                                    <label htmlFor="strict_mode" className="text-sm text-slate-600 dark:text-slate-400">
                                        Strict Mode (Fail workflow on AI error)
                                    </label>
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Delay Type
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.delay_type || 'duration'}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, delay_type: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="duration">Wait for duration</option>
                                        <option value="until_time">Wait until specific time</option>
                                        <option value="until_day">Wait until day of week</option>
                                    </select>
                                </div>

                                {(!selectedNode.data.config?.delay_type || selectedNode.data.config?.delay_type === 'duration') && (
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
                                                <option value="weeks">Weeks</option>
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {selectedNode.data.config?.delay_type === 'until_time' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Wait Until Time
                                        </label>
                                        <input
                                            type="time"
                                            value={selectedNode.data.config?.until_time || '09:00'}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, until_time: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Wait until this time (next occurrence if already passed)</p>
                                    </div>
                                )}

                                {selectedNode.data.config?.delay_type === 'until_day' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Wait Until Day
                                            </label>
                                            <select
                                                value={selectedNode.data.config?.until_day || 'monday'}
                                                onChange={(e) => {
                                                    setNodes(nds => nds.map(n =>
                                                        n.id === selectedNode.id
                                                            ? { ...n, data: { ...n.data, config: { ...n.data.config, until_day: e.target.value } } }
                                                            : n
                                                    ));
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                At Time
                                            </label>
                                            <input
                                                type="time"
                                                value={selectedNode.data.config?.at_time || '09:00'}
                                                onChange={(e) => {
                                                    setNodes(nds => nds.map(n =>
                                                        n.id === selectedNode.id
                                                            ? { ...n, data: { ...n.data, config: { ...n.data.config, at_time: e.target.value } } }
                                                            : n
                                                    ));
                                                }}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                                    <input
                                        type="checkbox"
                                        id="skip_weekends"
                                        checked={selectedNode.data.config?.skip_weekends || false}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, skip_weekends: e.target.checked } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <label htmlFor="skip_weekends" className="text-sm text-slate-600 dark:text-slate-300">
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Field to Check
                                    </label>
                                    <select
                                        value={selectedNode.data.config?.field || ''}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, field: e.target.value } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                {selectedNode.data.config?.field === 'custom' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Custom Field Name
                                        </label>
                                        <input
                                            type="text"
                                            value={selectedNode.data.config?.custom_field || ''}
                                            onChange={(e) => {
                                                setNodes(nds => nds.map(n =>
                                                    n.id === selectedNode.id
                                                        ? { ...n, data: { ...n.data, config: { ...n.data.config, custom_field: e.target.value } } }
                                                        : n
                                                ));
                                            }}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            placeholder="custom_field_name"
                                        />
                                    </div>
                                )}
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
                                {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(selectedNode.data.config?.operator) && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {['in_list', 'not_in_list'].includes(selectedNode.data.config?.operator)
                                                ? 'Values (comma-separated)'
                                                : 'Value'}
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
                                            placeholder={['in_list', 'not_in_list'].includes(selectedNode.data.config?.operator)
                                                ? 'qualified, proposal_sent, won'
                                                : 'qualified'}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                                    <input
                                        type="checkbox"
                                        id="case_insensitive"
                                        checked={selectedNode.data.config?.case_insensitive || false}
                                        onChange={(e) => {
                                            setNodes(nds => nds.map(n =>
                                                n.id === selectedNode.id
                                                    ? { ...n, data: { ...n.data, config: { ...n.data.config, case_insensitive: e.target.checked } } }
                                                    : n
                                            ));
                                        }}
                                        className="w-4 h-4 rounded border-slate-300"
                                    />
                                    <label htmlFor="case_insensitive" className="text-sm text-slate-600 dark:text-slate-300">
                                        Case insensitive comparison
                                    </label>
                                </div>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 mt-2">
                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Branch Paths:</p>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">TRUE - Condition met</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                            <span className="text-xs text-slate-600 dark:text-slate-400">FALSE - Not met</span>
                                        </div>
                                    </div>
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

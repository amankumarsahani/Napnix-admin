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

        {/* Visual Preview */}
        {data.config && Object.keys(data.config).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {data.triggerType === 'lead_created' && data.config.source_filter && (
                    <div className="text-[10px] text-slate-500 line-clamp-1">Source: {data.config.source_filter}</div>
                )}
                {data.triggerType === 'scheduled' && (
                    <div className="text-[10px] text-slate-500 line-clamp-1">{data.config.schedule_type} @ {data.config.schedule_time}</div>
                )}
            </div>
        )}

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

        {/* Visual Preview */}
        {data.config && Object.keys(data.config).length > 0 && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                {data.actionType === 'send_email' && (
                    <div className="text-[10px] text-slate-500 line-clamp-1 italic">"{data.config.subject}"</div>
                )}
                {data.actionType === 'add_note' && (
                    <div className="text-[10px] text-slate-500 line-clamp-2 italic">"{data.config.content}"</div>
                )}
                {data.actionType === 'ai_assistant' && (
                    <div className="text-[10px] text-indigo-500 font-medium">{data.config.model}</div>
                )}
                {data.actionType === 'create_task' && (
                    <div className="text-[10px] text-slate-500 line-clamp-1">Task: {data.config.title}</div>
                )}
            </div>
        )}

        {data.actionType && !data.config?.content && !data.config?.subject && (
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

        {/* Visual Preview */}
        {data.config && data.config.field && (
            <div className="mt-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium line-clamp-1">
                {data.config.field} {data.config.operator?.replace('_', ' ')} {data.config.value}
            </div>
        )}

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

        {/* Visual Preview */}
        {data.config && data.config.value && (
            <div className="mt-1 text-[10px] text-purple-600 dark:text-purple-400 font-medium text-center line-clamp-1">
                Wait {data.config.value} {data.config.unit}
            </div>
        )}

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
        { id: 'inquiry_created', label: 'Inquiry Created', type: 'trigger' },
        { id: 'inquiry_status_updated', label: 'Inquiry Status Updated', type: 'trigger' },
        { id: 'scheduled', label: 'Scheduled', type: 'trigger' },
        { id: 'manual', label: 'Manual Trigger', type: 'trigger' },
        { id: 'stripe_payment_received', label: 'Stripe Payment Received', type: 'trigger' },
        { id: 'stripe_subscription_created', label: 'Stripe Subscription Created', type: 'trigger' },
        { id: 'stripe_subscription_cancelled', label: 'Stripe Subscription Cancelled', type: 'trigger' },
        { id: 'stripe_invoice_paid', label: 'Stripe Invoice Paid', type: 'trigger' }
    ],
    actions: [
        { id: 'send_email', label: 'Send Email', type: 'action', actionType: 'send_email' },
        { id: 'update_lead', label: 'Update Lead', type: 'action', actionType: 'update_lead' },
        { id: 'update_client', label: 'Update Client', type: 'action', actionType: 'update_client' },
        { id: 'create_task', label: 'Create Task', type: 'action', actionType: 'create_task' },
        { id: 'assign_user', label: 'Assign User', type: 'action', actionType: 'assign_user' },
        { id: 'add_note', label: 'Add Note', type: 'action', actionType: 'add_note' },
        { id: 'update_inquiry', label: 'Update Inquiry', type: 'action', actionType: 'update_inquiry' },
        { id: 'assign_inquiry', label: 'Assign Inquiry', type: 'action', actionType: 'assign_inquiry' },
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
    const [localConfig, setLocalConfig] = useState({});
    const [localLabel, setLocalLabel] = useState('');
    const [isApplyingConfig, setIsApplyingConfig] = useState(false);
    const [isActive, setIsActive] = useState(false);



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
    }, [selectedNodeId]);


    const fetchWorkflow = async () => {
        try {
            setIsLoading(true);
            const res = await workflowsAPI.getById(id);
            const data = res.data || res;

            setWorkflowName(data.name || 'Untitled Workflow');
            setWorkflowDescription(data.description || '');
            setIsActive(!!data.is_active);

            if (data.canvas_data) {
                setNodes(data.canvas_data.nodes || []);
                setEdges(data.canvas_data.edges || []);
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
                    } catch (e) {
                        console.error('Failed to parse node config for node:', n.node_uid, e);
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
                console.log('Formatted nodes for React Flow:', formattedNodes);
                setNodes(formattedNodes);

                // Map connections to edges
                if (data.connections && data.connections.length > 0) {
                    console.log('Raw connections from backend:', data.connections);
                    const formattedEdges = data.connections.map((c, idx) => ({
                        id: String(c.id || `edge-${c.source}-${c.target}-${idx}`),
                        source: String(c.source),
                        target: String(c.target),
                        sourceHandle: c.source_handle === 'default' ? null : c.source_handle,
                        type: 'smoothstep',
                        animated: true,
                        style: { strokeWidth: 2, stroke: '#10b981' },
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
                    }));
                    console.log('Formatted edges for React Flow:', formattedEdges);
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
    const applyNodeConfig = useCallback(() => {
        if (!selectedNodeId) return;

        setIsApplyingConfig(true);
        setNodes(nds => nds.map(n =>
            n.id === selectedNodeId
                ? { ...n, data: { ...n.data, label: localLabel, config: localConfig } }
                : n
        ));

        // Show success feedback
        setTimeout(() => {
            setIsApplyingConfig(false);
            toast.success('Configuration applied');
        }, 300);
    }, [selectedNodeId, localLabel, localConfig, setNodes]);

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
                })),
                is_active: isActive
            };

            // Payload size check
            const payloadString = JSON.stringify(workflowData);
            const sizeInMB = (payloadString.length / (1024 * 1024)).toFixed(2);
            console.log(`[WorkflowEditor] Saving workflow. Payload size: ${sizeInMB} MB`);

            if (sizeInMB > 5) {
                const proceed = window.confirm(`Warning: Workflow data is unusually large (${sizeInMB} MB). Are you sure you want to save?`);
                if (!proceed) {
                    setSaving(false);
                    return;
                }
            }

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
                        <div
                            onClick={async () => {
                                const newActive = !isActive;
                                setIsActive(newActive);
                                console.log('[WorkflowEditor] Toggle isActive:', newActive);

                                if (!isNew && id && id !== 'new') {
                                    try {
                                        await workflowsAPI.toggle(id);
                                        toast.success(`Workflow ${newActive ? 'activated' : 'deactivated'}`);
                                    } catch (error) {
                                        console.error('Failed to toggle workflow:', error);
                                        setIsActive(!newActive);
                                        toast.error('Failed to update workflow status');
                                    }
                                }
                            }}
                            className="flex items-center gap-2 mr-4 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <span className={`text-xs font-bold uppercase select-none ${isActive ? 'text-green-500' : 'text-slate-400'}`}>
                                {isActive ? 'Active' : 'Inactive'}
                            </span>
                            <div
                                className={`relative inline-flex h-5 w-10 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${isActive ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isActive ? 'translate-x-5' : 'translate-x-0'}`}
                                />
                            </div>
                        </div>
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
                                value={localLabel}
                                onChange={(e) => setLocalLabel(e.target.value)}
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
                                        value={localConfig?.source_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
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
                                        value={localConfig?.status_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, status_filter: e.target.value })}
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
                                        value={localConfig?.client_type_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
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
                                        value={localConfig?.source_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, source_filter: e.target.value })}
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
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
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
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
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
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
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
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
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
                                        value={localConfig?.client_type_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, client_type_filter: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic text-center p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg">
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        From Status
                                    </label>
                                    <select
                                        value={localConfig?.from_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, from_status: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="">Any Status</option>
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="resolved">Resolved</option>
                                        <option value="converted">Converted</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        To Status
                                    </label>
                                    <select
                                        value={localConfig?.to_status || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_status: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Schedule Type
                                    </label>
                                    <select
                                        value={localConfig?.schedule_type || 'daily'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, schedule_type: e.target.value })}
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
                                        value={localConfig?.schedule_time || '09:00'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, schedule_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                {localConfig?.schedule_type === 'weekly' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Day of Week
                                        </label>
                                        <select
                                            value={localConfig?.day_of_week || 'monday'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, day_of_week: e.target.value })}
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
                                {localConfig?.schedule_type === 'monthly' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Day of Month
                                        </label>
                                        <select
                                            value={localConfig?.day_of_month || '1'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, day_of_month: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        >
                                            {[...Array(28)].map((_, i) => (
                                                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1">Limited to 28 to avoid issues with short months</p>
                                    </div>
                                )}
                                {localConfig?.schedule_type === 'once' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={localConfig?.schedule_date || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, schedule_date: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Target Entities
                                    </label>
                                    <select
                                        value={localConfig?.target_entity || 'all_leads'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, target_entity: e.target.value })}
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
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                            Trigger automations based on real payment events.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Filter by Plan
                                        </label>
                                        <select
                                            value={localConfig?.plan_id || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, plan_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        >
                                            <option value="">All Plans</option>
                                            <option value="starter">Starter Plan</option>
                                            <option value="growth">Growth Plan</option>
                                            <option value="business">Business Plan</option>
                                        </select>
                                        <p className="text-xs text-slate-400 mt-1">Leave empty to trigger for all plans</p>
                                    </div>
                                    {selectedNode.data.triggerType === 'stripe_invoice_paid' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Minimum Amount (USD)
                                            </label>
                                            <input
                                                type="number"
                                                value={localConfig?.min_amount || ''}
                                                onChange={(e) => setLocalConfig({ ...localConfig, min_amount: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                                placeholder="e.g. 50"
                                            />
                                        </div>
                                    )}
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
                                        value={localConfig?.target_type || 'leads'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, target_type: e.target.value })}
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
                                        value={localConfig?.filter_query || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, filter_query: e.target.value })}
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
                                        value={localConfig?.template_id || ''}
                                        onChange={(e) => {
                                            const templateId = e.target.value;
                                            if (templateId) {
                                                const template = emailTemplates.find(t => t.id == templateId);
                                                if (template) {
                                                    setLocalConfig({
                                                        ...localConfig,
                                                        template_id: parseInt(templateId),
                                                        subject: template.subject,
                                                        body: template.body || template.html_content || template.content
                                                    });
                                                }
                                            } else {
                                                setLocalConfig({ ...localConfig, template_id: null });
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
                                        To Email (Recipient)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.to_email || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, to_email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="{{email}}"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Use {"{{email}}"} for the inquiry/lead email address</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Email Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.subject || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, subject: e.target.value })}
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
                                        value={localConfig?.body || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, body: e.target.value })}
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
                                        value={localConfig?.new_status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_status: e.target.value,
                                            updates: { ...localConfig?.updates, status: e.target.value }
                                        })}
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
                                        value={localConfig?.new_source || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_source: e.target.value,
                                            updates: { ...localConfig?.updates, source: e.target.value }
                                        })}
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
                                        value={localConfig?.add_tags || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
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
                                        value={localConfig?.new_status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_status: e.target.value,
                                            updates: { ...localConfig?.updates, status: e.target.value }
                                        })}
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
                                        value={localConfig?.new_client_type || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            new_client_type: e.target.value,
                                            updates: { ...localConfig?.updates, client_type: e.target.value }
                                        })}
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
                                        value={localConfig?.add_tags || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, add_tags: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Set Status to
                                    </label>
                                    <select
                                        value={localConfig?.updates?.status || ''}
                                        onChange={(e) => setLocalConfig({
                                            ...localConfig,
                                            updates: { ...localConfig.updates, status: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Task Title
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.title || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
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
                                        value={localConfig?.description || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Task details..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={localConfig?.priority || 'medium'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, priority: e.target.value })}
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
                                            value={localConfig?.due_in_value || 1}
                                            onChange={(e) => setLocalConfig({ ...localConfig, due_in_value: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        />
                                        <select
                                            value={localConfig?.due_in_unit || 'days'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, due_in_unit: e.target.value })}
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
                                        value={localConfig?.assignment_method || 'round_robin'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, assignment_method: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="round_robin">Round Robin</option>
                                        <option value="least_busy">Least Busy</option>
                                        <option value="specific_user">Specific User</option>
                                        <option value="random">Random</option>
                                    </select>
                                </div>
                                {localConfig?.assignment_method === 'specific_user' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            User ID or Email
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.specific_user || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, specific_user: e.target.value })}
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
                                        value={localConfig?.team_filter || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, team_filter: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="sales"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">Only assign to users in this team</p>
                                </div>
                            </>
                        )}

                        {/* Action: Assign Inquiry */}
                        {selectedNode.type === 'action' && selectedNode.data.actionType === 'assign_inquiry' && (
                            <>
                                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                                    <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">
                                        Assigns the inquiry to a specific user
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        User ID
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.user_id || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, user_id: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Note Content
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={localConfig?.content || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, content: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Automated note: {{contact_name}} was qualified via workflow"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Note Type
                                    </label>
                                    <select
                                        value={localConfig?.note_type || 'general'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, note_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="general">General</option>
                                        <option value="call">Call Note</option>
                                        <option value="meeting">Meeting Note</option>
                                        <option value="system">System Note</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Activity Summary (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={localConfig?.summary || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, summary: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="Automated Note"
                                    />
                                    <p className="text-xs text-slate-400 mt-1">This will show up in the activity timeline header.</p>
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
                                        value={localConfig?.title || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, title: e.target.value })}
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
                                        value={localConfig?.message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, message: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="{{contact_name}} from {{company}} needs follow-up"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Send To
                                    </label>
                                    <select
                                        value={localConfig?.send_to || 'assigned_user'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, send_to: e.target.value })}
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
                                        value={localConfig?.url || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, url: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        placeholder="https://api.example.com/webhook"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        HTTP Method
                                    </label>
                                    <select
                                        value={localConfig?.method || 'POST'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, method: e.target.value })}
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
                                        value={localConfig?.headers_json || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, headers_json: e.target.value })}
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
                                        value={localConfig?.custom_payload || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, custom_payload: e.target.value })}
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
                                        value={localConfig?.prompt || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, prompt: e.target.value })}
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
                                        value={localConfig?.system_message || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, system_message: e.target.value })}
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
                                            value={localConfig?.model || 'gpt-4o-mini'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
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
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Store Result In
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.output_variable || 'ai_response'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, output_variable: e.target.value })}
                                            placeholder="variable_name"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 text-sm"
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
                                        value={localConfig?.delay_type || 'duration'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, delay_type: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    >
                                        <option value="duration">Wait for duration</option>
                                        <option value="until_time">Wait until specific time</option>
                                        <option value="until_day">Wait until day of week</option>
                                    </select>
                                </div>

                                {(!localConfig?.delay_type || localConfig?.delay_type === 'duration') && (
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Duration
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={localConfig?.value || 1}
                                                onChange={(e) => setLocalConfig({ ...localConfig, value: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Unit
                                            </label>
                                            <select
                                                value={localConfig?.unit || 'hours'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, unit: e.target.value })}
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

                                {localConfig?.delay_type === 'until_time' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Wait Until Time
                                        </label>
                                        <input
                                            type="time"
                                            value={localConfig?.until_time || '09:00'}
                                            onChange={(e) => setLocalConfig({ ...localConfig, until_time: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                        />
                                        <p className="text-xs text-slate-400 mt-1">Wait until this time (next occurrence if already passed)</p>
                                    </div>
                                )}

                                {localConfig?.delay_type === 'until_day' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                                Wait Until Day
                                            </label>
                                            <select
                                                value={localConfig?.until_day || 'monday'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, until_day: e.target.value })}
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
                                                value={localConfig?.at_time || '09:00'}
                                                onChange={(e) => setLocalConfig({ ...localConfig, at_time: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            />
                                        </div>
                                    </>
                                )}

                                <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                                    <input
                                        type="checkbox"
                                        id="skip_weekends"
                                        checked={localConfig?.skip_weekends || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, skip_weekends: e.target.checked })}
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
                                        value={localConfig?.field || ''}
                                        onChange={(e) => setLocalConfig({ ...localConfig, field: e.target.value })}
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
                                {localConfig?.field === 'custom' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Custom Field Name
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.custom_field || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, custom_field: e.target.value })}
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
                                        value={localConfig?.operator || 'equals'}
                                        onChange={(e) => setLocalConfig({ ...localConfig, operator: e.target.value })}
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
                                {!['is_empty', 'is_not_empty', 'is_null', 'is_not_null'].includes(localConfig?.operator) && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            {['in_list', 'not_in_list'].includes(localConfig?.operator)
                                                ? 'Values (comma-separated)'
                                                : 'Value'}
                                        </label>
                                        <input
                                            type="text"
                                            value={localConfig?.value || ''}
                                            onChange={(e) => setLocalConfig({ ...localConfig, value: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                            placeholder={['in_list', 'not_in_list'].includes(localConfig?.operator)
                                                ? 'qualified, proposal_sent, won'
                                                : 'qualified'}
                                        />
                                    </div>
                                )}
                                <div className="flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 rounded">
                                    <input
                                        type="checkbox"
                                        id="case_insensitive"
                                        checked={localConfig?.case_insensitive || false}
                                        onChange={(e) => setLocalConfig({ ...localConfig, case_insensitive: e.target.checked })}
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
                                {'{{id}}, {{email}}, {{contact_name}}, {{company}}, {{status}}, {{source}}, {{last_email_subject}}, {{last_email_body}}'}
                            </code>
                        </div>

                        {/* Generic / No Settings Fallback */}
                        {!['trigger', 'action', 'condition', 'delay'].includes(selectedNode.type) ||
                            (selectedNode.type === 'action' && !['send_email', 'update_lead', 'update_client', 'update_inquiry', 'create_task', 'assign_user', 'assign_inquiry', 'add_note', 'send_notification', 'webhook', 'ai_assistant'].includes(selectedNode.data.actionType)) ? (
                            <div className="p-4 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center">
                                <p className="text-sm text-slate-500">No specific configuration available for this node type.</p>
                                <p className="text-[10px] text-slate-400 mt-2">ID: {selectedNode.id}</p>
                            </div>
                        ) : null}

                        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={applyNodeConfig}
                                disabled={isApplyingConfig}
                                className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors font-medium shadow-sm flex items-center justify-center gap-2"
                            >
                                {isApplyingConfig ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        <span>Applying...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Apply Configuration</span>
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default WorkflowEditor;

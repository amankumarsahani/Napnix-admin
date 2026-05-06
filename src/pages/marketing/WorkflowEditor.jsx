import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { workflowsAPI, templatesAPI, documentTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

import { nodeTypes } from './workflow/workflowConstants';
import WorkflowNodePanel from './workflow/WorkflowNodePanel';
import WorkflowToolbar from './workflow/WorkflowToolbar';
import WorkflowNodeConfig from './workflow/WorkflowNodeConfig';

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
    const [isApplyingConfig, setIsApplyingConfig] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [confirmState, setConfirmState] = useState({ isOpen: false });



    const [emailTemplates, setEmailTemplates] = useState([]);
    const [documentTemplates, setDocumentTemplates] = useState([]);

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const res = await templatesAPI.getAll({ limit: 100 });
                setEmailTemplates(res.data || res.templates || []);
            } catch (error) {
                // silently ignore
            }
            try {
                const res = await documentTemplatesAPI.getAll();
                setDocumentTemplates(res.data || []);
            } catch (error) {
                // silently ignore
            }
        };
        fetchTemplates();
    }, []);

    useEffect(() => {
        if (!isNew && id && id !== 'undefined') {
            fetchWorkflow();
        } else if (id === 'undefined') {
            toast.error('Invalid workflow access');
            navigate('/workflows');
        }
    }, [id, isNew]);

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

    useEffect(() => {
        if (!selectedNodeId) return;

        const currentNode = nodes.find(n => n.id === selectedNodeId);
        if (!currentNode) return;

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

            if (data.canvas_data) {
                setNodes(data.canvas_data.nodes || []);
                setEdges(data.canvas_data.edges || []);
            } else if (data.nodes) {
                const formattedNodes = data.nodes.map(n => {
                    let nodeConfig = {};
                    try {
                        if (n.config) {
                            nodeConfig = typeof n.config === 'string' ? JSON.parse(n.config) : n.config;
                        } else if (n.data?.config) {
                            nodeConfig = typeof n.data.config === 'string' ? JSON.parse(n.data.config) : n.data.config;
                        }
                    } catch (e) {

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
                setNodes(formattedNodes);

                if (data.connections && data.connections.length > 0) {
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
                    setEdges(formattedEdges);
                }
            }
        } catch (error) {
            toast.error('Failed to load workflow data');
        } finally {
            setIsLoading(false);
        }
    };

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

    const selectedNode = nodes.find(n => n.id === selectedNodeId) || null;

    const onConnect = useCallback((params) => {
        setEdges((eds) => addEdge({
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { strokeWidth: 2 }
        }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((_event, node) => {
        setSelectedNodeId(node.id);
        setShowNodeConfig(true);
    }, []);

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

    const deleteSelectedNode = () => {
        if (selectedNodeId) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId));
            setSelectedNodeId(null);
            setShowNodeConfig(false);
        }
    };

    const applyNodeConfig = useCallback(() => {
        if (!selectedNodeId) return;

        setIsApplyingConfig(true);
        setNodes(nds => nds.map(n =>
            n.id === selectedNodeId
                ? { ...n, data: { ...n.data, label: localLabel, config: localConfig } }
                : n
        ));

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

            const payloadString = JSON.stringify(workflowData);
            const sizeInMB = (payloadString.length / (1024 * 1024)).toFixed(2);

            if (sizeInMB > 5) {
                setConfirmState({
                    isOpen: true,
                    title: 'Large Workflow Data',
                    message: `Workflow data is unusually large (${sizeInMB} MB). Are you sure you want to save? This may affect performance.`,
                    variant: 'warning',
                    confirmText: 'Save Anyway',
                    onConfirm: async () => {
                        setConfirmState({ isOpen: false });
                        try {
                            if (isNew) {
                                await workflowsAPI.create(workflowData);
                                toast.success('Workflow created!');
                            } else {
                                await workflowsAPI.update(id, workflowData);
                                toast.success('Workflow saved!');
                            }
                            navigate('/workflows');
                        } catch (error) {
                            toast.error('Failed to save workflow');
                        } finally {
                            setSaving(false);
                        }
                    },
                });
                setSaving(false);
                return;
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
            <WorkflowNodePanel addNode={addNode} />

            <div className="flex-1 flex flex-col relative">
                <WorkflowToolbar
                    navigate={navigate}
                    workflowName={workflowName}
                    setWorkflowName={setWorkflowName}
                    isActive={isActive}
                    setIsActive={setIsActive}
                    isNew={isNew}
                    id={id}
                    selectedNode={selectedNode}
                    deleteSelectedNode={deleteSelectedNode}
                    saving={saving}
                    saveWorkflow={saveWorkflow}
                />

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

            <WorkflowNodeConfig
                selectedNode={selectedNode}
                localLabel={localLabel}
                setLocalLabel={setLocalLabel}
                localConfig={localConfig}
                setLocalConfig={setLocalConfig}
                showNodeConfig={showNodeConfig}
                setShowNodeConfig={setShowNodeConfig}
                applyNodeConfig={applyNodeConfig}
                isApplyingConfig={isApplyingConfig}
                emailTemplates={emailTemplates}
                documentTemplates={documentTemplates}
            />

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => { setConfirmState({ isOpen: false }); }}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
            />
        </div>
    );
};

export default WorkflowEditor;

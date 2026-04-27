import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, MarkerType, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import toast from 'react-hot-toast';

const TRIGGER_TYPES = [
    { type: 'contact_subscribed', label: 'Contact Subscribes', icon: '👤', desc: 'When a new contact joins' },
    { type: 'tag_added', label: 'Tag Added', icon: '🏷️', desc: 'When a tag is added to contact' },
    { type: 'list_added', label: 'Added to List', icon: '📋', desc: 'When contact is added to a list' },
    { type: 'campaign_opened', label: 'Campaign Opened', icon: '📬', desc: 'When contact opens a campaign' },
    { type: 'campaign_clicked', label: 'Link Clicked', icon: '🖱️', desc: 'When contact clicks a campaign link' },
    { type: 'inactivity', label: 'Inactivity', icon: '😴', desc: 'When contact is inactive for X days' },
    { type: 'date_based', label: 'Date Field', icon: '📅', desc: 'On a contact date field (birthday)' },
    { type: 'webhook', label: 'Webhook', icon: '🔗', desc: 'External trigger via API' },
    { type: 'manual', label: 'Manual', icon: '✋', desc: 'Manually enroll contacts' },
];

const ACTION_TYPES = [
    { type: 'send_email', label: 'Send Email', icon: '✉️', desc: 'Send an email template' },
    { type: 'wait', label: 'Wait / Delay', icon: '⏳', desc: 'Wait for a duration' },
    { type: 'condition', label: 'If / Else', icon: '🔀', desc: 'Branch based on condition' },
    { type: 'add_tag', label: 'Add Tag', icon: '🏷️', desc: 'Add tag to contact' },
    { type: 'remove_tag', label: 'Remove Tag', icon: '🗑️', desc: 'Remove tag from contact' },
    { type: 'update_field', label: 'Update Field', icon: '✏️', desc: 'Update a contact field' },
    { type: 'move_to_list', label: 'Add to List', icon: '📋', desc: 'Add contact to a list' },
    { type: 'remove_from_list', label: 'Remove from List', icon: '📋', desc: 'Remove from a list' },
    { type: 'webhook', label: 'Webhook', icon: '🔗', desc: 'Call an external URL' },
    { type: 'notify', label: 'Notify Team', icon: '🔔', desc: 'Send internal notification' },
    { type: 'end', label: 'End', icon: '🏁', desc: 'End the automation' },
];

function TriggerNode({ data, selected }) {
    const trigger = TRIGGER_TYPES.find(t => t.type === data.triggerType) || TRIGGER_TYPES[0];
    return (
        <div className={`px-4 py-3 rounded-xl border-2 min-w-[200px] bg-white dark:bg-slate-800 shadow-sm ${selected ? 'border-emerald-500 shadow-emerald-100' : 'border-emerald-300'}`}>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{trigger.icon}</span>
                <span className="text-xs font-bold text-emerald-600 uppercase">Trigger</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{data.label || trigger.label}</p>
            {data.config?.tag && <p className="text-xs text-slate-400 mt-1">Tag: {data.config.tag}</p>}
            {data.config?.days && <p className="text-xs text-slate-400 mt-1">After {data.config.days} days</p>}
            <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3" />
        </div>
    );
}

function ActionNode({ data, selected }) {
    const action = ACTION_TYPES.find(a => a.type === data.actionType) || ACTION_TYPES[0];
    const colors = { send_email: 'blue', wait: 'purple', add_tag: 'amber', remove_tag: 'rose', update_field: 'cyan', move_to_list: 'indigo', webhook: 'orange', notify: 'pink', end: 'slate' };
    const c = colors[data.actionType] || 'blue';
    return (
        <div className={`px-4 py-3 rounded-xl border-2 min-w-[200px] bg-white dark:bg-slate-800 shadow-sm ${selected ? `border-${c}-500 shadow-${c}-100` : `border-${c}-300`}`}>
            <Handle type="target" position={Position.Top} className={`!bg-${c}-500 !w-3 !h-3`} />
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{action.icon}</span>
                <span className={`text-xs font-bold text-${c}-600 uppercase`}>{data.actionType === 'wait' ? 'Delay' : 'Action'}</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{data.label || action.label}</p>
            {data.config?.template_name && <p className="text-xs text-slate-400 mt-1">Template: {data.config.template_name}</p>}
            {data.config?.duration && <p className="text-xs text-slate-400 mt-1">Wait: {data.config.duration} {data.config.unit || 'hours'}</p>}
            {data.config?.tag && <p className="text-xs text-slate-400 mt-1">Tag: {data.config.tag}</p>}
            <Handle type="source" position={Position.Bottom} className={`!bg-${c}-500 !w-3 !h-3`} />
        </div>
    );
}

function ConditionNode({ data, selected }) {
    return (
        <div className={`px-4 py-3 rounded-xl border-2 min-w-[220px] bg-white dark:bg-slate-800 shadow-sm ${selected ? 'border-amber-500 shadow-amber-100' : 'border-amber-300'}`}>
            <Handle type="target" position={Position.Top} className="!bg-amber-500 !w-3 !h-3" />
            <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🔀</span>
                <span className="text-xs font-bold text-amber-600 uppercase">Condition</span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{data.label || 'If / Else'}</p>
            {data.config?.field && <p className="text-xs text-slate-400 mt-1">If {data.config.field} {data.config.operator} {data.config.value}</p>}
            <div className="flex justify-between mt-2 text-[10px] font-bold">
                <span className="text-emerald-600">YES ✓</span>
                <span className="text-rose-500">NO ✗</span>
            </div>
            <Handle type="source" position={Position.Bottom} id="yes" className="!bg-emerald-500 !w-3 !h-3" style={{ left: '25%' }} />
            <Handle type="source" position={Position.Bottom} id="no" className="!bg-rose-500 !w-3 !h-3" style={{ left: '75%' }} />
        </div>
    );
}

const nodeTypes = { trigger: TriggerNode, action: ActionNode, condition: ConditionNode };

export default function AutomationEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isNew = !id || id === 'new';

    const [nodes, setNodes, onNodesChange] = useNodesState([{
        id: 'trigger-1', type: 'trigger', position: { x: 300, y: 50 },
        data: { label: 'Contact Subscribes', triggerType: 'contact_subscribed', config: {} }
    }]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [automationName, setAutomationName] = useState('New Automation');
    const [selectedNode, setSelectedNode] = useState(null);
    const [isActive, setIsActive] = useState(false);

    const onConnect = useCallback((params) => {
        setEdges(eds => addEdge({ ...params, type: 'smoothstep', animated: true, style: { stroke: '#10b981', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' } }, eds));
    }, [setEdges]);

    const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);

    const addNode = (nodeType, actionType) => {
        const id = `${nodeType}-${Date.now()}`;
        const typeMap = { trigger: TRIGGER_TYPES, action: ACTION_TYPES };
        const item = (typeMap[nodeType] || ACTION_TYPES).find(t => t.type === actionType);
        const yOffset = 80 + nodes.length * 120;

        const newNode = {
            id, type: nodeType === 'condition' ? 'condition' : (nodeType === 'trigger' ? 'trigger' : 'action'),
            position: { x: 300, y: yOffset },
            data: {
                label: item?.label || actionType,
                ...(nodeType === 'trigger' ? { triggerType: actionType } : { actionType }),
                config: {}
            }
        };
        setNodes(nds => [...nds, newNode]);
    };

    const deleteNode = () => {
        if (!selectedNode) return;
        setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
        setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setSelectedNode(null);
    };

    const updateNodeConfig = (key, value) => {
        if (!selectedNode) return;
        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, config: { ...n.data.config, [key]: value } } } : n));
    };

    const updateNodeLabel = (label) => {
        if (!selectedNode) return;
        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n));
    };

    const handleSave = () => {
        if (!automationName) return toast.error('Name is required');
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) return toast.error('A trigger node is required');
        toast.success('Automation saved! (Connect API to persist)');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]">
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/email-marketing/automations')} className="text-slate-400 hover:text-slate-600 text-lg">&larr;</button>
                    <input type="text" value={automationName} onChange={e => setAutomationName(e.target.value)} className="text-lg font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white w-64" />
                </div>
                <div className="flex items-center gap-2">
                    {selectedNode && <button onClick={deleteNode} className="px-3 py-1.5 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">Delete Node</button>}
                    <button onClick={() => setIsActive(!isActive)} className={`px-3 py-1.5 text-xs rounded font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {isActive ? 'Active' : 'Draft'}
                    </button>
                    <button onClick={handleSave} className="btn btn-primary text-sm">Save</button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-56 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto flex-shrink-0 p-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Triggers</p>
                    <div className="space-y-1 mb-4">
                        {TRIGGER_TYPES.map(t => (
                            <button key={t.type} onClick={() => addNode('trigger', t.type)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                <span>{t.icon}</span><span className="text-xs text-slate-700 dark:text-slate-300">{t.label}</span>
                            </button>
                        ))}
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actions</p>
                    <div className="space-y-1">
                        {ACTION_TYPES.map(a => (
                            <button key={a.type} onClick={() => addNode(a.type === 'condition' ? 'condition' : 'action', a.type)}
                                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <span>{a.icon}</span><span className="text-xs text-slate-700 dark:text-slate-300">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1">
                    <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={onNodeClick} nodeTypes={nodeTypes} fitView className="bg-slate-50 dark:bg-[#0f172a]">
                        <Controls className="!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !rounded-xl !shadow-lg" />
                        <MiniMap nodeColor={(node) => ({ trigger: '#22c55e', action: '#3b82f6', condition: '#f59e0b' }[node.type] || '#eee')} maskColor="rgba(0,0,0,0.1)" className="!bg-white dark:!bg-slate-800 !rounded-xl !border-slate-200" />
                        <Background variant="dots" gap={16} size={1} color="#94a3b8" />
                    </ReactFlow>
                </div>

                <div className="w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto flex-shrink-0 p-4">
                    {selectedNode ? (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Node Settings</h3>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Label</label>
                                <input type="text" value={selectedNode.data?.label || ''} onChange={e => updateNodeLabel(e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" />
                            </div>
                            {selectedNode.data?.actionType === 'send_email' && (
                                <>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Template ID</label><input type="number" value={selectedNode.data?.config?.template_id || ''} onChange={e => updateNodeConfig('template_id', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Subject Override</label><input type="text" value={selectedNode.data?.config?.subject || ''} onChange={e => updateNodeConfig('subject', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                                </>
                            )}
                            {selectedNode.data?.actionType === 'wait' && (
                                <div className="flex gap-2">
                                    <div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">Duration</label><input type="number" value={selectedNode.data?.config?.duration || ''} onChange={e => updateNodeConfig('duration', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                                    <div className="flex-1"><label className="block text-xs font-medium text-slate-500 mb-1">Unit</label><select value={selectedNode.data?.config?.unit || 'hours'} onChange={e => updateNodeConfig('unit', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"><option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option></select></div>
                                </div>
                            )}
                            {(selectedNode.data?.actionType === 'add_tag' || selectedNode.data?.actionType === 'remove_tag') && (
                                <div><label className="block text-xs font-medium text-slate-500 mb-1">Tag Name</label><input type="text" value={selectedNode.data?.config?.tag || ''} onChange={e => updateNodeConfig('tag', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                            )}
                            {selectedNode.data?.actionType === 'condition' && (
                                <>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Field</label><select value={selectedNode.data?.config?.field || ''} onChange={e => updateNodeConfig('field', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"><option value="">Select field...</option><option value="email_score">Email Score</option><option value="open_count">Open Count</option><option value="click_count">Click Count</option><option value="tags">Tags</option><option value="source">Source</option></select></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Operator</label><select value={selectedNode.data?.config?.operator || ''} onChange={e => updateNodeConfig('operator', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"><option value="equals">Equals</option><option value="not_equals">Not Equals</option><option value="greater_than">Greater Than</option><option value="less_than">Less Than</option><option value="contains">Contains</option></select></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Value</label><input type="text" value={selectedNode.data?.config?.value || ''} onChange={e => updateNodeConfig('value', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                                </>
                            )}
                            {selectedNode.data?.actionType === 'webhook' && (
                                <>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">URL</label><input type="url" value={selectedNode.data?.config?.url || ''} onChange={e => updateNodeConfig('url', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" placeholder="https://..." /></div>
                                    <div><label className="block text-xs font-medium text-slate-500 mb-1">Method</label><select value={selectedNode.data?.config?.method || 'POST'} onChange={e => updateNodeConfig('method', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600"><option value="POST">POST</option><option value="GET">GET</option><option value="PUT">PUT</option></select></div>
                                </>
                            )}
                            {selectedNode.data?.triggerType === 'tag_added' && (
                                <div><label className="block text-xs font-medium text-slate-500 mb-1">Tag Name</label><input type="text" value={selectedNode.data?.config?.tag || ''} onChange={e => updateNodeConfig('tag', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                            )}
                            {selectedNode.data?.triggerType === 'inactivity' && (
                                <div><label className="block text-xs font-medium text-slate-500 mb-1">Inactive Days</label><input type="number" value={selectedNode.data?.config?.days || 30} onChange={e => updateNodeConfig('days', e.target.value)} className="w-full px-2 py-1.5 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div>
                            )}
                            <p className="text-xs text-slate-400">Type: {selectedNode.type} | ID: {selectedNode.id}</p>
                        </div>
                    ) : (
                        <div className="text-center text-sm text-slate-400 pt-10">
                            <p>Click a node to edit</p>
                            <p className="mt-2 text-xs">Add nodes from the left panel, then connect them by dragging between handles</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsAPI } from '../../api';
import {
    Plus,
    Play,
    Pause,
    Trash2,
    Edit2,
    Activity,
    Zap,
    Clock,
    CheckCircle,
    XCircle,
    MoreVertical,
    GitBranch,
    Mail,
    User,
    FileText
} from 'lucide-react';

const Workflows = () => {
    const navigate = useNavigate();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);

    useEffect(() => {
        fetchWorkflows();
    }, []);

    const fetchWorkflows = async () => {
        try {
            setLoading(true);
            const response = await workflowsAPI.getAll();
            setWorkflows(response.data || []);
        } catch (error) {
            console.error('Failed to fetch workflows:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (workflow) => {
        try {
            await workflowsAPI.toggle(workflow.id);
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to toggle workflow:', error);
        }
    };

    const handleDelete = async () => {
        if (!selectedWorkflow) return;
        try {
            await workflowsAPI.delete(selectedWorkflow.id);
            setShowDeleteModal(false);
            setSelectedWorkflow(null);
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
        }
    };

    const handleTest = async (workflow) => {
        try {
            await workflowsAPI.test(workflow.id);
            alert('Workflow triggered for testing!');
        } catch (error) {
            console.error('Failed to test workflow:', error);
            alert('Failed to test workflow');
        }
    };

    const getTriggerIcon = (triggerType) => {
        switch (triggerType) {
            case 'lead_created': return <User className="w-4 h-4" />;
            case 'client_created': return <User className="w-4 h-4" />;
            case 'scheduled': return <Clock className="w-4 h-4" />;
            case 'manual': return <Play className="w-4 h-4" />;
            default: return <Zap className="w-4 h-4" />;
        }
    };

    const getTriggerLabel = (triggerType) => {
        const labels = {
            'lead_created': 'Lead Created',
            'client_created': 'Client Created',
            'lead_status_changed': 'Lead Status Changed',
            'scheduled': 'Scheduled',
            'manual': 'Manual'
        };
        return labels[triggerType] || triggerType;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Automation Workflows</h1>
                    <p className="text-slate-500 dark:text-slate-400">Create automated workflows to streamline your processes</p>
                </div>
                <button
                    onClick={() => navigate('/workflows/new')}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Create Workflow
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <GitBranch className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{workflows.length}</p>
                            <p className="text-sm text-slate-500">Total Workflows</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {workflows.filter(w => w.is_active).length}
                            </p>
                            <p className="text-sm text-slate-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {workflows.reduce((sum, w) => sum + (w.execution_count || 0), 0)}
                            </p>
                            <p className="text-sm text-slate-500">Total Executions</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                            <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {workflows.reduce((sum, w) => sum + (w.success_count || 0), 0)}
                            </p>
                            <p className="text-sm text-slate-500">Successful</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Workflows List */}
            {workflows.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-12 text-center shadow-sm">
                    <GitBranch className="w-16 h-16 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No workflows yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">Create your first automation workflow to get started</p>
                    <button
                        onClick={() => navigate('/workflows/new')}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                    >
                        Create Workflow
                    </button>
                </div>
            ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Workflow</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Trigger</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Executions</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {workflows.map((workflow) => (
                                <tr
                                    key={workflow.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{workflow.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{workflow.description || 'No description'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded">
                                                {getTriggerIcon(workflow.trigger_type)}
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {getTriggerLabel(workflow.trigger_type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleToggle(workflow); }}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${workflow.is_active
                                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            {workflow.is_active ? (
                                                <>
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Inactive
                                                </>
                                            )}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <span className="font-medium text-slate-900 dark:text-white">{workflow.execution_count || 0}</span>
                                            <span className="text-slate-500"> runs</span>
                                            {workflow.success_count > 0 && (
                                                <span className="text-green-600 ml-2">({workflow.success_count} successful)</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleTest(workflow)}
                                                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                title="Test Run"
                                            >
                                                <Play className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => navigate(`/workflows/${workflow.id}/edit`)}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedWorkflow(workflow); setShowDeleteModal(true); }}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Delete Workflow</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-4">
                            Are you sure you want to delete "{selectedWorkflow?.name}"? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setSelectedWorkflow(null); }}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Workflows;

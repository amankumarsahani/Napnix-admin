import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowsAPI } from '../../api';
import toast from 'react-hot-toast';

// Simple SVG Icon components
const Icons = {
    Plus: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
    ),
    Play: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
    ),
    Trash: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
    ),
    Edit: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
    ),
    User: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    ),
    Clock: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
    ),
    Zap: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
        </svg>
    ),
    GitBranch: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="6" y1="3" x2="6" y2="15"></line>
            <circle cx="18" cy="6" r="3"></circle>
            <circle cx="6" cy="18" r="3"></circle>
            <path d="M18 9a9 9 0 0 1-9 9"></path>
        </svg>
    ),
    Check: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
    ),
    X: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    ),
    Activity: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
    )
};

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
            toast.error('Failed to load workflows');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (workflow) => {
        try {
            await workflowsAPI.toggle(workflow.id);
            toast.success(workflow.is_active ? 'Workflow deactivated' : 'Workflow activated');
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to toggle workflow:', error);
            toast.error('Failed to toggle workflow');
        }
    };

    const handleDelete = async () => {
        if (!selectedWorkflow) return;
        try {
            await workflowsAPI.delete(selectedWorkflow.id);
            toast.success('Workflow deleted');
            setShowDeleteModal(false);
            setSelectedWorkflow(null);
            fetchWorkflows();
        } catch (error) {
            console.error('Failed to delete workflow:', error);
            toast.error('Failed to delete workflow');
        }
    };

    const handleTest = async (workflow) => {
        try {
            await workflowsAPI.test(workflow.id);
            toast.success('Workflow triggered for testing!');
        } catch (error) {
            console.error('Failed to test workflow:', error);
            toast.error('Failed to test workflow');
        }
    };

    const getTriggerIcon = (triggerType) => {
        switch (triggerType) {
            case 'lead_created':
            case 'client_created':
                return <Icons.User />;
            case 'scheduled':
                return <Icons.Clock />;
            case 'manual':
                return <Icons.Play />;
            default:
                return <Icons.Zap />;
        }
    };

    const getTriggerLabel = (triggerType) => {
        const labels = {
            'lead_created': 'Lead Created',
            'client_created': 'Client Created',
            'lead_status_changed': 'Lead Status Changed',
            'client_status_changed': 'Client Status Changed',
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
                    onClick={() => toast('Workflow editor coming soon!')}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
                >
                    <Icons.Plus />
                    Create Workflow
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                            <Icons.GitBranch />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{workflows.length}</p>
                            <p className="text-sm text-slate-500">Total Workflows</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <Icons.Check />
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
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                            <Icons.Activity />
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
                        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                            <Icons.Zap />
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
                    <div className="text-slate-300 dark:text-slate-600 mb-4 flex justify-center">
                        <Icons.GitBranch />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No workflows yet</h3>
                    <p className="text-slate-500 dark:text-slate-400 mb-4">Create your first automation workflow to get started</p>
                    <button
                        onClick={() => toast('Workflow editor coming soon!')}
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
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                >
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{workflow.name}</p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{workflow.description || 'No description'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">
                                                {getTriggerIcon(workflow.trigger_type)}
                                            </span>
                                            <span className="text-sm text-slate-600 dark:text-slate-300">
                                                {getTriggerLabel(workflow.trigger_type)}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggle(workflow)}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${workflow.is_active
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                                                }`}
                                        >
                                            {workflow.is_active ? (
                                                <>
                                                    <Icons.Check />
                                                    Active
                                                </>
                                            ) : (
                                                <>
                                                    <Icons.X />
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
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleTest(workflow)}
                                                className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors"
                                                title="Test Run"
                                            >
                                                <Icons.Play />
                                            </button>
                                            <button
                                                onClick={() => toast('Editor coming soon!')}
                                                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit"
                                            >
                                                <Icons.Edit />
                                            </button>
                                            <button
                                                onClick={() => { setSelectedWorkflow(workflow); setShowDeleteModal(true); }}
                                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Icons.Trash />
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

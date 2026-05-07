import toast from 'react-hot-toast';
import { workflowsAPI } from '../../../api';

const WorkflowToolbar = ({
    navigate,
    workflowName,
    setWorkflowName,
    isActive,
    setIsActive,
    isNew,
    id,
    selectedNode,
    deleteSelectedNode,
    saving,
    saveWorkflow
}) => {
    return (
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

                        if (!isNew && id && id !== 'new') {
                            try {
                                await workflowsAPI.toggle(id);
                                toast.success(`Workflow ${newActive ? 'activated' : 'deactivated'}`);
                            } catch (error) {
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
    );
};

export default WorkflowToolbar;

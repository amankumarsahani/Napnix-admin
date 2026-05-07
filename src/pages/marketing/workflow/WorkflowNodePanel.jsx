import { NODE_PALETTE } from './workflowConstants';

const WorkflowNodePanel = ({ addNode }) => {
    return (
        <div className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 overflow-y-auto">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Nodes</h3>

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

            <div className="mb-4">
                <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">AI Blog</h4>
                <div className="space-y-2">
                    {NODE_PALETTE.aiBlog.map(item => (
                        <button
                            key={item.id}
                            onClick={() => addNode(item)}
                            className="w-full text-left px-3 py-2 text-sm bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

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
    );
};

export default WorkflowNodePanel;

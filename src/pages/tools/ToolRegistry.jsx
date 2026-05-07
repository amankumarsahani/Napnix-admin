import { useQuery } from '@tanstack/react-query';
import { toolsAPI } from '../../api';
import { FiGrid } from '../../components/icons/FeatherIcons';

export default function ToolRegistry() {
    const { data: toolsData, isLoading: loading } = useQuery({
        queryKey: ['tools'],
        queryFn: async () => {
            const res = await toolsAPI.getAll();
            return res.data || [];
        },
    });

    const tools = toolsData || [];

    const toolIcons = {
        nexcrm: '💼',
        nexmail: '📧',
    };

    const statusColors = {
        active: 'bg-emerald-100 text-emerald-700',
        beta: 'bg-amber-100 text-amber-700',
        deprecated: 'bg-red-100 text-red-700',
        maintenance: 'bg-slate-100 text-slate-600',
    };

    if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tool Registry</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage Nexspire platform tools and services</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <div key={tool.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-2xl">
                                {toolIcons[tool.slug] || <FiGrid />}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{tool.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">v{tool.version}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[tool.status] || statusColors.active}`}>{tool.status}</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{tool.description}</p>
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-xs text-slate-500">URL Pattern: <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{tool.base_url_pattern}</code></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

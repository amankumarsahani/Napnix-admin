import { FiServer } from '../../components/icons/FeatherIcons';

const TenantStats = ({ tenant }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Port</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">{tenant.assigned_port || '-'}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <FiServer className="text-indigo-500" /> Server
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white truncate">{tenant.server_name || 'Primary'}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Industry</div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{tenant.industry_type || 'general'}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Plan</div>
                <div className="text-lg font-semibold text-purple-600">{tenant.plan_name || 'Starter'}</div>
            </div>
        </div>
    );
};

export default TenantStats;

import { FiTerminal, FiRefreshCw, FiExternalLink } from '../../components/icons/FeatherIcons';

const TenantLogs = ({
    tenant,
    domain,
    logs,
    logsLoading,
    autoRefresh,
    setAutoRefresh,
    logsRef,
    onFetchLogs,
}) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <FiTerminal className="w-5 h-5 text-slate-500" />
                    PM2 Logs
                    {logsLoading && (
                        <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                </h3>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded border-slate-300 text-brand-600"
                        />
                        Auto-refresh
                    </label>
                    <button
                        onClick={onFetchLogs}
                        disabled={logsLoading}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-lg transition-colors flex items-center gap-2"
                    >
                        <FiRefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>

                    <a
                        href={`https://${tenant.slug}-crm.${domain}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                    >
                        <FiExternalLink className="w-4 h-4" />
                        Open CRM
                    </a>
                </div>
            </div>
            <div ref={logsRef} className="bg-slate-900 text-green-400 font-mono text-xs p-4 h-80 overflow-auto whitespace-pre-wrap">
                {logs || 'No logs available'}
            </div>
        </div>
    );
};

export default TenantLogs;

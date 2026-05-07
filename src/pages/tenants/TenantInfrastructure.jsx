import { FiDatabase } from '../../components/icons/FeatherIcons';

const TenantInfrastructure = ({ tenant, copyToClipboard }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <FiDatabase className="w-5 h-5 text-slate-500" />
                Infrastructure Details
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Database Name</p>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{tenant.db_name}</span>
                        <button onClick={() => copyToClipboard(tenant.db_name)} className="text-slate-400 hover:text-brand-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div>
                    <p className="text-xs font-medium text-slate-500 uppercase mb-2">Admin Email</p>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{tenant.email || 'admin@' + tenant.slug + '.local'}</span>
                        <button onClick={() => copyToClipboard(tenant.email || 'admin@' + tenant.slug + '.local')} className="text-slate-400 hover:text-brand-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                </div>
                {tenant.admin_password && (
                    <div className="md:col-span-2">
                        <p className="text-xs font-medium text-slate-500 uppercase mb-2">Admin Password</p>
                        <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                            <span className="font-mono text-sm text-slate-700 dark:text-slate-300">{tenant.admin_password}</span>
                            <button onClick={() => copyToClipboard(tenant.admin_password)} className="text-amber-600 hover:text-amber-700">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Use this password for initial admin login</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TenantInfrastructure;

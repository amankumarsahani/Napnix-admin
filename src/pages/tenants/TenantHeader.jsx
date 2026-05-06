import { FiCreditCard } from '../../components/icons/FeatherIcons';

const TenantHeader = ({
    tenant,
    actionLoading,
    sendingAgreement,
    onNavigateBack,
    onAction,
    onEndTrial,
    onSendPaymentLink,
    onSendAgreement,
    getStatusColor,
    getProcessStatusColor,
}) => {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <button
                    onClick={onNavigateBack}
                    className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{tenant.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-mono text-xs">{tenant.slug}</p>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(tenant.status)}`}>
                    {tenant.status}
                </span>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getProcessStatusColor(tenant.process_status)}`}></div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                        {tenant.process_status || 'stopped'}
                    </span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {tenant.process_status !== 'running' ? (
                    <button
                        onClick={() => onAction('start')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        Start
                    </button>
                ) : (
                    <>
                        <button
                            onClick={() => onAction('stop')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            Stop
                        </button>
                        <button
                            onClick={() => onAction('restart')}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            Restart
                        </button>
                    </>
                )}

                <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

                {tenant.status === 'trial' && (
                    <button
                        onClick={onEndTrial}
                        disabled={actionLoading === 'endTrial'}
                        className="px-4 py-2 bg-brand-600 dark:bg-brand-500 text-white rounded-lg hover:bg-brand-700 dark:hover:bg-brand-600 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                        {actionLoading === 'endTrial' ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <FiCreditCard className="w-4 h-4" />
                        )}
                        End Trial
                    </button>
                )}

                <button
                    onClick={onSendPaymentLink}
                    disabled={actionLoading === 'sendPayment'}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                    title="Send payment link email without suspending tenant"
                >
                    {actionLoading === 'sendPayment' ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <FiCreditCard className="w-4 h-4 text-brand-500" />
                    )}
                    Send Payment Link
                </button>

                <button
                    onClick={onSendAgreement}
                    disabled={sendingAgreement}
                    className="px-4 py-2 bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
                    title="Send service agreement PDF to tenant email"
                >
                    {sendingAgreement ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                    {sendingAgreement ? 'Sending...' : 'Send Agreement'}
                </button>
            </div>
        </div>
    );
};

export default TenantHeader;

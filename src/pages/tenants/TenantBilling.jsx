import { FiCreditCard, FiCheckCircle, FiXCircle, FiClock } from '../../components/icons/FeatherIcons';

const getPaymentStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
        case 'success':
        case 'succeeded':
            return <FiCheckCircle className="w-4 h-4 text-emerald-500" />;
        case 'failed':
            return <FiXCircle className="w-4 h-4 text-rose-500" />;
        default:
            return <FiClock className="w-4 h-4 text-amber-500" />;
    }
};

const TenantBilling = ({ payments, paymentsLoading }) => {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <FiCreditCard className="w-5 h-5 text-slate-500" />
                    Billing & Subscriptions
                    {paymentsLoading && (
                        <svg className="animate-spin h-4 w-4 text-slate-400" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                    )}
                </h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Date</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Invoice</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Plan</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400">Amount</th>
                            <th className="px-6 py-3 font-medium text-slate-500 dark:text-slate-400 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {paymentsLoading ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading billing history...</td>
                            </tr>
                        ) : payments.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No payment history found for this tenant.</td>
                            </tr>
                        ) : (
                            payments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                    <td className="px-6 py-3 text-slate-600 dark:text-slate-300">
                                        {new Date(payment.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{payment.invoice_number || '-'}</td>
                                    <td className="px-6 py-3 text-slate-900 dark:text-white font-medium">{payment.plan_name || 'One-time Payment'}</td>
                                    <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">
                                        ₹{parseFloat(payment.amount).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-center gap-1.5 capitalize text-slate-700 dark:text-slate-300">
                                            {getPaymentStatusIcon(payment.status)}
                                            <span className="text-xs">{payment.status}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TenantBilling;

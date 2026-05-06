import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { FiDownload, FiSearch, FiFilter, FiMoreHorizontal, FiCheck, FiX, FiClock, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function Transactions() {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const [filterStatus, setFilterStatus] = useState('all');

    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [syncPaymentId, setSyncPaymentId] = useState('');
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [pagination.page, filterStatus]);

    const handleSync = async (e) => {
        e.preventDefault();
        if (!syncPaymentId) return;

        try {
            setSyncing(true);
            const res = await api.post('/billing/payments/sync', {
                provider: 'stripe',
                paymentId: syncPaymentId
            });

            if (res.data.success) {
                toast.success('Transaction synced successfully');
                setSyncModalOpen(false);
                setSyncPaymentId('');
                fetchTransactions(); // Refresh list
            } else {
                toast.error(res.data.message || 'Sync failed');
            }
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to sync transaction');
        } finally {
            setSyncing(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/billing/payments?page=${pagination.page}&limit=10&status=${filterStatus}`);
            if (res.data.success) {
                setTransactions(res.data.data);
                setPagination(res.data.pagination);
            }
        } catch (error) {
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
            failed: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
            pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
        };
        const icon = {
            success: <FiCheck className="w-3 h-3" />,
            failed: <FiX className="w-3 h-3" />,
            pending: <FiClock className="w-3 h-3" />
        };
        const normalizedStatus = status?.toLowerCase() || 'pending';
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${styles[normalizedStatus] || styles.pending}`}>
                {icon[normalizedStatus]}
                {status}
            </span>
        );
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transactions</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time overview of all payments and transactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSyncModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        <FiRefreshCw className="w-4 h-4" />
                        Sync
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors">
                        <FiFilter className="w-4 h-4" />
                        Filter
                    </button>
                </div>
            </div>

            {/* Sync Modal */}
            {syncModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Sync Missing Transaction</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                            Enter the Stripe Payment Intent ID (e.g., pi_3L...) to manually fetch and record it.
                        </p>
                        <form onSubmit={handleSync}>
                            <input
                                type="text"
                                value={syncPaymentId}
                                onChange={(e) => setSyncPaymentId(e.target.value)}
                                placeholder="pi_1234567890..."
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 mb-4"
                                required
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSyncModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={syncing}
                                    className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {syncing && <FiRefreshCw className="w-4 h-4 animate-spin" />}
                                    {syncing ? 'Syncing...' : 'Sync Transaction'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {/* Filters Bar */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        {['all', 'success', 'failed'].map((status) => (
                            <button
                                key={status}
                                onClick={() => {
                                    setFilterStatus(status);
                                    setPagination({ ...pagination, page: 1 });
                                }}
                                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize ${filterStatus === status
                                    ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            className="pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500/50 w-64"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4">
                                            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-1" />
                                            <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                                        </td>
                                        <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded" /></td>
                                        <td className="px-6 py-4"></td>
                                    </tr>
                                ))
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No transactions found
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-slate-900 dark:text-white">
                                                {formatCurrency(tx.amount)}
                                            </div>
                                            <div className="text-xs text-slate-500 uppercase">{tx.currency || 'INR'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(tx.status)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                {tx.plan_name || 'One-time Payment'}
                                            </div>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">
                                                {tx.invoice_number}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                {tx.tenant_email || 'Unknown'}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {tx.tenant_name || 'Guest'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                            {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <FiMoreHorizontal className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                        Page <span className="font-medium text-slate-900 dark:text-white">{pagination.page}</span> of <span className="font-medium text-slate-900 dark:text-white">{pagination.pages || 1}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                            disabled={pagination.page <= 1}
                            className="px-3 py-1 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                            disabled={pagination.page >= pagination.pages}
                            className="px-3 py-1 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

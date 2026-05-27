import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { expensesAPI } from '../../api';
import {
    FiPlus, FiSearch, FiTrash2, FiEdit2, FiDownload,
    FiDollarSign, FiTrendingUp, FiRepeat, FiX, FiSave,
    FiBarChart2, FiFilter, FiCheckCircle
} from '../../components/icons/FeatherIcons';

const EXPENSE_CATEGORIES = [
    'Infrastructure', 'Software & Tools', 'Marketing & Ads',
    'Salaries & Contractors', 'Office & Supplies', 'Travel & Transport',
    'Food & Entertainment', 'Banking & Finance', 'Legal & Compliance', 'Other'
];

const DEPOSIT_CATEGORIES = [
    'Client Payment', 'Subscription Revenue', 'Sales',
    'Security Deposit Received', 'Refund', 'Grant / Investment', 'Other Income'
];

const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...DEPOSIT_CATEGORIES];

const CATEGORY_COLORS = {
    'Infrastructure':              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'Software & Tools':            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'Marketing & Ads':             'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    'Salaries & Contractors':      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    'Office & Supplies':           'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    'Travel & Transport':          'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    'Food & Entertainment':        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    'Banking & Finance':           'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    'Legal & Compliance':          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'Client Payment':              'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'Subscription Revenue':        'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    'Sales':                       'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    'Security Deposit Received':   'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-300',
    'Refund':                      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'Grant / Investment':          'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
    'Other Income':                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    'Other':                       'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
};

const CHART_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16','#ec4899','#64748b'];

const PAYMENT_LABELS = {
    cash: 'Cash', card: 'Card',
    bank_transfer: 'Bank Transfer', upi: 'UPI', other: 'Other'
};

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const EMPTY_FORM = (type = 'expense') => ({
    type,
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    category: type === 'deposit' ? 'Client Payment' : 'Other',
    description: '',
    vendor: '',
    payment_method: 'card',
    is_recurring: false,
    recurring_interval: 'monthly',
    reference: '',
    notes: ''
});

export default function Expenses() {
    const qc = useQueryClient();
    const [filters, setFilters] = useState({
        search: '', type: '', category: '',
        date_from: '', date_to: '', payment_method: ''
    });
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState([]);
    const [modal, setModal] = useState(null);
    const [showCharts, setShowCharts] = useState(true);

    const queryParams = useMemo(() => {
        const p = { page, limit: 50 };
        if (filters.type)           p.type = filters.type;
        if (filters.search)         p.search = filters.search;
        if (filters.category)       p.category = filters.category;
        if (filters.date_from)      p.date_from = filters.date_from;
        if (filters.date_to)        p.date_to = filters.date_to;
        if (filters.payment_method) p.payment_method = filters.payment_method;
        return p;
    }, [filters, page]);

    const { data: listData, isLoading } = useQuery({
        queryKey: ['expenses', queryParams],
        queryFn: () => expensesAPI.getAll(queryParams),
        staleTime: 60 * 1000,
    });

    const { data: statsData } = useQuery({
        queryKey: ['expenses-stats'],
        queryFn: () => expensesAPI.getStats(),
        staleTime: 2 * 60 * 1000,
    });

    const invalidate = () => {
        qc.invalidateQueries({ queryKey: ['expenses'] });
        qc.invalidateQueries({ queryKey: ['expenses-stats'] });
    };

    const createMutation = useMutation({
        mutationFn: (data) => expensesAPI.create(data),
        onSuccess: () => { invalidate(); toast.success('Record added'); setModal(null); },
        onError: (e) => toast.error(e.response?.data?.error || 'Failed to add'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => expensesAPI.update(id, data),
        onSuccess: () => { invalidate(); toast.success('Record updated'); setModal(null); },
        onError: (e) => toast.error(e.response?.data?.error || 'Failed to update'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => expensesAPI.delete(id),
        onSuccess: () => { invalidate(); toast.success('Deleted'); },
        onError: () => toast.error('Failed to delete'),
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => expensesAPI.bulkDelete(ids),
        onSuccess: (_, ids) => { invalidate(); toast.success(`${ids.length} records deleted`); setSelected([]); },
        onError: () => toast.error('Bulk delete failed'),
    });

    const records = listData?.data || [];
    const pagination = listData?.pagination || {};
    const stats = statsData?.data || {};
    const expStats = stats.expense || {};
    const depStats = stats.deposit || {};
    const netStats = stats.net || {};

    const allChecked = records.length > 0 && records.every(r => selected.includes(r.id));
    const toggleAll  = () => setSelected(allChecked ? [] : records.map(r => r.id));
    const toggleOne  = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const openAdd  = (type = 'expense') => setModal({ mode: 'add', data: EMPTY_FORM(type) });
    const openEdit = (row) => setModal({
        mode: 'edit',
        data: { ...row, date: row.date?.slice(0, 10), is_recurring: Boolean(row.is_recurring), recurring_interval: row.recurring_interval || 'monthly' }
    });

    const handleSubmit = (formData) => {
        const payload = {
            ...formData,
            amount: parseFloat(formData.amount),
            is_recurring: formData.is_recurring ? 1 : 0,
            recurring_interval: formData.is_recurring ? formData.recurring_interval : null,
        };
        if (modal.mode === 'add') createMutation.mutate(payload);
        else updateMutation.mutate({ id: modal.data.id, data: payload });
    };

    const exportCSV = () => {
        const headers = ['Type','Date','Vendor / From','Category','Description','Amount','Payment Method','Reference','Recurring'];
        const rows = records.map(r => [
            r.type, r.date?.slice(0, 10), r.vendor || '', r.category,
            r.description || '', r.amount,
            PAYMENT_LABELS[r.payment_method] || r.payment_method,
            r.reference || '',
            r.is_recurring ? (r.recurring_interval || 'yes') : 'no'
        ]);
        const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `finance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const filterCategories = [
        ...new Set([...ALL_CATEGORIES, ...(stats.allExpenseCategories || []), ...(stats.allDepositCategories || [])])
    ];

    const listTotal = records.reduce((s, r) => {
        return r.type === 'deposit' ? s + parseFloat(r.amount || 0) : s - parseFloat(r.amount || 0);
    }, 0);

    const trend = stats.monthlyTrend || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Finance Tracker</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Expenses and deposits in one place</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowCharts(v => !v)}
                        className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2">
                        <FiBarChart2 size={16} /> {showCharts ? 'Hide' : 'Show'} Charts
                    </button>
                    <button onClick={exportCSV}
                        className="px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 transition-colors flex items-center gap-2">
                        <FiDownload size={16} /> Export CSV
                    </button>
                    {/* Split add button */}
                    <div className="flex rounded-lg overflow-hidden border border-brand-600">
                        <button onClick={() => openAdd('expense')}
                            className="px-3 py-2 bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 flex items-center gap-1.5 transition-colors">
                            <FiPlus size={15} /> Expense
                        </button>
                        <div className="w-px bg-brand-500" />
                        <button onClick={() => openAdd('deposit')}
                            className="px-3 py-2 bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 flex items-center gap-1.5 transition-colors">
                            <FiPlus size={15} /> Deposit
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Deposits (Month)" value={fmt(depStats.thisMonth)} icon={<FiTrendingUp size={16} />} color="green" />
                <StatCard label="Expenses (Month)" value={fmt(expStats.thisMonth)} icon={<FiDollarSign size={16} />} color="brand" />
                <StatCard
                    label="Net This Month"
                    value={fmt(netStats.thisMonth)}
                    icon={<FiBarChart2 size={16} />}
                    color={netStats.thisMonth >= 0 ? 'teal' : 'red'}
                />
                <StatCard
                    label="Net YTD"
                    value={fmt(netStats.ytd)}
                    icon={<FiFilter size={16} />}
                    color={netStats.ytd >= 0 ? 'purple' : 'red'}
                />
            </div>

            {/* Charts */}
            {showCharts && trend.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Monthly Cash Flow</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={trend} barSize={12} barGap={3}>
                                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
                                <Tooltip
                                    formatter={(v, name) => [fmt(v), name === 'deposit' ? 'Deposits' : 'Expenses']}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '13px' }}
                                />
                                <Legend formatter={v => v === 'deposit' ? 'Deposits' : 'Expenses'} />
                                <Bar dataKey="deposit" fill="#10b981" radius={[3,3,0,0]} />
                                <Bar dataKey="expense" fill="#6366f1" radius={[3,3,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {(expStats.byCategory || []).length > 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Expense Breakdown</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={expStats.byCategory} dataKey="total" nameKey="category"
                                        cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                        {(expStats.byCategory || []).map((_, i) => (
                                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [fmt(v)]}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontSize: '13px' }} />
                                    <Legend iconType="circle" iconSize={9} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-48">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text" placeholder="Search vendor, description..."
                            value={filters.search}
                            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                    </div>
                    <select value={filters.type}
                        onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                        <option value="">All Types</option>
                        <option value="expense">Expenses</option>
                        <option value="deposit">Deposits</option>
                    </select>
                    <select value={filters.category}
                        onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                        <option value="">All Categories</option>
                        {filterCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filters.payment_method}
                        onChange={e => { setFilters(f => ({ ...f, payment_method: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                        <option value="">All Payments</option>
                        {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="date" value={filters.date_from} title="From date"
                        onChange={e => { setFilters(f => ({ ...f, date_from: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                    <input type="date" value={filters.date_to} title="To date"
                        onChange={e => { setFilters(f => ({ ...f, date_to: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                    {(filters.search || filters.type || filters.category || filters.date_from || filters.date_to || filters.payment_method) && (
                        <button onClick={() => { setFilters({ search:'', type:'', category:'', date_from:'', date_to:'', payment_method:'' }); setPage(1); }}
                            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1">
                            <FiX size={14} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Actions */}
            {selected.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-xl">
                    <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{selected.length} selected</span>
                    <button onClick={() => bulkDeleteMutation.mutate(selected)} disabled={bulkDeleteMutation.isPending}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50">
                        <FiTrash2 size={13} /> Delete Selected
                    </button>
                    <button onClick={() => setSelected([])} className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400">Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                                <th className="px-4 py-3 w-8">
                                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-slate-300" />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400 w-24">Type</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Vendor / From</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Category</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                                <th className="px-4 py-3 text-right font-medium text-slate-500 dark:text-slate-400">Amount</th>
                                <th className="px-4 py-3 text-left font-medium text-slate-500 dark:text-slate-400">Payment</th>
                                <th className="px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400">Recurring</th>
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">Loading...</td></tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-4 py-16 text-center">
                                        <FiDollarSign className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={36} />
                                        <p className="text-slate-400 font-medium">No records found</p>
                                        <p className="text-slate-300 dark:text-slate-600 text-xs mt-1">Add an expense or deposit to get started</p>
                                    </td>
                                </tr>
                            ) : records.map(row => (
                                <tr key={row.id}
                                    className={`border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${selected.includes(row.id) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        <input type="checkbox" checked={selected.includes(row.id)} onChange={() => toggleOne(row.id)} className="rounded border-slate-300" />
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                            row.type === 'deposit'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            {row.type === 'deposit' ? '+ Deposit' : '− Expense'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">{row.date?.slice(0, 10)}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white max-w-32 truncate">
                                        {row.vendor || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[row.category] || CATEGORY_COLORS['Other']}`}>
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-40 truncate">
                                        {row.description || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                                        row.type === 'deposit'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-slate-900 dark:text-white'
                                    }`}>
                                        {row.type === 'deposit' ? '+' : '−'}{fmt(row.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-xs">
                                        {PAYMENT_LABELS[row.payment_method] || row.payment_method}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.is_recurring ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
                                                <FiRepeat size={11} />{row.recurring_interval}
                                            </span>
                                        ) : <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button onClick={() => openEdit(row)}
                                                className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button onClick={() => { if (confirm('Delete this record?')) deleteMutation.mutate(row.id); }}
                                                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {records.length > 0 && (
                            <tfoot>
                                <tr className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                                    <td colSpan={6} className="px-4 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {pagination.total} record{pagination.total !== 1 ? 's' : ''}
                                    </td>
                                    <td className={`px-4 py-3 text-right text-sm font-bold ${listTotal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {listTotal >= 0 ? '+' : '−'}{fmt(Math.abs(listTotal))}
                                    </td>
                                    <td colSpan={3}></td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
                {pagination.pages > 1 && (
                    <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                        <span className="text-sm text-slate-500 dark:text-slate-400">Page {pagination.page} of {pagination.pages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40">
                                Previous
                            </button>
                            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                                className="px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <RecordModal
                    mode={modal.mode}
                    data={modal.data}
                    onClose={() => setModal(null)}
                    onSubmit={handleSubmit}
                    loading={createMutation.isPending || updateMutation.isPending}
                />
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color, small }) {
    const colorMap = {
        brand:  'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400',
        green:  'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
        teal:   'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400',
        purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
        red:    'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    };
    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
                <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.brand}`}>{icon}</div>
            </div>
            <p className={`font-bold text-slate-900 dark:text-white ${small ? 'text-base truncate' : 'text-xl'}`}>{value}</p>
        </div>
    );
}

function RecordModal({ mode, data, onClose, onSubmit, loading }) {
    const [form, setForm] = useState({ ...data });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isDeposit = form.type === 'deposit';
    const categories = isDeposit ? DEPOSIT_CATEGORIES : EXPENSE_CATEGORIES;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.date || !form.amount) { toast.error('Date and amount are required'); return; }
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        {mode === 'add' ? (isDeposit ? 'Add Deposit' : 'Add Expense') : (isDeposit ? 'Edit Deposit' : 'Edit Expense')}
                    </h2>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                        <FiX size={18} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="flex gap-2">
                        {[{ k: 'expense', l: '− Expense' }, { k: 'deposit', l: '+ Deposit' }].map(t => (
                            <button key={t.k} type="button"
                                onClick={() => { set('type', t.k); set('category', t.k === 'deposit' ? 'Client Payment' : 'Other'); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                                    form.type === t.k
                                        ? t.k === 'deposit'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-red-500 text-white border-red-500'
                                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}>
                                {t.l}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Date *</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Amount (₹) *</label>
                            <input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0.00"
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                {isDeposit ? 'From / Source' : 'Vendor'}
                            </label>
                            <input type="text" value={form.vendor} onChange={e => set('vendor', e.target.value)}
                                placeholder={isDeposit ? 'e.g. Acme Corp' : 'e.g. AWS, Google'}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Category</label>
                            <select value={form.category} onChange={e => set('category', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                        <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description"
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                    </div>

                    {isDeposit && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reference / Invoice #</label>
                            <input type="text" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="e.g. INV-001"
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500" />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Payment Method</label>
                        <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} className="rounded border-slate-300" />
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <FiRepeat size={14} /> Recurring
                            </span>
                        </label>
                        {form.is_recurring && (
                            <select value={form.recurring_interval} onChange={e => set('recurring_interval', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500">
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Notes</label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." rows={2}
                            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 resize-none" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading}
                            className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-50 flex items-center gap-2 transition-colors ${
                                isDeposit ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-500 hover:bg-red-600'
                            }`}>
                            {loading ? (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            ) : <FiSave size={14} />}
                            {mode === 'add' ? (isDeposit ? 'Add Deposit' : 'Add Expense') : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

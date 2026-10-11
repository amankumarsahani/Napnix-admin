import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell
} from 'recharts';
import toast from 'react-hot-toast';
import { expensesAPI } from '../../api';
import { Button, ConfirmDialog, Dialog, PageHeader, SearchInput, StatCard } from '../../components/ui';
import { useChartTheme } from '../../components/charts/useChartTheme';
import {
    FiPlus, FiSearch, FiTrash2, FiEdit2, FiDownload,
    FiDollarSign, FiTrendingUp, FiRepeat, FiX, FiSave,
    FiBarChart2, FiFilter, FiCheckCircle, FiUsers
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


const PAYMENT_LABELS = {
    cash: 'Cash', card: 'Card',
    bank_transfer: 'Bank Transfer', upi: 'UPI', other: 'Other'
};

const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const EMPTY_FORM = (type = 'expense') => ({
    type,
    date: new Date().toLocaleDateString('en-CA'), // local YYYY-MM-DD (toISOString is UTC: yesterday before 05:30 IST)
    amount: '',
    category: type === 'deposit' ? 'Client Payment' : 'Other',
    description: '',
    vendor: '',
    spent_by: '',
    payment_method: 'card',
    is_recurring: false,
    recurring_interval: 'monthly',
    reference: '',
    notes: ''
});

export default function Expenses() {
    const qc = useQueryClient();
    const chart = useChartTheme();
    const [filters, setFilters] = useState({
        search: '', type: '', category: '',
        date_from: '', date_to: '', payment_method: '', spent_by: ''
    });
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState([]);
    const [modal, setModal] = useState(null);
    const [showCharts, setShowCharts] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(null); // ids awaiting confirmation
    const [exporting, setExporting] = useState(false);

    const queryParams = useMemo(() => {
        const p = { page, limit: 50 };
        if (filters.type)           p.type = filters.type;
        if (filters.search)         p.search = filters.search;
        if (filters.category)       p.category = filters.category;
        if (filters.date_from)      p.date_from = filters.date_from;
        if (filters.date_to)        p.date_to = filters.date_to;
        if (filters.payment_method) p.payment_method = filters.payment_method;
        if (filters.spent_by)       p.spent_by = filters.spent_by;
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

    const { data: peopleData } = useQuery({
        queryKey: ['expense-people'],
        queryFn: () => expensesAPI.getPeople(),
        staleTime: 5 * 60 * 1000,
    });
    const people = peopleData?.data || [];

    const addPersonMutation = useMutation({
        mutationFn: (name) => expensesAPI.addPerson(name),
        onSuccess: () => { qc.invalidateQueries({ queryKey: ['expense-people'] }); toast.success('Person added'); },
        onError: (e) => toast.error(e.response?.data?.error || 'Failed to add person'),
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
        onSuccess: () => { invalidate(); toast.success('Deleted'); setConfirmDelete(null); },
        onError: () => toast.error('Failed to delete'),
    });

    const bulkDeleteMutation = useMutation({
        mutationFn: (ids) => expensesAPI.bulkDelete(ids),
        onSuccess: (_, ids) => { invalidate(); toast.success(`${ids.length} records deleted`); setSelected([]); setConfirmDelete(null); },
        onError: () => toast.error('Bulk delete failed'),
    });

    const records = listData?.data || [];
    const pagination = listData?.pagination || {};
    const stats = statsData?.data || {};
    const expStats = stats.expense || {};
    const depStats = stats.deposit || {};
    const netStats = stats.net || {};

    // Only rows on screen count as selected, so a bulk delete never hits rows hidden by paging/filters
    const visibleSelected = selected.filter(id => records.some(r => r.id === id));
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

    const exportCSV = async () => {
        setExporting(true);
        let all;
        try {
            // Every record matching the filters, not just the 50 on this page
            all = (await expensesAPI.getAll({ ...queryParams, page: 1, limit: 100000 }))?.data || [];
        } catch {
            toast.error('Export failed');
            return;
        } finally {
            setExporting(false);
        }
        // Quote-escape, and neutralise leading = + - @ so spreadsheets don't run them as formulas
        const cell = v => {
            let t = String(v ?? '');
            if (/^[=+\-@]/.test(t) && !/^-?\d+(\.\d+)?$/.test(t)) t = `'${t}`;
            return `"${t.replace(/"/g, '""')}"`;
        };
        const headers = ['Type','Date','Vendor / From','Spent By','Category','Description','Amount','Payment Method','Reference','Recurring'];
        const rows = all.map(r => [
            r.type, r.date?.slice(0, 10), r.vendor || '', r.spent_by || '', r.category,
            r.description || '', r.amount,
            PAYMENT_LABELS[r.payment_method] || r.payment_method,
            r.reference || '',
            r.is_recurring ? (r.recurring_interval || 'yes') : 'no'
        ]);
        const csv = [headers, ...rows].map(r => r.map(cell).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `finance-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const filterCategories = [
        ...new Set([...ALL_CATEGORIES, ...(stats.allExpenseCategories || []), ...(stats.allDepositCategories || [])])
    ];

    const listTotal = records.reduce((s, r) => {
        return r.type === 'deposit' ? s + parseFloat(r.amount || 0) : s - parseFloat(r.amount || 0);
    }, 0);

    const trend = stats.monthlyTrend || [];
    // Six fixed colour slots: largest 5 categories, the rest grouped (colours never cycle)
    const breakdown = (() => {
        const rows = [...(expStats.byCategory || [])].sort((a, b) => Number(b.total) - Number(a.total));
        if (rows.length <= 6) return rows;
        const rest = rows.slice(5).reduce((sum, r) => sum + Number(r.total || 0), 0);
        return [...rows.slice(0, 5), { category: 'Other (grouped)', total: rest }];
    })();
    // Backend returns this already sorted by total desc; cap it so one long list
    // cannot push the table off the screen.
    const spenders = (stats.bySpender || []).slice(0, 10);

    return (
        <div className="p-6 space-y-6">
            <PageHeader
                title="Finance Tracker"
                description="Expenses and deposits in one place."
                actions={
                    <>
                        <Button variant="ghost" onClick={() => setShowCharts(v => !v)}><FiBarChart2 size={16} />{showCharts ? 'Hide' : 'Show'} charts</Button>
                        <Button onClick={exportCSV} loading={exporting}>{!exporting && <FiDownload size={16} />}Export CSV</Button>
                        <Button variant="primary" onClick={() => openAdd('expense')}><FiPlus size={15} />Expense</Button>
                        <Button variant="primary" onClick={() => openAdd('deposit')}><FiPlus size={15} />Deposit</Button>
                    </>
                }
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Deposits (month)" value={fmt(depStats.thisMonth)} icon={<FiTrendingUp size={16} />} />
                <StatCard label="Expenses (month)" value={fmt(expStats.thisMonth)} icon={<FiDollarSign size={16} />} />
                <StatCard label="Net this month" value={<span className={netStats.thisMonth < 0 ? 'text-danger' : undefined}>{fmt(netStats.thisMonth)}</span>} icon={<FiBarChart2 size={16} />} />
                <StatCard label="Net YTD" value={<span className={netStats.ytd < 0 ? 'text-danger' : undefined}>{fmt(netStats.ytd)}</span>} icon={<FiFilter size={16} />} />
            </div>

            {/* Charts */}
            {showCharts && trend.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-surface rounded-md border border-border p-5">
                        <h3 className="text-sm font-semibold text-fg mb-4">Monthly Cash Flow</h3>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={trend} barSize={12} barGap={3}>
                                <XAxis dataKey="month" tick={chart.axisTick} axisLine={{ stroke: chart.grid }} tickLine={false} />
                                <YAxis tick={chart.axisTick} axisLine={false} tickLine={false} tickFormatter={v => '₹' + (v >= 1000 ? (v/1000).toFixed(0)+'k' : v)} />
                                <Tooltip
                                    formatter={(v, name) => [fmt(v), name === 'deposit' ? 'Deposits' : 'Expenses']}
                                    {...chart.tooltip}
                                />
                                <Legend formatter={v => v === 'deposit' ? 'Deposits' : 'Expenses'} />
                                <Bar dataKey="deposit" fill={chart.series[2]} radius={[4,4,0,0]} />
                                <Bar dataKey="expense" fill={chart.series[0]} radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    {(expStats.byCategory || []).length > 0 && (
                        <div className="bg-surface rounded-md border border-border p-5">
                            <h3 className="text-sm font-semibold text-fg mb-4">Expense Breakdown</h3>
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={breakdown} dataKey="total" nameKey="category" stroke={chart.surface} strokeWidth={2}
                                        cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                                        {breakdown.map((d, i) => (
                                            <Cell key={d.category} fill={d.category === 'Other (grouped)' ? chart.subtle : chart.series[i]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(v) => [fmt(v)]}
                                        {...chart.tooltip} />
                                    <Legend iconType="circle" iconSize={9} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                    {spenders.length > 0 && (
                        <div className="bg-surface rounded-md border border-border p-5 lg:col-span-2">
                            <div className="flex items-baseline justify-between mb-4">
                                <h3 className="text-sm font-semibold text-fg">Spend by Person</h3>
                                <span className="text-xs text-fg-subtle">Expenses, year to date</span>
                            </div>
                            {/* Horizontal bars: names need the long axis to stay readable. */}
                            <ResponsiveContainer width="100%" height={Math.max(140, spenders.length * 38)}>
                                <BarChart data={spenders} layout="vertical" barSize={18}
                                    margin={{ top: 0, right: 24, bottom: 0, left: 8 }}>
                                    <XAxis type="number" tick={chart.axisTick} axisLine={{ stroke: chart.grid }} tickLine={false}
                                        tickFormatter={v => '₹' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v)} />
                                    <YAxis type="category" dataKey="spent_by" width={130}
                                        tick={chart.axisTick} axisLine={false} tickLine={false} interval={0} />
                                    <Tooltip
                                        formatter={(v, _n, item) => [
                                            `${fmt(v)} · ${item.payload.count} record${item.payload.count !== 1 ? 's' : ''}`,
                                            'Spent',
                                        ]}
                                        {...chart.tooltip}
                                    />
                                    <Bar dataKey="total" fill={chart.series[0]} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="bg-surface rounded-md border border-border p-4">
                <div className="flex flex-wrap gap-3">
                    <SearchInput
                        value={filters.search}
                        onChange={search => { setFilters(f => ({ ...f, search })); setPage(1); }}
                        placeholder="Search vendor, description..."
                        label="Search records"
                        className="flex-1 min-w-48"
                    />
                    <select value={filters.type}
                        onChange={e => { setFilters(f => ({ ...f, type: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                        <option value="">All Types</option>
                        <option value="expense">Expenses</option>
                        <option value="deposit">Deposits</option>
                    </select>
                    <select value={filters.category}
                        onChange={e => { setFilters(f => ({ ...f, category: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                        <option value="">All Categories</option>
                        {filterCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filters.spent_by}
                        onChange={e => { setFilters(f => ({ ...f, spent_by: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                        <option value="">All People</option>
                        {people.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <select value={filters.payment_method}
                        onChange={e => { setFilters(f => ({ ...f, payment_method: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                        <option value="">All Payments</option>
                        {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <input type="date" value={filters.date_from} title="From date"
                        onChange={e => { setFilters(f => ({ ...f, date_from: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                    <input type="date" value={filters.date_to} title="To date"
                        onChange={e => { setFilters(f => ({ ...f, date_to: e.target.value })); setPage(1); }}
                        className="px-3 py-2 text-sm border border-border rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                    {(filters.search || filters.type || filters.category || filters.date_from || filters.date_to || filters.payment_method || filters.spent_by) && (
                        <button onClick={() => { setFilters({ search:'', type:'', category:'', date_from:'', date_to:'', payment_method:'', spent_by:'' }); setPage(1); }}
                            className="px-3 py-2 text-sm text-fg-muted hover:text-fg flex items-center gap-1">
                            <FiX size={14} /> Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Bulk Actions */}
            {visibleSelected.length > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-md">
                    <span className="text-sm font-medium text-brand-700 dark:text-brand-300">{visibleSelected.length} selected</span>
                    <button onClick={() => setConfirmDelete(visibleSelected)} disabled={bulkDeleteMutation.isPending}
                        className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1.5 disabled:opacity-50">
                        <FiTrash2 size={13} /> Delete Selected
                    </button>
                    <button onClick={() => setSelected([])} className="px-3 py-1.5 text-sm text-fg-muted">Clear</button>
                </div>
            )}

            {/* Table */}
            <div className="bg-surface rounded-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border bg-surface-2">
                                <th className="px-4 py-3 w-8">
                                    <input type="checkbox" checked={allChecked} onChange={toggleAll} className="rounded border-slate-300" />
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted w-24">Type</th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted">Date</th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted">Vendor / From</th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted">Spent By</th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted">Category</th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted">Description</th>
                                <th className="px-4 py-3 text-right font-medium text-fg-muted">Amount</th>
                                <th className="px-4 py-3 text-left font-medium text-fg-muted">Payment</th>
                                <th className="px-4 py-3 text-center font-medium text-fg-muted">Recurring</th>
                                <th className="px-4 py-3 w-20"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={11} className="px-4 py-12 text-center text-fg-subtle">Loading...</td></tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="px-4 py-16 text-center">
                                        <FiDollarSign className="mx-auto text-fg-subtle mb-3" size={36} />
                                        <p className="text-fg-subtle font-medium">No records found</p>
                                        <p className="text-fg-subtle text-xs mt-1">Add an expense or deposit to get started</p>
                                    </td>
                                </tr>
                            ) : records.map(row => (
                                <tr key={row.id}
                                    className={`border-b border-slate-50 dark:border-slate-700/50 hover:bg-surface-2 transition-colors ${selected.includes(row.id) ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
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
                                    <td className="px-4 py-3 text-fg-muted whitespace-nowrap">{row.date?.slice(0, 10)}</td>
                                    <td className="px-4 py-3 font-medium text-fg max-w-32 truncate">
                                        {row.vendor || <span className="text-fg-subtle">—</span>}
                                    </td>
                                    <td className="px-4 py-3 text-fg-muted whitespace-nowrap">
                                        {row.spent_by
                                            ? <span className="inline-flex items-center gap-1.5">
                                                <FiUsers size={12} className="text-fg-subtle" />{row.spent_by}
                                              </span>
                                            : <span className="text-fg-subtle">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[row.category] || CATEGORY_COLORS['Other']}`}>
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-fg-muted max-w-40 truncate">
                                        {row.description || <span className="text-fg-subtle">—</span>}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                                        row.type === 'deposit'
                                            ? 'text-emerald-600 dark:text-emerald-400'
                                            : 'text-fg'
                                    }`}>
                                        {row.type === 'deposit' ? '+' : '−'}{fmt(row.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-fg-muted text-xs">
                                        {PAYMENT_LABELS[row.payment_method] || row.payment_method}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {row.is_recurring ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 font-medium">
                                                <FiRepeat size={11} />{row.recurring_interval}
                                            </span>
                                        ) : <span className="text-fg-subtle text-xs">—</span>}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 justify-end">
                                            <button onClick={() => openEdit(row)} aria-label="Edit record" title="Edit"
                                                className="p-1.5 text-fg-subtle hover:text-brand-600 dark:hover:text-brand-400 rounded hover:bg-surface-2 transition-colors">
                                                <FiEdit2 size={14} />
                                            </button>
                                            <button onClick={() => setConfirmDelete([row.id])} aria-label="Delete record" title="Delete"
                                                className="p-1.5 text-fg-subtle hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-surface-2 transition-colors">
                                                <FiTrash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {records.length > 0 && (
                            <tfoot>
                                <tr className="border-t border-border bg-surface-2">
                                    <td colSpan={7} className="px-4 py-3 text-sm font-medium text-fg-muted">
                                        {pagination.total} record{pagination.total !== 1 ? 's' : ''} · net on this page
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
                    <div className="px-4 py-3 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-fg-muted">Page {pagination.page} of {pagination.pages}</span>
                        <div className="flex gap-2">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-2 disabled:opacity-40">
                                Previous
                            </button>
                            <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
                                className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-2 disabled:opacity-40">
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <ConfirmDialog
                open={!!confirmDelete}
                onClose={() => setConfirmDelete(null)}
                onConfirm={() => (confirmDelete.length === 1 ? deleteMutation.mutate(confirmDelete[0]) : bulkDeleteMutation.mutate(confirmDelete))}
                loading={deleteMutation.isPending || bulkDeleteMutation.isPending}
                title={confirmDelete?.length > 1 ? `Delete ${confirmDelete.length} records?` : 'Delete this record?'}
                message="Deleted records are removed from totals and reports. This can't be undone."
                confirmText={confirmDelete?.length > 1 ? `Delete ${confirmDelete.length} records` : 'Delete record'}
            />

            {modal && (
                <RecordModal
                    mode={modal.mode}
                    data={modal.data}
                    people={people}
                    onAddPerson={(name) => addPersonMutation.mutateAsync(name)}
                    addingPerson={addPersonMutation.isPending}
                    onClose={() => setModal(null)}
                    onSubmit={handleSubmit}
                    loading={createMutation.isPending || updateMutation.isPending}
                />
            )}
        </div>
    );
}

function RecordModal({ mode, data, people = [], onAddPerson, addingPerson, onClose, onSubmit, loading }) {
    const [form, setForm] = useState({ ...data, spent_by: data.spent_by || '' });
    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
    const isDeposit = form.type === 'deposit';
    const categories = isDeposit ? DEPOSIT_CATEGORIES : EXPENSE_CATEGORIES;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.date || !form.amount) { toast.error('Date and amount are required'); return; }
        onSubmit(form);
    };

    return (
        <Dialog open onClose={onClose} title={mode === 'add' ? (isDeposit ? 'Add deposit' : 'Add expense') : (isDeposit ? 'Edit deposit' : 'Edit expense')}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex gap-2">
                        {[{ k: 'expense', l: '− Expense' }, { k: 'deposit', l: '+ Deposit' }].map(t => (
                            <button key={t.k} type="button"
                                onClick={() => { set('type', t.k); set('category', t.k === 'deposit' ? 'Client Payment' : 'Other'); }}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                                    form.type === t.k
                                        ? t.k === 'deposit'
                                            ? 'bg-emerald-600 text-white border-emerald-600'
                                            : 'bg-red-500 text-white border-red-500'
                                        : 'border-border text-fg-muted hover:bg-surface-2'
                                }`}>
                                {t.l}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-fg-muted mb-1">Date *</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} required
                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-fg-muted mb-1">Amount (₹) *</label>
                            <input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} required placeholder="0.00"
                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-fg-muted mb-1">
                                {isDeposit ? 'From / Source' : 'Vendor'}
                            </label>
                            <input type="text" value={form.vendor} onChange={e => set('vendor', e.target.value)}
                                placeholder={isDeposit ? 'e.g. Acme Corp' : 'e.g. AWS, Google'}
                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-fg-muted mb-1">Category</label>
                            <select value={form.category} onChange={e => set('category', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-fg-muted mb-1">
                            {isDeposit ? 'Received By' : 'Spent By'}
                        </label>
                        <PersonSelect
                            value={form.spent_by}
                            people={people}
                            onChange={(v) => set('spent_by', v)}
                            onAddPerson={onAddPerson}
                            adding={addingPerson}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-fg-muted mb-1">Description</label>
                        <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description"
                            className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                    </div>

                    {isDeposit && (
                        <div>
                            <label className="block text-xs font-medium text-fg-muted mb-1">Reference / Invoice #</label>
                            <input type="text" value={form.reference} onChange={e => set('reference', e.target.value)} placeholder="e.g. INV-001"
                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-fg-muted mb-1">Payment Method</label>
                        <select value={form.payment_method} onChange={e => set('payment_method', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                            {Object.entries(PAYMENT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                    </div>

                    <div className="rounded-lg border border-border p-3 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={form.is_recurring} onChange={e => set('is_recurring', e.target.checked)} className="rounded border-slate-300" />
                            <span className="text-sm font-medium text-fg flex items-center gap-1.5">
                                <FiRepeat size={14} /> Recurring
                            </span>
                        </label>
                        {form.is_recurring && (
                            <select value={form.recurring_interval} onChange={e => set('recurring_interval', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
                                <option value="monthly">Monthly</option>
                                <option value="quarterly">Quarterly</option>
                                <option value="yearly">Yearly</option>
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-fg-muted mb-1">Notes</label>
                        <textarea value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any additional notes..." rows={2}
                            className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500 resize-none" />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose}
                            className="px-4 py-2 text-sm text-fg hover:bg-surface-2 rounded-lg">
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
        </Dialog>
    );
}

// Dropdown of saved people with an "Add new person" escape hatch pinned to the
// bottom of the list. New names are persisted to expense_people, so they show
// up in every future record and in the page filter.
function PersonSelect({ value, people, onChange, onAddPerson, adding }) {
    const [addMode, setAddMode] = useState(false);
    const [newName, setNewName] = useState('');

    const names = people.map(p => p.name);
    // A legacy value saved before this person existed must still render.
    const options = value && !names.includes(value) ? [value, ...names] : names;

    const handleSelect = (v) => {
        if (v === '__add__') { setAddMode(true); setNewName(''); return; }
        onChange(v);
    };

    const saveNew = async () => {
        const name = newName.trim();
        if (!name) { toast.error('Enter a name'); return; }
        try {
            await onAddPerson(name);
        } catch (err) {
            // Already exists → still usable, so fall through and select it.
            if (err?.response?.status !== 409) return;
        }
        onChange(name);
        setAddMode(false);
        setNewName('');
    };

    if (addMode) {
        return (
            <div className="flex gap-2">
                <input type="text" autoFocus value={newName} placeholder="Person name"
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); saveNew(); }
                        if (e.key === 'Escape') { e.preventDefault(); setAddMode(false); }
                    }}
                    className="flex-1 px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500" />
                <button type="button" onClick={saveNew} disabled={adding}
                    className="px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 flex items-center gap-1.5">
                    <FiCheckCircle size={14} /> Add
                </button>
                <button type="button" onClick={() => setAddMode(false)}
                    className="px-2 py-2 text-fg-subtle hover:text-fg rounded-lg">
                    <FiX size={16} />
                </button>
            </div>
        );
    }

    return (
        <select value={value || ''} onChange={e => handleSelect(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-border-strong rounded-lg bg-surface text-fg focus:ring-2 focus:ring-brand-500">
            <option value="">— Not specified —</option>
            {options.map(n => <option key={n} value={n}>{n}</option>)}
            <option disabled>──────────</option>
            <option value="__add__">＋ Add new person…</option>
        </select>
    );
}

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
    FiAlertTriangle, FiCheckCircle, FiEdit2, FiX, FiDollarSign
} from '../../components/icons/FeatherIcons';
import { plansAPI } from '../../api';
import { brand } from '../../brand';

/**
 * Price book (P4-02).
 *
 * Present in BOTH editions. Every instance operator sells to their own customers,
 * and on a whitelabel instance these are the partner's retail prices - what our
 * wholesale rate is, and therefore what their margin is, lives only on the master
 * and never reaches this screen.
 *
 * The default-price warning is the point of the page. A fresh instance is seeded
 * with prices that were never chosen by whoever runs it; selling at them would be
 * both wrong for the operator and a disclosure of somebody else's pricing.
 */

const CURRENCIES = [
    { code: 'INR', symbol: '₹' },
    { code: 'USD', symbol: '$' },
    { code: 'EUR', symbol: '€' },
    { code: 'GBP', symbol: '£' },
    { code: 'AED', symbol: 'د.إ' },
    { code: 'SGD', symbol: 'S$' },
    { code: 'AUD', symbol: 'A$' },
];

const EditModal = ({ plan, onClose }) => {
    const queryClient = useQueryClient();
    const [form, setForm] = useState({
        name: plan.name || '',
        description: plan.description || '',
        price_monthly: plan.price_monthly ?? 0,
        price_yearly: plan.price_yearly ?? 0,
        currency: plan.currency || 'INR',
        currency_symbol: plan.currency_symbol || '₹',
        is_active: plan.is_active !== 0,
    });

    const mutation = useMutation({
        mutationFn: (data) => plansAPI.update(plan.id, data),
        onSuccess: () => {
            toast.success(`${form.name} updated`);
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            onClose();
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to update plan'),
    });

    const setCurrency = (code) => {
        const found = CURRENCIES.find((c) => c.code === code);
        setForm({ ...form, currency: code, currency_symbol: found ? found.symbol : form.currency_symbol });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit {plan.name}</h2>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <FiX />
                    </button>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Description</label>
                        <input
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Currency</label>
                        <select
                            value={form.currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Monthly ({form.currency_symbol})
                            </label>
                            <input
                                type="number" min="0"
                                value={form.price_monthly}
                                onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Yearly ({form.currency_symbol})
                            </label>
                            <input
                                type="number" min="0"
                                value={form.price_yearly}
                                onChange={(e) => setForm({ ...form, price_yearly: e.target.value })}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                        />
                        Available for new tenants
                    </label>
                </div>

                <button
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(form)}
                    className="mt-5 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Saving…' : 'Save'}
                </button>
            </div>
        </div>
    );
};

const Plans = () => {
    const [editing, setEditing] = useState(null);
    const { data, isLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: () => plansAPI.getAll(),
        staleTime: 2 * 60 * 1000,
    });

    const plans = data?.data || [];
    const unpriced = plans.filter((p) => p.price_is_default === 1);

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Plans &amp; pricing</h1>
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    What {brand.productShortName} charges its customers for each plan.
                </p>
            </div>

            {unpriced.length > 0 && (
                <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
                    <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-600" />
                    <div className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>
                            {unpriced.length} plan{unpriced.length === 1 ? '' : 's'} still carry the seeded default price.
                        </strong>{' '}
                        Those numbers were not chosen for this installation. Set your own
                        before onboarding a customer onto them.
                    </div>
                </div>
            )}

            {isLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {plans.map((p) => (
                        <div
                            key={p.id}
                            className={`rounded-2xl border bg-white p-5 dark:bg-slate-900 ${
                                p.price_is_default === 1
                                    ? 'border-amber-300 dark:border-amber-800'
                                    : 'border-slate-200 dark:border-slate-800'
                            }`}
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{p.name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.slug}</p>
                                </div>
                                <button
                                    onClick={() => setEditing(p)}
                                    className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    title="Edit"
                                >
                                    <FiEdit2 />
                                </button>
                            </div>

                            <p className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">
                                {p.currency_symbol || '₹'}{Number(p.price_monthly).toLocaleString()}
                                <span className="text-sm font-normal text-slate-400"> /mo</span>
                            </p>

                            <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
                                {p.currency_symbol || '₹'}{Number(p.price_yearly).toLocaleString()} billed yearly
                                {p.currency ? ` · ${p.currency}` : ''}
                            </p>

                            {p.price_is_default === 1 ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                    <FiAlertTriangle className="text-[11px]" /> Default price, not yet set
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                    <FiCheckCircle className="text-[11px]" /> Priced
                                </span>
                            )}

                            {p.is_active === 0 && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800">
                                    Inactive
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {plans.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
                    <FiDollarSign className="mx-auto mb-3 text-3xl text-slate-400" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">No plans configured</p>
                </div>
            )}

            {editing && <EditModal plan={editing} onClose={() => setEditing(null)} />}
        </div>
    );
};

export default Plans;

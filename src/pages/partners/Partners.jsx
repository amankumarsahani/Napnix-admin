import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    FiPlus, FiGlobe, FiUsers, FiLayers, FiAlertTriangle, FiCopy, FiX, FiClock
} from '../../components/icons/FeatherIcons';
import partnersAPI from '../../api/partners';

/**
 * Whitelabel partner fleet (P1-04).
 *
 * Everything shown here comes from the read-only mirror each partner instance
 * pushes to us. An instance that stops reporting keeps its last-known numbers, so
 * anything past the staleness threshold is greyed and labelled rather than
 * presented as current - stale data that looks live is worse than no data.
 */

const relativeTime = (value) => {
    if (!value) return 'never';
    const diffMs = Date.now() - new Date(value).getTime();
    const mins = Math.round(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.round(hours / 24)}d ago`;
};

const HealthDot = ({ stale, status }) => {
    const colour = status !== 'active'
        ? 'bg-slate-400'
        : stale ? 'bg-amber-500' : 'bg-emerald-500';
    const label = status !== 'active' ? status : stale ? 'not reporting' : 'healthy';
    return (
        <span className="inline-flex items-center gap-2" title={label}>
            <span className={`w-2.5 h-2.5 rounded-full ${colour}`} />
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
        </span>
    );
};

const SecretModal = ({ secret, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <div className="mb-4 flex items-start gap-3">
                <FiAlertTriangle className="mt-0.5 text-amber-500" />
                <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Save this sync secret now
                    </h2>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        It is encrypted at rest and cannot be shown again. If it is lost the
                        only route forward is rotating it, which stops that instance
                        reporting until the new value is deployed there.
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">
                <code className="flex-1 break-all font-mono text-xs text-slate-800 dark:text-slate-200">
                    {secret}
                </code>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(secret);
                        toast.success('Copied');
                    }}
                    className="shrink-0 rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700"
                    title="Copy"
                >
                    <FiCopy />
                </button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                Set this as <code className="font-mono">PARTNER_SYNC_SECRET</code> on the
                partner instance, alongside{' '}
                <code className="font-mono">PARTNER_SLUG</code> and{' '}
                <code className="font-mono">PARTNER_SYNC_URL</code>.
            </p>
            <button
                onClick={onClose}
                className="mt-5 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
                I have saved it
            </button>
        </div>
    </div>
);

const CreateModal = ({ onClose, onCreated }) => {
    const [form, setForm] = useState({
        slug: '', name: '', base_domain: '', admin_url: '',
        contact_name: '', contact_email: '', tenant_quota: 25,
    });

    const mutation = useMutation({
        mutationFn: (data) => partnersAPI.create(data),
        onSuccess: (res) => {
            onCreated(res.sync_secret);
            toast.success('Partner registered');
        },
        onError: (err) => toast.error(err.response?.data?.error || 'Failed to register partner'),
    });

    const field = (name, label, props = {}) => (
        <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
            </label>
            <input
                value={form[name]}
                onChange={(e) => setForm({ ...form, [name]: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                {...props}
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        Register partner instance
                    </h2>
                    <button onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800">
                        <FiX />
                    </button>
                </div>

                <div className="space-y-3">
                    {field('slug', 'Slug', { placeholder: 'acme' })}
                    {field('name', 'Name', { placeholder: 'Acme Software' })}
                    {field('base_domain', 'Base domain', { placeholder: 'partner.com' })}
                    {field('admin_url', 'Admin URL', { placeholder: 'https://admin.partner.com' })}
                    {field('contact_name', 'Contact name')}
                    {field('contact_email', 'Contact email', { type: 'email' })}
                    {field('tenant_quota', 'Tenant quota', { type: 'number' })}
                </div>

                <button
                    disabled={!form.slug || !form.name || mutation.isPending}
                    onClick={() => mutation.mutate(form)}
                    className="mt-5 w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Registering…' : 'Register'}
                </button>
            </div>
        </div>
    );
};

const Partners = () => {
    const [showCreate, setShowCreate] = useState(false);
    const [newSecret, setNewSecret] = useState(null);
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['partners'],
        queryFn: () => partnersAPI.getAll(),
        staleTime: 2 * 60 * 1000,
    });

    const partners = data?.data || [];

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Partners</h1>
                    <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                        Whitelabel instances and the tenants they run.
                    </p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700"
                >
                    <FiPlus /> Register partner
                </button>
            </div>

            {isLoading ? (
                <p className="text-sm text-slate-500">Loading…</p>
            ) : partners.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-700">
                    <FiLayers className="mx-auto mb-3 text-3xl text-slate-400" />
                    <p className="font-medium text-slate-700 dark:text-slate-300">No partner instances yet</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Register one to start receiving its heartbeats.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {partners.map((p) => (
                        <Link
                            key={p.id}
                            to={`/partners/${p.id}`}
                            className={`rounded-2xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow dark:border-slate-800 dark:bg-slate-900 ${
                                p.is_stale ? 'opacity-60' : ''
                            }`}
                        >
                            <div className="mb-3 flex items-start justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">{p.name}</h3>
                                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        <FiGlobe className="text-[11px]" />
                                        {p.base_domain || p.slug}
                                    </p>
                                </div>
                                <HealthDot stale={Boolean(p.is_stale)} status={p.status} />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {p.tenants_active ?? 0}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Active</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {p.tenants_total ?? 0}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Tenants</p>
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                                        {p.users_total ?? 0}
                                    </p>
                                    <p className="text-[10px] uppercase tracking-wide text-slate-400">Users</p>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400 dark:border-slate-800">
                                <span className="flex items-center gap-1">
                                    <FiClock className="text-[11px]" /> {relativeTime(p.last_seen_at)}
                                </span>
                                <span className="font-mono">{p.git_sha || '—'}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {showCreate && (
                <CreateModal
                    onClose={() => setShowCreate(false)}
                    onCreated={(secret) => {
                        setShowCreate(false);
                        setNewSecret(secret);
                        queryClient.invalidateQueries({ queryKey: ['partners'] });
                    }}
                />
            )}
            {newSecret && <SecretModal secret={newSecret} onClose={() => setNewSecret(null)} />}
        </div>
    );
};

export default Partners;

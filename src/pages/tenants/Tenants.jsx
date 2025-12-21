import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantsAPI, plansAPI } from '../../api';
import toast from 'react-hot-toast';

const Tenants = () => {
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState({});

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tenantsRes, plansRes, statsRes] = await Promise.all([
                tenantsAPI.getAll(),
                plansAPI.getAll(),
                tenantsAPI.getStats()
            ]);
            setTenants(tenantsRes.data || []);
            setPlans(plansRes.data || []);
            setStats(statsRes.data);
        } catch (error) {
            toast.error('Failed to fetch tenants');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (tenantId, action) => {
        setActionLoading(prev => ({ ...prev, [tenantId]: action }));
        try {
            switch (action) {
                case 'start':
                    await tenantsAPI.start(tenantId);
                    toast.success('Tenant started');
                    break;
                case 'stop':
                    await tenantsAPI.stop(tenantId);
                    toast.success('Tenant stopped');
                    break;
                case 'restart':
                    await tenantsAPI.restart(tenantId);
                    toast.success('Tenant restarted');
                    break;
                case 'provision':
                    await tenantsAPI.provision(tenantId);
                    toast.success('Tenant provisioned');
                    break;
                default:
                    break;
            }
            fetchData();
        } catch (error) {
            toast.error(`Failed to ${action} tenant`);
        } finally {
            setActionLoading(prev => ({ ...prev, [tenantId]: null }));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'trial': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'suspended': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'cancelled': return 'bg-slate-100 text-slate-700 border-slate-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getProcessStatusColor = (status) => {
        switch (status) {
            case 'running': return 'bg-emerald-500';
            case 'stopped': return 'bg-slate-400';
            case 'starting': return 'bg-amber-500 animate-pulse';
            case 'error': return 'bg-rose-500';
            default: return 'bg-slate-400';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage NexCRM customers</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Tenant
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_tenants || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Total Tenants</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-emerald-600">{stats.active || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Active</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-blue-600">{stats.trial || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">On Trial</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-emerald-600">{stats.running_processes || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Running</div>
                    </div>
                </div>
            )}

            {/* Tenants Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Plan</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Process</th>
                                <th className="px-6 py-4">Port</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {tenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                        No tenants yet. Create your first tenant!
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">{tenant.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{tenant.slug}-crm-api.nexspiresolutions.co.in</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                                {tenant.plan_name || 'Starter'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(tenant.status)}`}>
                                                {tenant.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${getProcessStatusColor(tenant.process_status)}`}></div>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                                                    {tenant.process_status || 'stopped'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {tenant.assigned_port || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {tenant.process_status !== 'running' ? (
                                                    <button
                                                        onClick={() => handleAction(tenant.id, 'start')}
                                                        disabled={actionLoading[tenant.id]}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                        title="Start"
                                                    >
                                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleAction(tenant.id, 'stop')}
                                                            disabled={actionLoading[tenant.id]}
                                                            className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                                            title="Stop"
                                                        >
                                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                <rect x="6" y="6" width="12" height="12" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(tenant.id, 'restart')}
                                                            disabled={actionLoading[tenant.id]}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Restart"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => navigate(`/tenants/${tenant.id}`)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Tenant Modal */}
            {showCreateModal && (
                <CreateTenantModal
                    plans={plans}
                    onClose={() => setShowCreateModal(false)}
                    onCreated={() => {
                        setShowCreateModal(false);
                        fetchData();
                    }}
                />
            )}
        </div>
    );
};

// Create Tenant Modal Component
const CreateTenantModal = ({ plans, onClose, onCreated }) => {
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        industry_type: 'general',
        plan_id: 1
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            // Auto-generate slug from name
            ...(name === 'name' && { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await tenantsAPI.create(formData);
            toast.success('Tenant created and provisioning started!');
            onCreated();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create tenant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create New Tenant</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Company Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            placeholder="Acme Corporation"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Subdomain (Slug) *
                        </label>
                        <div className="flex items-center">
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                required
                                pattern="[a-z0-9-]+"
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                                placeholder="acme-corp"
                            />
                            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-600 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg text-slate-500 dark:text-slate-400 text-sm">
                                .crm-api.nexspiresolutions.co.in
                            </span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Admin Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            placeholder="admin@acme.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                            placeholder="+91 9876543210"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Industry
                            </label>
                            <select
                                name="industry_type"
                                value={formData.industry_type}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="general">General CRM</option>
                                <option value="ecommerce">E-Commerce</option>
                                <option value="realestate">Real Estate</option>
                                <option value="services">Services (Salon, Spa, etc.)</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="education">Education</option>
                                <option value="hospitality">Hospitality</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Plan
                            </label>
                            <select
                                name="plan_id"
                                value={formData.plan_id}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - ₹{plan.price_monthly}/mo
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            {loading && (
                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            Create & Provision
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Tenants;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tenantsAPI } from '../../api';
import { plansAPI } from '../../api';
import serverService from '../../api/admin';
import toast from 'react-hot-toast';
import { getStatusColor as getStatusColorUtil, getProcessStatusColor } from '../../utils/statusColors';
import { FiPlus, FiServer, FiGlobe, FiCheckCircle, FiMail, FiDatabase } from '../../components/icons/FeatherIcons';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';

const Tenants = () => {
    const domain = import.meta.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
    const navigate = useNavigate();
    const [tenants, setTenants] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState({});
    const [confirmState, setConfirmState] = useState({ isOpen: false });
    const [searchTerm, setSearchTerm] = useState('');
    const { currentPage, totalPages, totalItems, pageSize, goToPage, setPagination } = usePagination(10);

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, searchTerm]);

    const fetchData = async (retryCount = 0) => {
        const maxRetries = 3;
        const retryDelay = 2000;

        try {
            setLoading(true);
            const [tenantsRes, statsRes] = await Promise.all([
                tenantsAPI.getAll({ page: currentPage, limit: pageSize, ...(searchTerm && { search: searchTerm }) }),
                tenantsAPI.getStats()
            ]);
            setTenants(tenantsRes.data || []);
            setPagination(tenantsRes.pagination);
            setStats(statsRes.data);
        } catch {
            if (retryCount < maxRetries) {
                setTimeout(() => fetchData(retryCount + 1), retryDelay);
                return;
            }
            toast.error('Failed to fetch tenants');
        } finally {
            if (retryCount >= maxRetries || retryCount === 0) {
                setLoading(false);
            }
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
        } catch {
            toast.error(`Failed to ${action} tenant`);
        } finally {
            setActionLoading(prev => ({ ...prev, [tenantId]: null }));
        }
    };

    const getStatusColor = (status) => getStatusColorUtil('tenant', status);



    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tenants</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage NexCRM customers</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                    <FiPlus className="w-5 h-5" />
                    Add Tenant
                </button>
            </div>

            <div className="relative">
                <input
                    type="text"
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

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

            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Tenant</th>
                                <th className="px-6 py-4">Industry</th>
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
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No tenants yet. Create your first tenant!
                                    </td>
                                </tr>
                            ) : (
                                tenants.map((tenant) => (
                                    <tr key={tenant.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white">{tenant.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{tenant.slug}-crm-api.{domain}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded capitalize">
                                                {tenant.industry_type || 'general'}
                                            </span>
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
                                                {tenant.status === 'trial' && (
                                                    <button
                                                        onClick={() => {
                                                            setConfirmState({
                                                                isOpen: true,
                                                                title: 'Activate Tenant',
                                                                message: 'Are you sure you want to activate this tenant? This will end the trial period.',
                                                                variant: 'info',
                                                                confirmText: 'Activate',
                                                                onConfirm: async () => {
                                                                    setConfirmState({ isOpen: false });
                                                                    try {
                                                                        await tenantsAPI.update(tenant.id, { status: 'active' });
                                                                        toast.success('Tenant activated successfully');
                                                                        fetchData();
                                                                    } catch {
                                                                        toast.error('Failed to activate tenant');
                                                                    }
                                                                },
                                                            });
                                                        }}
                                                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                                                        title="Activate Tenant (End Trial)"
                                                    >
                                                        <FiCheckCircle className="w-5 h-5" />
                                                    </button>
                                                )}
                                                {tenant.process_status !== 'running' ? (
                                                    <button
                                                        onClick={() => handleAction(tenant.id, 'start')}
                                                        disabled={actionLoading[tenant.id]}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                        title="Start"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
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
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                <rect x="6" y="6" width="12" height="12" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => handleAction(tenant.id, 'restart')}
                                                            disabled={actionLoading[tenant.id]}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                            title="Restart"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            </div >

            <div className="md:hidden space-y-4">
                {tenants.map((tenant) => (
                    <div key={tenant.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="font-semibold text-slate-900 dark:text-white">{tenant.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{tenant.slug}-crm-api</div>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${getProcessStatusColor(tenant.process_status)}`}></div>
                                <span className="text-xs text-slate-500 capitalize">{tenant.process_status || 'stopped'}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-4">
                            <span className="px-2 py-1 text-xs font-medium bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400 rounded capitalize">
                                {tenant.industry_type || 'general'}
                            </span>
                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded">
                                {tenant.plan_name || 'Starter'}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getStatusColor(tenant.status)}`}>
                                {tenant.status}
                            </span>
                        </div>

                        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                            {tenant.process_status !== 'running' ? (
                                <button
                                    onClick={() => handleAction(tenant.id, 'start')}
                                    disabled={actionLoading[tenant.id]}
                                    className="flex-1 py-2.5 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                >
                                    Start
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleAction(tenant.id, 'stop')}
                                        disabled={actionLoading[tenant.id]}
                                        className="flex-1 py-2.5 text-amber-600 bg-amber-50 dark:bg-amber-900/30 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        Stop
                                    </button>
                                    <button
                                        onClick={() => handleAction(tenant.id, 'restart')}
                                        disabled={actionLoading[tenant.id]}
                                        className="flex-1 py-2.5 text-blue-600 bg-blue-50 dark:bg-blue-900/30 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                                    >
                                        Restart
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => navigate(`/tenants/${tenant.id}`)}
                                className="py-2.5 px-4 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg font-medium text-sm"
                            >
                                View
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />

            {
                showCreateModal && (
                    <CreateTenantModal
                        onClose={() => setShowCreateModal(false)}
                        onCreated={() => {
                            setShowCreateModal(false);
                            fetchData();
                        }}
                    />
                )
            }

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false })}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
            />
        </div >
    );
};

const CreateTenantModal = ({ onClose, onCreated }) => {
    const domain = import.meta.env.VITE_APP_BASE_DOMAIN || 'napnix.in';
    const [plans, setPlans] = useState([]);
    const [servers, setServers] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState(['napcrm']);
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        industry_type: 'general',
        plan_id: '',
        server_id: '',
        custom_domain: ''
    });
    const [loading, setLoading] = useState(false);

    const toggleProduct = (slug) => {
        setSelectedProducts(prev => {
            if (prev.includes(slug)) {
                const next = prev.filter(p => p !== slug);
                return next.length === 0 ? prev : next;
            }
            return [...prev, slug];
        });
    };

    const PRODUCTS = [
        {
            slug: 'napcrm',
            name: 'NapCRM',
            desc: 'Full CRM with contacts, deals, tasks, storefront',
            icon: FiDatabase,
            color: 'brand'
        },
        {
            slug: 'napmail',
            name: 'NapMail',
            desc: 'Email marketing campaigns & automation',
            icon: FiMail,
            color: 'sky'
        }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [plansRes, serversRes] = await Promise.all([
                    plansAPI.getAll(),
                    serverService.getAllServers()
                ]);
                if (plansRes.success) setPlans(plansRes.data);
                if (serversRes.success) {
                    setServers(serversRes.data);
                    if (serversRes.data.length > 0) {
                        const bestServer = serversRes.data.reduce((prev, curr) =>
                            (prev.tenant_count < curr.tenant_count) ? prev : curr
                        );
                        setFormData(prev => ({ ...prev, server_id: bestServer.id }));
                    }
                }
            } catch {
                toast.error('Failed to load form data');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
            ...(name === 'name' && { slug: value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') })
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedProducts.length === 0) {
            toast.error('Select at least one product');
            return;
        }
        setLoading(true);
        try {
            await tenantsAPI.create({ ...formData, tools: selectedProducts });
            toast.success('Tenant created and provisioning started!');
            onCreated();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to create tenant');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Products *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {PRODUCTS.map(product => {
                                const isSelected = selectedProducts.includes(product.slug);
                                const Icon = product.icon;
                                return (
                                    <button
                                        key={product.slug}
                                        type="button"
                                        onClick={() => toggleProduct(product.slug)}
                                        className={`relative flex flex-col items-start gap-1 p-3 rounded-lg border-2 text-left transition-all ${
                                            isSelected
                                                ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                                        }`}
                                    >
                                        {isSelected && (
                                            <FiCheckCircle className="absolute top-2 right-2 text-brand-500" size={16} />
                                        )}
                                        <Icon className={isSelected ? 'text-brand-500' : 'text-slate-400'} size={20} />
                                        <span className={`text-sm font-semibold ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {product.name}
                                        </span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">
                                            {product.desc}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-lg bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-4 py-3 text-sm text-brand-700 dark:text-brand-300">
                        New tenants are created automatically as a 14-day trial with the selected plan. You can adjust the trial, activate access, send a payment link, or mark them paid from the tenant detail page after creation.
                    </div>

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
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-l-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="acme-corp"
                            />
                            <span className="px-3 py-2 bg-slate-100 dark:bg-slate-600 border border-l-0 border-slate-300 dark:border-slate-600 rounded-r-lg text-slate-500 dark:text-slate-400 text-sm italic">
                                .crm-api.{domain}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                placeholder="+91 9876543210"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProducts.includes('napcrm') && (
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
                                <option value="education">Education</option>
                                <option value="fitness">Fitness / Gym</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="hospitality">Hospitality</option>
                                <option value="legal">Legal</option>
                                <option value="logistics">Logistics</option>
                                <option value="manufacturing">Manufacturing</option>
                                <option value="realestate">Real Estate</option>
                                <option value="restaurant">Restaurant</option>
                                <option value="salon">Salon & Spa</option>
                                <option value="hrm">HR Management</option>
                                <option value="services">Services</option>
                                <option value="travel">Travel</option>
                            </select>
                        </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Plan
                            </label>
                            <select
                                name="plan_id"
                                value={formData.plan_id}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            >
                                <option value="">Select Plan</option>
                                {plans.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - ₹{plan.price_monthly}/mo
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                        {selectedProducts.includes('napcrm') && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <FiServer className="text-brand-500" /> Destination Server
                            </label>
                            <select
                                required={selectedProducts.includes('napcrm')}
                                name="server_id"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                value={formData.server_id}
                                onChange={handleChange}
                            >
                                <option value="">Select Server</option>
                                {servers.map(server => (
                                    <option key={server.id} value={server.id}>
                                        {server.name} ({server.tenant_count} tenants)
                                    </option>
                                ))}
                            </select>
                        </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                                <FiGlobe className="text-sky-500" /> Custom Domain
                            </label>
                            <input
                                type="text"
                                name="custom_domain"
                                placeholder="crm.company.com (optional)"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                value={formData.custom_domain}
                                onChange={handleChange}
                            />
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

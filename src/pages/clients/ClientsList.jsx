import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsAPI, billingAPI } from '../../api';
import { createStatusColorFn } from '../../utils/statusColors';

import toast from 'react-hot-toast';
import DetailSidebar from '../../components/common/DetailSidebar';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const clientSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    contactName: z.string().min(1, 'Contact name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    phone: z.string().optional(),
    address: z.string().optional(),
    industry: z.string().optional(),
    status: z.string().default('active'),
});

export default function ClientsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('growth');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [generatingLink, setGeneratingLink] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');
    const [confirmState, setConfirmState] = useState({ isOpen: false });
    const [searchTerm, setSearchTerm] = useState('');

    const { currentPage, totalPages, totalItems, pageSize, goToPage, setPagination } = usePagination(10);

    const { data: clientsData, isLoading: loading } = useQuery({
        queryKey: ['clients', { page: currentPage, search: searchTerm }],
        queryFn: () => clientsAPI.getAll({ page: currentPage, limit: pageSize, ...(searchTerm && { search: searchTerm }) }),
    });

    const clients = clientsData ? (Array.isArray(clientsData) ? clientsData : clientsData.clients || []) : [];

    useEffect(() => {
        if (clientsData?.pagination) setPagination(clientsData.pagination);
    }, [clientsData, setPagination]);

    const form = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            address: '',
            industry: '',
            status: 'active',
        }
    });

    const onSubmit = async (data) => {
        try {
            if (editingClient) {
                await clientsAPI.update(editingClient.id, data);
                toast.success('Client updated successfully');
            } else {
                await clientsAPI.create(data);
                toast.success('Client created successfully');
            }
            setShowModal(false);
            resetForm();
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = (id) => {
        setConfirmState({
            isOpen: true,
            title: 'Delete Client',
            message: 'Are you sure you want to delete this client? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                setConfirmState({ isOpen: false });
                try {
                    await clientsAPI.delete(id);
                    toast.success('Client deleted successfully');
                    queryClient.invalidateQueries({ queryKey: ['clients'] });
                } catch {
                    toast.error('Failed to delete client');
                }
            },
        });
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        form.reset({
            companyName: client.companyName || '',
            contactName: client.contactName || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            industry: client.industry || '',
            status: client.status || 'active',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingClient(null);
        form.reset({
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            address: '',
            industry: '',
            status: 'active',
        });
    };

    const getStatusColor = createStatusColorFn('client');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Clients</h1>
                    <p className="text-gray-600 dark:text-slate-400 mt-1">{clients.length} total clients</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    + Add Client
                </button>
            </div>

            <div className="mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search clients..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-transparent dark:border-slate-700">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-slate-300">Company</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-slate-300">Contact</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-slate-300">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-slate-300">Phone</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-slate-300">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                        {clients.map((client) => (
                            <tr
                                key={client.id}
                                className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedClient(client)}
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{client.companyName}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{client.contactName}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{client.email}</td>
                                <td className="px-6 py-4 text-gray-600 dark:text-slate-300">{client.phone}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(client.status)}`}>
                                        {client.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/clients/${client.id}`);
                                            }}
                                            className="px-3 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-200 dark:hover:bg-brand-900 transition-colors text-sm font-medium"
                                        >
                                            View
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedClient(client);
                                                setShowLinkModal(true);
                                                setGeneratedLink('');
                                            }}
                                            className="px-3 py-1 bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 rounded-lg hover:bg-brand-200 dark:hover:bg-brand-900 transition-colors text-sm font-medium"
                                            title="Generate Payment Link"
                                        >
                                            Link
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(client);
                                            }}

                                            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors text-sm font-medium"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(client.id);
                                            }}
                                            className="px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors text-sm font-medium"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {clients.length === 0 && (
                    <div className="text-center py-12 text-gray-500 dark:text-slate-400">
                        <p className="text-lg mb-2">No clients yet</p>
                        <p className="text-sm">Click "Add Client" to create your first client</p>
                    </div>
                )}

                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        {...form.register('companyName')}
                                        className={`w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none ${form.formState.errors.companyName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    />
                                    {form.formState.errors.companyName && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{form.formState.errors.companyName.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Name *</label>
                                    <input
                                        type="text"
                                        {...form.register('contactName')}
                                        className={`w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none ${form.formState.errors.contactName ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    />
                                    {form.formState.errors.contactName && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{form.formState.errors.contactName.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email *</label>
                                    <input
                                        type="email"
                                        {...form.register('email')}
                                        className={`w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none ${form.formState.errors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : ''}`}
                                    />
                                    {form.formState.errors.email && (
                                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-1.5 ml-1">{form.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        {...form.register('phone')}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Industry</label>
                                    <input
                                        type="text"
                                        {...form.register('industry')}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                                    <select
                                        {...form.register('status')}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    >
                                        <option value="active">Active</option>
                                        <option value="prospect">Prospect</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Address</label>
                                <textarea
                                    {...form.register('address')}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    rows="3"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 transition-all"
                                >
                                    {editingClient ? 'Update Client' : 'Create Client'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DetailSidebar
                isOpen={!!selectedClient && !showLinkModal}
                onClose={() => setSelectedClient(null)}
                entityType="client"
                entityId={selectedClient?.id}
                title={selectedClient?.companyName}
                subTitle={selectedClient?.contactName}
                status={selectedClient?.status}
            />

            {/* Payment Link Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 max-w-md w-full shadow-2xl border border-transparent dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Generate Payment Link</h2>
                            <button onClick={() => setShowLinkModal(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Plan</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                                    value={selectedPlan}
                                    onChange={(e) => setSelectedPlan(e.target.value)}
                                >
                                    <option value="starter">Starter Plan ($0)</option>
                                    <option value="growth">Growth Plan ($49/mo)</option>
                                    <option value="business">Business Plan ($199/mo)</option>
                                </select>
                            </div>

                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Yearly (Save 15%)
                                </button>
                            </div>

                            {generatedLink ? (
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Share this link with {selectedClient?.contactName}</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={generatedLink}
                                            className="flex-1 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                        />
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(generatedLink);
                                                toast.success('Link copied to clipboard');
                                            }}
                                            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm hover:bg-brand-700"
                                        >
                                            Copy
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500 italic">This link will expire after 24 hours.</p>
                                </div>
                            ) : (
                                <button
                                    onClick={async () => {
                                        setGeneratingLink(true);
                                        try {
                                            const planKey = billingCycle === 'yearly' ? `${selectedPlan}_yearly` : selectedPlan;
                                            const response = await billingAPI.createPaymentLink({
                                                planId: planKey,
                                                successUrl: window.location.origin + '/pricing/success',
                                                cancelUrl: window.location.origin + '/pricing/cancel',
                                                metadata: {
                                                    client_id: selectedClient.id,
                                                    entity_type: 'client',
                                                    billing_cycle: billingCycle
                                                }
                                            });
                                            if (response.success) {
                                                setGeneratedLink(response.url);
                                                toast.success('Payment link generated!');
                                            }
                                        } catch {
                                            toast.error('Failed to generate link');
                                        } finally {
                                            setGeneratingLink(false);
                                        }
                                    }}
                                    disabled={generatingLink}
                                    className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all"
                                >
                                    {generatingLink ? 'Generating...' : 'Generate Magic Link'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState({ isOpen: false })}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                message={confirmState.message}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
            />

        </div>
    );
}

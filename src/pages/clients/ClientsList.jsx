import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { clientsAPI } from '../../api';

import toast from 'react-hot-toast';
import DetailSidebar from '../../components/common/DetailSidebar';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import SearchInput from '../../components/common/SearchInput';
import { FullPageSpinner } from '../../components/common/Spinner';
import PaymentLinkModal from '../../components/common/PaymentLinkModal';
import FormInput from '../../components/common/FormInput';
import FormSelect from '../../components/common/FormSelect';
import FormTextarea from '../../components/common/FormTextarea';
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

    const getStatusColor = (status) => {
        const colors = {
            active: 'bg-green-100 text-green-800',
            prospect: 'bg-blue-100 text-blue-800',
            inactive: 'bg-slate-100 text-slate-800',
        };
        return colors[status] || colors.active;
    };

    if (loading) {
        return <FullPageSpinner />;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Clients</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">{clients.length} total clients</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                    + Add Client
                </button>
            </div>

            <div className="mb-6">
                <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search clients..."
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-transparent dark:border-slate-700">
                <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-300">Company</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-300">Contact</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-300">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-300">Phone</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-300">Status</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-slate-700">
                        {clients.map((client) => (
                            <tr
                                key={client.id}
                                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedClient(client)}
                            >
                                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{client.companyName}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{client.contactName}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{client.email}</td>
                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{client.phone}</td>
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
                                            }}
                                            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors text-sm font-medium"
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
                    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                        <p className="text-lg mb-2">No clients yet</p>
                        <p className="text-sm">Click "Add Client" to create your first client</p>
                    </div>
                )}

                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput
                                    label="Company Name"
                                    required
                                    type="text"
                                    {...form.register('companyName')}
                                    error={form.formState.errors.companyName?.message}
                                />
                                <FormInput
                                    label="Contact Name"
                                    required
                                    type="text"
                                    {...form.register('contactName')}
                                    error={form.formState.errors.contactName?.message}
                                />
                                <FormInput
                                    label="Email"
                                    required
                                    type="email"
                                    {...form.register('email')}
                                    error={form.formState.errors.email?.message}
                                />
                                <FormInput
                                    label="Phone"
                                    type="tel"
                                    {...form.register('phone')}
                                />
                                <FormInput
                                    label="Industry"
                                    type="text"
                                    {...form.register('industry')}
                                />
                                <FormSelect
                                    label="Status"
                                    {...form.register('status')}
                                    options={[
                                        { value: 'active', label: 'Active' },
                                        { value: 'prospect', label: 'Prospect' },
                                        { value: 'inactive', label: 'Inactive' },
                                    ]}
                                />
                            </div>
                            <FormTextarea
                                label="Address"
                                {...form.register('address')}
                                rows={3}
                            />
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:bg-brand-700 hover:shadow-xl transition-all"
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

            <PaymentLinkModal
                isOpen={showLinkModal}
                onClose={() => setShowLinkModal(false)}
                entity={selectedClient}
                entityType="client"
            />

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

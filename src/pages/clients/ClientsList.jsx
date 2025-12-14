import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientsAPI } from '../../api';
import toast from 'react-hot-toast';
import DetailSidebar from '../../components/common/DetailSidebar';

export default function ClientsList() {
    const navigate = useNavigate();
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClient, setEditingClient] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        industry: '',
        status: 'active',
    });

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const data = await clientsAPI.getAll();
            setClients(Array.isArray(data) ? data : data.clients || []);
        } catch (error) {
            toast.error('Failed to load clients');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingClient) {
                await clientsAPI.update(editingClient.id, formData);
                toast.success('Client updated successfully');
            } else {
                await clientsAPI.create(formData);
                toast.success('Client created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchClients();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this client?')) return;

        try {
            await clientsAPI.delete(id);
            toast.success('Client deleted successfully');
            fetchClients();
        } catch (error) {
            toast.error('Failed to delete client');
        }
    };

    const handleEdit = (client) => {
        setEditingClient(client);
        setFormData({
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
        setFormData({
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
            inactive: 'bg-gray-100 text-gray-800',
        };
        return colors[status] || colors.active;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
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
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                    + Add Client
                </button>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden border border-transparent dark:border-slate-700">
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
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-slate-700">
                        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">{editingClient ? 'Edit Client' : 'Add New Client'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Contact Name *</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Industry</label>
                                    <input
                                        type="text"
                                        value={formData.industry}
                                        onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    rows="3"
                                />
                            </div>
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
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                entityType="client"
                entityId={selectedClient?.id}
                title={selectedClient?.companyName}
                subTitle={selectedClient?.contactName}
                status={selectedClient?.status}
            />
        </div>
    );
}

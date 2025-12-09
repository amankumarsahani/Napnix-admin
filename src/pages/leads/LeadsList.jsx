import { useState, useEffect } from 'react';
import { leadsAPI } from '../../api';
import toast from 'react-hot-toast';

export default function LeadsList() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        status: 'new',
        source: '',
        estimatedValue: '',
        notes: '',
    });

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            const data = await leadsAPI.getAll();
            setLeads(Array.isArray(data) ? data : data.leads || []);
        } catch (error) {
            toast.error('Failed to load leads');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingLead) {
                await leadsAPI.update(editingLead.id, formData);
                toast.success('Lead updated successfully');
            } else {
                await leadsAPI.create(formData);
                toast.success('Lead created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchLeads();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            await leadsAPI.delete(id);
            toast.success('Lead deleted successfully');
            fetchLeads();
        } catch (error) {
            toast.error('Failed to delete lead');
        }
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setFormData({
            companyName: lead.companyName || '',
            contactName: lead.contactName || '',
            email: lead.email || '',
            phone: lead.phone || '',
            status: lead.status || 'new',
            source: lead.source || '',
            estimatedValue: lead.estimatedValue || '',
            notes: lead.notes || '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingLead(null);
        setFormData({
            companyName: '',
            contactName: '',
            email: '',
            phone: '',
            status: 'new',
            source: '',
            estimatedValue: '',
            notes: '',
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-blue-100 text-blue-800 border-blue-300',
            contacted: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            qualified: 'bg-purple-100 text-purple-800 border-purple-300',
            won: 'bg-green-100 text-green-800 border-green-300',
            lost: 'bg-red-100 text-red-800 border-red-300',
        };
        return colors[status] || colors.new;
    };

    const groupedLeads = {
        new: leads.filter((l) => l.status === 'new'),
        contacted: leads.filter((l) => l.status === 'contacted'),
        qualified: leads.filter((l) => l.status === 'qualified'),
        won: leads.filter((l) => l.status === 'won'),
        lost: leads.filter((l) => l.status === 'lost'),
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
                    <h1 className="text-3xl font-bold text-gray-900">Leads Pipeline</h1>
                    <p className="text-gray-600 mt-1">{leads.length} total leads</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                    + Add Lead
                </button>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(groupedLeads).map(([status, statusLeads]) => (
                    <div key={status} className="bg-gray-100 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 capitalize">{status}</h3>
                            <span className="px-2 py-1 bg-white rounded-lg text-sm font-semibold text-gray-600">
                                {statusLeads.length}
                            </span>
                        </div>
                        <div className="space-y-3">
                            {statusLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    className={`bg-white rounded-xl p-4 border-2 ${getStatusColor(lead.status)} shadow-sm hover:shadow-md transition-all cursor-pointer`}
                                    onClick={() => handleEdit(lead)}
                                >
                                    <h4 className="font-bold text-gray-900 mb-1">{lead.companyName}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{lead.contactName}</p>
                                    {lead.estimatedValue && (
                                        <p className="text-sm font-semibold text-gray-900 mb-2">
                                            ${Number(lead.estimatedValue).toLocaleString()}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleEdit(lead);
                                            }}
                                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(lead.id);
                                            }}
                                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {statusLeads.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm">No leads</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-6">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Name *</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="qualified">Qualified</option>
                                        <option value="won">Won</option>
                                        <option value="lost">Lost</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Source</label>
                                    <input
                                        type="text"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                        placeholder="e.g., Website, Referral"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Estimated Value</label>
                                <input
                                    type="number"
                                    value={formData.estimatedValue}
                                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                                    rows="3"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                                >
                                    {editingLead ? 'Update Lead' : 'Create Lead'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

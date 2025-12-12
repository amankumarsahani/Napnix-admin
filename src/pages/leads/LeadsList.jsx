import { useState, useEffect } from 'react';
import { leadsAPI } from '../../api';
import toast from 'react-hot-toast';
import LeadsKanban from './LeadsKanban';
import DetailSidebar from '../../components/common/DetailSidebar';

// Mock data for initial view (replace with empty array or relevant initial state if needed)
const MOCK_LEADS = [
    { id: 1, contactName: 'Alice Freeman', company: 'TechCorp', email: 'alice@tech.com', status: 'new', estimatedValue: 5000, score: 85 },
    { id: 2, contactName: 'Robert Smith', company: 'Design Studio', email: 'rob@design.com', status: 'contacted', estimatedValue: 12000, score: 70 },
    { id: 3, contactName: 'Sarah Jones', company: 'Retail Inc', email: 'sarah@retail.com', status: 'qualified', estimatedValue: 3500, score: 60 },
];

export default function LeadsList() {
    const [leads, setLeads] = useState(MOCK_LEADS);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'kanban'
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
        score: 0
    });
    const [selectedLead, setSelectedLead] = useState(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            // Uncomment real API call when backend is ready
            // const data = await leadsAPI.getAll();
            // setLeads(Array.isArray(data) ? data : data.leads || []);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load leads');
            console.error(error);
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Simulate API call success for now
            const newLead = { ...formData, id: Date.now(), company: formData.companyName }; // Map companyName to company for consistent keys

            if (editingLead) {
                // await leadsAPI.update(editingLead.id, formData);
                setLeads(prev => prev.map(l => l.id === editingLead.id ? { ...newLead, id: editingLead.id } : l));
                toast.success('Lead updated successfully');
            } else {
                // await leadsAPI.create(formData);
                setLeads(prev => [newLead, ...prev]);
                toast.success('Lead created successfully');
            }
            setShowModal(false);
            resetForm();
            // fetchLeads(); // Refresh
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lead?')) return;
        try {
            // await leadsAPI.delete(id);
            setLeads(prev => prev.filter(l => l.id !== id));
            toast.success('Lead deleted successfully');
        } catch (error) {
            toast.error('Failed to delete lead');
        }
    };

    const handleEdit = (lead) => {
        setEditingLead(lead);
        setFormData({
            companyName: lead.company || lead.companyName || '',
            contactName: lead.contactName || '',
            email: lead.email || '',
            phone: lead.phone || '',
            status: lead.status || 'new',
            source: lead.source || '',
            estimatedValue: lead.estimatedValue || '',
            notes: lead.notes || '',
            score: lead.score || 0
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
            score: 0
        });
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-blue-100 text-blue-800 border-blue-200',
            contacted: 'bg-amber-100 text-amber-800 border-amber-200',
            qualified: 'bg-purple-100 text-purple-800 border-purple-200',
            won: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            lost: 'bg-rose-100 text-rose-800 border-rose-200',
        };
        return colors[status?.toLowerCase()] || colors.new;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Leads Pipeline</h1>
                    <p className="text-slate-500 mt-1">Manage and track your sales opportunities.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="List View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-brand-50 text-brand-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Kanban View"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowModal(true);
                        }}
                        className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Add Lead
                    </button>
                </div>
            </div>

            {/* View Content */}
            {viewMode === 'kanban' ? (
                <LeadsKanban leads={leads} onUpdateStatus={(id, status) => {
                    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
                }} />
            ) : (
                <div className="glass-panel overflow-hidden rounded-2xl border border-slate-200">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    <th className="px-6 py-4">Company / Contact</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Value</th>
                                    <th className="px-6 py-4">Heat Score</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {leads.map((lead) => (
                                    <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => setSelectedLead(lead)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                    {(lead.company || lead.companyName || '?')[0]}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-900">{lead.company || lead.companyName}</div>
                                                    <div className="text-sm text-slate-500">{lead.contactName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(lead.status)} capitalize`}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-slate-700">
                                            ${Number(lead.estimatedValue || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${lead.score >= 80 ? 'bg-emerald-500' :
                                                            lead.score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                                            }`}
                                                        style={{ width: `${lead.score || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600">{lead.score || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(lead)}
                                                    className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(lead.id)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {leads.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <svg className="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                                <p>No leads found. Create your first one!</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800">{editingLead ? 'Edit Lead' : 'Add New Lead'}</h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Company Name *</label>
                                    <input
                                        type="text"
                                        value={formData.companyName}
                                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        required
                                        placeholder="e.g. Acme Corp"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Contact Name *</label>
                                    <input
                                        type="text"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        required
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                                    <div className="relative">
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none appearance-none bg-white transition-all"
                                        >
                                            <option value="new">New</option>
                                            <option value="contacted">Contacted</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="won">Won</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Heat Score (0-100)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.score}
                                        onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) || 0 })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Estimated Value ($)</label>
                                    <input
                                        type="number"
                                        value={formData.estimatedValue}
                                        onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-mono"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Source</label>
                                    <input
                                        type="text"
                                        value={formData.source}
                                        onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        placeholder="e.g. Website"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all min-h-[100px]"
                                    placeholder="Add any relevant details here..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-brand-500/25 hover:bg-brand-700 transition-all transform active:scale-95"
                                >
                                    {editingLead ? 'Update Lead' : 'Create Lead'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <DetailSidebar
                isOpen={!!selectedLead}
                onClose={() => setSelectedLead(null)}
                entityType="lead"
                entityId={selectedLead?.id}
                title={selectedLead?.company || selectedLead?.companyName}
                subTitle={selectedLead?.contactName}
                status={selectedLead?.status}
            />
        </div>
    );
}

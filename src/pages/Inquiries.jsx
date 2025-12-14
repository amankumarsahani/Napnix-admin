import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { inquiriesAPI } from '../api';
import toast from 'react-hot-toast';

export default function Inquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const response = await inquiriesAPI.getAll();
            console.log('[Inquiries] API response:', response);
            // Backend returns { success: true, data: [...], page, limit }
            // inquiriesAPI.getAll() already extracts response.data from axios
            // So response = { success, data, page, limit } where data is the array
            const list = response?.data || [];
            console.log('[Inquiries] Extracted list:', list);
            setInquiries(Array.isArray(list) ? list : []);
        } catch (error) {
            toast.error('Failed to load inquiries');
            console.error('Fetch inquiries error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await inquiriesAPI.updateStatus(id, newStatus);
            toast.success('Status updated successfully');
            fetchInquiries();
        } catch (error) {
            toast.error('Failed to update status');
            console.error('Update status error:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this inquiry?')) return;

        try {
            await inquiriesAPI.delete(id);
            toast.success('Inquiry deleted successfully');
            fetchInquiries();
            setShowModal(false);
        } catch (error) {
            toast.error('Failed to delete inquiry');
            console.error('Delete inquiry error:', error);
        }
    };

    const handleConvertToLead = async (inquiry) => {
        console.log('[Convert to Lead] Converting:', inquiry.name);

        try {
            console.log('[Convert to Lead] Calling API...');
            toast.loading('Converting to lead...', { id: 'convert' });

            const result = await inquiriesAPI.convertToLead(inquiry.id, {
                notes: inquiry.message
            });

            console.log('[Convert to Lead] Success:', result);
            toast.success('Inquiry converted to lead!', { id: 'convert' });
            fetchInquiries();
            setShowModal(false);
        } catch (error) {
            console.error('[Convert to Lead] Error:', error);
            toast.error(error.response?.data?.error || 'Failed to convert', { id: 'convert' });
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            new: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400',
            contacted: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400',
            resolved: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400',
            converted: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-400',
        };
        return styles[status] || styles.new;
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contact Inquiries</h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Manage contact form submissions from your website</p>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                    Total: <span className="font-semibold">{inquiries.length}</span>
                </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                        No inquiries found
                                    </td>
                                </tr>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <tr
                                        key={inquiry.id}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer"
                                        onClick={() => navigate(`/inquiries/${inquiry.id}`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-slate-900 dark:text-white">{inquiry.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">{inquiry.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600 dark:text-slate-300">{inquiry.company || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={inquiry.status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    if (e.target.value === 'converted') {
                                                        handleConvertToLead(inquiry);
                                                    } else {
                                                        handleStatusChange(inquiry.id, e.target.value);
                                                    }
                                                }}
                                                className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusBadge(inquiry.status)}`}
                                                onClick={(e) => e.stopPropagation()}
                                                disabled={inquiry.status === 'converted'}
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="converted">→ Convert to Lead</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                            {formatDate(inquiry.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedInquiry(inquiry);
                                                        setShowModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    View
                                                </button>
                                                {inquiry.status !== 'converted' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleConvertToLead(inquiry);
                                                        }}
                                                        className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                                                        title="Convert to Lead"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                        </svg>
                                                        Lead
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {showModal && selectedInquiry && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inquiry Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedInquiry.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedInquiry.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedInquiry.phone || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Company</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{selectedInquiry.company || '-'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Message</label>
                                <p className="mt-1 text-slate-900 dark:text-white whitespace-pre-wrap bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
                                    {selectedInquiry.message}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                                    <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedInquiry.status)}`}>
                                        {selectedInquiry.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Submitted</label>
                                    <p className="mt-1 text-slate-900 dark:text-white">{formatDate(selectedInquiry.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                            <button
                                onClick={() => handleDelete(selectedInquiry.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete Inquiry
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


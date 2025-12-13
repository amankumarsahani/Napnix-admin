import { useState, useEffect } from 'react';
import { inquiriesAPI } from '../api';
import toast from 'react-hot-toast';
import DetailSidebar from '../components/common/DetailSidebar';

export default function Inquiries() {
    const [inquiries, setInquiries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInquiry, setSelectedInquiry] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [sidebarInquiry, setSidebarInquiry] = useState(null);

    useEffect(() => {
        fetchInquiries();
    }, []);

    const fetchInquiries = async () => {
        try {
            const response = await inquiriesAPI.getAll();
            // Backend returns { success: true, data: [...] }
            const list = response.data || response || [];
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

    const getStatusBadge = (status) => {
        const styles = {
            new: 'bg-blue-100 text-blue-700',
            contacted: 'bg-yellow-100 text-yellow-700',
            resolved: 'bg-green-100 text-green-700',
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
                    <h1 className="text-2xl font-bold text-slate-900">Contact Inquiries</h1>
                    <p className="text-slate-600 mt-1">Manage contact form submissions from your website</p>
                </div>
                <div className="text-sm text-slate-600">
                    Total: <span className="font-semibold">{inquiries.length}</span>
                </div>
            </div>

            {/* Inquiries Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Company
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {inquiries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No inquiries found
                                    </td>
                                </tr>
                            ) : (
                                inquiries.map((inquiry) => (
                                    <tr
                                        key={inquiry.id}
                                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => setSidebarInquiry(inquiry)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-slate-900">{inquiry.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600">{inquiry.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-600">{inquiry.company || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                                value={inquiry.status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(inquiry.id, e.target.value);
                                                }}
                                                className={`px-3 py-1 text-xs font-semibold rounded-full border-0 cursor-pointer ${getStatusBadge(inquiry.status)}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="new">New</option>
                                                <option value="contacted">Contacted</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {formatDate(inquiry.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">Inquiry Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
                                    <label className="text-sm font-medium text-slate-700">Name</label>
                                    <p className="mt-1 text-slate-900">{selectedInquiry.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Email</label>
                                    <p className="mt-1 text-slate-900">{selectedInquiry.email}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Phone</label>
                                    <p className="mt-1 text-slate-900">{selectedInquiry.phone || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Company</label>
                                    <p className="mt-1 text-slate-900">{selectedInquiry.company || '-'}</p>
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-700">Message</label>
                                <p className="mt-1 text-slate-900 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg">
                                    {selectedInquiry.message}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Status</label>
                                    <span className={`ml-2 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedInquiry.status)}`}>
                                        {selectedInquiry.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700">Submitted</label>
                                    <p className="mt-1 text-slate-900">{formatDate(selectedInquiry.createdAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 flex items-center justify-between">
                            <button
                                onClick={() => handleDelete(selectedInquiry.id)}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Delete Inquiry
                            </button>
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <DetailSidebar
                isOpen={!!sidebarInquiry}
                onClose={() => setSidebarInquiry(null)}
                entityType="inquiry"
                entityId={sidebarInquiry?.id}
                title={sidebarInquiry?.name}
                subTitle={sidebarInquiry?.company}
                status={sidebarInquiry?.status}
            />
        </div>
    );
}

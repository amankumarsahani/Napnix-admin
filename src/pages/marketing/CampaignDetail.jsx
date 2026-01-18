import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../../api';
import toast from 'react-hot-toast';

const CampaignDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState(null);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [recipientsLoading, setRecipientsLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchCampaign = useCallback(async () => {
        try {
            const res = await campaignsAPI.getById(id);
            setCampaign(res.data);
        } catch (error) {
            toast.error('Failed to load campaign');
            navigate('/campaigns');
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    const fetchRecipients = useCallback(async () => {
        try {
            setRecipientsLoading(true);
            const res = await campaignsAPI.getRecipients(id, {
                page,
                limit: 20,
                status: filter !== 'all' ? filter : undefined
            });
            setRecipients(res.data || []);
            setTotalPages(res.pagination?.pages || 1);
        } catch (error) {
            console.error('Failed to load recipients:', error);
        } finally {
            setRecipientsLoading(false);
        }
    }, [id, page, filter]);

    useEffect(() => {
        fetchCampaign();
    }, [fetchCampaign]);

    useEffect(() => {
        if (campaign) {
            fetchRecipients();
        }
    }, [campaign, fetchRecipients]);

    // Auto-refresh when campaign is sending
    useEffect(() => {
        if (campaign?.status === 'sending') {
            const interval = setInterval(() => {
                fetchCampaign();
                fetchRecipients();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [campaign?.status, fetchCampaign, fetchRecipients]);

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-slate-100 text-slate-700',
            sending: 'bg-amber-100 text-amber-700',
            sent: 'bg-emerald-100 text-emerald-700',
            failed: 'bg-rose-100 text-rose-700',
            bounced: 'bg-red-100 text-red-700',
            skipped: 'bg-gray-100 text-gray-600'
        };
        return styles[status] || 'bg-slate-100 text-slate-700';
    };

    const getCampaignStatusBadge = (status) => {
        const styles = {
            draft: 'bg-slate-100 text-slate-700 border-slate-200',
            scheduled: 'bg-blue-100 text-blue-700 border-blue-200',
            sending: 'bg-amber-100 text-amber-700 border-amber-200',
            completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            paused: 'bg-orange-100 text-orange-700 border-orange-200',
            failed: 'bg-rose-100 text-rose-700 border-rose-200'
        };
        return styles[status] || 'bg-slate-100 text-slate-700';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    if (!campaign) return null;

    const openRate = campaign.sent_count > 0
        ? ((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)
        : 0;
    const clickRate = campaign.opened_count > 0
        ? ((campaign.clicked_count / campaign.opened_count) * 100).toFixed(1)
        : 0;
    const bounceRate = campaign.sent_count > 0
        ? ((campaign.bounced_count / campaign.sent_count) * 100).toFixed(1)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <button
                        onClick={() => navigate('/campaigns')}
                        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Campaigns
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{campaign.name}</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">{campaign.subject}</p>
                </div>
                <div className="flex items-center gap-3">
                    {campaign.status === 'sending' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-emerald-700">Live</span>
                        </div>
                    )}
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border capitalize ${getCampaignStatusBadge(campaign.status)}`}>
                        {campaign.status}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <StatCard label="Total Recipients" value={campaign.total_recipients || 0} />
                <StatCard label="Sent" value={campaign.sent_count || 0} color="emerald" />
                <StatCard label="Opened" value={campaign.opened_count || 0} subtext={`${openRate}%`} color="blue" />
                <StatCard label="Clicked" value={campaign.clicked_count || 0} subtext={`${clickRate}%`} color="purple" />
                <StatCard label="Bounced" value={campaign.bounced_count || 0} subtext={`${bounceRate}%`} color="rose" />
                <StatCard label="Unsubscribed" value={campaign.unsubscribed_count || 0} color="orange" />
                <StatCard label="Failed" value={campaign.failed_count || 0} color="red" />
            </div>

            {/* Progress Bar */}
            {campaign.total_recipients > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600 dark:text-slate-400">Sending Progress</span>
                        <span className="font-medium text-slate-900 dark:text-white">
                            {campaign.sent_count} / {campaign.total_recipients}
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                        <div
                            className="bg-brand-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(campaign.sent_count / campaign.total_recipients) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            {/* Recipients List */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recipients</h2>
                    <div className="flex items-center gap-2">
                        <select
                            value={filter}
                            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
                            className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="sent">Sent</option>
                            <option value="failed">Failed</option>
                            <option value="bounced">Bounced</option>
                        </select>
                        <button
                            onClick={fetchRecipients}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                            title="Refresh"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>

                {recipientsLoading ? (
                    <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
                    </div>
                ) : recipients.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No recipients found
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Recipient</th>
                                        <th className="px-4 py-3 text-left">Status</th>
                                        <th className="px-4 py-3 text-left">Sent At</th>
                                        <th className="px-4 py-3 text-left">Opened</th>
                                        <th className="px-4 py-3 text-left">Clicked</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {recipients.map((recipient) => (
                                        <tr key={recipient.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                        {recipient.recipient_name || '-'}
                                                    </div>
                                                    <div className="text-sm text-slate-500">{recipient.recipient_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded capitalize ${getStatusBadge(recipient.status)}`}>
                                                    {recipient.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                                                {recipient.sent_at ? new Date(recipient.sent_at).toLocaleString() : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {recipient.opened_at ? (
                                                    <span className="text-emerald-600 text-sm">
                                                        {new Date(recipient.opened_at).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {recipient.clicked_at ? (
                                                    <span className="text-blue-600 text-sm">
                                                        {new Date(recipient.clicked_at).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="px-3 py-1 text-sm">
                                    Page {page} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ label, value, subtext, color = 'slate' }) => {
    const colors = {
        slate: 'text-slate-900 dark:text-white',
        emerald: 'text-emerald-600',
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        rose: 'text-rose-600',
        orange: 'text-orange-600',
        red: 'text-red-600'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
            {subtext && <span className="text-xs text-slate-400 ml-1">({subtext})</span>}
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{label}</div>
        </div>
    );
};

export default CampaignDetail;

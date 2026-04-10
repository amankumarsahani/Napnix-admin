import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { campaignsAPI } from '../../api';
import toast from 'react-hot-toast';
import usePagination from '../../hooks/usePagination';
import Pagination from '../../components/common/Pagination';

const Campaigns = () => {
    const navigate = useNavigate();
    const [campaigns, setCampaigns] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [actionLoading, setActionLoading] = useState({});
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);
    const intervalRef = useRef(null);

    const { currentPage, totalPages, totalItems, pageSize, goToPage, setPagination } = usePagination(10);

    // Fetch data function
    const fetchData = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const [campaignsRes, statsRes] = await Promise.all([
                campaignsAPI.getAll({ page: currentPage, limit: pageSize }),
                campaignsAPI.getDashboardStats()
            ]);
            setCampaigns(campaignsRes.data || []);
            if (campaignsRes.pagination) setPagination(campaignsRes.pagination);
            setStats(statsRes.data);
            setLastUpdated(new Date());
        } catch (error) {
            console.error('Fetch campaigns error:', error);
            if (showLoading) toast.error('Failed to fetch campaigns');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [currentPage, pageSize, setPagination]);

    // Initial load and page change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh polling when campaigns are sending
    useEffect(() => {
        const hasActiveCampaigns = campaigns.some(c => c.status === 'sending');

        if (autoRefresh && hasActiveCampaigns) {
            // Refresh every 10 seconds when campaigns are sending
            intervalRef.current = setInterval(() => {
                fetchData(false); // Silent refresh
            }, 10000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [autoRefresh, campaigns, fetchData]);

    const handleAction = async (campaignId, action) => {
        setActionLoading(prev => ({ ...prev, [campaignId]: action }));
        try {
            switch (action) {
                case 'start':
                    await campaignsAPI.start(campaignId);
                    toast.success('Campaign started!');
                    break;
                case 'pause':
                    await campaignsAPI.pause(campaignId);
                    toast.success('Campaign paused');
                    break;
                case 'resume':
                    await campaignsAPI.resume(campaignId);
                    toast.success('Campaign resumed');
                    break;
                case 'delete':
                    if (window.confirm('Delete this campaign?')) {
                        await campaignsAPI.delete(campaignId);
                        toast.success('Campaign deleted');
                    }
                    break;
            }
            fetchData();
        } catch (error) {
            toast.error(`Failed to ${action} campaign`);
        } finally {
            setActionLoading(prev => ({ ...prev, [campaignId]: null }));
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'sending': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'paused': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'failed': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
            </div>
        );
    }

    const hasActiveCampaigns = campaigns.some(c => c.status === 'sending');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Campaigns</h1>
                    <p className="text-slate-500 dark:text-slate-400">Send bulk emails to leads and clients</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Live indicator when campaigns are sending */}
                    {hasActiveCampaigns && autoRefresh && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-full">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Live</span>
                        </div>
                    )}
                    {lastUpdated && (
                        <span className="text-xs text-slate-400">
                            Updated {lastUpdated.toLocaleTimeString()}
                        </span>
                    )}
                    <button
                        onClick={() => fetchData()}
                        className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                    <button
                        onClick={() => { setSelectedCampaign(null); setShowCreateModal(true); }}
                        className="px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Campaign
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total_campaigns || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Total Campaigns</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-emerald-600">{stats.total_sent || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Emails Sent</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-blue-600">{stats.total_opened || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Opened</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-purple-600">{stats.overall_open_rate || 0}%</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Open Rate</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                        <div className="text-2xl font-bold text-rose-600">{stats.unsubscribed || 0}</div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">Unsubscribed</div>
                    </div>
                </div>
            )}

            {/* Campaigns Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                            <tr className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                <th className="px-6 py-4">Campaign</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Recipients</th>
                                <th className="px-6 py-4">Sent</th>
                                <th className="px-6 py-4">Opened</th>
                                <th className="px-6 py-4">Clicked</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                        No campaigns yet. Create your first campaign!
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((campaign) => (
                                    <tr key={campaign.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => navigate(`/campaigns/${campaign.id}`)}>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-semibold text-slate-900 dark:text-white hover:text-brand-600">{campaign.name}</div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">{campaign.subject}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 text-xs font-medium rounded border capitalize ${getStatusColor(campaign.status)}`}>
                                                {campaign.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {campaign.total_recipients || 0}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {campaign.sent_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {campaign.opened_count || 0}
                                            {campaign.sent_count > 0 && (
                                                <span className="text-xs text-slate-400 ml-1">
                                                    ({((campaign.opened_count / campaign.sent_count) * 100).toFixed(1)}%)
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                            {campaign.clicked_count || 0}
                                        </td>
                                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {campaign.status === 'draft' && (
                                                    <button
                                                        onClick={() => handleAction(campaign.id, 'start')}
                                                        disabled={actionLoading[campaign.id]}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors flex items-center gap-1"
                                                        title="Send"
                                                    >
                                                        {actionLoading[campaign.id] === 'start' ? (
                                                            <>
                                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                                </svg>
                                                                <span className="text-[10px] font-bold uppercase tracking-wider">Launching...</span>
                                                            </>
                                                        ) : (
                                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                                <path d="M8 5v14l11-7z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                                {campaign.status === 'sending' && (
                                                    <button
                                                        onClick={() => handleAction(campaign.id, 'pause')}
                                                        disabled={actionLoading[campaign.id]}
                                                        className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                                                        title="Pause"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                            <rect x="6" y="4" width="4" height="16" />
                                                            <rect x="14" y="4" width="4" height="16" />
                                                        </svg>
                                                    </button>
                                                )}
                                                {campaign.status === 'paused' && (
                                                    <button
                                                        onClick={() => handleAction(campaign.id, 'resume')}
                                                        disabled={actionLoading[campaign.id]}
                                                        className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition-colors"
                                                        title="Resume"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setSelectedCampaign(campaign); setShowCreateModal(true); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleAction(campaign.id, 'delete')}
                                                    disabled={actionLoading[campaign.id]}
                                                    className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={goToPage} />
            </div>

            {/* Create/Edit Campaign Modal */}
            {showCreateModal && (
                <CampaignModal
                    campaign={selectedCampaign}
                    onClose={() => { setShowCreateModal(false); setSelectedCampaign(null); }}
                    onSaved={() => { setShowCreateModal(false); setSelectedCampaign(null); fetchData(); }}
                />
            )}
        </div>
    );
};

// Campaign Modal Component
const CampaignModal = ({ campaign, onClose, onSaved }) => {
    const [templates, setTemplates] = useState([]);
    const [formData, setFormData] = useState({
        name: campaign?.name || '',
        subject: campaign?.subject || '',
        preview_text: campaign?.preview_text || '',
        html_content: campaign?.html_content || '',
        template_id: campaign?.template_id || '',
        audience_type: campaign?.audience_type || 'all_leads',
        custom_emails: campaign?.custom_emails || '',
        rate_limit_per_hour: campaign?.rate_limit_per_hour || 50,
        delay_between_emails: campaign?.delay_between_emails || 3,
        auto_enroll: campaign?.auto_enroll || false
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const res = await campaignsAPI.getTemplates();
            setTemplates(res.data || []);
        } catch (error) {
            console.error('Failed to load templates:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTemplateSelect = async (templateId) => {
        if (!templateId) {
            setFormData(prev => ({ ...prev, template_id: '', subject: '', preview_text: '' }));
            return;
        }

        // Find selected template and populate fields
        const template = templates.find(t => t.id === parseInt(templateId));
        if (template) {
            setFormData(prev => ({
                ...prev,
                template_id: templateId,
                subject: template.subject || prev.subject,
                preview_text: template.description || ''  // Use description as preview hint
            }));
        } else {
            setFormData(prev => ({ ...prev, template_id: templateId }));
        }
    };

    // Get selected template info
    const selectedTemplate = templates.find(t => t.id === parseInt(formData.template_id));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (campaign?.id) {
                await campaignsAPI.update(campaign.id, formData);
                toast.success('Campaign updated!');
            } else {
                await campaignsAPI.create(formData);
                toast.success('Campaign created!');
            }
            onSaved();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to save campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        {campaign?.id ? 'Edit Campaign' : 'New Campaign'}
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Campaign Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            placeholder="January Newsletter"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Template
                        </label>
                        <select
                            name="template_id"
                            value={formData.template_id}
                            onChange={(e) => handleTemplateSelect(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="">-- No Template (Custom HTML) --</option>
                            {templates.map(template => (
                                <option key={template.id} value={template.id}>
                                    {template.name} {template.category ? `(${template.category})` : ''}
                                </option>
                            ))}
                        </select>
                        {selectedTemplate && (
                            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                    <span className="font-medium">Template selected:</span> {selectedTemplate.name}
                                </p>
                                {selectedTemplate.description && (
                                    <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">{selectedTemplate.description}</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Email Subject *
                        </label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            placeholder="Exciting news for {{name}}!"
                        />
                        <p className="mt-1 text-xs text-slate-500">Use {'{{name}}'} for personalization</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Preview Text
                        </label>
                        <input
                            type="text"
                            name="preview_text"
                            value={formData.preview_text}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            placeholder="Short preview shown in inbox..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Audience
                        </label>
                        <select
                            name="audience_type"
                            value={formData.audience_type}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                        >
                            <option value="all_leads">All Leads</option>
                            <option value="all_clients">All Clients</option>
                            <option value="custom">Custom Emails (Paste or Upload)</option>
                        </select>
                    </div>

                    {/* Auto-Enroll Toggle - only for All Leads or All Clients */}
                    {(formData.audience_type === 'all_leads' || formData.audience_type === 'all_clients') && (
                        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <input
                                type="checkbox"
                                id="auto_enroll"
                                name="auto_enroll"
                                checked={formData.auto_enroll}
                                onChange={(e) => setFormData(prev => ({ ...prev, auto_enroll: e.target.checked }))}
                                className="w-4 h-4 rounded text-brand-600"
                            />
                            <div>
                                <label htmlFor="auto_enroll" className="text-sm font-medium text-slate-900 dark:text-white cursor-pointer">
                                    Auto-enroll new contacts
                                </label>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    New {formData.audience_type === 'all_leads' ? 'leads' : 'clients'} will automatically receive this campaign
                                </p>
                            </div>
                        </div>
                    )}

                    {formData.audience_type === 'custom' && (
                        <div className="space-y-3">
                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Upload Email List (Excel/CSV)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="file"
                                        id="emailFile"
                                        accept=".csv,.xlsx,.xls"
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            try {
                                                const result = await campaignsAPI.parseEmails(file);
                                                if (result.success && result.data.emailsText) {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        custom_emails: result.data.emailsText
                                                    }));
                                                    toast.success(`Loaded ${result.data.total} emails from file`);
                                                }
                                            } catch (err) {
                                                toast.error('Failed to parse file');
                                            }
                                            e.target.value = '';
                                        }}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor="emailFile"
                                        className="flex-1 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg text-center cursor-pointer hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                                    >
                                        <svg className="w-6 h-6 mx-auto text-slate-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="text-sm text-slate-600 dark:text-slate-400">
                                            Click to upload CSV or Excel file
                                        </span>
                                    </label>
                                </div>
                                <p className="mt-1 text-xs text-slate-500">File should have columns: email, name (name is optional)</p>
                            </div>

                            {/* Manual Entry */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                    Or paste email addresses (one per line)
                                </label>
                                <textarea
                                    name="custom_emails"
                                    value={formData.custom_emails}
                                    onChange={handleChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                                    placeholder="john@example.com&#10;Jane Doe <jane@example.com>&#10;support@company.com"
                                />
                                {formData.custom_emails && (
                                    <p className="mt-1 text-xs text-emerald-600">
                                        {formData.custom_emails.split('\n').filter(e => e.trim()).length} email(s) loaded
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!formData.template_id && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Email Content (HTML)
                            </label>
                            <textarea
                                name="html_content"
                                value={formData.html_content}
                                onChange={handleChange}
                                rows={10}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-sm"
                                placeholder="<h1>Hello {{name}}!</h1>&#10;<p>Your email content here...</p>"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Rate Limit (per hour)
                            </label>
                            <input
                                type="number"
                                name="rate_limit_per_hour"
                                value={formData.rate_limit_per_hour}
                                onChange={handleChange}
                                min={1}
                                max={500}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                Delay Between Emails (sec)
                            </label>
                            <input
                                type="number"
                                name="delay_between_emails"
                                value={formData.delay_between_emails}
                                onChange={handleChange}
                                min={1}
                                max={60}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500"
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
                            {campaign?.id ? 'Save Changes' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Campaigns;

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import EmailComposer from '../../components/common/EmailComposer';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Activity type configurations
const ACTIVITY_TYPES = {
    note: { label: 'Note', icon: '📝', color: 'bg-blue-500' },
    call: { label: 'Call', icon: '📞', color: 'bg-emerald-500' },
    email: { label: 'Email', icon: '✉️', color: 'bg-purple-500' },
    meeting: { label: 'Meeting', icon: '👥', color: 'bg-amber-500' },
    status_change: { label: 'Status Change', icon: '🔄', color: 'bg-slate-500' },
};

const STATUS_COLORS = {
    new: 'bg-blue-100 text-blue-700',
    contacted: 'bg-yellow-100 text-yellow-700',
    qualified: 'bg-emerald-100 text-emerald-700',
    negotiation: 'bg-purple-100 text-purple-700',
    won: 'bg-green-100 text-green-700',
    lost: 'bg-red-100 text-red-700',
};

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

const getRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export default function LeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState(null);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('timeline');

    // Activity form
    const [newNote, setNewNote] = useState('');
    const [activityType, setActivityType] = useState('note');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEmailComposer, setShowEmailComposer] = useState(false);

    useEffect(() => {
        fetchLead();
        fetchActivities();
    }, [id]);

    const fetchLead = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/leads/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLead(res.data.lead);
        } catch (error) {
            console.error('Failed to fetch lead:', error);
            toast.error('Failed to load lead details');
            navigate('/leads');
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/activities/lead/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setActivities(res.data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/activities`, {
                entityType: 'lead',
                entityId: id,
                type: activityType,
                summary: `${ACTIVITY_TYPES[activityType].label} logged`,
                details: newNote
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            toast.success('Activity added');
            setNewNote('');
            fetchActivities();
        } catch (error) {
            toast.error('Failed to add activity');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleStatusChange = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${API_URL}/leads/${id}`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Status updated');
            fetchLead();
            fetchActivities();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-2xl"></div>
                </div>
            </div>
        );
    }

    if (!lead) return null;

    return (
        <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-6">
                <Link to="/leads" className="hover:text-brand-600">Leads</Link>
                <span>/</span>
                <span className="text-slate-900 dark:text-white font-medium">{lead.contactName}</span>
            </div>

            {/* Header */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{lead.contactName}</h1>
                        <p className="text-slate-500 dark:text-slate-400 mt-1">{lead.company || 'No company'}</p>
                        <div className="flex items-center gap-3 mt-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-700'}`}>
                                {lead.status}
                            </span>
                            {lead.estimatedValue && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                    ${parseFloat(lead.estimatedValue).toLocaleString()}
                                </span>
                            )}
                            {lead.score !== null && (
                                <span className="px-2 py-1 bg-amber-50 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium">
                                    Score: {lead.score}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEmailComposer(true)}
                            className="px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Send Email
                        </button>
                        <button
                            onClick={() => navigate('/leads')}
                            className="px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                        >
                            ← Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Info & Actions */}
                <div className="space-y-6">
                    {/* Contact Info */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
                        <div className="space-y-3">
                            {lead.email && (
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400">✉️</span>
                                    <a href={`mailto:${lead.email}`} className="text-brand-600 hover:underline">{lead.email}</a>
                                </div>
                            )}
                            {lead.phone && (
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400">📞</span>
                                    <a href={`tel:${lead.phone}`} className="text-brand-600 hover:underline">{lead.phone}</a>
                                </div>
                            )}
                            {lead.leadSource && (
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-400">📍</span>
                                    <span className="text-slate-600">{lead.leadSource}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Update */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Update Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                            {['new', 'contacted', 'qualified', 'negotiation', 'won', 'lost'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium capitalize transition-all ${lead.status === status
                                        ? 'bg-brand-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assigned To */}
                    {lead.assignedFirstName && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Assigned To</h3>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-semibold">
                                    {lead.assignedFirstName[0]}{lead.assignedLastName?.[0] || ''}
                                </div>
                                <div>
                                    <p className="font-medium text-slate-900">{lead.assignedFirstName} {lead.assignedLastName}</p>
                                    <p className="text-sm text-slate-500">{lead.assignedEmail}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    {lead.notes && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                            <h3 className="font-semibold text-slate-900 mb-4">Notes</h3>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{lead.notes}</p>
                        </div>
                    )}

                    {/* Meta */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Details</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Created</span>
                                <span className="text-slate-900">{formatDate(lead.createdAt)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Updated</span>
                                <span className="text-slate-900">{formatDate(lead.updatedAt)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Timeline */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-100">
                            <button
                                onClick={() => setActiveTab('timeline')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'timeline'
                                    ? 'text-brand-600 border-b-2 border-brand-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                Timeline ({activities.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('add')}
                                className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === 'add'
                                    ? 'text-brand-600 border-b-2 border-brand-600'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                + Add Activity
                            </button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'add' && (
                                <form onSubmit={handleAddActivity} className="space-y-4">
                                    <div className="flex gap-2 flex-wrap">
                                        {Object.entries(ACTIVITY_TYPES).filter(([key]) => key !== 'status_change').map(([key, val]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => setActivityType(key)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activityType === key
                                                    ? 'bg-brand-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                {val.icon} {val.label}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Add details about this activity..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none resize-none h-32"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !newNote.trim()}
                                        className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Adding...' : 'Add Activity'}
                                    </button>
                                </form>
                            )}

                            {activeTab === 'timeline' && (
                                <div className="space-y-0">
                                    {activities.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-4xl mb-3">📭</div>
                                            <p className="text-slate-500">No activities yet</p>
                                            <button
                                                onClick={() => setActiveTab('add')}
                                                className="mt-4 text-brand-600 font-medium hover:underline"
                                            >
                                                Add the first activity
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            {/* Timeline line */}
                                            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-200"></div>

                                            {activities.map((activity, index) => {
                                                const config = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.note;
                                                return (
                                                    <div key={activity.id} className="relative pl-14 pb-6">
                                                        {/* Timeline dot */}
                                                        <div className={`absolute left-3 w-5 h-5 rounded-full ${config.color} flex items-center justify-center text-white text-xs`}>
                                                            {config.icon}
                                                        </div>

                                                        <div className="bg-slate-50 rounded-xl p-4">
                                                            <div className="flex items-start justify-between mb-2">
                                                                <span className="font-medium text-slate-900">{activity.summary}</span>
                                                                <span className="text-xs text-slate-400">{getRelativeTime(activity.createdAt)}</span>
                                                            </div>
                                                            {activity.details && (
                                                                <p className="text-sm text-slate-600">{activity.details}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Email Composer Modal */}
            <EmailComposer
                isOpen={showEmailComposer}
                onClose={() => setShowEmailComposer(false)}
                recipient={{ name: lead.contactName, email: lead.email, company: lead.company }}
                entityType="lead"
                entityId={id}
                onEmailSent={() => fetchActivities()}
            />
        </div>
    );
}

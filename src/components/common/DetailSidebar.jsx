import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Activity type configurations
const ACTIVITY_TYPES = {
    note: { label: 'Note', icon: '📝', color: 'bg-blue-400' },
    call: { label: 'Call', icon: '📞', color: 'bg-emerald-400' },
    email: { label: 'Email', icon: '✉️', color: 'bg-purple-400' },
    meeting: { label: 'Meeting', icon: '👥', color: 'bg-amber-400' },
    status_change: { label: 'Status Change', icon: '🔄', color: 'bg-slate-400' },
};

// Relative time formatter
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

export default function DetailSidebar({ isOpen, onClose, entityType, entityId, title, subTitle, status, email, phone }) {
    const [activeTab, setActiveTab] = useState('activity');
    const [activities, setActivities] = useState([]);
    const [newNote, setNewNote] = useState('');
    const [activityType, setActivityType] = useState('note');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingActivities, setLoadingActivities] = useState(false);

    useEffect(() => {
        if (isOpen && entityId) {
            fetchActivities();
            setActiveTab('activity'); // Reset to activity tab when opening
        }
    }, [isOpen, entityId, entityType]);

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/activities/${entityType}/${entityId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setActivities(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load activities', error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const handleAddActivity = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${API_URL}/activities`, {
                entityType,
                entityId,
                type: activityType,
                summary: `${ACTIVITY_TYPES[activityType].label} logged`,
                details: newNote
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data.success) {
                toast.success(`${ACTIVITY_TYPES[activityType].label} added!`);
                setNewNote('');
                fetchActivities();
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to add activity');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Sidebar Panel */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-slate-800 truncate">{title}</h2>
                            <p className="text-sm text-slate-500 mt-1">{subTitle}</p>
                            {status && (
                                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-100 text-brand-700 capitalize">
                                    {status}
                                </span>
                            )}
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Quick Contact Actions */}
                    {(email || phone) && (
                        <div className="flex gap-2 mt-4">
                            {email && (
                                <a href={`mailto:${email}`} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    Email
                                </a>
                            )}
                            {phone && (
                                <a href={`tel:${phone}`} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    Call
                                </a>
                            )}
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-6 mt-6 border-b border-slate-200">
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'activity' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Activity Timeline
                            {activeTab === 'activity' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-600 rounded-full"></div>}
                        </button>
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`pb-3 text-sm font-semibold transition-colors relative ${activeTab === 'overview' ? 'text-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Overview
                            {activeTab === 'overview' && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand-600 rounded-full"></div>}
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' ? (
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Contact Information</h3>
                                <div className="space-y-3">
                                    {email && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{email}</span>
                                        </div>
                                    )}
                                    {phone && (
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                            </div>
                                            <span className="text-sm font-medium text-slate-700">{phone}</span>
                                        </div>
                                    )}
                                    {!email && !phone && (
                                        <p className="text-sm text-slate-400 italic">No contact information available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Activity Input */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                {/* Activity Type Selector */}
                                <div className="flex gap-1 mb-3">
                                    {['note', 'call', 'email', 'meeting'].map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setActivityType(type)}
                                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${activityType === type
                                                    ? 'bg-brand-600 text-white shadow-sm'
                                                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            <span>{ACTIVITY_TYPES[type].icon}</span>
                                            <span className="hidden sm:inline">{ACTIVITY_TYPES[type].label}</span>
                                        </button>
                                    ))}
                                </div>

                                <textarea
                                    className="w-full p-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all resize-none text-sm bg-white"
                                    rows="3"
                                    placeholder={`Add ${activityType} details...`}
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                ></textarea>
                                <div className="flex justify-end mt-2">
                                    <button
                                        onClick={handleAddActivity}
                                        disabled={isSubmitting || !newNote.trim()}
                                        className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                                                Adding...
                                            </>
                                        ) : (
                                            <>Add {ACTIVITY_TYPES[activityType].label}</>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Timeline</h3>
                                {loadingActivities ? (
                                    <div className="flex justify-center py-8">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
                                    </div>
                                ) : activities.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm text-slate-400">No activity recorded yet</p>
                                        <p className="text-xs text-slate-300 mt-1">Add a note or log a call to get started</p>
                                    </div>
                                ) : (
                                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-4">
                                        {activities.map((activity) => {
                                            const typeConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.note;
                                            const isStatusChange = activity.type === 'status_change';

                                            return (
                                                <div key={activity.id} className="relative pl-6">
                                                    <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[8px] ${typeConfig.color}`}>
                                                    </div>

                                                    <div className={`p-3 rounded-lg border transition-colors ${isStatusChange
                                                            ? 'bg-gradient-to-r from-slate-50 to-white border-slate-200'
                                                            : 'bg-white border-slate-100 hover:border-slate-200'
                                                        }`}>
                                                        <div className="flex items-start justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm">{typeConfig.icon}</span>
                                                                <span className="text-xs font-semibold text-slate-600 capitalize">
                                                                    {isStatusChange ? activity.summary : typeConfig.label}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] font-medium text-slate-400">
                                                                {getRelativeTime(activity.createdAt)}
                                                            </span>
                                                        </div>
                                                        {!isStatusChange && (
                                                            <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{activity.details}</p>
                                                        )}
                                                        {activity.firstName && (
                                                            <p className="text-[10px] text-slate-400 mt-2">by {activity.firstName} {activity.lastName || ''}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


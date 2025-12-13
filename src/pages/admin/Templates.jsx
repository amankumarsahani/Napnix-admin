import { useState, useEffect } from 'react';
import { templatesAPI } from '../../api';
import toast from 'react-hot-toast';

const TEMPLATE_TYPES = [
    { value: 'email', label: 'Email', icon: '📧', color: 'blue' },
    { value: 'sms', label: 'SMS', icon: '💬', color: 'green' },
    { value: 'whatsapp', label: 'WhatsApp', icon: '📱', color: 'emerald' },
    { value: 'push', label: 'Push Notification', icon: '🔔', color: 'purple' },
    { value: 'other', label: 'Other', icon: '📄', color: 'slate' },
];

const CATEGORIES = [
    { value: 'notification', label: 'Notification' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'transactional', label: 'Transactional' },
    { value: 'system', label: 'System' },
];

export default function Templates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [previewHtml, setPreviewHtml] = useState(null);
    const [activeTypeFilter, setActiveTypeFilter] = useState('all');
    const [stats, setStats] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        type: 'email',
        subject: '',
        html_content: '',
        description: '',
        variables: [],
        category: 'notification',
        is_active: true,
    });

    useEffect(() => {
        fetchTemplates();
        fetchStats();
    }, [activeTypeFilter]);

    const fetchTemplates = async () => {
        try {
            const params = {};
            if (activeTypeFilter !== 'all') {
                params.type = activeTypeFilter;
            }
            const response = await templatesAPI.getAll(params);
            setTemplates(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            toast.error('Failed to load templates');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await templatesAPI.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const submitData = {
                ...formData,
                variables: formData.variables.length > 0
                    ? formData.variables.split(',').map(v => v.trim())
                    : []
            };

            if (editingTemplate) {
                await templatesAPI.update(editingTemplate.id, submitData);
                toast.success('Template updated successfully');
            } else {
                await templatesAPI.create(submitData);
                toast.success('Template created successfully');
            }
            setShowModal(false);
            resetForm();
            fetchTemplates();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this template?')) return;
        try {
            await templatesAPI.delete(id);
            toast.success('Template deleted successfully');
            fetchTemplates();
            fetchStats();
        } catch (error) {
            toast.error('Failed to delete template');
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name || '',
            type: template.type || 'email',
            subject: template.subject || '',
            html_content: template.html_content || '',
            description: template.description || '',
            variables: Array.isArray(template.variables)
                ? template.variables.join(', ')
                : '',
            category: template.category || 'notification',
            is_active: template.is_active !== false,
        });
        setShowModal(true);
    };

    const handlePreview = async (template) => {
        try {
            const sampleData = {};
            // Generate sample data from variables
            if (template.variables && Array.isArray(template.variables)) {
                template.variables.forEach(v => {
                    sampleData[v] = `[${v}]`;
                });
            }
            const response = await templatesAPI.preview(template.id, sampleData);
            setPreviewHtml(response.html);
        } catch (error) {
            toast.error('Failed to preview template');
        }
    };

    const resetForm = () => {
        setEditingTemplate(null);
        setFormData({
            name: '',
            type: 'email',
            subject: '',
            html_content: '',
            description: '',
            variables: [],
            category: 'notification',
            is_active: true,
        });
    };

    const getTypeInfo = (type) => TEMPLATE_TYPES.find(t => t.value === type) || TEMPLATE_TYPES[4];

    const getTypeColor = (type) => {
        const colors = {
            email: 'bg-blue-100 text-blue-700 border-blue-200',
            sms: 'bg-green-100 text-green-700 border-green-200',
            whatsapp: 'bg-emerald-100 text-emerald-700 border-emerald-200',
            push: 'bg-purple-100 text-purple-700 border-purple-200',
            other: 'bg-slate-100 text-slate-700 border-slate-200',
        };
        return colors[type] || colors.other;
    };

    const getCategoryColor = (category) => {
        const colors = {
            notification: 'bg-amber-100 text-amber-700',
            marketing: 'bg-pink-100 text-pink-700',
            transactional: 'bg-cyan-100 text-cyan-700',
            system: 'bg-slate-100 text-slate-700',
        };
        return colors[category] || colors.notification;
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
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Templates</h1>
                    <p className="text-slate-500 mt-1">Manage email, SMS, WhatsApp and other message templates</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="px-4 py-2 bg-brand-600 text-white font-semibold rounded-xl text-sm hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Template
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {TEMPLATE_TYPES.map(type => (
                        <div
                            key={type.value}
                            onClick={() => setActiveTypeFilter(activeTypeFilter === type.value ? 'all' : type.value)}
                            className={`bg-white rounded-xl p-4 border cursor-pointer transition-all hover:shadow-md ${activeTypeFilter === type.value ? 'border-brand-500 ring-2 ring-brand-500/20' : 'border-slate-200'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{type.icon}</span>
                                <div>
                                    <p className="text-2xl font-bold text-slate-900">{stats[type.value] || 0}</p>
                                    <p className="text-xs text-slate-500">{type.label}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                    const typeInfo = getTypeInfo(template.type);
                    return (
                        <div
                            key={template.id}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden group"
                        >
                            {/* Header */}
                            <div className="p-5 border-b border-slate-100">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{typeInfo.icon}</span>
                                        <div>
                                            <h3 className="font-bold text-slate-900 truncate">{template.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getTypeColor(template.type)}`}>
                                                    {typeInfo.label}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(template.category)}`}>
                                                    {template.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`w-2 h-2 rounded-full ${template.is_active ? 'bg-green-500' : 'bg-slate-300'}`} />
                                </div>
                            </div>

                            {/* Body */}
                            <div className="p-5">
                                {template.subject && (
                                    <p className="text-sm text-slate-600 mb-2">
                                        <span className="font-medium text-slate-700">Subject:</span> {template.subject}
                                    </p>
                                )}
                                <p className="text-sm text-slate-500 line-clamp-2">{template.description || 'No description'}</p>

                                {template.variables && template.variables.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {template.variables.slice(0, 4).map((v, i) => (
                                            <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                                                {`{{${v}}}`}
                                            </span>
                                        ))}
                                        {template.variables.length > 4 && (
                                            <span className="text-xs text-slate-400">+{template.variables.length - 4} more</span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handlePreview(template)}
                                    className="text-sm text-slate-600 hover:text-brand-600 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                    Preview
                                </button>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleEdit(template)}
                                        className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDelete(template.id)}
                                        className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {templates.length === 0 && (
                    <div className="col-span-full text-center py-16 text-slate-400">
                        <svg className="w-16 h-16 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No templates found</p>
                        <p className="text-sm">Create your first template to get started</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-slate-200">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-slate-900">
                                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                                </h2>
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

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Template Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        placeholder="e.g. welcome-email"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    >
                                        {TEMPLATE_TYPES.map(type => (
                                            <option key={type.value} value={type.value}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Subject Line</label>
                                    <input
                                        type="text"
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                        placeholder="e.g. Welcome to {{company}}!"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all"
                                    placeholder="What is this template used for?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Variables (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.variables}
                                    onChange={(e) => setFormData({ ...formData, variables: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-mono text-sm"
                                    placeholder="name, email, company"
                                />
                                <p className="text-xs text-slate-500 mt-1">Use these variables in content with double curly braces: {'{{name}}'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    {formData.type === 'sms' ? 'Message Content *' : 'HTML Content *'}
                                </label>
                                <textarea
                                    value={formData.html_content}
                                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition-all font-mono text-sm min-h-[200px]"
                                    placeholder={formData.type === 'sms' ? 'Hi {{name}}, your order #{{orderId}} has been confirmed!' : '<div>\\n  <h1>Hello {{name}}!</h1>\\n  <p>Welcome to our platform.</p>\\n</div>'}
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                                    Active (template can be used)
                                </label>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-slate-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        resetForm();
                                    }}
                                    className="flex-1 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-brand-500/25 hover:bg-brand-700 transition-all"
                                >
                                    {editingTemplate ? 'Update Template' : 'Create Template'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewHtml && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Template Preview</h3>
                            <button
                                onClick={() => setPreviewHtml(null)}
                                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 overflow-auto max-h-[70vh]">
                            <div
                                className="bg-white border border-slate-200 rounded-lg p-4"
                                dangerouslySetInnerHTML={{ __html: previewHtml }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

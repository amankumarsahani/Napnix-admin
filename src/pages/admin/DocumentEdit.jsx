import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { documentTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';

export default function DocumentEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [template, setTemplate] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'sales',
        content: ''
    });

    useEffect(() => {
        fetchTemplate();
    }, [id]);

    const fetchTemplate = async () => {
        try {
            const response = await documentTemplatesAPI.getById(id);
            const data = response.data;
            setTemplate(data);
            setFormData({
                name: data.name || '',
                description: data.description || '',
                category: data.category || 'sales',
                content: data.content || ''
            });
        } catch (error) {
            toast.error('Failed to load template');
            navigate('/documents');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.content.trim()) {
            toast.error('Name and content are required');
            return;
        }

        setSaving(true);
        try {
            await documentTemplatesAPI.update(id, formData);
            toast.success('Template updated successfully!');
            navigate('/documents');
        } catch (error) {
            toast.error('Failed to update template');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="h-64 bg-slate-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
                <Link to="/documents" className="text-slate-500 hover:text-brand-600">Documents</Link>
                <span className="text-slate-300">/</span>
                <span className="text-slate-900 font-medium">{template?.name}</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Edit Template</h1>
                    <p className="text-slate-500 mt-1">Modify the template content and settings</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/documents')}
                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor Panel */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
                        <h3 className="font-semibold text-slate-900">Template Details</h3>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                            >
                                <option value="sales">Sales</option>
                                <option value="legal">Legal</option>
                                <option value="finance">Finance</option>
                                <option value="operations">Operations</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-slate-900">HTML Content</h3>
                            <span className="text-xs text-slate-400">Use {"{{variable_name}}"} for dynamic fields</span>
                        </div>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-mono text-sm"
                            rows={20}
                            placeholder="<div>Your HTML content here...</div>"
                        />
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:sticky lg:top-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Live Preview</h3>
                        <div
                            className="border border-slate-200 rounded-xl p-6 bg-slate-50 min-h-[600px] overflow-y-auto"
                            dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-slate-400">Start typing to see preview...</p>' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

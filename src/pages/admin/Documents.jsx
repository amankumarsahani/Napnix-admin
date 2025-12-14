import { useState, useEffect } from 'react';
import { documentTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const CATEGORY_COLORS = {
    sales: 'bg-blue-100 text-blue-700',
    legal: 'bg-purple-100 text-purple-700',
    finance: 'bg-emerald-100 text-emerald-700',
    operations: 'bg-amber-100 text-amber-700',
};

export default function Documents() {
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [variables, setVariables] = useState({});
    const [sendData, setSendData] = useState({ to: '', subject: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await documentTemplatesAPI.getAll();
            setTemplates(response.data || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
            toast.error('Failed to load document templates');
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (template) => {
        try {
            const fullTemplate = await documentTemplatesAPI.getById(template.id);
            setSelectedTemplate(fullTemplate.data);

            // Initialize variables with empty strings
            const vars = {};
            const templateVars = typeof fullTemplate.data.variables === 'string'
                ? JSON.parse(fullTemplate.data.variables)
                : fullTemplate.data.variables || [];
            templateVars.forEach(v => vars[v] = '');
            setVariables(vars);
            setPreviewContent(fullTemplate.data.content);
            setShowPreviewModal(true);
        } catch (error) {
            toast.error('Failed to load template');
        }
    };

    const handleVariableChange = async (key, value) => {
        const newVars = { ...variables, [key]: value };
        setVariables(newVars);

        // Update preview
        if (selectedTemplate) {
            try {
                const result = await documentTemplatesAPI.preview(selectedTemplate.id, newVars);
                setPreviewContent(result.data.renderedContent);
            } catch (error) {
                console.error('Preview error:', error);
            }
        }
    };

    const openSendModal = (template) => {
        setSelectedTemplate(template);
        setSendData({ to: '', subject: `${template.name} from Nexspire Solutions` });
        setShowSendModal(true);
    };

    const handleSend = async () => {
        if (!sendData.to) {
            toast.error('Please enter recipient email');
            return;
        }

        setSending(true);
        try {
            await documentTemplatesAPI.send(selectedTemplate.id, sendData.to, sendData.subject, variables);
            toast.success('Document sent successfully!');
            setShowSendModal(false);
            setShowPreviewModal(false);
        } catch (error) {
            toast.error('Failed to send document');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-slate-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="h-48 bg-slate-200 rounded-2xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Document Templates</h1>
                    <p className="text-slate-500 mt-1">Personalize and send professional documents to your clients</p>
                </div>
                {user?.role === 'admin' && (
                    <button className="px-4 py-2 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700">
                        + Create Template
                    </button>
                )}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${CATEGORY_COLORS[template.category] || 'bg-slate-100 text-slate-700'}`}>
                                        {template.category}
                                    </span>
                                    {template.isDefault && (
                                        <span className="ml-2 inline-block px-2 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-700">
                                            Default
                                        </span>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-2">{template.name}</h3>
                            <p className="text-sm text-slate-500 line-clamp-2">{template.description}</p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <button
                                onClick={() => handlePreview(template)}
                                className="flex-1 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                            >
                                Preview & Edit
                            </button>
                            <button
                                onClick={() => {
                                    handlePreview(template);
                                    setTimeout(() => openSendModal(template), 500);
                                }}
                                className="flex-1 px-3 py-2 text-sm font-medium bg-brand-600 text-white hover:bg-brand-700 rounded-lg transition-colors"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Preview Modal */}
            {showPreviewModal && selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex">
                        {/* Variables Panel */}
                        <div className="w-80 border-r border-slate-200 p-6 overflow-y-auto bg-slate-50">
                            <h3 className="font-semibold text-slate-900 mb-4">Customize Variables</h3>
                            <div className="space-y-4">
                                {Object.keys(variables).map(key => (
                                    <div key={key}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                                            {key.replace(/_/g, ' ')}
                                        </label>
                                        <input
                                            type="text"
                                            value={variables[key]}
                                            onChange={(e) => handleVariableChange(key, e.target.value)}
                                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                            placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 space-y-2">
                                <button
                                    onClick={() => openSendModal(selectedTemplate)}
                                    className="w-full px-4 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700"
                                >
                                    Send via Email
                                </button>
                                <button
                                    onClick={() => setShowPreviewModal(false)}
                                    className="w-full px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Preview Panel */}
                        <div className="flex-1 p-6 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-slate-900">{selectedTemplate.name}</h2>
                            </div>
                            <div
                                className="border border-slate-200 rounded-xl p-6 bg-white min-h-[500px]"
                                dangerouslySetInnerHTML={{ __html: previewContent }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Send Modal */}
            {showSendModal && selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Send Document</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Email</label>
                                <input
                                    type="email"
                                    value={sendData.to}
                                    onChange={(e) => setSendData({ ...sendData, to: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                    placeholder="client@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={sendData.subject}
                                    onChange={(e) => setSendData({ ...sendData, subject: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSendModal(false)}
                                className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSend}
                                disabled={sending}
                                className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50"
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

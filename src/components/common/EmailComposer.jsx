import { useState, useEffect } from 'react';
import { emailTemplatesAPI, documentTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';

/**
 * EmailComposer - Reusable component for sending emails with templates and document attachments
 * 
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: () => void - callback when modal closes
 * - recipient: { name, email } - pre-filled recipient info
 * - entityType: 'inquiry' | 'lead' | 'client' - for activity logging
 * - entityId: string | number - ID of the entity
 * - onEmailSent: () => void - callback after successful send
 */
export default function EmailComposer({ isOpen, onClose, recipient, entityType, entityId, onEmailSent }) {
    const [emailTemplates, setEmailTemplates] = useState([]);
    const [documentTemplates, setDocumentTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const [selectedEmailTemplate, setSelectedEmailTemplate] = useState(null);
    const [selectedDocuments, setSelectedDocuments] = useState([]);

    const [emailData, setEmailData] = useState({
        to: '',
        subject: '',
        content: ''
    });

    const [variables, setVariables] = useState({});

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
            // Pre-fill recipient
            if (recipient?.email) {
                setEmailData(prev => ({ ...prev, to: recipient.email }));
            }
            // Pre-fill common variables
            if (recipient?.name) {
                setVariables(prev => ({ ...prev, contact_name: recipient.name, name: recipient.name }));
            }
        }
    }, [isOpen, recipient]);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const [emailRes, docRes] = await Promise.all([
                emailTemplatesAPI.getAll().catch(() => ({ data: [] })),
                documentTemplatesAPI.getAll().catch(() => ({ data: [] }))
            ]);
            setEmailTemplates(emailRes.data || []);
            setDocumentTemplates(docRes.data || []);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEmailTemplateSelect = async (template) => {
        setSelectedEmailTemplate(template);
        if (template) {
            try {
                // Fetch full template content
                const res = await emailTemplatesAPI.getById(template.id);
                const fullTemplate = res.data;
                setEmailData(prev => ({
                    ...prev,
                    subject: fullTemplate.subject || template.name,
                    content: fullTemplate.html_content || fullTemplate.htmlContent || fullTemplate.content || ''
                }));

                // Extract and set variables
                const extractedVars = extractVariables(fullTemplate.html_content || fullTemplate.htmlContent || fullTemplate.content || '');
                const newVars = {};
                extractedVars.forEach(v => {
                    // Keep existing values or set empty
                    newVars[v] = variables[v] || '';
                });
                // Pre-fill with recipient info
                if (recipient?.name) {
                    newVars.contact_name = recipient.name;
                    newVars.name = recipient.name;
                }
                if (recipient?.company) {
                    newVars.company_name = recipient.company;
                }
                setVariables(newVars);
            } catch (error) {
                toast.error('Failed to load template');
            }
        } else {
            setEmailData(prev => ({ ...prev, subject: '', content: '' }));
            setVariables({});
        }
    };

    const extractVariables = (content) => {
        const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
        return [...new Set(matches.map(m => m.replace(/\{\{|\}\}/g, '').trim()))];
    };

    const handleVariableChange = (key, value) => {
        setVariables(prev => ({ ...prev, [key]: value }));
    };

    const renderContent = (content, vars) => {
        let rendered = content;
        Object.entries(vars).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
            rendered = rendered.replace(regex, value || `[${key}]`);
        });
        return rendered;
    };

    const toggleDocumentSelection = async (doc) => {
        // Toggle selection
        let isSelected = false;
        setSelectedDocuments(prev => {
            const exists = prev.find(d => d.id === doc.id);
            if (exists) {
                return prev.filter(d => d.id !== doc.id);
            } else {
                isSelected = true;
                return [...prev, doc];
            }
        });

        // If selected, we need to ensure we have the variables
        // If the doc object already has 'variables' (array) or 'content', use it
        if (!doc.variables && !doc.content) {
            // Need to fetch full doc details if content/vars mock missing
            try {
                const fullDoc = await documentTemplatesAPI.getById(doc.id);
                doc.content = fullDoc.data.content;
                doc.variables = fullDoc.data.variables || extractVariables(doc.content);
            } catch (e) {
                console.error('Failed to fetch doc details for vars');
            }
        }

        // Extract variables if new selection
        // We do this inside a timeout to ensure state update of selectedDocuments doesn't conflict, 
        // though strictly React batches. But better: just calculate and set.

        // Actually, we can't rely on 'isSelected' variable inside the functional update above 
        // effectively for the async part unless we restructure.

        // Let's restructure properly:
        const prevSelected = selectedDocuments.find(d => d.id === doc.id);

        if (!prevSelected) {
            // It is being selected
            try {
                let content = doc.content;

                // If content is missing, fetch it (since list view might not have it)
                if (!content) {
                    const res = await documentTemplatesAPI.getById(doc.id);
                    content = res.data.content;
                    // Update the local doc object in state so we don't refetch later? 
                    // No, selectedDocuments just stores the ref.
                }

                if (content) {
                    const extracted = extractVariables(content);
                    setVariables(prev => {
                        const next = { ...prev };
                        extracted.forEach(v => {
                            if (next[v] === undefined) {
                                next[v] = '';
                            }
                        });
                        return next;
                    });
                }
            } catch (error) {
                console.error('Error extracting variables from doc:', error);
            }
        }
    };

    const handleSend = async () => {
        if (!emailData.to) {
            toast.error('Recipient email is required');
            return;
        }
        if (!emailData.content.trim()) {
            toast.error('Email content is required');
            return;
        }

        setSending(true);
        try {
            const renderedContent = renderContent(emailData.content, variables);

            // Build attachments array
            const attachments = [];
            const processedDocs = new Set(); // Prevent duplicates

            if (selectedDocuments.length > 0) {
                // Fetch and render each document
                // Note: We need to do this sequentially to handle async properly in loop
                for (const doc of selectedDocuments) {
                    if (processedDocs.has(doc.id)) continue;
                    processedDocs.add(doc.id);

                    try {
                        // Use existing content if available (from selection logic), or fetch
                        let docContent = doc.content;
                        if (!docContent) {
                            const docRes = await documentTemplatesAPI.getById(doc.id);
                            docContent = docRes.data.content;
                        }

                        if (docContent) {
                            const renderedDoc = renderContent(docContent, variables);
                            // Add as HTML attachment
                            // Sanitize filename
                            const filename = (doc.name || 'document').replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.html';

                            attachments.push({
                                filename: filename,
                                content: renderedDoc,
                                contentType: 'text/html'
                            });
                        }
                    } catch (e) {
                        console.error('Failed to prepare document attachment:', doc.id, e);
                        toast.error(`Failed to attach document: ${doc.name}`);
                    }
                }
            }

            // Send the email with attachments
            await emailTemplatesAPI.send({
                to: emailData.to,
                subject: emailData.subject,
                html: renderedContent, // Only email body
                attachments, // Pass attachments array
                entityType,
                entityId
            });

            toast.success('Email sent successfully!');
            onClose();
            if (onEmailSent) onEmailSent();

            // Reset state
            setSelectedEmailTemplate(null);
            setSelectedDocuments([]);
            setEmailData({ to: '', subject: '', content: '' });
            setVariables({});
        } catch (error) {
            toast.error(error.response?.data?.error || 'Failed to send email');
        } finally {
            setSending(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Send Email</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Choose a template and customize your message</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                        <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                            {/* Left Panel: Templates & Documents */}
                            <div className="border-r border-slate-200 dark:border-slate-700 p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
                                {/* Email Templates */}
                                <div>
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">📧 Email Templates</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        <button
                                            onClick={() => handleEmailTemplateSelect(null)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedEmailTemplate
                                                ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-600'
                                                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-brand-300 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300'
                                                }`}
                                        >
                                            ✏️ Compose from scratch
                                        </button>
                                        {emailTemplates.map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => handleEmailTemplateSelect(t)}
                                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedEmailTemplate?.id === t.id
                                                    ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-600'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-brand-300 dark:hover:border-brand-500 text-slate-700 dark:text-slate-300'
                                                    }`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                        {emailTemplates.length === 0 && (
                                            <p className="text-xs text-slate-400 py-2">No email templates available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Document Attachments */}
                                <div>
                                    <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">📎 Attach Documents</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {documentTemplates.map(d => (
                                            <label
                                                key={d.id}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedDocuments.find(sd => sd.id === d.id)
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-600'
                                                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedDocuments.find(sd => sd.id === d.id)}
                                                    onChange={() => toggleDocumentSelection(d)}
                                                    className="w-4 h-4 text-emerald-600 rounded"
                                                />
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{d.name}</span>
                                            </label>
                                        ))}
                                        {documentTemplates.length === 0 && (
                                            <p className="text-xs text-slate-400 py-2">No documents available</p>
                                        )}
                                    </div>
                                    {selectedDocuments.length > 0 && (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
                                            {selectedDocuments.length} document(s) will be attached
                                        </p>
                                    )}
                                </div>

                                {/* Variables */}
                                {Object.keys(variables).length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">🔤 Variables</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {Object.keys(variables).map(key => (
                                                <div key={key}>
                                                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1 capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={variables[key]}
                                                        onChange={(e) => handleVariableChange(key, e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:border-brand-500 outline-none"
                                                        placeholder={key.replace(/_/g, ' ')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Panel: Compose */}
                            <div className="lg:col-span-2 p-6 space-y-4">
                                {/* To */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">To</label>
                                    <input
                                        type="email"
                                        value={emailData.to}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none placeholder:text-slate-400"
                                        placeholder="recipient@example.com"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={emailData.subject}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none placeholder:text-slate-400"
                                        placeholder="Email subject..."
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Content</label>
                                    <textarea
                                        value={emailData.content}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-mono text-sm placeholder:text-slate-400"
                                        rows={8}
                                        placeholder="Write your email content or select a template..."
                                    />
                                </div>

                                {/* Preview */}
                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4">
                                    <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Preview</h4>
                                    <div
                                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-4 max-h-48 overflow-y-auto text-sm text-slate-900 dark:text-white"
                                        dangerouslySetInnerHTML={{
                                            __html: renderContent(emailData.content, variables) || '<p class="text-slate-400">Email preview will appear here...</p>'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !emailData.to || !emailData.content.trim()}
                        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {sending ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send Email
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

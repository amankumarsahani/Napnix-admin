import { useState, useEffect } from 'react';
import { templatesAPI, documentTemplatesAPI } from '../../api';
import toast from 'react-hot-toast';
import { Dialog } from '../ui';

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
            try {
                const [emailRes, docRes] = await Promise.all([
                    templatesAPI.getAll().catch(() => {
                        toast.error('Could not load email templates');
                        return { data: [] };
                    }),
                    documentTemplatesAPI.getAll().catch(() => {
                        toast.error('Could not load document templates');
                        return { data: [] };
                    })
                ]);
                setEmailTemplates(emailRes.data || []);
                setDocumentTemplates(docRes.data || []);
            } catch {
                toast.error('Failed to fetch templates');
            }
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    };

    const handleEmailTemplateSelect = async (template) => {
        setSelectedEmailTemplate(template);
        if (template) {
            try {
                // Fetch full template content
                const res = await templatesAPI.getById(template.id);
                const fullTemplate = res.data;
                setEmailData(prev => ({
                    ...prev,
                    subject: fullTemplate.subject || template.name,
                    content: fullTemplate.html_content || fullTemplate.htmlContent || fullTemplate.content || ''
                }));

                // Extract and set variables
                const extractedVars = extractVariables(fullTemplate.html_content || fullTemplate.htmlContent || fullTemplate.content || '');

                // Handle pre-defined attachments
                if (fullTemplate.attachment_document_ids) {
                    const docIds = fullTemplate.attachment_document_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
                    const docsToSelect = documentTemplates.filter(d => docIds.includes(d.id));
                    setSelectedDocuments(docsToSelect);

                    // Also extract variables from these documents
                    for (const doc of docsToSelect) {
                        try {
                            let docContent = doc.content;
                            if (!docContent) {
                                const docRes = await documentTemplatesAPI.getById(doc.id);
                                docContent = docRes.data.content;
                            }
                            if (docContent) {
                                extractedVars.push(...extractVariables(docContent));
                            }
                        } catch {
                            // silently ignore
                        }
                    }
                } else {
                    setSelectedDocuments([]);
                }

                const uniqueVars = [...new Set(extractedVars)];
                const newVars = {};
                uniqueVars.forEach(v => {
                    // Keep existing values or set empty
                    newVars[v] = variables[v] || '';
                });

                // Pre-fill with recipient info
                if (recipient?.name) {
                    newVars.contact_name = newVars.contact_name || recipient.name;
                    newVars.name = newVars.name || recipient.name;
                }
                if (recipient?.company) {
                    newVars.company_name = newVars.company_name || recipient.company;
                }
                setVariables(newVars);
            } catch {
                toast.error('Failed to load template');
            }
        } else {
            setEmailData(prev => ({ ...prev, subject: '', content: '' }));
            setVariables({});
            setSelectedDocuments([]);
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
        setSelectedDocuments(prev => {
            const exists = prev.find(d => d.id === doc.id);
            if (exists) {
                return prev.filter(d => d.id !== doc.id);
            } else {
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
            } catch {
                // silently ignore
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
            } catch {
                // silently ignore
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
                    } catch {
                        toast.error(`Failed to attach document: ${doc.name}`);
                    }
                }
            }

            // Send the email with attachments
            await templatesAPI.send({
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
        <Dialog open onClose={onClose} dismissible={!sending} title="Send email" description="Choose a template and customise your message" size="xxl">
            <div className="-mx-5 -my-4">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center p-12">
                        <div className="animate-spin w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
                            {/* Left Panel: Templates & Documents */}
                            <div className="border-r border-border p-6 space-y-6 bg-surface-2">
                                {/* Email Templates */}
                                <div>
                                    <h4 className="font-semibold text-fg mb-3">📧 Email Templates</h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        <button
                                            onClick={() => handleEmailTemplateSelect(null)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!selectedEmailTemplate
                                                ? 'bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-400 border border-brand-300 dark:border-brand-600'
                                                : 'bg-surface border border-border hover:border-brand-300 dark:hover:border-brand-500 text-fg'
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
                                                    : 'bg-surface border border-border hover:border-brand-300 dark:hover:border-brand-500 text-fg'
                                                    }`}
                                            >
                                                {t.name}
                                            </button>
                                        ))}
                                        {emailTemplates.length === 0 && (
                                            <p className="text-xs text-fg-subtle py-2">No email templates available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Document Attachments */}
                                <div>
                                    <h4 className="font-semibold text-fg mb-3 flex items-center gap-2">
                                        📎 Attach Documents
                                        <span className="text-[10px] font-normal px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded uppercase tracking-wider">PDF</span>
                                    </h4>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {documentTemplates.map(d => (
                                            <label
                                                key={d.id}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedDocuments.find(sd => sd.id === d.id)
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-600'
                                                    : 'bg-surface border border-border hover:border-emerald-300 dark:hover:border-emerald-500'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={!!selectedDocuments.find(sd => sd.id === d.id)}
                                                    onChange={() => toggleDocumentSelection(d)}
                                                    className="w-4 h-4 text-emerald-600 rounded"
                                                />
                                                <span className="text-sm text-fg">{d.name}</span>
                                            </label>
                                        ))}
                                        {documentTemplates.length === 0 && (
                                            <p className="text-xs text-fg-subtle py-2">No documents available</p>
                                        )}
                                    </div>
                                    {selectedDocuments.length > 0 && (
                                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                                            {selectedDocuments.length} document(s) will be attached as PDF
                                        </p>
                                    )}
                                </div>

                                {/* Variables */}
                                {Object.keys(variables).length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-fg mb-3">🔤 Variables</h4>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {Object.keys(variables).map(key => (
                                                <div key={key}>
                                                    <label className="block text-xs text-fg-muted mb-1 capitalize">
                                                        {key.replace(/_/g, ' ')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={variables[key]}
                                                        onChange={(e) => handleVariableChange(key, e.target.value)}
                                                        className="w-full px-3 py-2 text-sm border border-border bg-surface text-fg rounded-lg focus:border-brand-500 outline-none"
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
                                    <label className="block text-sm font-medium text-fg mb-1">To</label>
                                    <input
                                        type="email"
                                        value={emailData.to}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, to: e.target.value }))}
                                        className="w-full px-4 py-3 border border-border bg-surface text-fg rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none placeholder:text-slate-400"
                                        placeholder="recipient@example.com"
                                    />
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-fg mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={emailData.subject}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                                        className="w-full px-4 py-3 border border-border bg-surface text-fg rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none placeholder:text-slate-400"
                                        placeholder="Email subject..."
                                    />
                                </div>

                                {/* Content */}
                                <div>
                                    <label className="block text-sm font-medium text-fg mb-1">Content</label>
                                    <textarea
                                        value={emailData.content}
                                        onChange={(e) => setEmailData(prev => ({ ...prev, content: e.target.value }))}
                                        className="w-full px-4 py-3 border border-border bg-surface text-fg rounded-md focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none font-mono text-sm placeholder:text-slate-400"
                                        rows={8}
                                        placeholder="Write your email content or select a template..."
                                    />
                                </div>

                                {/* Preview */}
                                <div className="bg-surface-2 rounded-md p-4">
                                    <h4 className="text-sm font-medium text-fg mb-2">Preview</h4>
                                    <div
                                        className="bg-surface border border-border rounded-lg p-4 max-h-48 overflow-y-auto text-sm text-fg"
                                        dangerouslySetInnerHTML={{
                                            __html: renderContent(emailData.content, variables) || '<p class="text-fg-subtle">Email preview will appear here...</p>'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-border flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-border text-fg-muted rounded-md font-medium hover:bg-surface-2"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSend}
                        disabled={sending || !emailData.to || !emailData.content.trim()}
                        className="px-6 py-3 bg-brand-600 text-white rounded-md font-medium hover:bg-brand-700 disabled:opacity-50 flex items-center gap-2"
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
        </Dialog>
    );
}

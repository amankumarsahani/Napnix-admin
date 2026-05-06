import { useState } from 'react';
import { billingAPI } from '../../api';
import toast from 'react-hot-toast';

export default function PaymentLinkModal({ isOpen, onClose, entity, entityType }) {
    const [selectedPlan, setSelectedPlan] = useState('growth');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [generatingLink, setGeneratingLink] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    if (!isOpen) return null;

    const metadataKey = entityType === 'client' ? 'client_id' : 'lead_id';

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Generate Payment Link</h2>
                    <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Plan</label>
                        <select
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                            value={selectedPlan}
                            onChange={(e) => setSelectedPlan(e.target.value)}
                        >
                            <option value="starter">Starter Plan ($0)</option>
                            <option value="growth">Growth Plan ($49/mo)</option>
                            <option value="business">Business Plan ($199/mo)</option>
                        </select>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                        >
                            Yearly (Save 15%)
                        </button>
                    </div>

                    {generatedLink ? (
                        <div className="space-y-2">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Share this link with {entity?.contactName}</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={generatedLink}
                                    className="flex-1 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm"
                                />
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(generatedLink);
                                        toast.success('Link copied to clipboard');
                                    }}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 italic">This link will expire after 24 hours.</p>
                        </div>
                    ) : (
                        <button
                            onClick={async () => {
                                setGeneratingLink(true);
                                try {
                                    const planKey = billingCycle === 'yearly' ? `${selectedPlan}_yearly` : selectedPlan;
                                    const response = await billingAPI.createPaymentLink({
                                        planId: planKey,
                                        successUrl: window.location.origin + '/pricing/success',
                                        cancelUrl: window.location.origin + '/pricing/cancel',
                                        metadata: {
                                            [metadataKey]: entity.id,
                                            entity_type: entityType,
                                            billing_cycle: billingCycle
                                        }
                                    });
                                    if (response.success) {
                                        setGeneratedLink(response.url);
                                        toast.success('Payment link generated!');
                                    }
                                } catch {
                                    toast.error('Failed to generate link');
                                } finally {
                                    setGeneratingLink(false);
                                }
                            }}
                            disabled={generatingLink}
                            className="w-full py-3 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:bg-brand-700 disabled:opacity-50 transition-all"
                        >
                            {generatingLink ? 'Generating...' : 'Generate Magic Link'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

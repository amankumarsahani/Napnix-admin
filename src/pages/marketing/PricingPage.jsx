import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { billingAPI, settingsAPI } from '../../api';
import toast from 'react-hot-toast';

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 'Free',
        monthly: 0,
        description: 'Perfect for individuals and small startups just getting started.',
        features: ['Up to 100 Leads', 'Basic Workflows', 'Email Support', '1 Team Member']
    },
    {
        id: 'growth',
        name: 'Growth',
        price: '$49',
        monthly: 49,
        description: 'Advanced tools for rapidly growing businesses.',
        features: ['Unlimited Leads', 'Advanced Automation', 'Priority Support', '5 Team Members', 'Analytics Dashboard']
    },
    {
        id: 'business',
        name: 'Business',
        price: '$199',
        monthly: 199,
        description: 'Elite solutions for large enterprises with complex needs.',
        features: ['Custom Workflows', 'API Access', '24/7 Dedicated Support', 'Unlimited Team Members', 'White-labeling']
    },
];

export default function PricingPage() {
    const [usePaymentLink, setUsePaymentLink] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [contactEmail, setContactEmail] = useState('sales@nexspire.com');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPricingMode = async () => {
            try {
                const response = await settingsAPI.getSettings();
                if (response.success) {
                    if (response.data.pricing_page_mode) {
                        setUsePaymentLink(response.data.pricing_page_mode === 'payment_link');
                    }
                    if (response.data.contact_sales_email) {
                        setContactEmail(response.data.contact_sales_email);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch pricing mode:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPricingMode();
    }, []);

    const handleBuy = async (planId) => {
        if (!usePaymentLink) {
            window.location.href = `mailto:${contactEmail}?subject=Nexspire%20Subscription%20Inquiry:%20${planId}%20Plan%20(${billingCycle})`;
            return;
        }

        const id = toast.loading('Initiating secure checkout...');
        try {
            const finalPlanId = billingCycle === 'yearly' ? `${planId}_yearly` : planId;
            const response = await billingAPI.createPaymentLink({
                planId: finalPlanId,
                successUrl: window.location.origin + '/dashboard?payment=success',
                cancelUrl: window.location.origin + '/pricing?payment=cancelled',
                metadata: {
                    source: 'pricing_page',
                    billing_cycle: billingCycle
                }
            });

            if (response.success && response.url) {
                window.location.href = response.url;
            } else {
                toast.error('Failed to generate checkout link', { id });
            }
        } catch (err) {
            toast.error('Payment gateway error', { id });
            console.error(err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-base font-semibold text-brand-600 dark:text-brand-400 tracking-wide uppercase">Pricing Plans</h2>
                    <p className="mt-2 text-4xl font-extrabold text-slate-900 dark:text-white sm:text-5xl lg:text-6xl tracking-tight">
                        Scale your business with <span className="text-brand-600">Nexspire</span>
                    </p>
                    <p className="mt-4 max-w-2xl text-xl text-slate-500 dark:text-slate-400 mx-auto">
                        Choose the perfect plan for your business needs. No hidden fees.
                    </p>

                    <div className="mt-8 flex flex-col items-center gap-6">
                        <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-lg' : 'text-slate-500'}`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-400 shadow-lg' : 'text-slate-500'}`}
                            >
                                Yearly
                                <span className="bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-[10px] px-2 py-0.5 rounded-full">Save 15%</span>
                            </button>
                        </div>

                        <div className="flex justify-center items-center gap-4">
                            <span className={`text-sm font-medium ${!usePaymentLink ? 'text-brand-600' : 'text-slate-500 font-normal'}`}>Consultation Mode</span>
                            <button
                                onClick={() => setUsePaymentLink(!usePaymentLink)}
                                className="relative inline-flex items-center cursor-pointer focus:outline-none"
                            >
                                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${usePaymentLink ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${usePaymentLink ? 'translate-x-6' : 'translate-x-0'}`} />
                                </div>
                            </button>
                            <span className={`text-sm font-medium ${usePaymentLink ? 'text-brand-600' : 'text-slate-500 font-normal'}`}>Instant Access</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`relative flex flex-col bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-xl border-2 transition-all hover:scale-[1.02] ${plan.id === 'growth' ? 'border-brand-500 shadow-brand-500/10' : 'border-transparent'
                                }`}
                        >
                            {plan.id === 'growth' && (
                                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1 px-4 py-1 bg-brand-500 text-white text-sm font-bold rounded-full">
                                    MOST POPULAR
                                </div>
                            )}
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{plan.description}</p>
                            </div>
                            <div className="mb-8">
                                <span className="text-5xl font-extrabold text-slate-900 dark:text-white">
                                    {plan.id === 'starter' ? 'Free' : (billingCycle === 'monthly' ? plan.price : `$${Math.round(plan.monthly * 12 * 0.85)}`)}
                                </span>
                                {plan.monthly > 0 && <span className="text-slate-500 dark:text-slate-400 font-medium tracking-wide">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>}
                            </div>
                            <ul className="flex-1 space-y-4 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-center text-slate-600 dark:text-slate-300 text-sm">
                                        <svg className="w-5 h-5 text-brand-500 mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => handleBuy(plan.id)}
                                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-lg ${plan.id === 'growth'
                                    ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-600/30'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                            >
                                {usePaymentLink ? (plan.id === 'starter' ? 'Get Started' : 'Buy Now') : 'Contact Sales'}
                            </button>
                        </div>
                    ))}
                </div>

                <p className="mt-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                    All plans include a 30-day money back guarantee. Prices are in USD.
                </p>
            </div>
        </div>
    );
}


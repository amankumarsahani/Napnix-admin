import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiCopy } from 'react-icons/fi';
import { billingAPI } from '../../api';
import { Button, Dialog, Field, Input, Select, cx } from '../ui';

/**
 * Stripe payment link for a lead or client.
 * entity: { type: 'lead' | 'client', id, name }
 */
export default function PaymentLinkDialog({ open, onClose, entity }) {
    return (
        <Dialog open={open} onClose={onClose} title="Generate payment link" size="sm">
            {/* keyed: a different lead/client starts with a fresh form */}
            {entity && <PaymentLinkForm key={`${entity.type}-${entity.id}`} entity={entity} />}
        </Dialog>
    );
}

function PaymentLinkForm({ entity }) {
    const [plan, setPlan] = useState('growth');
    const [cycle, setCycle] = useState('monthly');
    const [link, setLink] = useState('');

    const generate = useMutation({
        mutationFn: () => billingAPI.createPaymentLink({
            planId: cycle === 'yearly' ? `${plan}_yearly` : plan,
            successUrl: `${window.location.origin}/pricing/success`,
            cancelUrl: `${window.location.origin}/pricing/cancel`,
            metadata: { [`${entity.type}_id`]: entity.id, entity_type: entity.type, billing_cycle: cycle },
        }),
        onSuccess: (res) => {
            if (res?.success) { setLink(res.url); toast.success('Payment link generated'); }
            else toast.error('Failed to generate link');
        },
        onError: () => toast.error('Failed to generate link'),
    });

    return (
            <div className="space-y-4">
                <Field label="Plan">
                    <Select value={plan} onChange={e => { setPlan(e.target.value); setLink(''); }}>
                        <option value="starter">Starter Plan ($0)</option>
                        <option value="growth">Growth Plan ($49/mo)</option>
                        <option value="business">Business Plan ($199/mo)</option>
                    </Select>
                </Field>

                <div role="radiogroup" aria-label="Billing cycle" className="grid grid-cols-2 gap-1 p-1 rounded-sm bg-surface-2 border border-border">
                    {[['monthly', 'Monthly'], ['yearly', 'Yearly (Save 15%)']].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={cycle === value}
                            onClick={() => { setCycle(value); setLink(''); }}
                            className={cx('h-8 rounded-sm text-sm font-medium', cycle === value ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg')}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {link ? (
                    <Field label={`Share this link with ${entity?.name || 'the customer'}`} hint="This link will expire after 24 hours.">
                        <div className="flex gap-2">
                            <Input readOnly value={link} onFocus={e => e.target.select()} className="font-mono text-xs" />
                            <Button
                                variant="primary"
                                onClick={() => { navigator.clipboard.writeText(link); toast.success('Link copied to clipboard'); }}
                            >
                                <FiCopy className="size-4" />Copy
                            </Button>
                        </div>
                    </Field>
                ) : (
                    <Button variant="primary" className="w-full" loading={generate.isPending} onClick={() => generate.mutate()}>
                        Generate link
                    </Button>
                )}
            </div>
    );
}

import { useState } from 'react';
import { Button, Dialog, Field, Input, Select, Textarea } from '../../components/ui';
import { EMPTY_LEAD as EMPTY, LEAD_STATUSES, fromLead } from './leadFields';


/** Create/edit lead. `lead` = existing lead to edit, or { status } to preset a new one. */
export default function LeadFormDialog({ open, onClose, lead, onSubmit, saving }) {
    const editing = !!lead?.id;
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={editing ? 'Edit lead' : 'Add new lead'}
            size="lg"
            footer={
                <>
                    <Button onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button variant="primary" type="submit" form="lead-form" loading={saving}>
                        {editing ? 'Update lead' : 'Create lead'}
                    </Button>
                </>
            }
        >
            {/* keyed: each open starts from this lead's values */}
            {open && <LeadForm key={lead?.id ?? `new-${lead?.status || ''}`} lead={lead} editing={editing} onSubmit={onSubmit} />}
        </Dialog>
    );
}

function LeadForm({ lead, editing, onSubmit }) {
    const [form, setForm] = useState(() => (editing ? fromLead(lead) : { ...EMPTY, ...(lead?.status ? { status: lead.status } : {}) }));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

    return (
            <form id="lead-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Company name" required>
                    <Input value={form.companyName} onChange={set('companyName')} placeholder="e.g. Acme Corp" data-autofocus />
                </Field>
                <Field label="Contact name" required>
                    <Input value={form.contactName} onChange={set('contactName')} placeholder="e.g. John Doe" />
                </Field>
                <Field label="Email">
                    <Input type="email" value={form.email} onChange={set('email')} placeholder="john@example.com" />
                </Field>
                <Field label="Phone">
                    <Input type="tel" value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
                </Field>
                <Field label="Status">
                    <Select value={form.status} onChange={set('status')}>
                        {LEAD_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </Select>
                </Field>
                <Field label="Heat score" hint="0 to 100">
                    <Input type="number" min="0" max="100" value={form.score}
                        onChange={e => setForm(f => ({ ...f, score: Math.min(100, Math.max(0, parseInt(e.target.value, 10) || 0)) }))} />
                </Field>
                <Field label="Estimated value (₹)">
                    <Input type="number" min="0" value={form.estimatedValue} onChange={set('estimatedValue')} placeholder="0" className="font-mono" />
                </Field>
                <Field label="Source">
                    <Input value={form.source} onChange={set('source')} placeholder="e.g. Website" />
                </Field>
                <Field label="Notes" className="sm:col-span-2">
                    <Textarea value={form.notes} onChange={set('notes')} placeholder="Add any relevant details here..." />
                </Field>
            </form>
    );
}

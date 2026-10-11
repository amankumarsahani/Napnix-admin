// Lead form <-> API mapping. The API column for source is leadSource (not source).
export const EMPTY_LEAD = { companyName: '', contactName: '', email: '', phone: '', status: 'new', source: '', estimatedValue: '', notes: '', score: 0 };

export const LEAD_STATUSES = [
    ['new', 'New'], ['contacted', 'Contacted'], ['qualified', 'Qualified'], ['negotiation', 'Negotiation'], ['won', 'Won'], ['lost', 'Lost'],
];

/** Lead fields as the form edits them. The API column for source is leadSource. */
export const fromLead = lead => ({
    companyName: lead.company || lead.companyName || '',
    contactName: lead.contactName || '',
    email: lead.email || '',
    phone: lead.phone || '',
    status: lead.status || 'new',
    source: lead.leadSource || lead.source || '',
    estimatedValue: lead.estimatedValue ?? '',
    notes: lead.notes || '',
    score: lead.score || 0,
});

export const toLeadPayload = form => ({
    contactName: form.contactName,
    company: form.companyName,
    email: form.email,
    phone: form.phone,
    status: form.status,
    leadSource: form.source,
    estimatedValue: form.estimatedValue === '' ? null : parseFloat(form.estimatedValue),
    notes: form.notes,
    score: form.score || 0,
});

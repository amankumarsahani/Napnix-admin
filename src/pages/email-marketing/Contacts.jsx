import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiPlus, FiUpload } from 'react-icons/fi';
import { nmContactsAPI } from '../../api/nexmail';
import Pagination from '../../components/common/Pagination';
import { parseCsvObjects } from '../../utils/parseCsv';
import {
    Badge, Button, DataTable, Dialog, EmptyState, Field, Input, PageHeader, Panel, SearchInput, Tabs, Textarea, cx,
} from '../../components/ui';

const PAGE_SIZE = 25;
const STATUS_TABS = [{ id: 'all', label: 'All' }, { id: 'subscribed', label: 'Subscribed' }, { id: 'unsubscribed', label: 'Unsubscribed' }, { id: 'bounced', label: 'Bounced' }];
const STATUS_TONE = { subscribed: 'success', unsubscribed: 'neutral', bounced: 'danger', complained: 'warning', pending: 'warning' };
const scoreTone = s => (s >= 70 ? 'success' : s >= 40 ? 'warning' : 'danger');
const EMPTY = { email: '', first_name: '', last_name: '', phone: '', company: '' };
const FIELDS = [['email', 'Email', 'email', 'john@example.com', true], ['first_name', 'First name', 'text', 'John'], ['last_name', 'Last name', 'text', 'Doe'], ['phone', 'Phone', 'tel', '+91 98765 43210'], ['company', 'Company', 'text', 'Acme Inc']];
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;

function AddForm({ onSubmit }) {
    const [form, setForm] = useState(EMPTY);
    return (
        <form id="contact-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
            {FIELDS.map(([key, label, type, ph, required], i) => (
                <Field key={key} label={label} required={required}>
                    <Input type={type} required={required} value={form[key]} placeholder={ph} data-autofocus={i === 0 ? true : undefined} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
                </Field>
            ))}
        </form>
    );
}

export default function Contacts() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState('all');
    const [adding, setAdding] = useState(false);
    const [importing, setImporting] = useState(false);
    const [csv, setCsv] = useState('');

    const query = useQuery({
        queryKey: ['nexmail-contacts', { page, search, status }],
        queryFn: () => nmContactsAPI.getAll({ page, limit: PAGE_SIZE, search, status: status === 'all' ? undefined : status }),
        placeholderData: keepPreviousData,
        staleTime: 60 * 1000,
    });
    const contacts = query.data?.data || [];
    const total = query.data?.total || 0;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['nexmail-contacts'] });

    const add = useMutation({
        mutationFn: form => nmContactsAPI.create(form),
        onSuccess: () => { toast.success('Contact added'); setAdding(false); refresh(); },
        onError: err => toast.error(apiErr(err, 'Failed to add contact')),
    });

    // Parsed here so the dialog can show "N contacts found" and reject a file with no email column before sending
    const parsed = csv.trim() ? parseCsvObjects(csv) : null;
    const hasEmail = parsed?.keys.some(k => k === 'email' || k === 'e-mail');
    const rows = parsed && hasEmail ? parsed.records.map(r => ({ ...r, email: r.email || r['e-mail'] })).filter(r => r.email) : [];
    const doImport = useMutation({
        mutationFn: () => nmContactsAPI.import({ contacts: rows }),
        onSuccess: r => { toast.success(`Imported ${r.imported}, skipped ${r.skipped}`); setImporting(false); setCsv(''); refresh(); },
        onError: err => toast.error(apiErr(err, 'Import failed')),
    });

    const actions = (
        <>
            <Button onClick={() => setImporting(true)}><FiUpload className="size-4" />Import</Button>
            <Button variant="primary" onClick={() => setAdding(true)}><FiPlus className="size-4" />Add contact</Button>
        </>
    );

    return (
        <div className="space-y-4">
            <PageHeader title="Contacts" description={query.data ? `${total.toLocaleString('en-IN')} contacts` : undefined} actions={actions} />
            <Tabs label="Contact status" tabs={STATUS_TABS} value={status} onChange={s => { setStatus(s); setPage(1); }} />
            <SearchInput value={search} onChange={t => { setSearch(t); setPage(1); }} placeholder="Search email, name, company" label="Search contacts" className="w-full sm:w-80" />

            <Panel flush>
                <DataTable
                    caption="Contacts"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={contacts}
                    onRowClick={c => navigate(`/email-marketing/contacts/${c.id}`)}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search ? `No contacts match “${search}”` : 'No contacts yet'} description={search ? undefined : 'Import a CSV or add contacts one by one.'} action={!search && <Button variant="primary" size="sm" onClick={() => setImporting(true)}>Import contacts</Button>} />}
                    columns={[
                        { key: 'contact', header: 'Contact', render: c => (<span className="block min-w-0 max-w-xs"><span className="block truncate font-medium">{c.email}</span><span className="block truncate text-xs text-fg-subtle">{[c.first_name, c.last_name].filter(Boolean).join(' ')}{c.company ? ` · ${c.company}` : ''}</span></span>) },
                        { key: 'status', header: 'Status', render: c => <Badge tone={STATUS_TONE[c.status] || 'neutral'} className="capitalize">{c.status}</Badge> },
                        { key: 'score', header: 'Score', render: c => <Badge tone={scoreTone(c.email_score)}>{c.email_score}</Badge> },
                        { key: 'source', header: 'Source', className: 'capitalize text-fg-muted', render: c => c.source?.replace(/_/g, ' ') || '—' },
                        { key: 'emails', header: 'Emails', align: 'right', mono: true, render: c => c.email_count || 0 },
                        { key: 'opens', header: 'Opens', align: 'right', mono: true, render: c => c.open_count || 0 },
                        { key: 'added', header: 'Added', className: 'whitespace-nowrap text-fg-muted', render: c => (c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—') },
                    ]}
                />
                {total > PAGE_SIZE && (
                    <div className="border-t border-border"><Pagination currentPage={page} totalPages={Math.ceil(total / PAGE_SIZE)} totalItems={total} pageSize={PAGE_SIZE} onPageChange={setPage} /></div>
                )}
            </Panel>

            <Dialog
                open={adding}
                onClose={() => setAdding(false)}
                title="Add contact"
                size="sm"
                footer={<><Button onClick={() => setAdding(false)} disabled={add.isPending}>Cancel</Button><Button variant="primary" type="submit" form="contact-form" loading={add.isPending}>Add contact</Button></>}
            >
                {adding && <AddForm onSubmit={form => add.mutate(form)} />}
            </Dialog>

            <Dialog
                open={importing}
                onClose={() => setImporting(false)}
                title="Import contacts"
                description="Paste CSV with a header row. The email column is required."
                footer={
                    <>
                        <Button onClick={() => setImporting(false)} disabled={doImport.isPending}>Cancel</Button>
                        <Button variant="primary" onClick={() => doImport.mutate()} loading={doImport.isPending} disabled={!rows.length}>
                            {rows.length ? `Import ${rows.length} contact${rows.length === 1 ? '' : 's'}` : 'Import'}
                        </Button>
                    </>
                }
            >
                <Field
                    label="CSV data"
                    error={parsed && !hasEmail ? 'No email column found in the header row' : undefined}
                    hint={parsed && hasEmail ? `${rows.length} rows with an email address` : 'Quoted fields and commas inside quotes are supported'}
                >
                    <Textarea rows={10} value={csv} onChange={e => setCsv(e.target.value)} spellCheck={false} data-autofocus className="font-mono text-xs"
                        placeholder={'email,first_name,last_name,company\njohn@example.com,John,Doe,Acme\njane@example.com,Jane,Smith,"Globex, Inc"'} />
                </Field>
            </Dialog>
        </div>
    );
}

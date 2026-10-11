import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Papa from 'papaparse';
import toast from 'react-hot-toast';
import { FiColumns, FiDownload, FiEdit2, FiEye, FiLink, FiList, FiPlus, FiTrash2, FiUpload } from 'react-icons/fi';
import { leadsAPI } from '../../api';
import Pagination from '../../components/common/Pagination';
import PaymentLinkDialog from '../../components/billing/PaymentLinkDialog';
import {
    Avatar, Button, ConfirmDialog, DataTable, EmptyState, IconButton, PageHeader, Panel,
    QueryState, SearchInput, SkeletonRows, StatusBadge, cx,
} from '../../components/ui';
import LeadsKanban from './LeadsKanban';
import LeadFormDialog from './LeadFormDialog';
import { toLeadPayload } from './leadFields';

const PAGE_SIZE = 10;
const BOARD_LIMIT = 500; // board shows the whole pipeline, not one page
const inr = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;

function ScoreBar({ score }) {
    const value = Math.max(0, Math.min(100, Number(score) || 0));
    const tone = value >= 80 ? 'bg-success' : value >= 50 ? 'bg-warning' : 'bg-danger';
    return (
        <span className="inline-flex items-center gap-2">
            <span aria-hidden="true" className="w-20 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <span className={cx('block h-full rounded-full', tone)} style={{ width: `${value}%` }} />
            </span>
            <span className="font-mono tabular-nums text-xs w-6">{value}</span>
        </span>
    );
}

function downloadTemplate() {
    const csv = ['Company,Contact,Email,Phone,Value,Notes,Score', 'Acme Corp,John Doe,john@example.com,555-0123,5000,Potential big client,80'].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'leads_template.csv' });
    a.click();
    URL.revokeObjectURL(url);
}

export default function LeadsList() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [view, setView] = useState('list');
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [formLead, setFormLead] = useState(null); // null = closed; {} = new; lead = edit
    const [deleting, setDeleting] = useState(null);
    const [linkLead, setLinkLead] = useState(null);

    const params = view === 'kanban'
        ? { page: 1, limit: BOARD_LIMIT, ...(search && { search }) }
        : { page, limit: PAGE_SIZE, ...(search && { search }) };

    const leadsQuery = useQuery({
        queryKey: ['leads', params],
        queryFn: () => leadsAPI.getAll(params),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData, // keep rows on screen while the next page/search loads
    });
    const leads = leadsQuery.data?.leads || leadsQuery.data?.data || [];
    const pagination = leadsQuery.data?.pagination;

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['leads'] });

    const save = useMutation({
        mutationFn: ({ id, form }) => (id ? leadsAPI.update(id, toLeadPayload(form)) : leadsAPI.create(toLeadPayload(form))),
        onSuccess: (_, { id }) => { toast.success(id ? 'Lead updated' : 'Lead created'); setFormLead(null); invalidate(); },
        onError: err => toast.error(err.response?.data?.error || 'Could not save the lead'),
    });

    const remove = useMutation({
        mutationFn: id => leadsAPI.delete(id),
        onSuccess: () => { toast.success('Lead deleted'); setDeleting(null); invalidate(); },
        onError: () => toast.error('Failed to delete lead'),
    });

    const importCsv = useMutation({
        mutationFn: rows => leadsAPI.bulkCreate(rows),
        onSuccess: res => { toast.success(res?.message || 'Leads imported'); invalidate(); },
        onError: () => toast.error('Failed to import leads'),
    });

    const handleFile = (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: ({ data }) => {
                const rows = data.map(row => ({
                    company: row.Company || row.company,
                    contactName: row.Contact || row.contactName,
                    email: row.Email || row.email,
                    phone: row.Phone || row.phone,
                    status: 'new',
                    leadSource: 'CSV Import',
                    estimatedValue: parseFloat(row.Value || row.estimatedValue) || 0,
                    notes: row.Notes || row.notes,
                    score: parseInt(row.Score || row.score, 10) || 0,
                })).filter(l => l.contactName);
                if (!rows.length) { toast.error('No valid leads found in CSV'); return; }
                importCsv.mutate(rows);
            },
            error: () => toast.error('Failed to parse CSV file'),
        });
    };

    const onSearch = term => { setSearch(term); setPage(1); };

    return (
        <div className="space-y-4">
            <PageHeader
                title="Leads Pipeline"
                description="Manage and track your sales opportunities."
                actions={
                    <>
                        <div role="radiogroup" aria-label="View" className="flex p-0.5 rounded-sm border border-border bg-surface">
                            {[{ value: 'list', label: 'List view', icon: FiList }, { value: 'kanban', label: 'Board view', icon: FiColumns }].map(opt => {
                                const Icon = opt.icon;
                                return (
                                    <button key={opt.value} type="button" role="radio" aria-checked={view === opt.value} aria-label={opt.label} title={opt.label}
                                        onClick={() => setView(opt.value)}
                                        className={cx('size-8 grid place-items-center rounded-sm', view === opt.value ? 'bg-accent-soft text-accent' : 'text-fg-muted hover:text-fg')}>
                                        <Icon className="size-4" />
                                    </button>
                                );
                            })}
                        </div>
                        <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
                        <Button onClick={downloadTemplate} title="Download CSV template"><FiDownload className="size-4" /><span className="hidden sm:inline">Template</span></Button>
                        <Button onClick={() => fileInputRef.current?.click()} loading={importCsv.isPending}>
                            {!importCsv.isPending && <FiUpload className="size-4" />}<span className="hidden sm:inline">Import CSV</span>
                        </Button>
                        <Button variant="primary" onClick={() => setFormLead({})}><FiPlus className="size-4" /><span className="hidden sm:inline">Add Lead</span></Button>
                    </>
                }
            />

            <SearchInput value={search} onChange={onSearch} placeholder="Search leads" label="Search leads" className="w-full sm:w-72" />

            {view === 'kanban' ? (
                <QueryState query={leadsQuery} isEmpty={() => false} skeleton={<SkeletonRows rows={8} />}>
                    {() => (
                        <LeadsKanban
                            leads={leads}
                            onOpen={lead => navigate(`/leads/${lead.id}`)}
                            onAdd={status => setFormLead({ status })}
                        />
                    )}
                </QueryState>
            ) : (
                <Panel flush>
                    <DataTable
                        caption="Leads"
                        loading={leadsQuery.isLoading}
                        error={leadsQuery.error}
                        onRetry={leadsQuery.refetch}
                        rows={leads}
                        onRowClick={lead => navigate(`/leads/${lead.id}`)}
                        className={cx(leadsQuery.isPlaceholderData && 'opacity-60')}
                        empty={
                            <EmptyState
                                title={search ? `No leads match “${search}”` : 'No leads yet'}
                                description={search ? 'Try a different name, company or email.' : 'Add a lead or import a CSV to start your pipeline.'}
                                action={!search && <Button variant="primary" size="sm" onClick={() => setFormLead({})}><FiPlus className="size-4" />Add Lead</Button>}
                            />
                        }
                        columns={[
                            {
                                key: 'company', header: 'Company / Contact',
                                render: lead => (
                                    <span className="flex items-center gap-2.5">
                                        <Avatar name={lead.company || lead.contactName} />
                                        <span className="min-w-0">
                                            <span className="block font-medium truncate">{lead.company || lead.companyName || '—'}</span>
                                            {lead.contactName !== (lead.company || lead.companyName) && (
                                                <span className="block text-xs text-fg-muted truncate">{lead.contactName}</span>
                                            )}
                                        </span>
                                    </span>
                                ),
                            },
                            { key: 'status', header: 'Status', render: lead => <StatusBadge entity="lead" status={lead.status} /> },
                            {
                                key: 'assigned', header: 'Assigned to',
                                render: lead => (lead.assignedFirstName ? (
                                    <span className="flex items-center gap-2">
                                        <Avatar name={`${lead.assignedFirstName} ${lead.assignedLastName || ''}`} size="sm" />
                                        {lead.assignedFirstName}
                                    </span>
                                ) : <span className="text-fg-subtle">Unassigned</span>),
                            },
                            { key: 'value', header: 'Value', align: 'right', mono: true, render: lead => inr(lead.estimatedValue) },
                            { key: 'score', header: 'Heat score', render: lead => <ScoreBar score={lead.score} /> },
                        ]}
                        actions={lead => (
                            <span className="inline-flex gap-0.5">
                                <IconButton size="sm" label={`View ${lead.contactName}`} onClick={() => navigate(`/leads/${lead.id}`)}><FiEye className="size-4" /></IconButton>
                                <IconButton size="sm" label={`Edit ${lead.contactName}`} onClick={() => setFormLead(lead)}><FiEdit2 className="size-4" /></IconButton>
                                <IconButton size="sm" label="Generate payment link" onClick={() => setLinkLead(lead)}><FiLink className="size-4" /></IconButton>
                                <IconButton size="sm" variant="danger" label={`Delete ${lead.contactName}`} onClick={() => setDeleting(lead)}><FiTrash2 className="size-4" /></IconButton>
                            </span>
                        )}
                    />
                    {pagination && pagination.pages > 1 && (
                        <div className="border-t border-border">
                            <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                        </div>
                    )}
                </Panel>
            )}

            <LeadFormDialog
                open={!!formLead}
                lead={formLead}
                onClose={() => setFormLead(null)}
                saving={save.isPending}
                onSubmit={form => save.mutate({ id: formLead?.id, form })}
            />

            <ConfirmDialog
                open={!!deleting}
                onClose={() => setDeleting(null)}
                onConfirm={() => remove.mutate(deleting.id)}
                loading={remove.isPending}
                title="Delete lead?"
                message={deleting && `This deletes ${deleting.contactName}${deleting.company ? ` (${deleting.company})` : ''}. This can't be undone.`}
                confirmText="Delete lead"
            />

            <PaymentLinkDialog
                open={!!linkLead}
                onClose={() => setLinkLead(null)}
                entity={linkLead && { type: 'lead', id: linkLead.id, name: linkLead.contactName }}
            />
        </div>
    );
}

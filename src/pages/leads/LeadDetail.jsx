import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import apiClient from '../../api/axios';
import { leadsAPI } from '../../api';
import EmailComposer from '../../components/common/EmailComposer';
import ActivityTimeline from '../../components/activity/ActivityTimeline';
import { activityQueryKey } from '../../components/activity/activityKeys';
import { useAuth } from '../../contexts/AuthContext';
import {
    Avatar, Badge, Button, ErrorState, Field, PageHeader, Panel, Select, Skeleton, StatusBadge, cx,
} from '../../components/ui';
import LeadFormDialog from './LeadFormDialog';
import { LEAD_STATUSES, toLeadPayload } from './leadFields';

const inr = n => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const formatDate = value => (value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—');

function Row({ label, children }) {
    return (
        <div className="flex justify-between gap-4 py-1.5 text-sm">
            <dt className="text-fg-muted">{label}</dt>
            <dd className="text-fg text-right">{children}</dd>
        </div>
    );
}

export default function LeadDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const queryClient = useQueryClient();
    const [emailOpen, setEmailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const leadQuery = useQuery({
        queryKey: ['lead', id],
        queryFn: async () => (await apiClient.get(`/leads/${id}`)).data.lead,
        staleTime: 2 * 60 * 1000,
    });
    const usersQuery = useQuery({
        queryKey: ['lead-assignable-users'],
        queryFn: async () => (await leadsAPI.getAssignableUsers()).data || [],
        staleTime: 10 * 60 * 1000,
        enabled: isAdmin,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['lead', id] });
        queryClient.invalidateQueries({ queryKey: ['leads'] });
        queryClient.invalidateQueries({ queryKey: activityQueryKey('lead', id) });
    };

    const update = useMutation({
        mutationFn: payload => apiClient.put(`/leads/${id}`, payload),
        onSuccess: (_, payload) => { toast.success(payload.status && Object.keys(payload).length === 1 ? 'Status updated' : 'Lead updated'); setEditOpen(false); refresh(); },
        onError: err => toast.error(err.response?.data?.error || 'Could not update the lead'),
    });
    const assign = useMutation({
        mutationFn: assignedTo => leadsAPI.assign(id, assignedTo),
        onSuccess: () => { toast.success('Lead reassigned'); refresh(); },
        onError: err => toast.error(err.response?.data?.error || 'Failed to reassign lead'),
    });

    if (leadQuery.isLoading) {
        return (
            <div className="max-w-6xl mx-auto space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid lg:grid-cols-3 gap-4">
                    <Skeleton className="h-72 rounded-md" />
                    <Skeleton className="h-72 rounded-md lg:col-span-2" />
                </div>
            </div>
        );
    }
    if (leadQuery.isError || !leadQuery.data) {
        return <ErrorState error={leadQuery.error || new Error('Lead not found')} onRetry={leadQuery.refetch} />;
    }

    const lead = leadQuery.data;

    return (
        <div className="max-w-6xl mx-auto">
            <PageHeader
                back={{ to: '/leads', label: 'Leads' }}
                title={lead.contactName}
                description={lead.company || 'No company'}
                actions={
                    <>
                        <Button onClick={() => setEditOpen(true)}><FiEdit2 className="size-4" />Edit</Button>
                        <Button variant="primary" onClick={() => setEmailOpen(true)} disabled={!lead.email} title={lead.email ? undefined : 'This lead has no email address'}>
                            <FiMail className="size-4" />Send email
                        </Button>
                    </>
                }
            >
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <StatusBadge entity="lead" status={lead.status} />
                    {lead.estimatedValue != null && <Badge tone="success"><span className="font-mono">{inr(lead.estimatedValue)}</span></Badge>}
                    {lead.score != null && <Badge>Score <span className="font-mono">{lead.score}</span></Badge>}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                    <Panel title="Contact">
                        <ul className="space-y-2 text-sm">
                            {lead.email && <li className="flex items-center gap-2.5"><FiMail aria-hidden="true" className="size-4 text-fg-subtle" /><a href={`mailto:${lead.email}`} className="text-accent hover:underline truncate">{lead.email}</a></li>}
                            {lead.phone && <li className="flex items-center gap-2.5"><FiPhone aria-hidden="true" className="size-4 text-fg-subtle" /><a href={`tel:${lead.phone}`} className="text-accent hover:underline">{lead.phone}</a></li>}
                            {lead.leadSource && <li className="flex items-center gap-2.5"><FiMapPin aria-hidden="true" className="size-4 text-fg-subtle" /><span className="text-fg-muted">{lead.leadSource}</span></li>}
                            {!lead.email && !lead.phone && !lead.leadSource && <li className="text-fg-subtle">No contact details yet.</li>}
                        </ul>
                    </Panel>

                    <Panel title="Status">
                        <div role="radiogroup" aria-label="Lead status" className="grid grid-cols-2 gap-1.5">
                            {LEAD_STATUSES.map(([value, label]) => (
                                <button
                                    key={value}
                                    type="button"
                                    role="radio"
                                    aria-checked={lead.status === value}
                                    disabled={update.isPending}
                                    onClick={() => lead.status !== value && update.mutate({ status: value })}
                                    className={cx(
                                        'h-8 rounded-sm border text-sm font-medium disabled:opacity-60',
                                        lead.status === value ? 'border-accent bg-accent-soft text-accent' : 'border-border text-fg-muted hover:text-fg hover:bg-surface-2'
                                    )}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </Panel>

                    <Panel title="Assigned to">
                        {lead.assignedFirstName ? (
                            <div className="flex items-center gap-3">
                                <Avatar name={`${lead.assignedFirstName} ${lead.assignedLastName || ''}`} />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-fg">{lead.assignedFirstName} {lead.assignedLastName}</p>
                                    <p className="text-xs text-fg-subtle truncate">{lead.assignedEmail}</p>
                                </div>
                            </div>
                        ) : <p className="text-sm text-fg-subtle">No one assigned</p>}

                        {isAdmin && (
                            <Field label="Reassign to" className="mt-4 pt-3 border-t border-border" hint={assign.isPending ? 'Reassigning…' : undefined}>
                                <Select
                                    value=""
                                    disabled={assign.isPending || usersQuery.isLoading}
                                    onChange={e => e.target.value && assign.mutate(e.target.value)}
                                >
                                    <option value="" disabled>{usersQuery.isError ? 'Could not load team' : 'Select a team member…'}</option>
                                    {(usersQuery.data || []).map(u => (
                                        <option key={u.id} value={u.id} disabled={u.id === lead.assignedTo}>
                                            {u.firstName} {u.lastName} ({u.role})
                                        </option>
                                    ))}
                                </Select>
                            </Field>
                        )}
                    </Panel>

                    {lead.notes && (
                        <Panel title="Notes">
                            <p className="text-sm text-fg-muted whitespace-pre-wrap">{lead.notes}</p>
                        </Panel>
                    )}

                    <Panel title="Details">
                        <dl>
                            <Row label="Created">{formatDate(lead.createdAt)}</Row>
                            <Row label="Updated">{formatDate(lead.updatedAt)}</Row>
                        </dl>
                    </Panel>
                </div>

                <div className="lg:col-span-2">
                    <ActivityTimeline entityType="lead" entityId={id} />
                </div>
            </div>

            <EmailComposer
                isOpen={emailOpen}
                onClose={() => setEmailOpen(false)}
                recipient={{ name: lead.contactName, email: lead.email, company: lead.company }}
                entityType="lead"
                entityId={id}
                onEmailSent={() => queryClient.invalidateQueries({ queryKey: activityQueryKey('lead', id) })}
            />

            <LeadFormDialog
                open={editOpen}
                lead={lead}
                onClose={() => setEditOpen(false)}
                saving={update.isPending}
                onSubmit={form => update.mutate(toLeadPayload(form))}
            />
        </div>
    );
}

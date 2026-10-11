import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiArrowRight, FiMail, FiPhone } from 'react-icons/fi';
import apiClient from '../../api/axios';
import EmailComposer from '../../components/common/EmailComposer';
import ActivityTimeline from '../../components/activity/ActivityTimeline';
import { activityQueryKey } from '../../components/activity/activityKeys';
import { Avatar, Button, ConfirmDialog, ErrorState, PageHeader, Panel, Skeleton, StatusBadge, cx } from '../../components/ui';

const STATUSES = [['new', 'New'], ['contacted', 'Contacted'], ['resolved', 'Resolved']];
const formatDate = value => (value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—');

export default function InquiryDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [emailOpen, setEmailOpen] = useState(false);
    const [confirmConvert, setConfirmConvert] = useState(false);

    const query = useQuery({
        queryKey: ['inquiries', 'detail', id],
        queryFn: async () => { const res = await apiClient.get(`/inquiries/${id}`); return res.data.data || res.data; },
        staleTime: 2 * 60 * 1000,
    });

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['inquiries'] }); // list, detail and sidebar count
        queryClient.invalidateQueries({ queryKey: activityQueryKey('inquiry', id) });
    };

    const setStatus = useMutation({
        mutationFn: status => apiClient.patch(`/inquiries/${id}/status`, { status }),
        onSuccess: () => { toast.success('Status updated'); refresh(); },
        onError: () => toast.error('Failed to update status'),
    });
    const convert = useMutation({
        mutationFn: () => apiClient.post(`/inquiries/${id}/convert-to-lead`, {}),
        onSuccess: res => {
            toast.success('Converted to lead');
            refresh();
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            const leadId = res.data?.lead?.id;
            navigate(leadId ? `/leads/${leadId}` : '/leads');
        },
        onError: () => { toast.error('Failed to convert to lead'); setConfirmConvert(false); },
    });

    if (query.isLoading) {
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
    if (query.isError || !query.data) {
        return <ErrorState error={query.error || new Error('Inquiry not found')} onRetry={query.refetch} />;
    }

    const inquiry = query.data;
    const converted = inquiry.status === 'converted';
    const leadId = inquiry.lead_id || inquiry.leadId;

    return (
        <div className="max-w-6xl mx-auto">
            <PageHeader
                back={{ to: '/inquiries', label: 'Inquiries' }}
                title={inquiry.name}
                description={inquiry.company || 'No company'}
                actions={
                    <>
                        <Button onClick={() => setEmailOpen(true)} disabled={!inquiry.email}><FiMail className="size-4" />Send email</Button>
                        {!converted && <Button variant="primary" onClick={() => setConfirmConvert(true)}><FiArrowRight className="size-4" />Convert to lead</Button>}
                        {converted && leadId && <Button variant="primary" onClick={() => navigate(`/leads/${leadId}`)}>View lead</Button>}
                    </>
                }
            >
                <div className="mt-3"><StatusBadge entity="inquiry" status={inquiry.status} /></div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                    {inquiry.message && (
                        <Panel title="Message">
                            <p className="text-sm text-fg whitespace-pre-wrap">{inquiry.message}</p>
                        </Panel>
                    )}

                    <Panel title="Contact">
                        <ul className="space-y-2 text-sm">
                            {inquiry.email && <li className="flex items-center gap-2.5"><FiMail aria-hidden="true" className="size-4 text-fg-subtle" /><a href={`mailto:${inquiry.email}`} className="text-accent hover:underline truncate">{inquiry.email}</a></li>}
                            {inquiry.phone && <li className="flex items-center gap-2.5"><FiPhone aria-hidden="true" className="size-4 text-fg-subtle" /><a href={`tel:${inquiry.phone}`} className="text-accent hover:underline">{inquiry.phone}</a></li>}
                            {!inquiry.email && !inquiry.phone && <li className="text-fg-subtle">No contact details.</li>}
                        </ul>
                    </Panel>

                    <Panel title="Status">
                        {converted ? (
                            <p className="text-sm text-fg-muted">
                                Converted to a lead{leadId && <> · <Link to={`/leads/${leadId}`} className="text-accent hover:underline">open lead</Link></>}.
                            </p>
                        ) : (
                            <div role="radiogroup" aria-label="Inquiry status" className="grid grid-cols-3 gap-1.5">
                                {STATUSES.map(([value, label]) => (
                                    <button
                                        key={value}
                                        type="button"
                                        role="radio"
                                        aria-checked={inquiry.status === value}
                                        disabled={setStatus.isPending}
                                        onClick={() => inquiry.status !== value && setStatus.mutate(value)}
                                        className={cx(
                                            'h-8 rounded-sm border text-sm font-medium disabled:opacity-60',
                                            inquiry.status === value ? 'border-accent bg-accent-soft text-accent' : 'border-border text-fg-muted hover:text-fg hover:bg-surface-2'
                                        )}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </Panel>

                    {inquiry.assignedFirstName && (
                        <Panel title="Assigned to">
                            <div className="flex items-center gap-3">
                                <Avatar name={`${inquiry.assignedFirstName} ${inquiry.assignedLastName || ''}`} />
                                <p className="text-sm font-medium text-fg">{inquiry.assignedFirstName} {inquiry.assignedLastName}</p>
                            </div>
                        </Panel>
                    )}

                    <Panel title="Details">
                        <dl className="flex justify-between gap-4 text-sm">
                            <dt className="text-fg-muted">Received</dt>
                            <dd className="text-fg">{formatDate(inquiry.createdAt)}</dd>
                        </dl>
                    </Panel>
                </div>

                <div className="lg:col-span-2">
                    <ActivityTimeline entityType="inquiry" entityId={id} />
                </div>
            </div>

            <EmailComposer
                isOpen={emailOpen}
                onClose={() => setEmailOpen(false)}
                recipient={{ name: inquiry.name, email: inquiry.email, company: inquiry.company }}
                entityType="inquiry"
                entityId={id}
                onEmailSent={() => queryClient.invalidateQueries({ queryKey: activityQueryKey('inquiry', id) })}
            />

            <ConfirmDialog
                open={confirmConvert}
                onClose={() => setConfirmConvert(false)}
                onConfirm={() => convert.mutate()}
                loading={convert.isPending}
                variant="primary"
                title="Convert to lead?"
                message="This creates a new lead from this inquiry's details and opens it."
                confirmText="Convert"
            />
        </div>
    );
}

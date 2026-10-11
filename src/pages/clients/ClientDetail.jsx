import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import apiClient from '../../api/axios';
import { clientsAPI } from '../../api';
import EmailComposer from '../../components/common/EmailComposer';
import ActivityTimeline from '../../components/activity/ActivityTimeline';
import { activityQueryKey } from '../../components/activity/activityKeys';
import { Badge, Button, ErrorState, PageHeader, Panel, QueryState, Skeleton, SkeletonRows, StatusBadge } from '../../components/ui';
import ClientFormDialog from './ClientFormDialog';

const formatDate = value => (value
    ? new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—');

export default function ClientDetail() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [emailOpen, setEmailOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const clientQuery = useQuery({
        queryKey: ['client', id],
        queryFn: async () => { const res = await apiClient.get(`/clients/${id}`); return res.data.client || res.data; },
        staleTime: 2 * 60 * 1000,
    });
    const projectsQuery = useQuery({
        queryKey: ['projects', { clientId: id }],
        queryFn: async () => (await apiClient.get('/projects', { params: { clientId: id } })).data,
        staleTime: 2 * 60 * 1000,
    });

    const save = useMutation({
        mutationFn: values => clientsAPI.update(id, values),
        onSuccess: () => {
            toast.success('Client updated');
            setEditOpen(false);
            queryClient.invalidateQueries({ queryKey: ['client', id] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
        },
        onError: err => toast.error(err.response?.data?.message || err.response?.data?.error || 'Could not save the client'),
    });

    if (clientQuery.isLoading) {
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
    if (clientQuery.isError || !clientQuery.data) {
        return <ErrorState error={clientQuery.error || new Error('Client not found')} onRetry={clientQuery.refetch} />;
    }

    const client = clientQuery.data;
    const projects = projectsQuery.data?.projects || (Array.isArray(projectsQuery.data) ? projectsQuery.data : []);
    const projectTotal = projectsQuery.data?.pagination?.total ?? projects.length;

    return (
        <div className="max-w-6xl mx-auto">
            <PageHeader
                back={{ to: '/clients', label: 'Clients' }}
                title={client.companyName || client.contactName}
                description={client.companyName ? client.contactName : undefined}
                actions={
                    <>
                        <Button onClick={() => setEditOpen(true)}><FiEdit2 className="size-4" />Edit</Button>
                        <Button variant="primary" onClick={() => setEmailOpen(true)} disabled={!client.email}><FiMail className="size-4" />Send email</Button>
                    </>
                }
            >
                <div className="flex flex-wrap items-center gap-2 mt-3">
                    <StatusBadge entity="client" status={client.status} />
                    {client.industry && <Badge>{client.industry}</Badge>}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="space-y-4">
                    <Panel title="Contact">
                        <ul className="space-y-2 text-sm">
                            {client.email && <li className="flex items-center gap-2.5"><FiMail aria-hidden="true" className="size-4 text-fg-subtle" /><a href={`mailto:${client.email}`} className="text-accent hover:underline truncate">{client.email}</a></li>}
                            {client.phone && <li className="flex items-center gap-2.5"><FiPhone aria-hidden="true" className="size-4 text-fg-subtle" /><a href={`tel:${client.phone}`} className="text-accent hover:underline">{client.phone}</a></li>}
                            {client.address && <li className="flex items-start gap-2.5"><FiMapPin aria-hidden="true" className="size-4 mt-0.5 text-fg-subtle" /><span className="text-fg-muted whitespace-pre-wrap">{client.address}</span></li>}
                            {!client.email && !client.phone && !client.address && <li className="text-fg-subtle">No contact details yet.</li>}
                        </ul>
                    </Panel>

                    <Panel title="Projects" actions={<span className="font-mono tabular-nums text-xs text-fg-subtle">{projectTotal}</span>} flush>
                        <QueryState
                            query={projectsQuery}
                            select={() => projects}
                            skeleton={<SkeletonRows rows={2} />}
                            empty={<p className="px-4 py-3 text-sm text-fg-subtle">No projects yet</p>}
                        >
                            {() => (
                                <ul className="divide-y divide-border">
                                    {projects.slice(0, 5).map(p => (
                                        <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                                            <span className="text-sm font-medium text-fg truncate">{p.name}</span>
                                            <StatusBadge entity="project" status={p.status} />
                                        </li>
                                    ))}
                                    {projectTotal > 5 && <li className="px-4 py-2 text-xs text-fg-subtle">+{projectTotal - 5} more projects</li>}
                                </ul>
                            )}
                        </QueryState>
                    </Panel>

                    <Panel title="Details">
                        <dl className="space-y-1.5 text-sm">
                            <div className="flex justify-between gap-4"><dt className="text-fg-muted">Created</dt><dd className="text-fg">{formatDate(client.createdAt)}</dd></div>
                            <div className="flex justify-between gap-4"><dt className="text-fg-muted">Updated</dt><dd className="text-fg">{formatDate(client.updatedAt)}</dd></div>
                        </dl>
                    </Panel>
                </div>

                <div className="lg:col-span-2">
                    <ActivityTimeline entityType="client" entityId={id} />
                </div>
            </div>

            <EmailComposer
                isOpen={emailOpen}
                onClose={() => setEmailOpen(false)}
                recipient={{ name: client.contactName, email: client.email, company: client.companyName }}
                entityType="client"
                entityId={id}
                onEmailSent={() => queryClient.invalidateQueries({ queryKey: activityQueryKey('client', id) })}
            />

            <ClientFormDialog
                open={editOpen}
                client={client}
                onClose={() => setEditOpen(false)}
                saving={save.isPending}
                onSubmit={values => save.mutate(values)}
            />
        </div>
    );
}

import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiEdit2, FiTrash2, FiUserPlus } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../api/axios';
import Pagination from '../../components/common/Pagination';
import {
    Avatar, Badge, Button, ConfirmDialog, DataTable, Dialog, EmptyState, Field, IconButton, Input, PageHeader, Panel,
    SearchInput, Select, cx,
} from '../../components/ui';

const PAGE_SIZE = 10;
const BASE_DEPARTMENTS = ['Management', 'Sales', 'Marketing', 'Development', 'Support'];
const ROLES = [['admin', 'Admin'], ['manager', 'Manager'], ['sales_operator', 'Sales Operator'], ['user', 'User']];
const ROLE_TONE = { admin: 'info', manager: 'warning' };
const roleLabel = r => ROLES.find(([v]) => v === r)?.[1] || 'No login';
const EMPTY = { name: '', email: '', phone: '', position: '', joinDate: '', role: 'sales_operator', department: '', status: 'active' };

function MemberForm({ member, departments, isSelf, onSubmit }) {
    const editing = !!member?.id;
    const [form, setForm] = useState(() => (editing
        ? { name: member.name || '', phone: member.phone || '', position: member.position || '', role: member.role || 'user', department: member.department || '', status: member.status || 'active' }
        : EMPTY));
    const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));
    return (
        <form id="member-form" onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
                <Input required value={form.name} onChange={set('name')} data-autofocus />
            </Field>
            {editing ? (
                <Field label="Email" hint="Email is the login and can't be changed here">
                    <Input value={member.email || ''} disabled />
                </Field>
            ) : (
                <Field label="Email" required hint="Login details are emailed here">
                    <Input type="email" required value={form.email} onChange={set('email')} />
                </Field>
            )}
            <Field label="Phone">
                <Input type="tel" value={form.phone} onChange={set('phone')} />
            </Field>
            <Field label="Position">
                <Input value={form.position} onChange={set('position')} placeholder="e.g. Senior Developer" />
            </Field>
            <Field label="Role" hint={isSelf ? "You can't change your own role" : undefined}>
                <Select value={form.role} onChange={set('role')} disabled={isSelf}>
                    {ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
            </Field>
            <Field label="Department" hint="Pick one or type a new name">
                <Input list="team-departments" value={form.department} onChange={set('department')} />
                <datalist id="team-departments">{departments.map(d => <option key={d} value={d} />)}</datalist>
            </Field>
            {editing ? (
                <Field label="Status">
                    <Select value={form.status} onChange={set('status')}>
                        <option value="active">Active</option>
                        <option value="on_leave">On leave</option>
                        <option value="inactive">Inactive</option>
                    </Select>
                </Field>
            ) : (
                <Field label="Join date">
                    <Input type="date" value={form.joinDate} onChange={set('joinDate')} />
                </Field>
            )}
        </form>
    );
}

export default function Team() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [formMember, setFormMember] = useState(null);
    const [removing, setRemoving] = useState(null);

    const params = { page, limit: PAGE_SIZE, ...(search && { search }) };
    const query = useQuery({
        queryKey: ['teams', params],
        queryFn: () => apiClient.get('/teams', { params }).then(r => r.data),
        staleTime: 2 * 60 * 1000,
        placeholderData: keepPreviousData,
    });
    const members = query.data?.data || [];
    const pagination = query.data?.pagination;
    const departments = [...new Set([...BASE_DEPARTMENTS, ...members.map(m => m.department).filter(Boolean)])];
    const isSelf = m => !!m?.email && m.email.toLowerCase() === user?.email?.toLowerCase();

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['teams'] });
    const save = useMutation({
        mutationFn: ({ id, form }) => (id ? apiClient.put(`/teams/${id}`, form) : apiClient.post('/teams', form)).then(r => r.data),
        onSuccess: (res, { id, form }) => {
            if (id) toast.success('Member updated');
            else if (res.emailSent) toast.success(`Employee created. Login details emailed to ${form.email}`, { duration: 6000 });
            else toast.success('Team profile created. This email already had a login, so its role was left unchanged.', { duration: 6000 });
            setFormMember(null);
            invalidate();
        },
        onError: err => toast.error(err.response?.data?.message || 'Could not save the member'),
    });
    const remove = useMutation({
        mutationFn: id => apiClient.delete(`/teams/${id}`),
        onSuccess: () => { toast.success('Member removed'); setRemoving(null); invalidate(); },
        onError: err => toast.error(err.response?.data?.message || 'Failed to remove member'),
    });

    const addButton = <Button variant="primary" onClick={() => setFormMember({})}><FiUserPlus className="size-4" />Add employee</Button>;

    return (
        <div className="space-y-4">
            <PageHeader
                title="Team"
                description={pagination ? `${pagination.total} members` : 'Employees, roles and departments'}
                actions={addButton}
            />
            <SearchInput value={search} onChange={t => { setSearch(t); setPage(1); }} placeholder="Search name, email, position" label="Search team" className="w-full sm:w-72" />

            <Panel flush>
                <DataTable
                    caption="Team members"
                    loading={query.isLoading}
                    error={query.error}
                    onRetry={query.refetch}
                    rows={members}
                    onRowClick={m => setFormMember(m)}
                    className={cx(query.isPlaceholderData && 'opacity-60')}
                    empty={<EmptyState title={search ? `No members match “${search}”` : 'No team members yet'} action={!search && addButton} />}
                    columns={[
                        {
                            key: 'member', header: 'Member',
                            render: m => (
                                <span className="flex items-center gap-3 min-w-0">
                                    <Avatar name={m.name} />
                                    <span className="min-w-0">
                                        <span className="block font-medium truncate">{m.name}{isSelf(m) && <span className="ml-1.5 text-xs text-fg-subtle">(you)</span>}</span>
                                        <span className="block text-xs text-fg-subtle truncate">{m.email}</span>
                                    </span>
                                </span>
                            ),
                        },
                        { key: 'position', header: 'Position', className: 'text-fg-muted', render: m => m.position || '—' },
                        { key: 'role', header: 'Role', render: m => <Badge tone={ROLE_TONE[m.role] || 'neutral'}>{roleLabel(m.role)}</Badge> },
                        { key: 'department', header: 'Department', className: 'text-fg-muted', render: m => m.department || '—' },
                        {
                            key: 'status', header: 'Status',
                            render: m => <Badge tone={m.status === 'active' ? 'success' : m.status === 'on_leave' ? 'warning' : 'neutral'}>{String(m.status || 'active').replace('_', ' ')}</Badge>,
                        },
                    ]}
                    actions={m => (
                        <span className="inline-flex gap-0.5">
                            <IconButton size="sm" label={`Edit ${m.name}`} onClick={() => setFormMember(m)}><FiEdit2 className="size-4" /></IconButton>
                            {!isSelf(m) && (
                                <IconButton size="sm" variant="danger" label={`Remove ${m.name}`} onClick={() => setRemoving(m)}><FiTrash2 className="size-4" /></IconButton>
                            )}
                        </span>
                    )}
                />
                {pagination && pagination.pages > 1 && (
                    <div className="border-t border-border">
                        <Pagination currentPage={page} totalPages={pagination.pages} totalItems={pagination.total} pageSize={PAGE_SIZE} onPageChange={setPage} />
                    </div>
                )}
            </Panel>

            <Dialog
                open={!!formMember}
                onClose={() => setFormMember(null)}
                title={formMember?.id ? 'Edit employee' : 'Add employee'}
                description={formMember?.id ? undefined : 'Creates a login and emails the password to the employee.'}
                size="lg"
                footer={
                    <>
                        <Button onClick={() => setFormMember(null)} disabled={save.isPending}>Cancel</Button>
                        <Button variant="primary" type="submit" form="member-form" loading={save.isPending}>{formMember?.id ? 'Save changes' : 'Create employee'}</Button>
                    </>
                }
            >
                {formMember && (
                    <MemberForm
                        key={formMember.id ?? 'new'}
                        member={formMember}
                        departments={departments}
                        isSelf={isSelf(formMember)}
                        onSubmit={form => save.mutate({ id: formMember.id, form })}
                    />
                )}
            </Dialog>

            <ConfirmDialog
                open={!!removing}
                onClose={() => setRemoving(null)}
                onConfirm={() => remove.mutate(removing.id)}
                loading={remove.isPending}
                title="Remove team member?"
                message={removing && `${removing.name} is removed from the team list. Their login account is not deleted.`}
                confirmText="Remove"
            />
        </div>
    );
}

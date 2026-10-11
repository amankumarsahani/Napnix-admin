import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Dialog, Field, Input, Select, Textarea } from '../../components/ui';

const clientSchema = z.object({
    companyName: z.string().min(1, 'Company name is required'),
    contactName: z.string().min(1, 'Contact name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    phone: z.string().optional(),
    address: z.string().optional(),
    industry: z.string().optional(),
    status: z.string().default('active'),
});

const valuesFrom = client => ({
    companyName: client?.companyName || '',
    contactName: client?.contactName || '',
    email: client?.email || '',
    phone: client?.phone || '',
    address: client?.address || '',
    industry: client?.industry || '',
    status: client?.status || 'active',
});

/** Create or edit a client. `client` = existing client, or null/{} for a new one. */
export default function ClientFormDialog({ open, onClose, client, onSubmit, saving }) {
    const editing = !!client?.id;
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={editing ? 'Edit client' : 'Add new client'}
            size="lg"
            footer={
                <>
                    <Button onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button variant="primary" type="submit" form="client-form" loading={saving}>{editing ? 'Update client' : 'Create client'}</Button>
                </>
            }
        >
            {/* keyed: each open starts from this client's values */}
            {open && <ClientForm key={client?.id ?? 'new'} client={client} onSubmit={onSubmit} />}
        </Dialog>
    );
}

function ClientForm({ client, onSubmit }) {
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(clientSchema),
        defaultValues: valuesFrom(client),
    });

    return (
        <form id="client-form" onSubmit={handleSubmit(onSubmit)} noValidate className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Company name" required error={errors.companyName?.message}>
                <Input {...register('companyName')} data-autofocus />
            </Field>
            <Field label="Contact name" required error={errors.contactName?.message}>
                <Input {...register('contactName')} />
            </Field>
            <Field label="Email" required error={errors.email?.message}>
                <Input type="email" {...register('email')} />
            </Field>
            <Field label="Phone">
                <Input type="tel" {...register('phone')} />
            </Field>
            <Field label="Industry">
                <Input {...register('industry')} />
            </Field>
            <Field label="Status">
                <Select {...register('status')}>
                    <option value="active">Active</option>
                    <option value="prospect">Prospect</option>
                    <option value="inactive">Inactive</option>
                </Select>
            </Field>
            <Field label="Address" className="sm:col-span-2">
                <Textarea rows={3} {...register('address')} />
            </Field>
        </form>
    );
}

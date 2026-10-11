import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Button, ErrorState, PageHeader, Skeleton } from '../ui';

/**
 * Page chrome for a content editor (portfolio project, case study): loads the record when editing,
 * saves it, and shows header + Save/Cancel. The `Form` renders <form id="content-form" onSubmit=...>
 * and calls `onSave(payload)`; remounting by `key` means it always starts from the saved record.
 *   config: { noun, listPath, listLabel, api, resultKey, Form, maxWidth? }
 */
export default function EditorPage({ config }) {
    const { noun, listPath, listLabel, api, resultKey, Form } = config;
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const isEdit = !!id;
    const cap = noun[0].toUpperCase() + noun.slice(1);

    const query = useQuery({
        queryKey: [`${noun}-record`, id],
        queryFn: async () => {
            const r = await api.getById(id);
            if (!r.success || !r[resultKey]) throw new Error(`${cap} not found`);
            return r[resultKey];
        },
        enabled: isEdit,
        staleTime: 0,
    });
    const save = useMutation({
        mutationFn: data => (isEdit ? api.update(id, data) : api.create(data)),
        onSuccess: () => {
            toast.success(isEdit ? `${cap} updated` : `${cap} created`);
            queryClient.invalidateQueries({ queryKey: [`content-${noun}`] });
            queryClient.invalidateQueries({ queryKey: [`${noun}-record`, id] });
            navigate(listPath);
        },
        onError: err => toast.error(err.response?.data?.error || `Failed to save ${noun}`),
    });

    if (isEdit && query.isLoading) return <div className="max-w-4xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-96 rounded-md" /></div>;
    if (isEdit && query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;

    return (
        <div className="max-w-4xl">
            <PageHeader
                back={{ to: listPath, label: listLabel }}
                title={isEdit ? `Edit ${noun}` : `Add ${noun}`}
                actions={
                    <>
                        <Button onClick={() => navigate(listPath)} disabled={save.isPending}>Cancel</Button>
                        <Button variant="primary" type="submit" form="content-form" loading={save.isPending}>Save {noun}</Button>
                    </>
                }
            />
            <Form key={id || 'new'} record={query.data} isEdit={isEdit} onSave={save.mutate} />
        </div>
    );
}

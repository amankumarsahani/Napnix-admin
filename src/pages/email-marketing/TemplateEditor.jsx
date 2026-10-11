import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCopy, FiMonitor, FiMove, FiSmartphone, FiTrash2 } from 'react-icons/fi';
import { nmTemplatesAPI } from '../../api/nexmail';
import { Badge, Button, ErrorState, IconButton, Input, Select, Skeleton, Textarea, cx } from '../../components/ui';
import { BLOCK_FIELDS, BLOCK_TYPES, DEFAULT_BLOCKS, createBlock, newBlockId } from './templateBlocks';

// This editor's Save used to show "Template saved (connect to API to persist)" and keep nothing,
// and templates opened by id never loaded. It now loads and saves through the NexMail API.
const apiErr = (err, fallback) => err?.response?.data?.error || fallback;
const CATEGORIES = ['marketing', 'transactional', 'onboarding', 'newsletter'];
const asBlocks = v => {
    let arr = v;
    if (typeof v === 'string') { try { arr = JSON.parse(v); } catch { arr = []; } }
    return Array.isArray(arr) ? arr.map(b => ({ ...b, id: b.id || newBlockId(), settings: b.settings || {} })) : [];
};

function SortableBlock({ block, selected, onSelect, onDelete, onDuplicate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
            className={cx('group relative rounded-sm border-2 cursor-pointer', selected ? 'border-accent' : 'border-transparent hover:border-border-strong')}
            onClick={() => onSelect(block.id)}
        >
            <div className="absolute right-1 top-1 z-10 flex gap-1 rounded-sm bg-surface p-0.5 opacity-0 shadow-pop group-hover:opacity-100 group-focus-within:opacity-100">
                <IconButton size="sm" label="Drag to reorder" {...attributes} {...listeners} className="cursor-grab"><FiMove className="size-4" /></IconButton>
                <IconButton size="sm" label="Duplicate block" onClick={e => { e.stopPropagation(); onDuplicate(block.id); }}><FiCopy className="size-4" /></IconButton>
                <IconButton size="sm" variant="danger" label="Delete block" onClick={e => { e.stopPropagation(); onDelete(block.id); }}><FiTrash2 className="size-4" /></IconButton>
            </div>
            <BlockPreview block={block} />
        </div>
    );
}

// Canvas stand-in for each block: email HTML is light by nature, so these keep their own colours
function BlockPreview({ block }) {
    const s = block.settings;
    switch (block.type) {
        case 'header': return <div style={{ backgroundColor: s.backgroundColor, color: s.textColor, padding: s.padding || '24px', textAlign: s.align || 'center' }}><h2 style={{ margin: 0, fontSize: s.fontSize || '24px' }}>{s.content}</h2></div>;
        case 'text': return <div className="bg-white" style={{ padding: s.padding || '20px', fontSize: s.fontSize, color: s.textColor }} dangerouslySetInnerHTML={{ __html: s.content }} />;
        case 'image': return <div className="bg-white" style={{ padding: s.padding, textAlign: s.align }}>{s.src ? <img src={s.src} alt={s.alt} style={{ maxWidth: '100%', width: s.width }} /> : <div className="grid h-32 place-items-center rounded-sm bg-surface-3 text-sm text-fg-subtle">Enter an image URL</div>}</div>;
        case 'button': return <div className="bg-white" style={{ padding: '20px', textAlign: s.align }}><span style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: s.backgroundColor, color: s.textColor, borderRadius: s.borderRadius, fontWeight: 'bold', fontSize: s.fontSize }}>{s.text}</span></div>;
        case 'divider': return <div className="bg-white" style={{ padding: s.padding }}><hr style={{ border: 'none', borderTop: `${s.thickness} ${s.style} ${s.color}` }} /></div>;
        case 'spacer': return <div className="bg-white" style={{ height: s.height }} />;
        case 'columns2': return <div className="bg-white" style={{ padding: s.padding, display: 'flex', gap: s.gap }}><div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: s.column1 }} /><div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: s.column2 }} /></div>;
        case 'footer': return <div style={{ padding: s.padding, textAlign: 'center', fontSize: '12px', color: s.textColor, backgroundColor: s.backgroundColor }} dangerouslySetInnerHTML={{ __html: s.content + (s.showUnsubscribe ? '<br/><a href="#" style="color:#999;">Unsubscribe</a>' : '') }} />;
        default: return <div className="bg-white p-4 text-center text-sm text-gray-500">{block.type} block</div>;
    }
}

function FieldControl({ def, value, onChange }) {
    const id = `${def.key}-field`;
    const label = <label htmlFor={id} className="mb-1 block text-xs font-medium text-fg-muted">{def.label}</label>;
    if (def.kind === 'check') {
        return (
            <label className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" className="accent-accent" checked={value !== false && !!value} onChange={e => onChange(def.key, e.target.checked)} />{def.label}
            </label>
        );
    }
    if (def.kind === 'color') {
        return (
            <div>{label}
                <div className="flex gap-2">
                    <input type="color" aria-label={`${def.label} picker`} value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'} onChange={e => onChange(def.key, e.target.value)} className="size-9 shrink-0 cursor-pointer rounded-sm border border-border-strong bg-surface" />
                    <Input id={id} value={value || ''} onChange={e => onChange(def.key, e.target.value)} className="font-mono text-xs" />
                </div>
            </div>
        );
    }
    if (def.kind === 'select') {
        return <div>{label}<Select id={id} value={value || ''} onChange={e => onChange(def.key, e.target.value)}>{def.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Select></div>;
    }
    if (def.kind === 'area' || def.kind === 'mono') {
        return <div>{label}<Textarea id={id} rows={def.rows} value={value || ''} onChange={e => onChange(def.key, e.target.value)} className={def.kind === 'mono' ? 'font-mono text-xs' : 'text-sm'} spellCheck={def.kind !== 'mono'} /></div>;
    }
    return <div>{label}<Input id={id} value={value || ''} onChange={e => onChange(def.key, e.target.value)} placeholder={def.placeholder} /></div>;
}

// Field components are hoisted: they used to be declared inside PropertyPanel, so every keystroke created
// new component types, remounted the inputs and dropped focus after one character.
function PropertyPanel({ block, onChange }) {
    if (!block) return <p className="p-4 text-center text-sm text-fg-subtle">Select a block to edit it</p>;
    const defs = BLOCK_FIELDS[block.type] || [];
    return (
        <div className="space-y-3 p-4">
            <h2 className="text-sm font-semibold capitalize text-fg">{block.type} settings</h2>
            {block.type === 'menu' && <p className="text-xs text-fg-subtle">Menu items keep their defaults; edit them with an HTML block for now.</p>}
            {defs.length ? defs.map(def => (
                <FieldControl key={`${block.id}-${def.key}`} def={def} value={block.settings[def.key]} onChange={(key, val) => onChange(block.id, { ...block.settings, [key]: val })} />
            )) : <p className="text-sm text-fg-subtle">No settings for this block.</p>}
        </div>
    );
}

function Builder({ record, isEdit }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [blocks, setBlocks] = useState(() => (record ? asBlocks(record.blocks_json) : DEFAULT_BLOCKS()));
    const [name, setName] = useState(record?.name || 'Untitled template');
    const [subject, setSubject] = useState(record?.subject || '');
    const [category, setCategory] = useState(record?.category || 'marketing');
    const [status, setStatus] = useState(record?.status || 'active');
    const [selectedId, setSelectedId] = useState(null);
    const [preview, setPreview] = useState(null); // { html } | null
    const [mobile, setMobile] = useState(false);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const lastSettingsEdit = useRef({ id: null, at: 0 });
    const stateKey = JSON.stringify([name, subject, category, status, blocks]);
    const [baseline, setBaseline] = useState(stateKey);
    const dirty = stateKey !== baseline;
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        if (!dirty) return undefined;
        const warn = e => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirty]);

    const pushUndo = () => { setUndoStack(p => [...p.slice(-30), JSON.stringify(blocks)]); setRedoStack([]); };
    const undo = () => {
        if (!undoStack.length) return;
        setRedoStack(p => [...p, JSON.stringify(blocks)]);
        setBlocks(JSON.parse(undoStack[undoStack.length - 1]));
        setUndoStack(s => s.slice(0, -1));
    };
    const redo = () => {
        if (!redoStack.length) return;
        setUndoStack(p => [...p, JSON.stringify(blocks)]);
        setBlocks(JSON.parse(redoStack[redoStack.length - 1]));
        setRedoStack(s => s.slice(0, -1));
    };

    const removeBlock = id => { pushUndo(); setBlocks(b => b.filter(x => x.id !== id)); if (selectedId === id) setSelectedId(null); };
    const duplicate = id => {
        const idx = blocks.findIndex(b => b.id === id);
        if (idx === -1) return;
        pushUndo();
        const copy = { ...JSON.parse(JSON.stringify(blocks[idx])), id: newBlockId() };
        setBlocks(p => [...p.slice(0, idx + 1), copy, ...p.slice(idx + 1)]);
    };
    const updateSettings = (id, settings) => {
        // one undo step per burst of typing in the same block, not one per keystroke
        const now = Date.now();
        if (lastSettingsEdit.current.id !== id || now - lastSettingsEdit.current.at > 1000) pushUndo();
        lastSettingsEdit.current = { id, at: now };
        setBlocks(b => b.map(x => (x.id === id ? { ...x, settings } : x)));
    };
    const onDragEnd = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        pushUndo();
        setBlocks(items => arrayMove(items, items.findIndex(i => i.id === active.id), items.findIndex(i => i.id === over.id)));
    };

    // Shortcuts must not fire while typing: Delete used to remove the selected block from inside any text field
    const onKeyDown = e => {
        if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
        const mod = e.ctrlKey || e.metaKey;
        if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
        else if (e.key === 'Delete' && selectedId) { e.preventDefault(); removeBlock(selectedId); }
    };

    const compile = useMutation({
        mutationFn: () => nmTemplatesAPI.compile(blocks).then(r => r.data.html),
        onSuccess: html => setPreview({ html }),
        onError: err => toast.error(apiErr(err, 'Could not build the preview')),
    });
    const save = useMutation({
        mutationFn: async () => {
            if (!name.trim()) throw new Error('Give the template a name');
            const html = await nmTemplatesAPI.compile(blocks).then(r => r.data.html);
            const payload = { name: name.trim(), category, subject, status, blocks_json: blocks, html_content: html };
            return isEdit ? nmTemplatesAPI.update(record.id, payload) : nmTemplatesAPI.create(payload);
        },
        onSuccess: r => {
            toast.success(isEdit ? 'Template saved' : 'Template created');
            setBaseline(stateKey);
            queryClient.invalidateQueries({ queryKey: ['nexmail-templates'] });
            queryClient.invalidateQueries({ queryKey: ['nexmail-template', String(record?.id)] });
            if (!isEdit) navigate(`/email-marketing/templates/${r.templateId}/edit`, { replace: true });
        },
        onError: err => toast.error(err.message === 'Give the template a name' ? err.message : apiErr(err, 'Failed to save template')),
    });

    const selected = blocks.find(b => b.id === selectedId);
    const leave = () => { if (!dirty || window.confirm('Discard unsaved changes?')) navigate('/email-marketing/templates'); };

    return (
        <div className="-m-4 flex h-[calc(100dvh-52px)] flex-col lg:-m-6" onKeyDown={onKeyDown}>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface px-3 py-2">
                <IconButton label="Back to templates" onClick={leave}><FiArrowLeft className="size-4" /></IconButton>
                <input aria-label="Template name" value={name} onChange={e => setName(e.target.value)} className="h-8 w-56 rounded-sm bg-transparent px-1.5 text-base font-semibold text-fg hover:bg-surface-2 focus:bg-surface-2 focus:outline-2 focus:outline-accent" />
                <div className="w-36"><Select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)}>{CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c[0].toUpperCase() + c.slice(1)}</option>)}</Select></div>
                <div className="w-28"><Select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)}><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></Select></div>
                {dirty && <Badge tone="warning">Unsaved</Badge>}
                <div className="ml-auto flex items-center gap-2">
                    <Button size="sm" onClick={undo} disabled={!undoStack.length}>Undo</Button>
                    <Button size="sm" onClick={redo} disabled={!redoStack.length}>Redo</Button>
                    {preview
                        ? <><IconButton label={mobile ? 'Desktop width' : 'Mobile width'} onClick={() => setMobile(m => !m)}>{mobile ? <FiMonitor className="size-4" /> : <FiSmartphone className="size-4" />}</IconButton><Button size="sm" onClick={() => setPreview(null)}>Back to editing</Button></>
                        : <Button size="sm" onClick={() => compile.mutate()} loading={compile.isPending}>Preview</Button>}
                    <Button variant="primary" size="sm" onClick={() => save.mutate()} loading={save.isPending}>Save</Button>
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 border-b border-border bg-surface-2 px-3 py-1.5">
                <label htmlFor="tpl-subject" className="text-xs font-medium text-fg-muted">Subject</label>
                <input id="tpl-subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject line (use {{first_name}} to personalise)" className="h-7 flex-1 bg-transparent px-1 text-sm text-fg placeholder:text-fg-subtle focus:outline-none" />
            </div>

            {preview ? (
                <div className="flex flex-1 justify-center overflow-auto bg-surface-2 p-6">
                    {/* sandboxed: template HTML never runs in the admin origin */}
                    <iframe title="Template preview" sandbox="" srcDoc={preview.html} style={{ width: mobile ? 320 : 640 }} className="h-full min-h-[480px] rounded-sm border border-border bg-white" />
                </div>
            ) : (
                <div className="flex min-h-0 flex-1">
                    <aside aria-label="Blocks" className="hidden w-56 shrink-0 overflow-y-auto border-r border-border bg-surface p-3 md:block">
                        <p className="mb-2 text-xs font-medium text-fg-muted">Add a block</p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {BLOCK_TYPES.map(bt => (
                                <button key={bt.type} type="button" onClick={() => { pushUndo(); setBlocks(p => [...p, createBlock(bt.type)]); }}
                                    className="rounded-sm border border-border px-2 py-2 text-center text-xs font-medium text-fg hover:bg-surface-2">{bt.label}</button>
                            ))}
                        </div>
                        <p className="mb-1 mt-5 text-xs font-medium text-fg-muted">Variables (click to copy)</p>
                        {['first_name', 'last_name', 'email', 'company', 'unsubscribe_url'].map(v => (
                            <button key={v} type="button" onClick={() => { navigator.clipboard.writeText(`{{${v}}}`); toast.success(`Copied {{${v}}}`); }}
                                className="block w-full rounded-sm px-2 py-1 text-left font-mono text-xs text-fg-muted hover:bg-surface-2">{`{{${v}}}`}</button>
                        ))}
                    </aside>

                    <div className="flex-1 overflow-auto bg-surface-2">
                        <div className="mx-auto min-h-full w-[600px] max-w-full py-6">
                            <div className="overflow-hidden rounded-sm border border-border bg-white">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                        {blocks.map(b => <SortableBlock key={b.id} block={b} selected={selectedId === b.id} onSelect={setSelectedId} onDelete={removeBlock} onDuplicate={duplicate} />)}
                                    </SortableContext>
                                </DndContext>
                                {!blocks.length && <p className="py-20 text-center text-sm text-gray-500">Add blocks from the left panel</p>}
                            </div>
                        </div>
                    </div>

                    <aside aria-label="Block settings" className="w-72 shrink-0 overflow-y-auto border-l border-border bg-surface">
                        <PropertyPanel block={selected} onChange={updateSettings} />
                    </aside>
                </div>
            )}
        </div>
    );
}

export default function TemplateEditor() {
    const { id } = useParams();
    const query = useQuery({ queryKey: ['nexmail-template', id], queryFn: () => nmTemplatesAPI.getById(id).then(r => r.data), enabled: !!id, staleTime: 0 });
    if (id && query.isLoading) return <div className="space-y-4"><Skeleton className="h-10 rounded-md" /><Skeleton className="h-96 rounded-md" /></div>;
    if (id && query.isError) return <ErrorState error={query.error} onRetry={query.refetch} />;
    return <Builder key={id || 'new'} record={query.data} isEdit={!!id} />;
}

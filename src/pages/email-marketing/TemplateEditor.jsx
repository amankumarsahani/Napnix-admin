import { useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';
import { FiPlus, FiXCircle, FiLayout, FiSettings, FiChevronDown } from '../../components/icons/FeatherIcons';

const BLOCK_TYPES = [
    { type: 'header', label: 'Header', icon: 'H' },
    { type: 'text', label: 'Text', icon: 'T' },
    { type: 'image', label: 'Image', icon: 'I' },
    { type: 'button', label: 'Button', icon: 'B' },
    { type: 'divider', label: 'Divider', icon: '—' },
    { type: 'spacer', label: 'Spacer', icon: '↕' },
    { type: 'columns2', label: '2 Columns', icon: '▥' },
    { type: 'imageText', label: 'Img+Text', icon: '⊞' },
    { type: 'social', label: 'Social', icon: '@' },
    { type: 'footer', label: 'Footer', icon: '©' },
    { type: 'video', label: 'Video', icon: '▶' },
    { type: 'testimonial', label: 'Testimonial', icon: '"' },
    { type: 'productCard', label: 'Product', icon: '🛍' },
    { type: 'menu', label: 'Nav Menu', icon: '☰' },
    { type: 'code', label: 'HTML', icon: '</>' },
];

const BLOCK_DEFAULTS = {
    header: { content: 'Your Company Name', backgroundColor: '#4f46e5', textColor: '#ffffff', padding: '24px', fontSize: '24px', align: 'center' },
    text: { content: '<p>Write your email content here. You can use <b>bold</b>, <i>italic</i>, and <a href="#">links</a>.</p>', padding: '20px', fontSize: '16px', textColor: '#333333' },
    image: { src: '', alt: 'Image', width: '100%', align: 'center', padding: '10px', link: '' },
    button: { text: 'Click Here', url: '#', backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: '8px', align: 'center', fontSize: '16px' },
    divider: { color: '#e5e7eb', thickness: '1px', style: 'solid', padding: '10px 20px' },
    spacer: { height: '20px' },
    columns2: { split: '50-50', column1: '<p>Left column content</p>', column2: '<p>Right column content</p>', padding: '20px', gap: '20px' },
    imageText: { imageSrc: '', imageAlt: 'Image', imagePosition: 'left', content: '<p>Description goes here</p>', padding: '20px' },
    social: { align: 'center', padding: '20px', facebook: '', twitter: '', instagram: '', linkedin: '' },
    footer: { content: '&copy; 2026 {{company}}. All rights reserved.', textColor: '#999999', backgroundColor: '#f8f9fa', padding: '20px', showUnsubscribe: true },
    video: { videoUrl: '', thumbnailUrl: '', alt: 'Watch Video', padding: '20px' },
    testimonial: { quote: 'Amazing product!', author: 'Jane Doe', title: 'CEO', padding: '20px', backgroundColor: '#f8f9fa' },
    productCard: { productName: 'Product Name', price: '$99', imageUrl: '', description: 'Short description', buttonText: 'Shop Now', buttonUrl: '#', padding: '20px' },
    menu: { items: [{ text: 'Home', url: '#' }, { text: 'Shop', url: '#' }, { text: 'Contact', url: '#' }], align: 'center', padding: '15px', textColor: '#333', separator: '|' },
    code: { content: '<!-- Custom HTML -->' },
};

let blockIdCounter = 0;
function createBlock(type) {
    return { id: `block_${++blockIdCounter}_${Date.now()}`, type, settings: { ...BLOCK_DEFAULTS[type] } };
}

function SortableBlock({ block, isSelected, onSelect, onDelete, onDuplicate }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

    return (
        <div ref={setNodeRef} style={style} {...attributes}
            className={`group relative border-2 rounded-lg transition-all cursor-pointer ${isSelected ? 'border-indigo-500 shadow-md' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'}`}
            onClick={() => onSelect(block.id)}>
            <div {...listeners} className="absolute left-0 top-0 bottom-0 w-6 flex items-center justify-center cursor-grab text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="4" cy="3" r="1.5" fill="currentColor"/><circle cx="10" cy="3" r="1.5" fill="currentColor"/><circle cx="4" cy="7" r="1.5" fill="currentColor"/><circle cx="10" cy="7" r="1.5" fill="currentColor"/><circle cx="4" cy="11" r="1.5" fill="currentColor"/><circle cx="10" cy="11" r="1.5" fill="currentColor"/></svg>
            </div>
            <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={(e) => { e.stopPropagation(); onDuplicate(block.id); }} className="w-6 h-6 rounded bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center hover:bg-indigo-100" title="Duplicate">⧉</button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(block.id); }} className="w-6 h-6 rounded bg-red-100 dark:bg-red-900/30 text-red-500 text-xs flex items-center justify-center hover:bg-red-200" title="Delete">&times;</button>
            </div>
            <BlockPreview block={block} />
        </div>
    );
}

function BlockPreview({ block }) {
    const s = block.settings;
    switch (block.type) {
        case 'header':
            return <div style={{ backgroundColor: s.backgroundColor, color: s.textColor, padding: s.padding || '24px', textAlign: s.align || 'center' }}><h2 style={{ margin: 0, fontSize: s.fontSize || '24px' }}>{s.content}</h2></div>;
        case 'text':
            return <div style={{ padding: s.padding || '20px', fontSize: s.fontSize, color: s.textColor }} dangerouslySetInnerHTML={{ __html: s.content }} />;
        case 'image':
            return <div style={{ padding: s.padding, textAlign: s.align }}>{s.src ? <img src={s.src} alt={s.alt} style={{ maxWidth: '100%', width: s.width }} /> : <div className="h-32 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center text-slate-400">Drop image or enter URL</div>}</div>;
        case 'button':
            return <div style={{ padding: '20px', textAlign: s.align }}><span style={{ display: 'inline-block', padding: '14px 32px', backgroundColor: s.backgroundColor, color: s.textColor, borderRadius: s.borderRadius, fontWeight: 'bold', fontSize: s.fontSize }}>{s.text}</span></div>;
        case 'divider':
            return <div style={{ padding: s.padding }}><hr style={{ border: 'none', borderTop: `${s.thickness} ${s.style} ${s.color}` }} /></div>;
        case 'spacer':
            return <div style={{ height: s.height, background: 'repeating-linear-gradient(45deg, transparent, transparent 5px, #f1f5f9 5px, #f1f5f9 6px)' }} />;
        case 'columns2':
            return <div style={{ padding: s.padding, display: 'flex', gap: s.gap }}><div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: s.column1 }} /><div style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: s.column2 }} /></div>;
        case 'footer':
            return <div style={{ padding: s.padding, textAlign: 'center', fontSize: '12px', color: s.textColor, backgroundColor: s.backgroundColor }} dangerouslySetInnerHTML={{ __html: s.content + (s.showUnsubscribe ? '<br/><a href="#" style="color:#999;">Unsubscribe</a>' : '') }} />;
        case 'social':
            return <div style={{ padding: s.padding, textAlign: s.align }}>{['facebook', 'twitter', 'instagram', 'linkedin'].filter(k => s[k]).map(k => <span key={k} style={{ margin: '0 8px', color: '#666', fontSize: '14px' }}>{k}</span>)}{!Object.values(s).some(v => v && typeof v === 'string' && v.startsWith('http')) && <span className="text-slate-400 text-sm">Configure social links →</span>}</div>;
        default:
            return <div style={{ padding: '16px' }} className="text-slate-400 text-sm text-center">{block.type.toUpperCase()} Block</div>;
    }
}

function PropertyPanel({ block, onChange }) {
    if (!block) return <div className="p-4 text-center text-sm text-slate-400">Select a block to edit its properties</div>;

    const update = (key, val) => onChange(block.id, { ...block.settings, [key]: val });
    const s = block.settings;

    const ColorField = ({ label, k }) => (
        <div><label className="block text-xs font-medium text-slate-500 mb-1">{label}</label><div className="flex gap-2"><input type="color" value={s[k] || '#000000'} onChange={e => update(k, e.target.value)} className="w-8 h-8 rounded border cursor-pointer" /><input type="text" value={s[k] || ''} onChange={e => update(k, e.target.value)} className="flex-1 px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" /></div></div>
    );
    const TextField = ({ label, k, placeholder, multiline }) => (
        <div><label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>{multiline ? <textarea value={s[k] || ''} onChange={e => update(k, e.target.value)} placeholder={placeholder} rows={4} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 resize-y" /> : <input type="text" value={s[k] || ''} onChange={e => update(k, e.target.value)} placeholder={placeholder} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600" />}</div>
    );
    const SelectField = ({ label, k, options }) => (
        <div><label className="block text-xs font-medium text-slate-500 mb-1">{label}</label><select value={s[k] || ''} onChange={e => update(k, e.target.value)} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600">{options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}</select></div>
    );

    const fields = {
        header: () => <><TextField label="Heading Text" k="content" /><ColorField label="Background" k="backgroundColor" /><ColorField label="Text Color" k="textColor" /><TextField label="Logo URL" k="logoUrl" placeholder="https://..." /><SelectField label="Alignment" k="align" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /><TextField label="Font Size" k="fontSize" placeholder="24px" /><TextField label="Padding" k="padding" placeholder="24px" /></>,
        text: () => <><div><label className="block text-xs font-medium text-slate-500 mb-1">Content (HTML)</label><textarea value={s.content || ''} onChange={e => update('content', e.target.value)} rows={8} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono resize-y" /></div><ColorField label="Text Color" k="textColor" /><TextField label="Font Size" k="fontSize" /><TextField label="Padding" k="padding" /></>,
        image: () => <><TextField label="Image URL" k="src" placeholder="https://..." /><TextField label="Alt Text" k="alt" /><TextField label="Width" k="width" placeholder="100%" /><TextField label="Link URL" k="link" placeholder="https://..." /><SelectField label="Alignment" k="align" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /><TextField label="Border Radius" k="borderRadius" placeholder="0" /><TextField label="Padding" k="padding" /></>,
        button: () => <><TextField label="Button Text" k="text" /><TextField label="URL" k="url" placeholder="https://..." /><ColorField label="Background" k="backgroundColor" /><ColorField label="Text Color" k="textColor" /><TextField label="Border Radius" k="borderRadius" /><SelectField label="Alignment" k="align" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /><TextField label="Font Size" k="fontSize" /></>,
        divider: () => <><ColorField label="Color" k="color" /><TextField label="Thickness" k="thickness" /><SelectField label="Style" k="style" options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} /><TextField label="Padding" k="padding" /></>,
        spacer: () => <><TextField label="Height" k="height" placeholder="20px" /></>,
        columns2: () => <><SelectField label="Column Split" k="split" options={[{ value: '50-50', label: '50/50' }, { value: '30-70', label: '30/70' }, { value: '70-30', label: '70/30' }, { value: '40-60', label: '40/60' }, { value: '60-40', label: '60/40' }]} /><div><label className="block text-xs font-medium text-slate-500 mb-1">Column 1 (HTML)</label><textarea value={s.column1 || ''} onChange={e => update('column1', e.target.value)} rows={4} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono resize-y" /></div><div><label className="block text-xs font-medium text-slate-500 mb-1">Column 2 (HTML)</label><textarea value={s.column2 || ''} onChange={e => update('column2', e.target.value)} rows={4} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono resize-y" /></div><TextField label="Padding" k="padding" /><TextField label="Gap" k="gap" /></>,
        imageText: () => <><TextField label="Image URL" k="imageSrc" placeholder="https://..." /><TextField label="Image Alt" k="imageAlt" /><SelectField label="Image Position" k="imagePosition" options={[{ value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /><div><label className="block text-xs font-medium text-slate-500 mb-1">Text Content (HTML)</label><textarea value={s.content || ''} onChange={e => update('content', e.target.value)} rows={4} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono resize-y" /></div><TextField label="Padding" k="padding" /></>,
        social: () => <><SelectField label="Alignment" k="align" options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} /><TextField label="Facebook" k="facebook" placeholder="https://facebook.com/..." /><TextField label="Twitter/X" k="twitter" placeholder="https://x.com/..." /><TextField label="Instagram" k="instagram" placeholder="https://instagram.com/..." /><TextField label="LinkedIn" k="linkedin" placeholder="https://linkedin.com/..." /><TextField label="Padding" k="padding" /></>,
        footer: () => <><div><label className="block text-xs font-medium text-slate-500 mb-1">Footer Content (HTML)</label><textarea value={s.content || ''} onChange={e => update('content', e.target.value)} rows={3} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono resize-y" /></div><ColorField label="Text Color" k="textColor" /><ColorField label="Background" k="backgroundColor" /><div className="flex items-center gap-2"><input type="checkbox" checked={s.showUnsubscribe !== false} onChange={e => update('showUnsubscribe', e.target.checked)} id="unsub" /><label htmlFor="unsub" className="text-xs text-slate-600">Show unsubscribe link</label></div></>,
        video: () => <><TextField label="Video URL" k="videoUrl" placeholder="https://youtube.com/watch?v=..." /><TextField label="Thumbnail URL" k="thumbnailUrl" placeholder="Auto-detected for YouTube" /><TextField label="Alt Text" k="alt" /></>,
        testimonial: () => <><TextField label="Quote" k="quote" multiline /><TextField label="Author" k="author" /><TextField label="Title" k="title" /><TextField label="Avatar URL" k="avatarUrl" placeholder="https://..." /><ColorField label="Background" k="backgroundColor" /></>,
        productCard: () => <><TextField label="Product Name" k="productName" /><TextField label="Price" k="price" /><TextField label="Image URL" k="imageUrl" /><TextField label="Description" k="description" multiline /><TextField label="Button Text" k="buttonText" /><TextField label="Button URL" k="buttonUrl" /></>,
        menu: () => <><SelectField label="Alignment" k="align" options={[{ value: 'center', label: 'Center' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }]} /><ColorField label="Text Color" k="textColor" /><TextField label="Separator" k="separator" /><p className="text-xs text-slate-400 mt-2">Edit menu items in JSON format in the code view</p></>,
        code: () => <><div><label className="block text-xs font-medium text-slate-500 mb-1">Raw HTML</label><textarea value={s.content || ''} onChange={e => update('content', e.target.value)} rows={10} className="w-full px-2 py-1 text-xs border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600 font-mono resize-y" /></div></>,
    };

    return (
        <div className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{block.type} Settings</h3>
            {(fields[block.type] || (() => <p className="text-xs text-slate-400">No settings available</p>))()}
        </div>
    );
}

export default function TemplateEditor() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [blocks, setBlocks] = useState([createBlock('header'), createBlock('text'), createBlock('button'), createBlock('footer')]);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [templateName, setTemplateName] = useState('Untitled Template');
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('marketing');
    const [previewMode, setPreviewMode] = useState(false);
    const [mobilePreview, setMobilePreview] = useState(false);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const pushUndo = useCallback(() => {
        setUndoStack(prev => [...prev.slice(-30), JSON.stringify(blocks)]);
        setRedoStack([]);
    }, [blocks]);

    const undo = useCallback(() => {
        if (undoStack.length === 0) return;
        setRedoStack(prev => [...prev, JSON.stringify(blocks)]);
        const prev = undoStack[undoStack.length - 1];
        setUndoStack(s => s.slice(0, -1));
        setBlocks(JSON.parse(prev));
    }, [undoStack, blocks]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        setUndoStack(prev => [...prev, JSON.stringify(blocks)]);
        const next = redoStack[redoStack.length - 1];
        setRedoStack(s => s.slice(0, -1));
        setBlocks(JSON.parse(next));
    }, [redoStack, blocks]);

    const handleKeyDown = useCallback((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redo(); }
        if (e.key === 'Delete' && selectedBlockId) { e.preventDefault(); pushUndo(); setBlocks(b => b.filter(bl => bl.id !== selectedBlockId)); setSelectedBlockId(null); }
    }, [undo, redo, selectedBlockId, pushUndo]);

    const addBlock = (type) => { pushUndo(); setBlocks(prev => [...prev, createBlock(type)]); };
    const deleteBlock = (id) => { pushUndo(); setBlocks(b => b.filter(bl => bl.id !== id)); if (selectedBlockId === id) setSelectedBlockId(null); };
    const duplicateBlock = (id) => { pushUndo(); const idx = blocks.findIndex(b => b.id === id); if (idx === -1) return; const clone = { ...JSON.parse(JSON.stringify(blocks[idx])), id: `block_${++blockIdCounter}_${Date.now()}` }; setBlocks(prev => [...prev.slice(0, idx + 1), clone, ...prev.slice(idx + 1)]); };
    const updateBlockSettings = (id, settings) => { pushUndo(); setBlocks(b => b.map(bl => bl.id === id ? { ...bl, settings } : bl)); };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        pushUndo();
        setBlocks(items => { const oldIndex = items.findIndex(i => i.id === active.id); const newIndex = items.findIndex(i => i.id === over.id); return arrayMove(items, oldIndex, newIndex); });
    };

    const selectedBlock = blocks.find(b => b.id === selectedBlockId);

    const handleSave = async () => {
        toast.success('Template saved (connect to API to persist)');
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)]" onKeyDown={handleKeyDown} tabIndex={0}>
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/email-marketing/templates')} className="text-slate-400 hover:text-slate-600 text-lg">&larr;</button>
                    <input type="text" value={templateName} onChange={e => setTemplateName(e.target.value)} className="text-lg font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white w-64" />
                    <select value={category} onChange={e => setCategory(e.target.value)} className="text-xs px-2 py-1 border rounded bg-slate-50 dark:bg-slate-700 dark:border-slate-600">
                        <option value="marketing">Marketing</option><option value="transactional">Transactional</option><option value="onboarding">Onboarding</option><option value="newsletter">Newsletter</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Ctrl+Z / Ctrl+Y</span>
                    <button onClick={undo} disabled={undoStack.length === 0} className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700">Undo</button>
                    <button onClick={redo} disabled={redoStack.length === 0} className="px-2 py-1 text-xs border rounded disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700">Redo</button>
                    <button onClick={() => setPreviewMode(!previewMode)} className={`px-3 py-1.5 text-xs rounded font-medium ${previewMode ? 'bg-indigo-100 text-indigo-700' : 'border hover:bg-slate-100 dark:hover:bg-slate-700'}`}>{previewMode ? 'Edit' : 'Preview'}</button>
                    {previewMode && <button onClick={() => setMobilePreview(!mobilePreview)} className={`px-3 py-1.5 text-xs rounded font-medium border ${mobilePreview ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100'}`}>{mobilePreview ? '320px' : '600px'}</button>}
                    <button onClick={handleSave} className="btn btn-primary text-sm">Save</button>
                </div>
            </div>

            <div className="flex items-center px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <label className="text-xs font-medium text-slate-500 mr-2">Subject:</label>
                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Email subject line... (use {{first_name}} for personalization)" className="flex-1 px-2 py-1 text-sm bg-transparent border-none outline-none text-slate-900 dark:text-white" />
            </div>

            {previewMode ? (
                <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex justify-center p-6">
                    <div style={{ width: mobilePreview ? 320 : 600 }} className="bg-white rounded-lg shadow-xl overflow-hidden transition-all">
                        <PreviewFrame blocks={blocks} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-56 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto flex-shrink-0 p-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Add Blocks</p>
                        <div className="grid grid-cols-2 gap-2">
                            {BLOCK_TYPES.map(bt => (
                                <button key={bt.type} onClick={() => addBlock(bt.type)} className="flex flex-col items-center gap-1 p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors text-center">
                                    <span className="text-lg">{bt.icon}</span>
                                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400">{bt.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Variables</p>
                            {['first_name', 'last_name', 'email', 'company', 'unsubscribe_url'].map(v => (
                                <button key={v} onClick={() => { navigator.clipboard.writeText(`{{${v}}}`); toast.success(`Copied {{${v}}}`); }}
                                    className="block w-full text-left px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                                    {'{{' + v + '}}'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 flex justify-center">
                        <div className="w-[600px] min-h-full py-6">
                            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                                        {blocks.map(block => (
                                            <SortableBlock key={block.id} block={block} isSelected={selectedBlockId === block.id} onSelect={setSelectedBlockId} onDelete={deleteBlock} onDuplicate={duplicateBlock} />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                {blocks.length === 0 && (
                                    <div className="py-20 text-center text-slate-400"><FiPlus className="w-8 h-8 mx-auto mb-2" /><p className="text-sm">Add blocks from the left panel</p></div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-y-auto flex-shrink-0">
                        <PropertyPanel block={selectedBlock} onChange={updateBlockSettings} />
                    </div>
                </div>
            )}
        </div>
    );
}

function PreviewFrame({ blocks }) {
    const compileSimple = (blocks) => {
        let html = '';
        for (const b of blocks) {
            const s = b.settings;
            switch (b.type) {
                case 'header': html += `<div style="background:${s.backgroundColor};color:${s.textColor};padding:${s.padding};text-align:${s.align}"><h1 style="margin:0;font-size:${s.fontSize}">${s.content}</h1></div>`; break;
                case 'text': html += `<div style="padding:${s.padding};font-size:${s.fontSize};color:${s.textColor}">${s.content}</div>`; break;
                case 'image': html += `<div style="padding:${s.padding};text-align:${s.align}">${s.src ? `<img src="${s.src}" alt="${s.alt}" style="max-width:100%;width:${s.width}" />` : ''}</div>`; break;
                case 'button': html += `<div style="padding:20px;text-align:${s.align}"><a href="#" style="display:inline-block;padding:14px 32px;background:${s.backgroundColor};color:${s.textColor};text-decoration:none;border-radius:${s.borderRadius};font-weight:bold;font-size:${s.fontSize}">${s.text}</a></div>`; break;
                case 'divider': html += `<div style="padding:${s.padding}"><hr style="border:none;border-top:${s.thickness} ${s.style} ${s.color}" /></div>`; break;
                case 'spacer': html += `<div style="height:${s.height}"></div>`; break;
                case 'footer': html += `<div style="padding:${s.padding};text-align:center;font-size:12px;color:${s.textColor};background:${s.backgroundColor}">${s.content}${s.showUnsubscribe !== false ? '<br/><a href="#" style="color:#999">Unsubscribe</a>' : ''}</div>`; break;
                default: html += `<div style="padding:20px">${s.content || ''}</div>`;
            }
        }
        return html;
    };
    return <div dangerouslySetInnerHTML={{ __html: compileSimple(blocks) }} />;
}

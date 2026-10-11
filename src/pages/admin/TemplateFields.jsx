import { Field, Input, Select, Textarea, cx } from '../../components/ui';

const CATEGORIES = [['sales', 'Sales'], ['legal', 'Legal'], ['finance', 'Finance'], ['operations', 'Operations']];

/**
 * Rendered document HTML in a sandboxed iframe: template CSS can't leak into the admin
 * and scripts in a template never run. Paper is white in both themes (it's the document).
 */
export function DocumentPreview({ html, className, title = 'Document preview' }) {
    return (
        <iframe
            title={title}
            sandbox=""
            srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:16px;font-family:system-ui,sans-serif;color:#111">${html || '<p style="color:#888">Start typing to see preview…</p>'}</body>`}
            className={cx('w-full rounded-sm border border-border bg-white', className)}
        />
    );
}

/** Name / category / description / HTML content, shared by the create dialog and the edit page. */
export default function TemplateFields({ value, onChange, contentRows = 14 }) {
    const set = key => e => onChange({ ...value, [key]: e.target.value });
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Template name" required>
                <Input value={value.name} onChange={set('name')} placeholder="e.g., Welcome Email" data-autofocus />
            </Field>
            <Field label="Category">
                <Select value={value.category} onChange={set('category')}>
                    {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
            </Field>
            <Field label="Description" className="sm:col-span-2">
                <Input value={value.description} onChange={set('description')} placeholder="Brief description of this template" />
            </Field>
            <Field label="Content (HTML)" required hint="Use {{variable_name}} for dynamic fields." className="sm:col-span-2">
                <Textarea rows={contentRows} value={value.content} onChange={set('content')} className="font-mono text-sm"
                    placeholder={'<div style="font-family: Arial, sans-serif; padding: 20px;">\n  <h1>Hello {{contact_name}}</h1>\n  <p>Your content here...</p>\n</div>'} />
            </Field>
        </div>
    );
}

import { useEffect, useId, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { cx } from './cx';
import { Button, IconButton } from './Button';

const SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Mark the element to focus first with `data-autofocus` (React's autoFocus fires before showModal).
 * Modal dialog on the native <dialog> element: the browser makes the page behind it inert
 * (focus trap) and handles Esc. We add scroll lock, initial focus, focus restore and
 * backdrop-click-to-close.
 */
export function Dialog({ open, onClose, title, description, size = 'md', footer, children, dismissible = true, side, className }) {
    const ref = useRef(null);
    const returnFocus = useRef(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return undefined;
        if (open && !dialog.open) {
            returnFocus.current = document.activeElement;
            dialog.showModal();
            const target = dialog.querySelector('[data-autofocus]') || dialog.querySelector(`[data-dialog-body] ${FOCUSABLE}`) || dialog.querySelector(FOCUSABLE);
            target?.focus();
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => { document.body.style.overflow = prevOverflow; };
        }
        if (!open && dialog.open) {
            dialog.close();
            returnFocus.current?.focus?.();
        }
        return undefined;
    }, [open]);

    // Restore focus if the dialog unmounts while open
    useEffect(() => () => { if (ref.current?.open) returnFocus.current?.focus?.(); }, []);

    return (
        <dialog
            ref={ref}
            aria-labelledby={title ? titleId : undefined}
            onCancel={e => { e.preventDefault(); if (dismissible) onClose?.(); }}
            onClick={e => { if (dismissible && e.target === ref.current) onClose?.(); }}
            className={cx(
                'border border-border bg-surface text-fg p-0 shadow-modal backdrop:bg-black/40 open:flex flex-col',
                side === 'right'
                    ? 'w-full h-dvh max-h-dvh m-0 ml-auto rounded-none border-y-0 border-r-0'
                    : 'w-[calc(100%-2rem)] max-h-[85dvh] m-auto rounded-md',
                SIZES[size], className
            )}
        >
            {open && (
                <>
                    {(title || dismissible) && (
                        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-border">
                            <div className="min-w-0">
                                {title && <h2 id={titleId} className="text-base font-semibold text-fg">{title}</h2>}
                                {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
                            </div>
                            {dismissible && (
                                <IconButton label="Close" size="sm" onClick={onClose} className="-mr-2 -mt-1">
                                    <FiX className="size-4" />
                                </IconButton>
                            )}
                        </div>
                    )}
                    <div data-dialog-body className={cx('overflow-y-auto', side === 'right' ? 'flex-1 flex flex-col min-h-0' : 'px-5 py-4')}>{children}</div>
                    {footer && <div className={cx('flex justify-end gap-2 px-5 py-3 border-t border-border bg-surface-2', side !== 'right' && 'rounded-b-md')}>{footer}</div>}
                </>
            )}
        </dialog>
    );
}

/** Side panel on the same modal primitive (Esc, focus, scroll lock). Body is a flex column the caller fills. */
export function Drawer(props) {
    return <Dialog size="lg" {...props} side="right" />;
}

/** Confirm/cancel dialog. variant: danger | primary. */
export function ConfirmDialog({
    open, onClose, onConfirm, title = 'Are you sure?', message,
    confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', loading = false,
}) {
    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            title={title}
            size="sm"
            dismissible={!loading}
            footer={
                <>
                    <Button onClick={onClose} disabled={loading}>{cancelText}</Button>
                    <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
                        {confirmText}
                    </Button>
                </>
            }
        >
            {message && <p className="text-sm text-fg-muted">{message}</p>}
        </Dialog>
    );
}

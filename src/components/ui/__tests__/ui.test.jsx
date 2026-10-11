import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { useState } from 'react';
import { Dialog, ConfirmDialog, Field, Input, QueryState, SearchInput, Tabs } from '..';

afterEach(() => vi.useRealTimers());

describe('Dialog', () => {
    function Harness({ onClose = () => {} }) {
        const [open, setOpen] = useState(false);
        return (
            <>
                <button onClick={() => setOpen(true)}>open</button>
                <Dialog open={open} onClose={() => { onClose(); setOpen(false); }} title="Edit client">
                    <input aria-label="name" />
                </Dialog>
            </>
        );
    }

    it('moves focus into the body, closes on Esc (cancel) and restores focus to the trigger', () => {
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        const trigger = screen.getByText('open');
        trigger.focus();
        fireEvent.click(trigger);

        expect(screen.getByRole('dialog', { hidden: true })).toHaveAttribute('aria-labelledby');
        expect(screen.getByText('Edit client')).toBeInTheDocument();
        expect(document.activeElement).toBe(screen.getByLabelText('name'));

        fireEvent(screen.getByRole('dialog', { hidden: true }), new Event('cancel', { cancelable: true }));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(document.activeElement).toBe(trigger);
    });

    it('closes on backdrop click but not on content click', () => {
        const onClose = vi.fn();
        render(<Dialog open onClose={onClose} title="T"><p>body</p></Dialog>);
        fireEvent.click(screen.getByText('body'));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('dialog', { hidden: true }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ConfirmDialog focuses the confirm button and blocks dismiss while loading', () => {
        const onClose = vi.fn();
        const { rerender } = render(<ConfirmDialog open onClose={onClose} onConfirm={() => {}} confirmText="Delete" />);
        expect(document.activeElement).toHaveTextContent('Delete');
        rerender(<ConfirmDialog open loading onClose={onClose} onConfirm={() => {}} confirmText="Delete" />);
        fireEvent(screen.getByRole('dialog', { hidden: true }), new Event('cancel', { cancelable: true }));
        expect(onClose).not.toHaveBeenCalled();
    });
});

describe('Field', () => {
    it('wires label, hint and error to the control', () => {
        const { rerender } = render(<Field label="Email" hint="We never share it"><Input /></Field>);
        const input = screen.getByLabelText('Email');
        expect(input).toHaveAccessibleDescription('We never share it');
        expect(input).not.toHaveAttribute('aria-invalid');

        rerender(<Field label="Email" hint="We never share it" error="Enter a valid email"><Input /></Field>);
        expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
        expect(screen.getByLabelText('Email')).toHaveAccessibleDescription('Enter a valid email');
    });
});

describe('QueryState', () => {
    const view = query => render(
        <QueryState query={query} skeleton={<p>loading</p>} empty={<p>empty</p>}>{d => <p>{d.length} rows</p>}</QueryState>
    );

    it('shows the skeleton while loading', () => {
        view({ isLoading: true });
        expect(screen.getByText('loading')).toBeInTheDocument();
    });

    it('shows error with a working Retry', () => {
        const refetch = vi.fn();
        view({ isError: true, error: new Error('boom'), refetch });
        expect(screen.getByRole('alert')).toHaveTextContent('boom');
        fireEvent.click(screen.getByText('Retry'));
        expect(refetch).toHaveBeenCalled();
    });

    it('shows empty, then data', () => {
        view({ data: [] }).unmount();
        expect(screen.queryByText('empty')).toBeNull();
        view({ data: [] });
        expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('passes data to children', () => {
        view({ data: [1, 2] });
        expect(screen.getByText('2 rows')).toBeInTheDocument();
    });
});

describe('SearchInput', () => {
    it('debounces onChange and does not fire on mount', () => {
        vi.useFakeTimers();
        const onChange = vi.fn();
        render(<SearchInput onChange={onChange} delay={250} />);
        act(() => { vi.advanceTimersByTime(500); });
        expect(onChange).not.toHaveBeenCalled();

        const box = screen.getByRole('searchbox');
        fireEvent.change(box, { target: { value: 'a' } });
        fireEvent.change(box, { target: { value: 'as' } });
        act(() => { vi.advanceTimersByTime(200); });
        expect(onChange).not.toHaveBeenCalled();
        act(() => { vi.advanceTimersByTime(60); });
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(onChange).toHaveBeenCalledWith('as');
    });
});

describe('Tabs', () => {
    it('uses roving tabindex and arrow keys', () => {
        function T() {
            const [v, setV] = useState('a');
            return <Tabs value={v} onChange={setV} tabs={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} />;
        }
        render(<T />);
        const [a, b] = screen.getAllByRole('tab');
        expect(a).toHaveAttribute('tabindex', '0');
        expect(b).toHaveAttribute('tabindex', '-1');
        fireEvent.keyDown(a, { key: 'ArrowRight' });
        expect(screen.getAllByRole('tab')[1]).toHaveAttribute('aria-selected', 'true');
        expect(document.activeElement).toBe(screen.getAllByRole('tab')[1]);
    });
});

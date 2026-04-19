import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from '../../components/ErrorBoundary';

function ThrowError() {
  throw new Error('test');
}

function GoodChild() {
  return <div data-testid="child">Working</div>;
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>
    );
    expect(screen.getByTestId('child')).toHaveTextContent('Working');
  });

  it('renders error UI when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.queryByTestId('child')).not.toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('shows "Something went wrong" heading', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const heading = screen.getByText('Something went wrong');
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe('H1');

    consoleSpy.mockRestore();
  });

  it('shows "Refresh Page" button', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const button = screen.getByText('Refresh Page');
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe('BUTTON');

    consoleSpy.mockRestore();
  });
});

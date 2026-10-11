export default function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange }) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Always show max 7 slots: [1] [...] [x-1] [x] [x+1] [...] [last]
    const getPageNumbers = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages = new Set();
        pages.add(1);
        pages.add(totalPages);

        // Window around current page
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
            if (i > 1 && i < totalPages) pages.add(i);
        }

        // Convert to sorted array and insert ellipsis
        const sorted = [...pages].sort((a, b) => a - b);
        const result = [];

        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
                result.push('...');
            }
            result.push(sorted[i]);
        }

        return result;
    };

    return (
        <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-sm text-fg-muted">
                Showing <span className="font-medium text-fg">{startItem}</span> to{' '}
                <span className="font-medium text-fg">{endItem}</span> of{' '}
                <span className="font-medium text-fg">{totalItems}</span> results
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-fg-muted hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Previous
                </button>

                {getPageNumbers().map((page, idx) =>
                    page === '...' ? (
                        <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-fg-subtle">
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                page === currentPage
                                    ? 'bg-brand-600 text-white shadow-sm'
                                    : 'text-fg-muted hover:bg-surface-2'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-lg border border-border text-fg-muted hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

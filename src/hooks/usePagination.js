import { useState, useCallback } from 'react';

/**
 * Server-side pagination hook.
 * Manages page state. Component calls its own fetch with page/limit params,
 * then feeds the API pagination response back via setPagination().
 */
export default function usePagination(defaultPageSize = 10) {
    const [currentPage, setCurrentPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(defaultPageSize);

    const setPagination = useCallback((pagination) => {
        if (!pagination) return;
        const total = pagination.total || 0;
        const limit = pagination.limit || defaultPageSize;
        setTotalItems(total);
        setTotalPages(pagination.pages || Math.max(1, Math.ceil(total / limit)));
        if (pagination.page) setCurrentPage(pagination.page);
    }, [defaultPageSize]);

    const goToPage = useCallback((page) => {
        setCurrentPage(Math.max(1, page));
    }, []);

    const resetPage = useCallback(() => {
        setCurrentPage(1);
    }, []);

    return {
        currentPage,
        totalPages,
        totalItems,
        pageSize,
        goToPage,
        resetPage,
        setPagination,
    };
}

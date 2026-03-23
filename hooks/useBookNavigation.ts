import { useState, useCallback } from 'react';

export function useBookNavigation(totalPages: number) {
  const [currentPage, setCurrentPage] = useState(0);

  const goToPage = useCallback((page: number) => {
    const validPage = Math.max(0, Math.min(page, totalPages - 1));
    setCurrentPage(validPage);
  }, [totalPages]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  return {
    currentPage,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    isFirstPage: currentPage === 0,
    isLastPage: currentPage === totalPages - 1,
  };
}

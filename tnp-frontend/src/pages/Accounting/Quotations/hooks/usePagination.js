import { useMemo } from 'react';

export default function usePagination(items, currentPage, perPage) {
  const total = items.length;
  const pageData = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return items.slice(start, start + perPage);
  }, [items, currentPage, perPage]);

  const info = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    const to = Math.min(start + perPage, total);
    return {
      current_page: currentPage,
      last_page: Math.max(1, Math.ceil(total / perPage)),
      per_page: perPage,
      total,
      from: total === 0 ? 0 : start + 1,
      to,
    };
  }, [currentPage, perPage, total]);

  return { pageData, info, total };
}

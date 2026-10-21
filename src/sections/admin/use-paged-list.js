import { useMemo, useState, useCallback } from 'react';

import { useReport } from './use-report';

// ----------------------------------------------------------------------

/**
 * Filters + pagination around a list endpoint (`fetcher({ ...filters, skip, limit })` -> `{ total, data, ... }`).
 * Changing any filter returns to the first page. `result` is the whole response, for the extras lists carry
 * (status counts, summaries).
 */
export function usePagedList(fetcher, { initialFilters = {}, initialRowsPerPage = 10 } = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPageState] = useState(initialRowsPerPage);

  const params = useMemo(
    () => ({ ...filters, skip: page * rowsPerPage, limit: rowsPerPage }),
    [filters, page, rowsPerPage]
  );

  const report = useReport(() => fetcher(params), params);

  const setFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(0);
  }, []);

  const patchFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  }, []);

  const setRowsPerPage = useCallback((value) => {
    setRowsPerPageState(value);
    setPage(0);
  }, []);

  return {
    ...report,
    result: report.data,
    rows: report.data?.data ?? [],
    total: report.data?.total ?? 0,
    filters,
    setFilter,
    patchFilters,
    page,
    setPage,
    rowsPerPage,
    setRowsPerPage,
  };
}

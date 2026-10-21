import { useRef, useState, useEffect, useCallback } from 'react';

import { getErrorMessage } from 'src/auth/services/adminOwnerService';

// ----------------------------------------------------------------------

/**
 * Loads one report. `key` (any JSON-able value: the filters it depends on) re-runs the fetch when it changes.
 * The previous data stays in `data` while the next load is in flight, so a screen keeps its frame and only dims;
 * a response that arrives after a newer request was made is dropped.
 *
 * @returns {{ data: any, rows: object[], error: string, loading: boolean, reload: () => Promise<void>, updatedAt: Date|null }}
 */
export function useReport(fetcher, key = '', { enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: '', loading: enabled, updatedAt: null });
  const latest = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(async () => {
    latest.current += 1;
    const id = latest.current;

    setState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      const data = await fetcherRef.current();
      if (id === latest.current)
        setState({ data, error: '', loading: false, updatedAt: new Date() });
    } catch (error) {
      if (id === latest.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: getErrorMessage(error, 'Could not load this report.'),
        }));
      }
    }
  }, []);

  const serialisedKey = JSON.stringify(key);
  useEffect(() => {
    if (enabled) reload();
  }, [serialisedKey, enabled, reload]);

  // Lists answer { data: [...] }; `rows` saves every caller the optional chaining.
  const rows = Array.isArray(state.data?.data) ? state.data.data : [];

  return { ...state, rows, reload };
}

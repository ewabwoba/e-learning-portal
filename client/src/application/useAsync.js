import { useCallback, useEffect, useRef, useState } from 'react';

/** Runs an async loader and exposes {data, error, loading, reload, setData}. Ignores stale results. */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const run = useRef(0);
  const load = useCallback(() => {
    const n = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    Promise.resolve().then(loader).then(
      (data) => { if (n === run.current) setState({ data, error: null, loading: false }); },
      (error) => { if (n === run.current) setState({ data: null, error, loading: false }); },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { load(); return () => { run.current += 1; }; }, [load]);
  const setData = useCallback((updater) => setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater })), []);
  return { ...state, reload: load, setData };
}

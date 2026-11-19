import { apiRepository } from './apiRepository';
import { demoRepository } from './demoRepository';

// Resolve once at startup: VITE_DATA_SOURCE=demo|api forces a source, otherwise probe the API.
let resolved;
export function resolveRepository() {
  if (resolved) return resolved;
  const forced = import.meta.env.VITE_DATA_SOURCE;
  if (forced === 'demo') resolved = Promise.resolve(demoRepository);
  else if (forced === 'api') resolved = Promise.resolve(apiRepository);
  else {
    const base = import.meta.env.VITE_API_URL || '/api';
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 2500);
    resolved = fetch(`${base}/health`, { signal: ctl.signal })
      .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('json') ? apiRepository : demoRepository))
      .catch(() => demoRepository)
      .finally(() => clearTimeout(timer));
  }
  return resolved;
}

import { useCallback, useState } from 'react';

const KEY = 'coursely.saved';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };

/** Bookmarked course ids (per browser; a light convenience, not account data). */
export function useSaved() {
  const [ids, setIds] = useState(read);
  const toggle = useCallback((id) => setIds((cur) => {
    const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* ignore */ }
    return next;
  }), []);
  return { ids, has: (id) => ids.includes(id), toggle };
}

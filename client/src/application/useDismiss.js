import { useEffect } from 'react';

/** Calls onDismiss on Escape or on a pointer-down outside `ref` while `active`. */
export function useDismiss(ref, active, onDismiss) {
  useEffect(() => {
    if (!active) return undefined;
    const key = (e) => { if (e.key === 'Escape') onDismiss(); };
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) onDismiss(); };
    document.addEventListener('keydown', key);
    document.addEventListener('pointerdown', down);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', down); };
  }, [ref, active, onDismiss]);
}

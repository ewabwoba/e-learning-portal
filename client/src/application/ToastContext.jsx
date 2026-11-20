import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const id = useRef(0);
  const dismiss = useCallback((i) => setItems((xs) => xs.filter((x) => x.id !== i)), []);
  const push = useCallback((message, tone = 'success') => {
    const n = ++id.current;
    setItems((xs) => [...xs.slice(-2), { id: n, message, tone }]);
    setTimeout(() => dismiss(n), 5000);
  }, [dismiss]);
  const api = useMemo(() => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error'), info: (m) => push(m, 'success') }), [push]);
  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.tone}`}>
            {t.tone === 'error' ? <AlertCircle size={18} aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss notification"><X size={16} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

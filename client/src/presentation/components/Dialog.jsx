import React, { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

/** Accessible modal: traps Tab, closes on Escape / backdrop, restores focus. */
export default function Dialog({ title, onClose, children, footer, width = 480 }) {
  const id = useId();
  const box = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const first = box.current?.querySelector('textarea, input, select, button:not(.dialog-x)') || box.current;
    first?.focus();
    const key = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = [...box.current.querySelectorAll('a[href], button:not(:disabled), input, select, textarea')];
      if (!f.length) return;
      const a = f[0]; const z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    };
    document.addEventListener('keydown', key);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = ''; prev?.focus?.(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-labelledby={id} ref={box} tabIndex={-1} style={{ maxWidth: width }}>
        <div className="dialog-head"><h2 id={id}>{title}</h2><button type="button" className="icon-btn dialog-x" onClick={onClose} aria-label="Close"><X size={18} /></button></div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-foot">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Asks for confirmation and, when `reason` is set, a required note.
 * onConfirm(reason) may throw; its message is shown in the dialog.
 */
export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', danger, reason, reasonLabel = 'Reason', onConfirm, onClose }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (reason && !text.trim()) { setErr('Please add a short note. It is shown to the person affected.'); return; }
    setBusy(true); setErr('');
    try { await onConfirm(text.trim()); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Dialog title={title} onClose={busy ? () => {} : onClose}>
      <form onSubmit={submit} noValidate className="dialog-form">
        {message && <p className="muted">{message}</p>}
        {reason && (
          <div className="field">
            <label htmlFor="dlg-reason">{reasonLabel}</label>
            <textarea id="dlg-reason" className="textarea" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} aria-invalid={err && !text.trim() ? 'true' : undefined} />
          </div>
        )}
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger-solid' : 'btn-primary'}`} disabled={busy}>{busy ? 'Working…' : confirmLabel}</button>
        </div>
      </form>
    </Dialog>
  );
}

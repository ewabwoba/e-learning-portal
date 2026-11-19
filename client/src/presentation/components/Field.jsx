import React, { useId, useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export function Field({ label, error, hint, as: As = 'input', children, ...props }) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  const cls = As === 'select' ? 'select' : As === 'textarea' ? 'textarea' : 'input';
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <As id={id} className={cls} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...props}>{children}</As>
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error" id={`${id}-err`} role="alert"><AlertCircle size={14} aria-hidden /> {error}</span>}
    </div>
  );
}

export function PasswordField({ label = 'Password', error, hint, ...props }) {
  const id = useId();
  const [show, setShow] = useState(false);
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="pw-wrap">
        <input id={id} className="input" type={show ? 'text' : 'password'} aria-invalid={error ? 'true' : undefined} aria-describedby={describedBy} {...props} />
        <button type="button" className="pw-toggle" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
      {hint && !error && <span className="hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="error" id={`${id}-err`} role="alert"><AlertCircle size={14} aria-hidden /> {error}</span>}
    </div>
  );
}

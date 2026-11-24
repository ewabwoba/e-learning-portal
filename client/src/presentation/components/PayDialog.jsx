import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Smartphone, XCircle } from 'lucide-react';
import Dialog from './Dialog';
import { Field } from './Field';
import { useRepo } from '../../application/DataContext';
import { formatPrice } from '../../domain/course';

const POLL_MS = 3000;
const MAX_POLLS = 30; // about 90 seconds
const PHONE = /^(?:\+?254|0)?[17]\d{8}$/;

/** M-Pesa STK Push checkout. The server decides when a payment succeeded; this only asks and waits. */
export default function PayDialog({ course, onPaid, onClose }) {
  const repo = useRepo();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('form'); // form | waiting | success | failed | timeout
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const poll = (id, n = 0) => {
    timer.current = setTimeout(async () => {
      try {
        const p = await repo.payments.status(id);
        if (p.status === 'SUCCESS') { setStep('success'); setMsg(p.message); return; }
        if (p.status !== 'PENDING') { setStep('failed'); setMsg(p.message); return; }
      } catch { /* a dropped request is not a failed payment: keep polling */ }
      if (n + 1 >= MAX_POLLS) setStep('timeout'); else poll(id, n + 1);
    }, POLL_MS);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!PHONE.test(phone.replace(/[\s-]/g, ''))) { setErr('Enter a valid Safaricom number, e.g. 0712 345 678.'); return; }
    setErr(''); setStep('waiting'); setMsg('Check your phone and enter your M-Pesa PIN.');
    try { const p = await repo.payments.start(course.id, phone); poll(p.id); }
    catch (x) { setStep('form'); setErr(x.message); }
  };

  const retry = () => { setStep('form'); setErr(''); };

  return (
    <Dialog title={step === 'success' ? 'Payment received' : 'Pay with M-Pesa'} onClose={onClose}>
      {step === 'form' && (
        <form onSubmit={submit} noValidate className="dialog-form">
          <p className="muted"><b>{course.title}</b><br />Amount: <b>{formatPrice(course.price)}</b></p>
          <Field label="M-Pesa phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="0712 345 678" value={phone} onChange={(e) => setPhone(e.target.value)} error={err} hint="You will get a prompt on this phone to enter your PIN." />
          <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary">Send payment request</button></div>
        </form>
      )}
      {step === 'waiting' && (
        <div className="pay-state" role="status"><Smartphone size={32} aria-hidden /><b>Waiting for your approval</b><p className="muted">{msg}</p><span className="spinner" aria-hidden /><p className="muted small">If you closed this window after paying, the course will appear in My learning.</p></div>
      )}
      {step === 'success' && (
        <div className="pay-state ok" role="status"><CheckCircle2 size={36} aria-hidden /><b>You are enrolled</b><p className="muted">{msg}</p><button type="button" className="btn btn-primary" onClick={onPaid}>Start learning</button></div>
      )}
      {step === 'failed' && (
        <div className="pay-state bad" role="alert"><XCircle size={36} aria-hidden /><b>Payment was not completed</b><p className="muted">{msg || 'No money was taken.'}</p><div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Close</button><button type="button" className="btn btn-primary" onClick={retry}>Try again</button></div></div>
      )}
      {step === 'timeout' && (
        <div className="pay-state" role="status"><b>We have not heard back yet</b><p className="muted">If you entered your PIN, your course will appear in My learning shortly. If not, you can try again.</p><div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Close</button><button type="button" className="btn btn-primary" onClick={retry}>Try again</button></div></div>
      )}
    </Dialog>
  );
}

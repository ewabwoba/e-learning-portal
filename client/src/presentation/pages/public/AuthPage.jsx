import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, GraduationCap, Presentation, Quote } from 'lucide-react';
import Brand from '../../components/Brand';
import CourseArt from '../../components/CourseArt';
import { Field, PasswordField } from '../../components/Field';
import { useAuth, homeFor } from '../../../application/AuthContext';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import { validateCredentials } from '../../../domain/course';

const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);

export default function AuthPage({ mode }) {
  const register = mode === 'register';
  useDocumentTitle(register ? 'Create your account' : 'Log in');
  const { login, register: signUp, user, isAuthenticated, mode: dataMode } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [sp] = useSearchParams();
  const next = safeNext(sp.get('next'));
  const [form, setForm] = useState({ name: '', email: '', password: '', role: sp.get('role') === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  if (isAuthenticated && !busy) return <Navigate to={next || homeFor(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const v = validateCredentials(form, { register });
    setErrors(v); setFormError('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const u = register ? await signUp(form) : await login(form);
      toast.success(register ? `Welcome to Coursely, ${u.name.split(' ')[0]}!` : `Welcome back, ${u.name.split(' ')[0]}!`);
      nav(next || homeFor(u), { replace: true });
    } catch (err) {
      setErrors(err.fields || {}); setFormError(err.message); setBusy(false);
    }
  };
  const fill = (email) => setForm((f) => ({ ...f, email, password: 'Password123!' }));

  return (
    <div className="auth">
      <div className="auth-form-side">
        <Brand />
        <div className="auth-card">
          <h1>{register ? 'Create your account' : 'Welcome back'}</h1>
          <p className="muted">{register ? 'Join Coursely to learn new skills or share your own.' : 'Log in to continue your learning journey.'}</p>

          <form onSubmit={submit} noValidate>
            {register && (
              <fieldset className="role-pick">
                <legend>I want to</legend>
                {[['STUDENT', GraduationCap, 'Learn', 'Take courses'], ['INSTRUCTOR', Presentation, 'Teach', 'Create courses']].map(([v, Icon, t, s]) => (
                  <label key={v} className={form.role === v ? 'on' : ''}><input type="radio" name="role" value={v} checked={form.role === v} onChange={set('role')} /><Icon size={22} aria-hidden /><b>{t}</b><small>{s}</small></label>
                ))}
              </fieldset>
            )}
            {register && <Field label="Full name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />}
            <Field label="Email" type="email" autoComplete="email" value={form.email} onChange={set('email')} error={errors.email} />
            <PasswordField label="Password" autoComplete={register ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} error={errors.password} hint={register ? 'At least 8 characters.' : undefined} />
            {formError && <div className="form-alert" role="alert"><AlertCircle size={18} aria-hidden />{formError}</div>}
            <button className="btn btn-primary btn-lg btn-block" disabled={busy}>{busy ? <><span className="spinner" aria-hidden /> Please wait…</> : register ? 'Create account' : 'Log in'}</button>
          </form>

          {!register && (
            <div className="demo-box">
              <b>Try a demo account</b>
              <div><button type="button" className="btn btn-outline btn-sm" onClick={() => fill('student@coursely.dev')}>Student</button><button type="button" className="btn btn-outline btn-sm" onClick={() => fill('instructor@coursely.dev')}>Instructor</button></div>
              <small>Fills the form with sample credentials{dataMode === 'demo' ? ' (offline demo data)' : ''}.</small>
            </div>
          )}
          <p className="switch">{register ? <>Already have an account? <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link></> : <>New to Coursely? <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>Join for free</Link></>}</p>
        </div>
      </div>
      <div className="auth-art-side" aria-hidden>
        <div className="auth-art-inner">
          <div className="auth-art-img"><CourseArt category="Development" /></div>
          <Quote size={28} />
          <h2>Enhance your skills for a brighter future.</h2>
          <p>One place to learn, teach and track real progress.</p>
        </div>
      </div>
    </div>
  );
}

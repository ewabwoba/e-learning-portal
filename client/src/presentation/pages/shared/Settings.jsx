import React, { useState } from 'react';
import { Database, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../application/AuthContext';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import { Field } from '../../components/Field';
import { initials } from '../../../domain/course';

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, updateProfile, logout, mode } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: user.name, headline: user.headline || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErr('Your name cannot be empty.'); return; }
    setErr(''); setBusy(true);
    try { await updateProfile(form); toast.success('Profile updated.'); } catch (x) { toast.error(x.message); } finally { setBusy(false); }
  };

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings">Manage your profile and account.</PageHeader>
      <div className="settings-grid">
        <form className="panel editor-section" onSubmit={submit} noValidate>
          <h2>Profile</h2>
          <div className="profile-row"><span className="avatar lg" aria-hidden>{initials(form.name)}</span><div><b>{user.name}</b><p className="muted">{user.role === 'INSTRUCTOR' ? 'Instructor account' : 'Student account'}</p></div></div>
          <Field label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={err} autoComplete="name" />
          <Field label="Headline" value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} hint={user.role === 'INSTRUCTOR' ? 'Shown on your course pages.' : 'A short line about you.'} maxLength={120} />
          <Field label="Email" value={user.email} readOnly hint="Your email is used to sign in." />
          <div><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save profile'}</button></div>
        </form>
        <div className="panel editor-section">
          <h2>Account</h2>
          <p className="muted">Signed in as <b>{user.email}</b>.</p>
          <div className="data-note"><Database size={18} aria-hidden /><div><b>{mode === 'api' ? 'Connected to the Coursely API' : 'Offline demo data'}</b><p className="muted">{mode === 'api' ? 'Your data is stored by the Spring Boot service.' : 'The API was not detected, so everything is saved in this browser only.'}</p></div></div>
          <div><button type="button" className="btn btn-danger" onClick={() => { logout(); nav('/'); }}><LogOut size={17} aria-hidden /> Log out</button></div>
        </div>
      </div>
    </>
  );
}

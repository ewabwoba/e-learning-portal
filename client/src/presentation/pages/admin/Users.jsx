import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Plus, Search, Trash2, UserX, UserCheck, Users as UsersIcon, X } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useAuth } from '../../../application/AuthContext';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import Dialog, { ConfirmDialog } from '../../components/Dialog';
import { Field, PasswordField } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { APPROVAL, ROLE_LABEL } from '../../../domain/access';
import { initials } from '../../../domain/course';

const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function CreateUser({ onDone, onClose }) {
  const repo = useRepo();
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'STUDENT' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (!f.name.trim()) v.name = 'Enter a name.';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) v.email = 'Enter a valid email address.';
    if (f.password.length < 8) v.password = 'Use at least 8 characters.';
    setErr(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try { onDone(await repo.admin.createUser(f)); onClose(); } catch (x) { setErr({ form: x.message, ...(x.fields || {}) }); setBusy(false); }
  };
  return (
    <Dialog title="Create a user" onClose={onClose}>
      <form onSubmit={submit} noValidate className="dialog-form">
        <Field label="Full name" value={f.name} onChange={set('name')} error={err.name} />
        <Field label="Email" type="email" value={f.email} onChange={set('email')} error={err.email} />
        <PasswordField label="Temporary password" value={f.password} onChange={set('password')} error={err.password} hint="Share it securely. They can change it after signing in." />
        <Field as="select" label="Role" value={f.role} onChange={set('role')}><option value="STUDENT">Student</option><option value="INSTRUCTOR">Instructor</option><option value="ADMIN">Admin</option></Field>
        {f.role === 'ADMIN' && <p className="form-warn">Admins can manage everything on the platform. Only create one for someone you fully trust.</p>}
        {err.form && <p className="form-error" role="alert">{err.form}</p>}
        <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Creating…' : 'Create user'}</button></div>
      </form>
    </Dialog>
  );
}

export default function AdminUsers() {
  useDocumentTitle('Users · Admin');
  const repo = useRepo();
  const toast = useToast();
  const { user: me } = useAuth();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') === 'approvals' ? 'approvals' : 'all';
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const { data, loading, error, reload, setData } = useAsync(() => repo.admin.users(), [repo]);
  const [dlg, setDlg] = useState(null);
  const replace = (u) => setData((l) => l.map((r) => (r.id === u.id ? u : r)));
  const pending = (data || []).filter((u) => u.role === 'INSTRUCTOR' && u.approval !== 'APPROVED');

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (tab === 'approvals' ? pending : data || []).filter((u) => (!role || u.role === role) && (!t || u.name.toLowerCase().includes(t) || u.email.toLowerCase().includes(t)));
  }, [data, q, role, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn, ok) => { try { replace(await fn()); toast.success(ok); } catch (e) { toast.error(e.message); reload(); } };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Users and instructors" actions={<button type="button" className="btn btn-primary" onClick={() => setDlg({ kind: 'CREATE' })}><Plus size={17} aria-hidden /> Create user</button>}>Manage accounts, roles and instructor approvals. Role changes are recorded in the audit log.</PageHeader>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'all'} className={tab === 'all' ? 'on' : ''} onClick={() => setSp({})}>All users<span className="tab-count">{data?.length || 0}</span></button>
        <button type="button" role="tab" aria-selected={tab === 'approvals'} className={tab === 'approvals' ? 'on' : ''} onClick={() => setSp({ tab: 'approvals' })}>Instructor approvals<span className="tab-count">{pending.length}</span></button>
      </div>
      <div className="toolbar">
        <div className="search-box"><Search size={16} aria-hidden /><label htmlFor="u-q" className="sr-only">Search users</label><input id="u-q" className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <label className="sr-only" htmlFor="u-role">Filter by role</label>
        <select id="u-role" className="select" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option><option value="STUDENT">Students</option><option value="INSTRUCTOR">Instructors</option><option value="ADMIN">Admins</option></select>
      </div>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} style={{ padding: 18 }}><Skeleton h={40} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && rows.length === 0 && <EmptyState icon={UsersIcon} title={tab === 'approvals' ? 'No instructors are waiting' : 'No users match'}>{tab === 'approvals' ? 'New instructor sign-ups will appear here for approval.' : 'Try a different search or filter.'}</EmptyState>}
      {!loading && !error && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Joined</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((u) => {
                const self = u.id === me.id; const suspended = u.status === 'SUSPENDED';
                return (
                  <tr key={u.id} className={suspended ? 'row-muted' : ''}>
                    <td className="cell-first"><div className="cell-main"><span className="avatar sm" aria-hidden>{initials(u.name)}</span><div><b>{u.name}{self && <span className="you"> (you)</span>}</b><small>{u.email}</small>{u.approvalNote && u.approval === 'REJECTED' && <small className="reason">Note: {u.approvalNote}</small>}</div></div></td>
                    <td data-label="Role">
                      <select className="select select-sm" aria-label={`Role for ${u.name}`} value={u.role} disabled={self}
                        onChange={(e) => setDlg({ kind: 'ROLE', u, role: e.target.value })}>
                        {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                      </select>
                    </td>
                    <td data-label="Status">
                      {suspended ? <span className="pill pill-red">Suspended</span> : u.role === 'INSTRUCTOR' ? <span className={`pill ${APPROVAL[u.approval]?.pill}`}>{APPROVAL[u.approval]?.label}</span> : <span className="pill pill-green">Active</span>}
                    </td>
                    <td data-label="Joined" className="num">{date(u.createdAt)}</td>
                    <td className="actions">
                      {u.role === 'INSTRUCTOR' && u.approval !== 'APPROVED' && <button type="button" className="btn btn-primary btn-sm" onClick={() => setDlg({ kind: 'APPROVE', u })}><Check size={14} aria-hidden /> Approve</button>}
                      {u.role === 'INSTRUCTOR' && u.approval === 'PENDING' && <button type="button" className="btn btn-outline btn-sm" onClick={() => setDlg({ kind: 'REJECT', u })}><X size={14} aria-hidden /> Reject</button>}
                      {!self && (suspended
                        ? <button type="button" className="btn btn-ghost btn-sm" onClick={() => run(() => repo.admin.setUserStatus(u.id, 'ACTIVE'), 'Account reactivated.')}><UserCheck size={14} aria-hidden /> Reactivate</button>
                        : <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDlg({ kind: 'SUSPEND', u })}><UserX size={14} aria-hidden /> Suspend</button>)}
                      {!self && <button type="button" className="icon-btn danger" aria-label={`Delete ${u.name}`} onClick={() => setDlg({ kind: 'DELETE', u })}><Trash2 size={15} /></button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dlg?.kind === 'CREATE' && <CreateUser onDone={(u) => { setData((l) => [u, ...l]); toast.success('User created.'); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'ROLE' && <ConfirmDialog title="Change role?" message={`${dlg.u.name} will become ${ROLE_LABEL[dlg.role].toLowerCase() === 'admin' ? 'an admin with full control of the platform' : `a ${ROLE_LABEL[dlg.role].toLowerCase()}`}. This takes effect immediately and is logged.`} confirmLabel="Change role" danger={dlg.role === 'ADMIN'} onConfirm={async () => { replace(await repo.admin.setRole(dlg.u.id, dlg.role)); toast.success('Role updated.'); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'APPROVE' && <ConfirmDialog title="Approve instructor?" message={`${dlg.u.name} will be able to submit courses for review.`} confirmLabel="Approve" onConfirm={async () => { replace(await repo.admin.decideInstructor(dlg.u.id, 'APPROVE')); toast.success('Instructor approved.'); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'REJECT' && <ConfirmDialog title="Decline this instructor?" message="They keep their account and can still draft courses, but cannot submit them." reason reasonLabel="What should they fix?" confirmLabel="Decline" danger onConfirm={async (r) => { replace(await repo.admin.decideInstructor(dlg.u.id, 'REJECT', r)); toast.success('Instructor declined.'); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'SUSPEND' && <ConfirmDialog title="Suspend this account?" message={`${dlg.u.name} is signed out immediately and cannot sign in until reactivated.${dlg.u.role === 'INSTRUCTOR' ? ' Their courses are hidden from the catalogue.' : ''}`} confirmLabel="Suspend" danger onConfirm={async () => { replace(await repo.admin.setUserStatus(dlg.u.id, 'SUSPENDED')); toast.success('Account suspended.'); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'DELETE' && <ConfirmDialog title="Delete this user?" message={`${dlg.u.email} will be removed permanently. Accounts with courses or enrolments cannot be deleted. Suspend them instead.`} confirmLabel="Delete user" danger onConfirm={async () => { await repo.admin.deleteUser(dlg.u.id); setData((l) => l.filter((r) => r.id !== dlg.u.id)); toast.success('User deleted.'); }} onClose={() => setDlg(null)} />}
    </>
  );
}

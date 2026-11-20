import React, { useState } from 'react';
import { ClipboardList, Plus, Trash2 } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import Dialog, { ConfirmDialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';

const date = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

function EnrollDialog({ onDone, onClose }) {
  const repo = useRepo();
  const people = useAsync(() => repo.admin.users(), [repo]);
  const courses = useAsync(() => repo.admin.courses(), [repo]);
  const [s, setS] = useState(''); const [c, setC] = useState('');
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const students = (people.data || []).filter((u) => u.role === 'STUDENT' && u.status === 'ACTIVE');
  const open = (courses.data || []).filter((x) => x.status === 'PUBLISHED');
  const go = async (e) => {
    e.preventDefault();
    if (!s || !c) { setErr('Choose a student and a course.'); return; }
    setBusy(true);
    try { onDone(await repo.admin.enroll(s, c)); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Dialog title="Enrol a student" onClose={onClose}>
      <form onSubmit={go} noValidate className="dialog-form">
        <Field as="select" label="Student" value={s} onChange={(e) => setS(e.target.value)}><option value="">Choose a student</option>{students.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}</Field>
        <Field as="select" label="Course" value={c} onChange={(e) => setC(e.target.value)}><option value="">Choose a published course</option>{open.map((x) => <option key={x.id} value={x.id}>{x.title}</option>)}</Field>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy || people.loading || courses.loading}>{busy ? 'Enrolling…' : 'Enrol'}</button></div>
      </form>
    </Dialog>
  );
}

export default function AdminEnrollments() {
  useDocumentTitle('Enrolments · Admin');
  const repo = useRepo();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => repo.admin.enrollments(), [repo]);
  const [dlg, setDlg] = useState(null);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Enrolments" actions={<button type="button" className="btn btn-primary" onClick={() => setDlg({ kind: 'NEW' })}><Plus size={17} aria-hidden /> Enrol a student</button>}>The 200 most recent enrolments. Cancelling one removes the student's progress in that course.</PageHeader>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} style={{ padding: 18 }}><Skeleton h={30} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={ClipboardList} title="No enrolments yet">Students appear here as soon as they enrol.</EmptyState>}
      {!loading && !error && data.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Enrolled</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id}>
                  <td className="cell-first"><b>{e.studentName}</b><small className="block">{e.studentEmail}</small></td>
                  <td data-label="Course">{e.courseTitle}</td>
                  <td data-label="Progress" className="num">{e.progressPercent}%</td>
                  <td data-label="Enrolled" className="num">{date(e.enrolledAt)}</td>
                  <td className="actions"><button type="button" className="btn btn-ghost btn-sm" onClick={() => setDlg({ kind: 'CANCEL', e })}><Trash2 size={14} aria-hidden /> Cancel</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dlg?.kind === 'NEW' && <EnrollDialog onDone={(e) => { setData((l) => [e, ...l.filter((x) => x.id !== e.id)]); toast.success('Student enrolled.'); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'CANCEL' && <ConfirmDialog title="Cancel this enrolment?" message={`${dlg.e.studentName} loses access to “${dlg.e.courseTitle}” and their progress is removed.`} confirmLabel="Cancel enrolment" danger onConfirm={async () => { await repo.admin.cancelEnrollment(dlg.e.id); setData((l) => l.filter((x) => x.id !== dlg.e.id)); toast.success('Enrolment cancelled.'); }} onClose={() => setDlg(null)} />}
    </>
  );
}

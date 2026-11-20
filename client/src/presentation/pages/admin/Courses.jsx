import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Eye, Library, Pencil, Trash2, Undo2, X } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import CourseImage from '../../components/CourseImage';
import { ConfirmDialog } from '../../components/Dialog';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { courseStatus } from '../../../domain/access';
import { formatPrice } from '../../../domain/course';

const TABS = [['ALL', 'All'], ['PENDING_REVIEW', 'In review'], ['PUBLISHED', 'Published'], ['REJECTED', 'Needs changes'], ['DRAFT', 'Drafts'], ['ARCHIVED', 'Archived']];
const BADGES = ['', 'NEW', 'HOT', 'FEATURED', 'SPECIAL'];

export default function AdminCourses() {
  useDocumentTitle('Courses · Admin');
  const repo = useRepo();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const tab = TABS.some(([k]) => k === sp.get('status')) ? sp.get('status') : 'ALL';
  const { data, loading, error, reload, setData } = useAsync(() => repo.admin.courses(), [repo]);
  const [dlg, setDlg] = useState(null);
  const counts = useMemo(() => (data || []).reduce((m, c) => ({ ...m, [c.status]: (m[c.status] || 0) + 1 }), { ALL: data?.length || 0 }), [data]);
  const rows = (data || []).filter((c) => tab === 'ALL' || c.status === tab);
  const patch = (c) => setData((l) => l.map((r) => (r.id === c.id ? c : r)));

  const review = (c, decision, reason) => repo.admin.reviewCourse(c.id, decision, reason).then((u) => {
    patch(u);
    toast.success(decision === 'APPROVE' ? 'Course published.' : decision === 'REJECT' ? 'Sent back to the instructor with your note.' : 'Course taken down.');
  });
  const badge = async (c, b) => { try { patch(await repo.admin.setBadge(c.id, b)); toast.success('Badge updated.'); } catch (e) { toast.error(e.message); } };

  return (
    <>
      <PageHeader eyebrow="Administration" title="Courses">Review submissions and manage every course on the platform.</PageHeader>
      <div className="tabs" role="tablist" aria-label="Course status">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setSp(k === 'ALL' ? {} : { status: k })}>{l}<span className="tab-count">{counts[k] || 0}</span></button>)}
      </div>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} style={{ padding: 20 }}><Skeleton h={48} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && rows.length === 0 && <EmptyState icon={Library} title={tab === 'PENDING_REVIEW' ? 'The review queue is clear' : 'No courses here'}>{tab === 'PENDING_REVIEW' ? 'Courses submitted by approved instructors will appear here.' : 'Try another status.'}</EmptyState>}
      {!loading && !error && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Course</th><th>Instructor</th><th>Status</th><th>Students</th><th>Price</th><th>Badge</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map((c) => {
                const st = courseStatus(c.status);
                return (
                  <tr key={c.id}>
                    <td className="cell-first"><div className="cell-main"><div className="thumb"><CourseImage course={c} /></div><div><b>{c.title}</b><small>{c.category} · {c.lessonCount} {c.lessonCount === 1 ? "lesson" : "lessons"}</small>{c.rejectionReason && <small className="reason">Note: {c.rejectionReason}</small>}</div></div></td>
                    <td data-label="Instructor">{c.instructor?.name}</td>
                    <td data-label="Status"><span className={`pill ${st.pill}`}>{st.label}</span></td>
                    <td data-label="Students" className="num">{c.students}</td>
                    <td data-label="Price" className="num">{formatPrice(c.price)}</td>
                    <td data-label="Badge"><select className="select select-sm" aria-label={`Badge for ${c.title}`} value={c.badge || ''} onChange={(e) => badge(c, e.target.value)}>{BADGES.map((b) => <option key={b} value={b}>{b || 'None'}</option>)}</select></td>
                    <td className="actions">
                      {c.status === 'PENDING_REVIEW' && <>
                        <button type="button" className="btn btn-primary btn-sm" onClick={() => setDlg({ c, kind: 'APPROVE' })}><Check size={14} aria-hidden /> Approve</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setDlg({ c, kind: 'REJECT' })}><X size={14} aria-hidden /> Reject</button>
                      </>}
                      {c.status === 'PUBLISHED' && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDlg({ c, kind: 'UNPUBLISH' })}><Undo2 size={14} aria-hidden /> Take down</button>}
                      <Link to={`/app/courses/${c.id}`} className="btn btn-ghost btn-sm" aria-label={`Preview ${c.title}`}><Eye size={14} aria-hidden /> Preview</Link>
                      <Link to={`/app/admin/courses/${c.id}`} className="btn btn-ghost btn-sm" aria-label={`Edit ${c.title}`}><Pencil size={14} aria-hidden /> Edit</Link>
                      <button type="button" className="icon-btn danger" aria-label={`Delete ${c.title}`} onClick={() => setDlg({ c, kind: 'DELETE' })}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {dlg?.kind === 'APPROVE' && <ConfirmDialog title="Publish this course?" message={`“${dlg.c.title}” will appear in the public catalogue straight away.`} confirmLabel="Publish" onConfirm={() => review(dlg.c, 'APPROVE')} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'REJECT' && <ConfirmDialog title="Send back for changes" message={`Tell ${dlg.c.instructor?.name} what to improve. They can edit and resubmit.`} reason reasonLabel="What needs to change?" confirmLabel="Send back" onConfirm={(r) => review(dlg.c, 'REJECT', r)} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'UNPUBLISH' && <ConfirmDialog title="Take this course down?" message="It disappears from the catalogue. Enrolled learners keep their progress." reason reasonLabel="Reason" confirmLabel="Take down" danger onConfirm={(r) => review(dlg.c, 'UNPUBLISH', r)} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'DELETE' && <ConfirmDialog title="Delete this course?" message={`“${dlg.c.title}” and its ${dlg.c.students} enrolment(s) will be removed permanently. Consider taking it down instead.`} confirmLabel="Delete course" danger onConfirm={async () => { await repo.admin.deleteCourse(dlg.c.id); setData((l) => l.filter((r) => r.id !== dlg.c.id)); toast.success('Course deleted.'); }} onClose={() => setDlg(null)} />}
    </>
  );
}

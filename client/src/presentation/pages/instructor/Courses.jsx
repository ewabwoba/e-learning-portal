import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Library, Pencil, Plus } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import CourseImage from '../../components/CourseImage';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { formatPrice } from '../../../domain/course';

export default function InstructorCourses() {
  useDocumentTitle('My courses');
  const repo = useRepo();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useAsync(() => repo.instructor.courses(), [repo]);
  const [busyId, setBusyId] = useState(null);

  const toggle = async (c) => {
    const status = c.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    setBusyId(c.id);
    try {
      await repo.instructor.setStatus(c.id, status);
      setData((rows) => rows.map((r) => (r.id === c.id ? { ...r, status } : r)));
      toast.success(status === 'PUBLISHED' ? 'Course published. Learners can now find it.' : 'Course moved back to draft.');
    } catch (e) { toast.error(e.message); } finally { setBusyId(null); }
  };

  return (
    <>
      <PageHeader eyebrow="Instructor workspace" title="My courses" actions={<Link to="/app/teach/courses/new" className="btn btn-primary"><Plus size={17} aria-hidden /> New course</Link>}>Create, edit and publish your courses.</PageHeader>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} style={{ padding: 20 }}><Skeleton h={48} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={Library} title="No courses yet" action={<Link to="/app/teach/courses/new" className="btn btn-primary"><Plus size={17} aria-hidden /> Create a course</Link>}>Your courses will be listed here, with their status and sales.</EmptyState>}
      {!loading && !error && data.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Course</th><th>Status</th><th>Students</th><th>Price</th><th>Sales</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="cell-first"><div className="cell-main"><div className="thumb"><CourseImage course={c} /></div><div><b>{c.title}</b><small>{c.category} · {c.lessonCount} lessons</small></div></div></td>
                  <td data-label="Status"><span className={`pill ${c.status === 'PUBLISHED' ? 'pill-green' : 'pill-orange'}`}>{c.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span></td>
                  <td data-label="Students" className="num">{c.students}</td>
                  <td data-label="Price" className="num">{formatPrice(c.price)}</td>
                  <td data-label="Sales" className="num">{formatPrice(c.revenue)}</td>
                  <td className="actions">
                    <Link to={`/app/teach/courses/${c.id}`} className="btn btn-outline btn-sm"><Pencil size={14} aria-hidden /> Edit</Link>
                    <Link to={`/app/courses/${c.id}`} className="btn btn-ghost btn-sm" aria-label={`Preview ${c.title}`}><Eye size={14} aria-hidden /> Preview</Link>
                    <button type="button" className="btn btn-ghost btn-sm" disabled={busyId === c.id} onClick={() => toggle(c)}>{c.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

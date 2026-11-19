import React, { useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { initials } from '../../../domain/course';

export default function Students() {
  useDocumentTitle('Students');
  const repo = useRepo();
  const { data, loading, error, reload } = useAsync(() => repo.instructor.students(), [repo]);
  const [q, setQ] = useState('');
  const [course, setCourse] = useState('');
  const titles = useMemo(() => [...new Set((data || []).map((r) => r.courseTitle))], [data]);
  const rows = (data || []).filter((r) => (!course || r.courseTitle === course) && `${r.name} ${r.email}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <>
      <PageHeader eyebrow="Instructor workspace" title="Students">Everyone enrolled in your courses and how they are progressing.</PageHeader>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} style={{ padding: 16 }}><Skeleton h={40} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={Users} title="No students yet">When learners enrol in your published courses, they will show up here.</EmptyState>}
      {!loading && !error && data.length > 0 && (
        <>
          <div className="toolbar">
            <div className="search-field"><Search size={17} aria-hidden /><label htmlFor="stu-q" className="sr-only">Search students</label><input id="stu-q" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="field inline"><label htmlFor="stu-c" className="sr-only">Filter by course</label><select id="stu-c" className="select" value={course} onChange={(e) => setCourse(e.target.value)}><option value="">All courses</option>{titles.map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
          {rows.length === 0 ? <EmptyState icon={Search} title="No students match">Try a different name or course.</EmptyState> : (
            <div className="table-wrap">
              <table className="table responsive">
                <thead><tr><th>Student</th><th>Course</th><th>Progress</th><th>Enrolled</th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.enrollmentId}>
                      <td className="cell-first"><div className="cell-main"><span className="avatar sm" aria-hidden>{initials(r.name)}</span><div><b>{r.name}</b><small>{r.email}</small></div></div></td>
                      <td data-label="Course">{r.courseTitle}</td>
                      <td data-label="Progress"><div className="prog-cell"><div className="progress" role="progressbar" aria-valuenow={r.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${r.name} progress`}><span style={{ width: `${r.progressPercent}%` }} /></div><span className="num">{r.progressPercent}%</span></div></td>
                      <td data-label="Enrolled" className="num">{new Date(r.enrolledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}

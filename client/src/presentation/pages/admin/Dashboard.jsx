import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeDollarSign, ClipboardCheck, Library, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useAuth } from '../../../application/AuthContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader, { StatCard } from '../../components/PageHeader';
import { ErrorState, Skeleton } from '../../components/States';
import { formatPrice, initials } from '../../../domain/course';

export default function AdminDashboard() {
  useDocumentTitle('Admin dashboard');
  const repo = useRepo();
  const { user } = useAuth();
  const report = useAsync(() => repo.admin.report(), [repo]);
  const users = useAsync(() => repo.admin.users(), [repo]);
  const courses = useAsync(() => repo.admin.courses(), [repo]);
  const r = report.data;
  const pendingPeople = (users.data || []).filter((u) => u.role === 'INSTRUCTOR' && u.approval === 'PENDING');
  const queue = (courses.data || []).filter((c) => c.status === 'PENDING_REVIEW');
  const max = Math.max(1, ...(r?.topCourses || []).map((c) => c.students));

  return (
    <>
      <PageHeader eyebrow="Administration" title={`Welcome back, ${user.name.split(' ')[0]}`}>Approve instructors, review courses and keep the platform healthy.</PageHeader>
      {report.error && <ErrorState error={report.error} onRetry={report.reload} title="We could not load the platform report" />}
      {!report.error && (
        <div className="stat-grid" aria-busy={report.loading}>
          {report.loading ? [0, 1, 2, 3].map((i) => <div className="stat-card" key={i}><Skeleton w={48} h={48} r={14} /><div style={{ flex: 1 }}><Skeleton w="60%" /><Skeleton w="40%" h={26} /></div></div>) : (
            <>
              <StatCard icon={Users} tone="blue" label="Users" value={r.users} note={`${r.students} students · ${r.instructors} instructors`} />
              <StatCard icon={UserCheck} tone="amber" label="Instructors to approve" value={r.pendingInstructors} note={r.suspendedUsers ? `${r.suspendedUsers} suspended account${r.suspendedUsers > 1 ? 's' : ''}` : 'No suspended accounts'} />
              <StatCard icon={ClipboardCheck} tone="violet" label="Courses in review" value={r.pendingReview} note={`${r.published} published`} />
              <StatCard icon={BadgeDollarSign} tone="green" label="Gross sales" value={formatPrice(r.grossSales)} note={`${r.enrollments} enrolments`} />
            </>
          )}
        </div>
      )}

      <div className="dash-grid">
        <section className="panel" aria-labelledby="ap-h">
          <div className="panel-head"><div><h2 id="ap-h">Instructors awaiting approval</h2><p className="muted">They can draft courses but cannot submit them yet.</p></div><Link to="/app/admin/users?tab=approvals" className="text-link">Open <ArrowRight size={15} aria-hidden /></Link></div>
          {users.loading ? [0, 1].map((i) => <Skeleton key={i} h={40} />) : users.error ? <ErrorState error={users.error} onRetry={users.reload} /> : pendingPeople.length === 0 ? <p className="muted pad">Nobody is waiting. New instructor sign-ups will show here.</p> : (
            <ul className="people">
              {pendingPeople.slice(0, 5).map((u) => <li key={u.id}><span className="avatar sm" aria-hidden>{initials(u.name)}</span><div><b>{u.name}</b><small>{u.email}</small></div><Link to="/app/admin/users?tab=approvals" className="btn btn-outline btn-sm">Review</Link></li>)}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="rq-h">
          <div className="panel-head"><div><h2 id="rq-h">Review queue</h2><p className="muted">Courses submitted for publishing.</p></div><Link to="/app/admin/courses?status=PENDING_REVIEW" className="text-link">Open <ArrowRight size={15} aria-hidden /></Link></div>
          {courses.loading ? [0, 1].map((i) => <Skeleton key={i} h={40} />) : courses.error ? <ErrorState error={courses.error} onRetry={courses.reload} /> : queue.length === 0 ? <p className="muted pad">The queue is clear.</p> : (
            <ul className="people">
              {queue.slice(0, 5).map((c) => <li key={c.id}><span className="avatar sm" aria-hidden><Library size={16} /></span><div><b>{c.title}</b><small>by {c.instructor?.name}</small></div><Link to="/app/admin/courses?status=PENDING_REVIEW" className="btn btn-outline btn-sm">Review</Link></li>)}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="tc-h">
          <div className="panel-head"><div><h2 id="tc-h">Top courses</h2><p className="muted">By number of students.</p></div></div>
          {report.loading ? [0, 1, 2].map((i) => <Skeleton key={i} h={34} />) : r?.topCourses?.length ? (
            <ul className="hbars">{r.topCourses.map((c) => <li key={c.courseId}><div className="hbar-top"><span>{c.title}</span><b className="num">{c.students}</b></div><div className="progress blue" aria-hidden><span style={{ width: `${(c.students / max) * 100}%` }} /></div></li>)}</ul>
          ) : <p className="muted pad">Enrolments will appear here.</p>}
        </section>

        <section className="panel" aria-labelledby="hl-h">
          <div className="panel-head"><div><h2 id="hl-h">Catalogue health</h2><p className="muted">Courses by status.</p></div></div>
          {r ? (
            <ul className="status-list">
              {[['Published', r.published, 'pill-green'], ['In review', r.pendingReview, ''], ['Drafts', r.drafts, 'pill-orange'], ['Needs changes', r.rejected, 'pill-red'], ['Archived', r.archived, 'pill-grey']].map(([l, n, p]) => <li key={l}><span className={`pill ${p}`}>{l}</span><b className="num">{n}</b></li>)}
            </ul>
          ) : <Skeleton h={120} />}
          <p className="muted small"><ShieldCheck size={14} aria-hidden /> Every admin action is recorded in the <Link to="/app/admin/audit" className="text-link">audit log</Link>.</p>
        </section>
      </div>
    </>
  );
}

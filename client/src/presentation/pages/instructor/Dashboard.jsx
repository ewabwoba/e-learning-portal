import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeDollarSign, Library, Plus, Star, Users, PenLine } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useAuth } from '../../../application/AuthContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader, { StatCard } from '../../components/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';
import { initials } from '../../../domain/course';

const money = (n) => `KSh ${Number(n).toLocaleString('en-KE', { maximumFractionDigits: 0 })}`;

export default function InstructorDashboard() {
  useDocumentTitle('Instructor dashboard');
  const repo = useRepo();
  const { user } = useAuth();
  const stats = useAsync(() => repo.instructor.stats(), [repo]);
  const students = useAsync(() => repo.instructor.students(), [repo]);
  const s = stats.data;
  const max = Math.max(1, ...(s?.byCourse || []).map((r) => r.students));

  return (
    <>
      <PageHeader eyebrow="Instructor workspace" title={`Welcome back, ${user.name.split(' ')[0]}`} actions={<Link to="/app/teach/courses/new" className="btn btn-primary"><Plus size={17} aria-hidden /> Create a course</Link>}>
        Here is how your courses are doing.
      </PageHeader>

      {stats.error && <ErrorState error={stats.error} onRetry={stats.reload} title="We could not load your stats" />}
      {!stats.error && (
        <div className="stat-grid" aria-busy={stats.loading}>
          {stats.loading ? [0, 1, 2, 3].map((i) => <div className="stat-card" key={i}><Skeleton w={48} h={48} r={14} /><div style={{ flex: 1 }}><Skeleton w="60%" /><Skeleton w="40%" h={26} /></div></div>) : (
            <>
              <StatCard icon={Users} tone="blue" label="Total students" value={s.students} note="Across all courses" />
              <StatCard icon={BadgeDollarSign} tone="green" label="Gross sales" value={money(s.revenue)} note="Before fees" />
              <StatCard icon={Library} tone="violet" label="Published courses" value={s.published} note={`${s.courses - s.published} in draft`} />
              <StatCard icon={Star} tone="amber" label="Average rating" value={s.averageRating || '–'} note={s.averageRating ? 'From learners' : 'No ratings yet'} />
            </>
          )}
        </div>
      )}

      {!stats.loading && s && s.courses === 0 ? (
        <EmptyState icon={PenLine} title="Create your first course" action={<Link to="/app/teach/courses/new" className="btn btn-primary"><Plus size={17} aria-hidden /> Start a course</Link>}>Add modules and lessons, set a price, then publish when you are ready.</EmptyState>
      ) : (
        <div className="dash-grid">
          <section className="panel" aria-labelledby="top-h">
            <div className="panel-head"><div><h2 id="top-h">Top courses</h2><p className="muted">By number of students.</p></div><Link to="/app/teach/courses" className="text-link">Manage <ArrowRight size={15} aria-hidden /></Link></div>
            {stats.loading ? [0, 1, 2].map((i) => <Skeleton key={i} h={34} />) : s?.byCourse.length ? (
              <ul className="hbars">
                {s.byCourse.map((r) => (
                  <li key={r.courseId}><div className="hbar-top"><span>{r.title}</span><b className="num">{r.students}</b></div><div className="progress blue" aria-hidden><span style={{ width: `${(r.students / max) * 100}%` }} /></div></li>
                ))}
              </ul>
            ) : <p className="muted pad">Students will appear here as soon as they enrol.</p>}
          </section>

          <section className="panel" aria-labelledby="rec-h">
            <div className="panel-head"><div><h2 id="rec-h">Recent enrolments</h2><p className="muted">Latest students to join.</p></div><Link to="/app/teach/students" className="text-link">All students <ArrowRight size={15} aria-hidden /></Link></div>
            {students.loading ? [0, 1, 2].map((i) => <Skeleton key={i} h={40} />) : students.error ? <ErrorState error={students.error} onRetry={students.reload} /> : students.data.length === 0 ? <p className="muted pad">No enrolments yet.</p> : (
              <ul className="people">
                {students.data.slice(0, 5).map((r) => (
                  <li key={r.enrollmentId}><span className="avatar sm" aria-hidden>{initials(r.name)}</span><div><b>{r.name}</b><small>{r.courseTitle}</small></div><span className="pill pill-grey num">{r.progressPercent}%</span></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </>
  );
}

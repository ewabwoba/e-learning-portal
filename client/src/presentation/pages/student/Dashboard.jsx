import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpen, Clock3, Flame, Play, Compass } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useAuth } from '../../../application/AuthContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader, { StatCard } from '../../components/PageHeader';
import CourseCard from '../../components/CourseCard';
import CourseImage from '../../components/CourseImage';
import { EmptyState, ErrorState, Skeleton, CardSkeletons } from '../../components/States';
import { formatDuration } from '../../../domain/course';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export function WeeklyChart({ data }) {
  const max = Math.max(30, ...data.map((d) => d.minutes));
  return (
    <figure className="weekly">
      <div className="bars" role="img" aria-label={`Minutes learned per day: ${data.map((d) => `${d.label} ${d.minutes}`).join(', ')}`}>
        {data.map((d, i) => (
          <div className="bar-col" key={i}>
            <span className="bar-val num">{d.minutes || ''}</span>
            <div className="bar-track"><i className={i === data.length - 1 ? 'today' : ''} style={{ height: `${Math.max(d.minutes ? 8 : 0, (d.minutes / max) * 100)}%` }} /></div>
            <span className="bar-label">{d.label}</span>
          </div>
        ))}
      </div>
      <figcaption className="sr-only">Learning minutes over the last seven days</figcaption>
    </figure>
  );
}

export default function StudentDashboard() {
  useDocumentTitle('Dashboard');
  const repo = useRepo();
  const { user } = useAuth();
  const enr = useAsync(() => repo.learning.enrollments(), [repo]);
  const stats = useAsync(() => repo.learning.stats(), [repo]);
  const catalog = useAsync(() => repo.courses.list(), [repo]);

  const enrolledIds = new Set((enr.data || []).map((e) => e.courseId));
  const active = (enr.data || []).filter((e) => e.progressPercent < 100);
  const recs = (catalog.data || []).filter((c) => !enrolledIds.has(c.id)).sort((a, b) => b.rating - a.rating).slice(0, 3);
  const s = stats.data;
  const hours = s ? Math.round((s.minutesLearned / 60) * 10) / 10 : 0;

  return (
    <>
      <PageHeader eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} title={`${greeting()}, ${user.name.split(' ')[0]}`} actions={<Link to="/app/explore" className="btn btn-outline"><Compass size={17} aria-hidden /> Explore courses</Link>}>
        Ready to make today a little more productive?
      </PageHeader>

      <div className="stat-grid" aria-busy={stats.loading}>
        {stats.loading ? [0, 1, 2, 3].map((i) => <div className="stat-card" key={i}><Skeleton w={48} h={48} r={14} /><div style={{ flex: 1 }}><Skeleton w="60%" /><Skeleton w="40%" h={26} /></div></div>) : stats.error ? <div style={{ gridColumn: '1/-1' }}><ErrorState error={stats.error} onRetry={stats.reload} title="We could not load your stats" /></div> : (
          <>
            <StatCard icon={BookOpen} tone="blue" label="In progress" value={s.inProgress} note={s.inProgress ? 'Keep it going' : 'Start a course'} />
            <StatCard icon={Clock3} tone="violet" label="Learning time" value={hours} unit=" hrs" note="All time" />
            <StatCard icon={Award} tone="amber" label="Certificates" value={s.certificates} note={s.certificates ? 'Well done' : 'Finish a course'} />
            <StatCard icon={Flame} tone="green" label="Day streak" value={s.streakDays} unit={s.streakDays === 1 ? ' day' : ' days'} note={s.streakDays ? 'Don’t break it' : 'Learn today'} />
          </>
        )}
      </div>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="cont-h">
          <div className="panel-head"><div><h2 id="cont-h">Continue learning</h2><p className="muted">Pick up right where you left off.</p></div><Link to="/app/learning" className="text-link">View all <ArrowRight size={15} aria-hidden /></Link></div>
          {enr.loading && [0, 1].map((i) => <div className="resume-row" key={i}><Skeleton w={120} h={76} r={8} /><div style={{ flex: 1 }}><Skeleton w="70%" /><Skeleton w="40%" /></div></div>)}
          {enr.error && <ErrorState error={enr.error} onRetry={enr.reload} />}
          {!enr.loading && !enr.error && enr.data.length === 0 && (
            <EmptyState icon={BookOpen} title="You have not enrolled in a course yet" action={<Link to="/app/explore" className="btn btn-primary">Find your first course</Link>}>Browse the catalogue and start with something that excites you.</EmptyState>
          )}
          {!enr.loading && !enr.error && enr.data.length > 0 && active.length === 0 && <p className="muted pad">You have completed every course. Time to pick the next one.</p>}
          {active.slice(0, 3).map((e) => (
            <Link key={e.id} to={`/app/learn/${e.courseId}`} className="resume-row">
              <div className="resume-thumb"><CourseImage course={e.course} /></div>
              <div className="resume-info">
                <span className="course-cat">{e.course.category}</span>
                <b>{e.course.title}</b>
                <div className="progress" role="progressbar" aria-valuenow={e.progressPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`${e.course.title} progress`}><span style={{ width: `${e.progressPercent}%` }} /></div>
                <small className="muted">{e.progressPercent}% complete · {e.totalLessons - e.completedLessons} lessons left</small>
              </div>
              <span className="round-play" aria-hidden><Play size={16} fill="currentColor" /></span>
            </Link>
          ))}
        </section>

        <section className="panel" aria-labelledby="wk-h">
          <div className="panel-head"><div><h2 id="wk-h">This week</h2><p className="muted">Minutes learned per day.</p></div></div>
          {stats.loading ? <Skeleton h={180} r={10} /> : s && <WeeklyChart data={s.weekly} />}
          {s && <p className="week-total">{formatDuration(s.weekly.reduce((a, d) => a + d.minutes, 0))} this week</p>}
        </section>
      </div>

      <section className="panel" aria-labelledby="rec-h">
        <div className="panel-head"><div><h2 id="rec-h">Picked for your growth</h2><p className="muted">Highly rated courses you have not started.</p></div><Link to="/app/explore" className="text-link">Explore all <ArrowRight size={15} aria-hidden /></Link></div>
        {catalog.loading ? <CardSkeletons count={3} /> : catalog.error ? <ErrorState error={catalog.error} onRetry={catalog.reload} /> : recs.length === 0 ? <p className="muted pad">You have enrolled in everything we have. New courses arrive regularly.</p> : (
          <div className="course-grid">{recs.map((c, i) => <CourseCard key={c.id} course={c} index={i} to={`/app/courses/${c.id}`} />)}</div>
        )}
      </section>
    </>
  );
}

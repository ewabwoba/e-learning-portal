import React, { useState } from 'react';
import { courseStatus } from '../../../domain/access';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Award, BookOpen, ChevronRight, Clock3, FileText, Infinity as InfinityIcon, PlayCircle, Smartphone, Users, ArrowRight } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useAuth } from '../../../application/AuthContext';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import CourseImage from '../../components/CourseImage';
import Stars from '../../components/Stars';
import { ErrorState, Skeleton } from '../../components/States';
import { initials, formatDuration, formatPrice, discountPercent, curriculumStats, formatCount } from '../../../domain/course';

function DetailSkeleton() {
  return (
    <div className="container detail-wrap" aria-busy="true" aria-label="Loading course">
      <div><Skeleton w="30%" /><div style={{ height: 14 }} /><Skeleton h={38} /><div style={{ height: 14 }} /><Skeleton w="70%" h={18} /><div style={{ height: 28 }} /><Skeleton h={260} r={12} /></div>
      <Skeleton h={380} r={12} />
    </div>
  );
}

export default function CourseDetail({ inApp = false }) {
  const { id } = useParams();
  const repo = useRepo();
  const nav = useNavigate();
  const loc = useLocation();
  const toast = useToast();
  const { user, isAuthenticated } = useAuth();
  const [busy, setBusy] = useState(false);
  const course = useAsync(() => repo.courses.get(id), [repo, id]);
  const mine = useAsync(() => (user?.role === 'STUDENT' ? repo.learning.enrollments() : Promise.resolve([])), [repo, user?.id]);
  useDocumentTitle(course.data?.title);

  if (course.loading) return <DetailSkeleton />;
  if (course.error) return <div className="container" style={{ padding: '56px 0' }}><ErrorState error={course.error} onRetry={course.reload} title="Course unavailable" /></div>;

  const c = course.data;
  const stats = curriculumStats(c.modules);
  const enrolled = (mine.data || []).find((e) => e.courseId === c.id);
  const isOwner = user?.role === 'INSTRUCTOR' && user.id === c.instructor.id;
  const off = discountPercent(c);
  const learnPath = `/app/learn/${c.id}`;

  const enroll = async () => {
    if (!isAuthenticated) { nav(`/login?next=${encodeURIComponent(loc.pathname)}&intent=enroll`); return; }
    setBusy(true);
    try { await repo.learning.enroll(c.id); toast.success('You are enrolled. Happy learning!'); nav(learnPath); }
    catch (e) { toast.error(e.message); setBusy(false); }
  };

  let cta;
  if (enrolled) cta = <Link to={learnPath} className="btn btn-primary btn-lg btn-block">{enrolled.progressPercent ? 'Continue learning' : 'Start learning'} <ArrowRight size={17} aria-hidden /></Link>;
  else if (isOwner) cta = <Link to={`/app/teach/courses/${c.id}`} className="btn btn-primary btn-lg btn-block">Edit this course</Link>;
  else if (user?.role === 'ADMIN') cta = <><Link to={`/app/admin/courses/${c.id}`} className="btn btn-primary btn-lg btn-block">Edit this course</Link><Link to={`/app/admin/courses${c.status === 'PENDING_REVIEW' ? '?status=PENDING_REVIEW' : ''}`} className="btn btn-outline btn-lg btn-block" style={{ marginTop: 10 }}>Back to admin</Link></>;
  else if (user?.role === 'INSTRUCTOR') cta = <p className="buy-note">You are signed in as an instructor. Use a student account to enrol in courses.</p>;
  else cta = (
    <button type="button" className="btn btn-primary btn-lg btn-block" onClick={enroll} disabled={busy}>
      {busy ? <><span className="spinner" aria-hidden /> Enrolling…</> : isAuthenticated ? (c.price === 0 ? 'Enrol for free' : 'Enrol now') : 'Sign in to enrol'}
    </button>
  );

  return (
    <div className="detail">
      <div className="detail-hero">
        <div className="container">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to={inApp ? '/app/explore' : '/courses'}>Courses</Link><ChevronRight size={14} aria-hidden />
            <Link to={`${inApp ? '/app/explore' : '/courses'}?category=${encodeURIComponent(c.category)}`}>{c.category}</Link>
          </nav>
          <div className="detail-hero-copy">
            <div className="chips">{c.badge && <span className={`badge badge-${c.badge}`}>{c.badge}</span>}<span className="pill">{c.level}</span>{c.status !== 'PUBLISHED' && <span className={`pill ${courseStatus(c.status).pill}`}>{courseStatus(c.status).label} · preview</span>}</div>
            <h1>{c.title}</h1>
            <p className="lead">{c.description}</p>
            <div className="detail-meta">
              {c.rating > 0 && <span className="rating"><Stars value={c.rating} /> <b className="num">{c.rating}</b><span className="muted"> ({formatCount(c.ratingCount)} ratings)</span></span>}
              <span><Users size={16} aria-hidden /> {formatCount(c.students)} students</span>
              <span><Clock3 size={16} aria-hidden /> {formatDuration(stats.minutes)}</span>
            </div>
            <div className="by"><span className="avatar sm">{initials(c.instructor.name)}</span><span>Created by <b>{c.instructor.name}</b></span></div>
          </div>
        </div>
      </div>

      <div className="container detail-wrap">
        <div className="detail-main">
          <section aria-labelledby="inc-h" className="box">
            <h2 id="inc-h">What you will learn</h2>
            <ul className="learn-list">
              {c.modules.slice(0, 6).map((m) => <li key={m.id}><span className="tick" aria-hidden>✓</span>{m.title}</li>)}
              {c.modules.length === 0 && <li className="muted">The curriculum for this course is coming soon.</li>}
            </ul>
          </section>

          <section aria-labelledby="cur-h" className="box">
            <div className="box-head"><h2 id="cur-h">Course curriculum</h2><span className="muted">{stats.modules} modules · {stats.lessons} lessons · {formatDuration(stats.minutes)}</span></div>
            <div className="curriculum">
              {c.modules.map((m, i) => (
                <details key={m.id} open={i === 0}>
                  <summary><span>{m.title}</span><small>{m.lessons.length} lessons</small></summary>
                  <ul>
                    {m.lessons.map((l) => (
                      <li key={l.id}>{l.type === 'VIDEO' ? <PlayCircle size={17} aria-hidden /> : <FileText size={17} aria-hidden />}<span>{l.title}</span><small>{formatDuration(l.durationMinutes)}</small></li>
                    ))}
                  </ul>
                </details>
              ))}
            </div>
          </section>

          <section aria-labelledby="ins-h" className="box instructor-box">
            <h2 id="ins-h">Your instructor</h2>
            <div className="ins-row"><span className="avatar lg">{initials(c.instructor.name)}</span><div><b>{c.instructor.name}</b><p className="muted">{c.instructor.headline || 'Coursely instructor'}</p></div></div>
          </section>
        </div>

        <aside className="buy-card" aria-label="Enrolment">
          <div className="buy-media"><CourseImage course={c} eager /></div>
          <div className="buy-body">
            <div className="buy-price"><strong>{formatPrice(c.price)}</strong>{off > 0 && <><s>{formatPrice(c.originalPrice)}</s><span className="pill pill-green">{off}% off</span></>}</div>
            {cta}
            {!enrolled && !isOwner && user?.role !== 'ADMIN' && c.price > 0 && <p className="buy-note">Payments are not connected in this starter, so enrolment is instant.</p>}
            <h3>This course includes</h3>
            <ul className="includes">
              <li><PlayCircle size={17} aria-hidden /> {formatDuration(stats.minutes)} of lessons</li>
              <li><BookOpen size={17} aria-hidden /> {stats.lessons} lessons in {stats.modules} modules</li>
              <li><Smartphone size={17} aria-hidden /> Learn on desktop, tablet and mobile</li>
              <li><InfinityIcon size={17} aria-hidden /> Full lifetime access</li>
              <li><Award size={17} aria-hidden /> Certificate of completion</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

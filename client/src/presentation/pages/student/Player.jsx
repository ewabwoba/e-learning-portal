import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Award, CheckCircle2, ChevronLeft, ChevronRight, Circle, FileText, Play, PlayCircle } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import { ErrorState, Skeleton } from '../../components/States';
import CourseArt from '../../components/CourseArt';
import { formatDuration, nextLesson } from '../../../domain/course';
import { percent } from '../../../domain/progress';

function LessonStage({ lesson, course }) {
  const isFile = lesson.type === 'VIDEO' && /^https?:\/\/.+\.(mp4|webm)(\?.*)?$/i.test(lesson.content || '');
  if (lesson.type === 'READING') {
    return <article className="reading"><span className="pill"><FileText size={14} aria-hidden /> Reading</span><h2>{lesson.title}</h2><p>{lesson.content || 'No reading material has been added to this lesson yet.'}</p></article>;
  }
  if (isFile) return <video className="video" controls preload="metadata" src={lesson.content} aria-label={lesson.title} />;
  return (
    <div className="video placeholder">
      <CourseArt category={course.category} />
      <div className="video-overlay"><span className="big-play" aria-hidden><Play size={30} fill="currentColor" /></span><b>{lesson.title}</b><small>Lesson video placeholder · {formatDuration(lesson.durationMinutes)}</small></div>
    </div>
  );
}

export default function Player() {
  const { courseId } = useParams();
  const repo = useRepo();
  const toast = useToast();
  const [sp, setSp] = useSearchParams();
  const { data, error, loading, reload, setData } = useAsync(() => repo.learning.course(courseId), [repo, courseId]);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(data?.title);

  const lessons = useMemo(() => (data?.modules || []).flatMap((m) => m.lessons), [data]);
  const current = lessons.find((l) => String(l.id) === sp.get('lesson')) || (data && nextLesson(data));
  useEffect(() => { if (data && current && sp.get('lesson') !== String(current.id)) setSp({ lesson: current.id }, { replace: true }); }, [data, current, sp, setSp]);

  if (loading) return <div className="player"><div><Skeleton h={420} r={14} /><div style={{ height: 16 }} /><Skeleton w="50%" h={28} /></div><Skeleton h={420} r={14} /></div>;
  if (error) return <ErrorState error={error} onRetry={reload} title={error.status === 403 ? 'Enrol to start learning' : 'We could not open this course'} />;
  if (!current) return <ErrorState error={{ message: 'This course does not have any lessons yet.' }} title="No lessons yet" />;

  const idx = lessons.findIndex((l) => l.id === current.id);
  const prev = lessons[idx - 1]; const next = lessons[idx + 1];
  const go = (l) => setSp({ lesson: l.id });
  const done = lessons.filter((l) => l.completed).length;
  const pct = percent(done, lessons.length);

  const toggle = async () => {
    if (data.preview) return;
    setBusy(true);
    try {
      const r = await repo.learning.toggleLesson(data.id, current.id);
      setData((d) => ({ ...d, progressPercent: r.progressPercent, completedLessons: r.completedLessons, modules: d.modules.map((m) => ({ ...m, lessons: m.lessons.map((l) => (l.id === r.lessonId ? { ...l, completed: r.completed } : l)) })) }));
      if (r.completed && r.progressPercent === 100) toast.success('Course complete. Your certificate is ready!');
      else if (r.completed && next) go(next);
    } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="player-wrap">
      <nav className="crumbs" aria-label="Breadcrumb"><Link to="/app/learning">My learning</Link><ChevronRight size={14} aria-hidden /><span>{data.title}</span></nav>
      <div className="player">
        <div className="player-main">
          <LessonStage lesson={current} course={data} />
          <div className="lesson-bar">
            <div><span className="course-cat">Lesson {idx + 1} of {lessons.length}</span><h1>{current.title}</h1></div>
            {!data.preview && (
              <button type="button" className={`btn ${current.completed ? 'btn-outline' : 'btn-primary'}`} onClick={toggle} disabled={busy} aria-pressed={current.completed}>
                {busy ? <span className="spinner" aria-hidden /> : <CheckCircle2 size={18} aria-hidden />}{current.completed ? 'Completed' : 'Mark as complete'}
              </button>
            )}
          </div>
          {data.preview && <p className="buy-note">Instructor preview. Progress is not tracked.</p>}
          {pct === 100 && !data.preview && <div className="cert-banner"><Award size={26} aria-hidden /><div><b>Course complete</b><p>You finished every lesson in {data.title}. Your certificate has been added to your account.</p></div></div>}
          <div className="lesson-nav">
            <button type="button" className="btn btn-outline" disabled={!prev} onClick={() => go(prev)}><ChevronLeft size={17} aria-hidden /> Previous</button>
            <button type="button" className="btn btn-primary" disabled={!next} onClick={() => go(next)}>Next lesson <ChevronRight size={17} aria-hidden /></button>
          </div>
        </div>

        <aside className="player-side" aria-label="Course content">
          <div className="side-head">
            <b>{data.title}</b>
            <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress"><span style={{ width: `${pct}%` }} /></div>
            <small className="muted">{done} of {lessons.length} lessons · {pct}%</small>
          </div>
          {data.modules.map((m, mi) => (
            <details key={m.id} open={m.lessons.some((l) => l.id === current.id) || mi === 0}>
              <summary><span>{m.title}</span><small>{m.lessons.filter((l) => l.completed).length}/{m.lessons.length}</small></summary>
              <ul>
                {m.lessons.map((l) => (
                  <li key={l.id}>
                    <button type="button" className={l.id === current.id ? 'on' : ''} aria-current={l.id === current.id ? 'true' : undefined} onClick={() => go(l)}>
                      {l.completed ? <CheckCircle2 size={18} className="ok" aria-label="Completed" /> : <Circle size={18} aria-label="Not completed" />}
                      <span>{l.title}<small>{l.type === 'VIDEO' ? <PlayCircle size={12} aria-hidden /> : <FileText size={12} aria-hidden />} {formatDuration(l.durationMinutes)}</small></span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </aside>
      </div>
    </div>
  );
}

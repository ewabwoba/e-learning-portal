import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import CourseCard from '../../components/CourseCard';
import { CardSkeletons, EmptyState, ErrorState } from '../../components/States';

const TABS = [['all', 'All'], ['active', 'In progress'], ['done', 'Completed']];

export default function MyLearning() {
  useDocumentTitle('My learning');
  const repo = useRepo();
  const [tab, setTab] = useState('all');
  const { data, loading, error, reload } = useAsync(() => repo.learning.enrollments(), [repo]);
  const list = (data || []).filter((e) => tab === 'all' || (tab === 'done' ? e.progressPercent === 100 : e.progressPercent < 100));
  const count = (t) => (data || []).filter((e) => t === 'all' || (t === 'done' ? e.progressPercent === 100 : e.progressPercent < 100)).length;

  return (
    <>
      <PageHeader eyebrow="Your learning space" title="My learning">All your courses and progress, together in one place.</PageHeader>
      <div className="tabs" role="tablist" aria-label="Filter courses">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{label}{data && <span className="tab-count">{count(k)}</span>}</button>
        ))}
      </div>
      <div role="tabpanel" aria-busy={loading}>
        {loading && <CardSkeletons count={3} />}
        {error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && list.length === 0 && (
          tab === 'done'
            ? <EmptyState icon={Trophy} title="No completed courses yet" action={<button className="btn btn-primary" onClick={() => setTab('active')}>See courses in progress</button>}>Finish every lesson in a course to earn your certificate.</EmptyState>
            : <EmptyState icon={BookOpen} title="Nothing here yet" action={<Link to="/app/explore" className="btn btn-primary">Explore courses</Link>}>Enrol in a course and it will appear here with your progress.</EmptyState>
        )}
        {!loading && !error && list.length > 0 && (
          <div className="course-grid">
            {list.map((e, i) => <CourseCard key={e.id} index={i} course={e.course} enrollment={e} to={`/app/learn/${e.courseId}`} />)}
          </div>
        )}
      </div>
    </>
  );
}

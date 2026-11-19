import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award, BookOpenCheck, Clock3, MonitorSmartphone, PlayCircle, Star, Users, GraduationCap, Check, ChartColumn, BadgeDollarSign, UserPlus, Search, Trophy } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useAuth, homeFor } from '../../../application/AuthContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import CourseArt from '../../components/CourseArt';
import CourseImage from '../../components/CourseImage';
import { CATEGORY_META } from '../../components/categoryMeta';
import { Skeleton, ErrorState } from '../../components/States';
import { CATEGORIES, formatCount, formatHours } from '../../../domain/course';

const HERO_IMG = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=900&q=80';

function HeroVisual() {
  const [failed, setFailed] = useState(false);
  return (
    <div className="hero-visual">
      <div className="hero-blob" aria-hidden />
      <div className="hero-photo">
        {failed ? <CourseArt category="Development" /> : <img src={HERO_IMG} alt="A smiling instructor holding a laptop" onError={() => setFailed(true)} />}
      </div>
      <div className="float-card f1"><span className="f-icon"><Award size={22} aria-hidden /></span><b>12K+ Certified learners</b></div>
      <div className="float-card f2">
        <div className="mini-bars" aria-hidden><i style={{ height: '70%' }} /><i style={{ height: '38%' }} /><i style={{ height: '100%' }} /></div>
        <div><b>135+ Hours</b><small>Course &amp; videos</small><b>85+ Instructors</b><small>Teaching &amp; sharing</small></div>
      </div>
      <div className="float-card f3"><span className="f-icon"><GraduationCap size={22} aria-hidden /></span><b>4.9 Average rating</b></div>
    </div>
  );
}

function PopularCard({ c }) {
  return (
    <Link to={`/courses/${c.id}`} className="pop-card">
      <div className="pop-media"><CourseImage course={c} /></div>
      <div className="pop-row"><span className="tag-outline">{c.category}</span><span className="pop-level">Level: <b>{c.level.toUpperCase()}</b></span></div>
      <h3>{c.title}</h3>
      <p>{c.description}</p>
      <div className="pop-stats">
        <span><i className="s-ic s1"><Users size={15} aria-hidden /></i>{formatCount(c.students)}</span>
        <span><i className="s-ic s2"><Star size={15} aria-hidden /></i>{c.rating || '–'}</span>
        <span><i className="s-ic s3"><Clock3 size={15} aria-hidden /></i>{formatHours(c.durationMinutes)}</span>
      </div>
    </Link>
  );
}

const BENEFITS = [
  { icon: PlayCircle, tone: 'b1', title: 'Learn from experts', text: 'Short, practical video lessons and notes from instructors who work in the field every day.' },
  { icon: MonitorSmartphone, tone: 'b2', title: 'Learn your way', text: 'Pick up on any device, pause anywhere, and resume exactly where you left off.' },
  { icon: ChartColumn, tone: 'b3', title: 'See your progress', text: 'Track completed lessons, learning time and streaks so momentum never slips.' },
  { icon: Trophy, tone: 'b4', title: 'Finish with a certificate', text: 'Complete a course and earn proof of your new skill to share with employers.' },
];

const STEPS = [
  { icon: UserPlus, title: 'Create your free account', text: 'Join as a student or an instructor in under a minute.' },
  { icon: Search, title: 'Find the right course', text: 'Filter by category, level, rating and price, then enrol.' },
  { icon: BookOpenCheck, title: 'Learn and grow', text: 'Complete lessons at your pace and track every step.' },
];

const FAQ = [
  ['Is Coursely free to join?', 'Yes. Creating an account is free, and some courses are free too. Paid courses show their price before you enrol.'],
  ['Can I learn on my phone or tablet?', 'Yes. Coursely is designed to work comfortably on desktop, tablet and mobile, and your progress follows your account.'],
  ['How do I become an instructor?', 'Create an account as an instructor, build your curriculum in the course editor, and publish when you are ready.'],
  ['Do I get a certificate?', 'Completing every lesson in a course marks it as complete and adds it to your certificates.'],
];

export default function Home() {
  useDocumentTitle('');
  const repo = useRepo();
  const { user, isAuthenticated } = useAuth();
  const { data: courses, error, loading, reload } = useAsync(() => repo.courses.list(), [repo]);
  const popular = (courses || []).slice().sort((a, b) => b.students - a.students).slice(0, 5);
  const counts = (courses || []).reduce((m, c) => ({ ...m, [c.category]: (m[c.category] || 0) + 1 }), {});
  const cats = CATEGORIES.slice().sort((a, b) => (counts[b] || 0) - (counts[a] || 0)).slice(0, 6);

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <h1>Enhance your Skills for a <span>Brighter Future</span></h1>
            <p>Discover the most popular courses to enhance your skills and advance your career, from business and technology to creative arts and personal development.</p>
            <div className="hero-cta">
              <Link to="/courses" className="btn btn-primary btn-lg">Explore Courses</Link>
              {isAuthenticated
                ? <Link to={homeFor(user)} className="btn btn-outline btn-lg">Go to my dashboard</Link>
                : <Link to="/register?role=INSTRUCTOR" className="btn btn-outline btn-lg">Become an instructor</Link>}
            </div>
            <ul className="hero-points">
              <li><Check size={16} aria-hidden /> Free to join</li><li><Check size={16} aria-hidden /> Learn at your pace</li><li><Check size={16} aria-hidden /> Certificates on completion</li>
            </ul>
          </div>
          <HeroVisual />
        </div>
      </section>

      <section className="popular" aria-labelledby="popular-h">
        <div className="container popular-grid">
          <div className="popular-intro">
            <h2 id="popular-h">Popular Courses</h2>
            <p>Discover the most popular courses to enhance your skills.</p>
            <Link to="/courses" className="text-link">Browse all courses <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <div className="pop-track" tabIndex={0} aria-label="Popular courses, scroll horizontally">
            {loading && [0, 1, 2].map((i) => <div className="pop-card" key={i} aria-hidden><Skeleton h={150} r={8} /><Skeleton w="50%" h={20} /><Skeleton h={22} /><Skeleton w="80%" /></div>)}
            {error && <ErrorState error={error} onRetry={reload} title="We could not load courses" />}
            {popular.map((c) => <PopularCard key={c.id} c={c} />)}
          </div>
        </div>
      </section>

      <section className="section" id="why" aria-labelledby="why-h">
        <div className="container">
          <div className="section-head center"><span className="eyebrow">Why Coursely</span><h2 id="why-h">Everything you need to learn with confidence</h2><p>One calm, focused place for students to learn and for instructors to teach.</p></div>
          <div className="benefit-grid">
            {BENEFITS.map(({ icon: Icon, tone, title, text }) => (
              <div className="benefit" key={title}><span className={`b-icon ${tone}`}><Icon size={26} aria-hidden /></span><h3>{title}</h3><p>{text}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section categories" id="categories" aria-labelledby="cat-h">
        <div className="container">
          <div className="section-head row">
            <div><span className="eyebrow">Learn something new</span><h2 id="cat-h">Explore Courses by Categories</h2></div>
            <Link to="/courses" className="text-link">View All <ArrowRight size={16} aria-hidden /></Link>
          </div>
          <div className="cat-grid">
            {cats.map((c) => {
              const { icon: Icon, bg, fg } = CATEGORY_META[c];
              return (
                <Link key={c} to={`/courses?category=${encodeURIComponent(c)}`} className="cat-card">
                  <span className="cat-tile" style={{ background: bg, color: fg }}><Icon size={40} strokeWidth={1.6} aria-hidden /></span>
                  <span><b>{c}</b><small>{loading ? '…' : `${counts[c] || 0} ${counts[c] === 1 ? 'course' : 'courses'}`}</small></span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section" id="how" aria-labelledby="how-h">
        <div className="container">
          <div className="section-head center"><span className="eyebrow">How it works</span><h2 id="how-h">Start learning in three simple steps</h2></div>
          <ol className="steps">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title}><span className="step-no">{i + 1}</span><span className="step-icon"><Icon size={24} aria-hidden /></span><h3>{title}</h3><p>{text}</p></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section teach" aria-labelledby="teach-h">
        <div className="container teach-panel">
          <div className="teach-copy">
            <span className="eyebrow">For instructors</span>
            <h2 id="teach-h">Share what you know. Reach learners everywhere.</h2>
            <p>Build your curriculum with modules and lessons, set your own price, and follow your students’ progress from one workspace.</p>
            <ul className="check-list">
              <li><Check size={18} aria-hidden /> Simple course editor with drafts and publishing</li>
              <li><Check size={18} aria-hidden /> Student roster with progress at a glance</li>
              <li><Check size={18} aria-hidden /> Earnings and enrolment insights</li>
            </ul>
            <Link to="/register?role=INSTRUCTOR" className="btn btn-primary btn-lg">Start teaching <ArrowRight size={17} aria-hidden /></Link>
          </div>
          <div className="teach-visual" aria-hidden>
            <div className="teach-card"><BadgeDollarSign size={22} /><div><small>Monthly earnings</small><b>$2,480</b></div></div>
            <div className="teach-card t2"><Users size={22} /><div><small>New students</small><b>+128</b></div></div>
            <CourseArt category="Business" />
          </div>
        </div>
      </section>

      <section className="section faq" id="faq" aria-labelledby="faq-h">
        <div className="container faq-wrap">
          <div className="section-head"><span className="eyebrow">FAQ</span><h2 id="faq-h">Questions, answered</h2></div>
          <div className="faq-list">
            {FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      <section className="cta-band">
        <div className="container cta-inner">
          <div><h2>Ready to learn something that changes everything?</h2><p>Join for free and take your first lesson today.</p></div>
          <Link to="/register" className="btn btn-light btn-lg">Join for Free <ArrowRight size={17} aria-hidden /></Link>
        </div>
      </section>
    </>
  );
}

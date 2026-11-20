import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, X, ArrowRight } from 'lucide-react';
import Brand from '../components/Brand';
import { metaFor } from '../components/categoryMeta';
import { useCategories } from '../../application/useCategories';
import { initials } from '../../domain/course';
import { useAuth, homeFor } from '../../application/AuthContext';
import { useDismiss } from '../../application/useDismiss';

function ExploreMenu() {
  const categories = useCategories();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const loc = useLocation();
  useDismiss(ref, open, () => setOpen(false));
  useEffect(() => setOpen(false), [loc]);
  return (
    <div className="explore" ref={ref}>
      <button type="button" className="btn btn-primary btn-sm explore-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        Explore <ChevronDown size={15} aria-hidden />
      </button>
      {open && (
        <div className="menu explore-menu">
          <Link to="/courses" className="menu-all">Browse all courses <ArrowRight size={15} aria-hidden /></Link>
          {categories.map((c) => {
            const { icon: Icon, bg, fg } = metaFor(c);
            return <Link key={c} to={`/courses?category=${encodeURIComponent(c)}`}><span className="menu-icon" style={{ background: bg, color: fg }}><Icon size={16} aria-hidden /></span>{c}</Link>;
          })}
        </div>
      )}
    </div>
  );
}

function HeaderSearch({ id }) {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return (
    <form className="input-group header-search" role="search" onSubmit={(e) => { e.preventDefault(); nav(`/courses${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}>
      <label htmlFor={id} className="sr-only">Search courses</label>
      <input id={id} className="input" placeholder="What do you want to learn?" value={q} onChange={(e) => setQ(e.target.value)} />
      <button type="submit" aria-label="Search"><Search size={18} aria-hidden /></button>
    </form>
  );
}

export function Header() {
  const { user, isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => setOpen(false), [loc]);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <ExploreMenu />
        <div className="header-search-wrap"><HeaderSearch id="hs-desktop" /></div>
        <nav className="header-nav" aria-label="Primary">
          <NavLink to="/courses">Courses</NavLink>
          <a href="/#how">How it works</a>
          <Link to="/register?role=INSTRUCTOR">Teach</Link>
        </nav>
        <div className="header-actions">
          {isAuthenticated ? (
            <Link to={homeFor(user)} className="btn btn-primary btn-sm"><span className="avatar sm" aria-hidden>{initials(user.name)}</span> My dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Log in</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Join for Free</Link>
            </>
          )}
        </div>
        <button type="button" className="icon-btn burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen(!open)}>{open ? <X size={20} /> : <Menu size={20} />}</button>
      </div>
      <div id="mobile-nav" className={`mobile-nav ${open ? 'open' : ''}`} hidden={!open}>
        <div className="container">
          <HeaderSearch id="hs-mobile" />
          <nav aria-label="Mobile">
            <Link to="/courses">All courses</Link>
            <a href="/#categories">Categories</a>
            <a href="/#how">How it works</a>
            <Link to="/register?role=INSTRUCTOR">Teach on Coursely</Link>
          </nav>
          <div className="mobile-actions">
            {isAuthenticated ? <Link to={homeFor(user)} className="btn btn-primary btn-block">My dashboard</Link> : (<><Link to="/login" className="btn btn-outline btn-block">Log in</Link><Link to="/register" className="btn btn-primary btn-block">Join for Free</Link></>)}
          </div>
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand />
          <p>Expert-led courses for students and instructors. Build skills for the future you want.</p>
        </div>
        <nav aria-label="Learn"><h4>Learn</h4><Link to="/courses">All courses</Link><Link to="/courses?badge=HOT">Hot right now</Link><Link to="/courses?price=free">Free courses</Link><Link to="/register">Create account</Link></nav>
        <nav aria-label="Teach"><h4>Teach</h4><Link to="/register?role=INSTRUCTOR">Become an instructor</Link><Link to="/login">Instructor sign in</Link></nav>
        <nav aria-label="Explore"><h4>Explore</h4><a href="/#categories">Categories</a><a href="/#how">How it works</a><a href="/#faq">FAQ</a><a href="mailto:support@coursely.example">Contact support</a></nav>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} Coursely. Learn something that matters.</span><span>Built with React and Spring Boot</span></div>
    </footer>
  );
}

export default function PublicLayout() {
  const loc = useLocation();
  useEffect(() => { if (!loc.hash) window.scrollTo(0, 0); }, [loc.pathname, loc.hash]);
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}><Outlet /></main>
      <Footer />
    </>
  );
}

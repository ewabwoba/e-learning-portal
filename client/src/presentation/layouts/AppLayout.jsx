import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Compass, GraduationCap, Globe, LayoutDashboard, LogOut, Menu, Plus, Search, Settings, Users, X, ChevronDown, Library, ShieldCheck, UserCog, Tags, ClipboardList, ScrollText, RefreshCw } from 'lucide-react';
import Brand from '../components/Brand';
import { PageLoader } from '../components/States';
import { useAuth } from '../../application/AuthContext';
import { useDismiss } from '../../application/useDismiss';
import { initials } from '../../domain/course';
import { ROLE_LABEL, homeForRole } from '../../domain/access';
import { useToast } from '../../application/ToastContext';

const NAV = {
  STUDENT: [
    ['/app', 'Dashboard', LayoutDashboard, true],
    ['/app/learning', 'My learning', BookOpen],
    ['/app/explore', 'Explore courses', Compass],
    ['/app/settings', 'Settings', Settings],
  ],
  ADMIN: [
    ['/app/admin', 'Dashboard', LayoutDashboard, true],
    ['/app/admin/courses', 'Courses', Library],
    ['/app/admin/users', 'Users & instructors', UserCog],
    ['/app/admin/categories', 'Categories', Tags],
    ['/app/admin/enrollments', 'Enrolments', ClipboardList],
    ['/app/admin/audit', 'Audit log', ScrollText],
    ['/app/settings', 'Settings', Settings],
  ],
  INSTRUCTOR: [
    ['/app/teach', 'Dashboard', LayoutDashboard, true],
    ['/app/teach/courses', 'My courses', Library],
    ['/app/teach/students', 'Students', Users],
    ['/app/explore', 'Marketplace', Compass],
    ['/app/settings', 'Settings', Settings],
  ],
};

function AccountMenu() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useDismiss(ref, open, () => setOpen(false));
  return (
    <div className="account" ref={ref}>
      <button type="button" className="account-btn" aria-expanded={open} aria-haspopup="true" onClick={() => setOpen(!open)}>
        <span className="avatar sm" aria-hidden>{initials(user.name)}</span>
        <span className="account-name"><b>{user.name}</b><small>{ROLE_LABEL[user.role] || 'Student'}</small></span>
        <ChevronDown size={16} aria-hidden />
      </button>
      {open && (
        <div className="menu account-menu">
          <div className="menu-user"><b>{user.name}</b><small>{user.email}</small></div>
          <Link to="/app/settings" onClick={() => setOpen(false)}><Settings size={16} aria-hidden /> Account settings</Link>
          <Link to="/" onClick={() => setOpen(false)}><Globe size={16} aria-hidden /> Public website</Link>
          <button type="button" onClick={() => { logout(); nav('/'); }}><LogOut size={16} aria-hidden /> Log out</button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user, ready, isAuthenticated, mode, logout } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();
  const [drawer, setDrawer] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => { setDrawer(false); if (!loc.hash) window.scrollTo(0, 0); }, [loc.pathname]);
  useEffect(() => {
    if (!drawer) return undefined;
    const esc = (e) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [drawer]);

  if (!ready) return <PageLoader label="Loading your workspace" />;
  if (!isAuthenticated) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />;

  const instructor = user.role === 'INSTRUCTOR';
  const isAdmin = user.role === 'ADMIN';
  const links = NAV[user.role] || NAV.STUDENT;

  return (
    <div className="shell">
      <a href="#app-main" className="skip-link">Skip to content</a>
      {drawer && <div className="drawer-backdrop shell-backdrop" onClick={() => setDrawer(false)} aria-hidden />}
      <aside className={`sidebar ${drawer ? 'open' : ''}`} aria-label="Workspace">
        <div className="sidebar-top">
          <Brand to={homeForRole(user.role)} />
          <button type="button" className="icon-btn sidebar-close" onClick={() => setDrawer(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="side-nav" aria-label="Main">
          {links.map(([to, label, Icon, end]) => (
            <NavLink key={to} to={to} end={end} className="side-link" title={label}><Icon size={20} aria-hidden /><span>{label}</span></NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="side-card">
            {isAdmin ? <><b>Platform admin</b><p>You can see and change everything. Actions are logged.</p><Link to="/app/admin/users?tab=approvals" className="btn btn-primary btn-sm btn-block"><ShieldCheck size={16} aria-hidden /> Approvals</Link></>
              : instructor ? <><b>Share your expertise</b><p>Build a course and reach learners everywhere.</p><Link to="/app/teach/courses/new" className="btn btn-primary btn-sm btn-block"><Plus size={16} aria-hidden /> New course</Link></>
              : <><b>Keep your momentum</b><p>Small steps lead to big things.</p><Link to="/app/explore" className="btn btn-primary btn-sm btn-block">Find a course</Link></>}
          </div>
          <button type="button" className="side-link logout" onClick={() => { logout(); nav('/'); }} title="Log out"><LogOut size={20} aria-hidden /><span>Log out</span></button>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <button type="button" className="icon-btn burger-app" onClick={() => setDrawer(true)} aria-label="Open menu" aria-expanded={drawer}><Menu size={20} /></button>
          <form className="topbar-search" role="search" onSubmit={(e) => { e.preventDefault(); nav(`/app/explore${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); }}>
            <Search size={17} aria-hidden /><label htmlFor="app-q" className="sr-only">Search courses</label>
            <input id="app-q" placeholder="Search courses" value={q} onChange={(e) => setQ(e.target.value)} />
          </form>
          <div className="topbar-right">
            {isAdmin
              ? <Link to="/app/admin/courses?status=PENDING_REVIEW" className="btn btn-primary btn-sm topbar-cta"><ShieldCheck size={16} aria-hidden /><span>Review queue</span></Link>
              : instructor
              ? <Link to="/app/teach/courses/new" className="btn btn-primary btn-sm topbar-cta"><Plus size={16} aria-hidden /><span>New course</span></Link>
              : <Link to="/app/explore" className="btn btn-primary btn-sm topbar-cta"><GraduationCap size={16} aria-hidden /><span>Explore</span></Link>}
            <AccountMenu />
          </div>
        </header>
        {instructor && <ApprovalBanner />}
        {mode === 'demo' && <div className="demo-banner" role="note">Offline demo mode: the API was not detected, so data is saved in this browser only.</div>}
        <main id="app-main" className="shell-content" tabIndex={-1}><Outlet /></main>
      </div>
    </div>
  );
}

function ApprovalBanner() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  if (user.approval === 'APPROVED' || !user.approval) return null;
  const rejected = user.approval === 'REJECTED';
  const check = async () => {
    setBusy(true);
    try { const u = await refreshUser(); if (u?.approval === 'APPROVED') toast.success('You are approved. You can now submit courses.'); else toast.info('Still waiting for approval.'); } catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className={`approval-banner ${rejected ? 'bad' : ''}`} role="status">
      <ShieldCheck size={18} aria-hidden />
      <p>{rejected ? <>Your instructor application needs changes{user.approvalNote ? <>: <b>{user.approvalNote}</b></> : '.'} You can keep drafting, but you cannot submit courses yet.</> : <>Your instructor account is awaiting approval. You can draft courses now and submit them once an admin approves you.</>}</p>
      <button type="button" className="btn btn-ghost btn-sm" onClick={check} disabled={busy}><RefreshCw size={14} aria-hidden /> Check status</button>
    </div>
  );
}

/** `role` may be a single role or an array. Anyone else is sent to their own home. */
export function RoleGuard({ role, children }) {
  const { user } = useAuth();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(user.role)) return <Navigate to={homeForRole(user.role)} replace />;
  return children;
}

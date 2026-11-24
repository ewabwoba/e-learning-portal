// Offline repository: the same contract as apiRepository, persisted in localStorage.
// Used automatically when the Spring Boot API is unreachable, so the UI can be explored on its own.
import { ApiError } from './httpClient';
import { getToken } from './session';
import { seedUsers, seedCourses, seedEnrollments, seedCategories, DEMO_PASSWORD } from './demoData';
import { calculateStreak, weeklyMinutes, percent } from '../domain/progress';
import { curriculumStats } from '../domain/course';

const KEY = 'coursely.demo.v3';
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

function seed() {
  const lessonIndex = {};
  seedCourses.forEach((c) => c.modules.forEach((m) => m.lessons.forEach((l) => { lessonIndex[l.id] = true; })));
  return {
    users: clone(seedUsers).map((u) => ({ status: 'ACTIVE', approval: 'APPROVED', createdAt: daysAgo(40), ...u, password: DEMO_PASSWORD })),
    categories: seedCategories.map((name, i) => ({ id: i + 1, name })),
    audit: [],
    courses: clone(seedCourses),
    enrollments: seedEnrollments.map((e) => ({
      id: e.id, userId: e.userId, courseId: e.courseId, enrolledAt: daysAgo(e.daysAgo),
      done: Object.fromEntries(e.done.filter(([lid]) => lessonIndex[lid]).map(([lid, d]) => [lid, daysAgo(d)])),
    })),
    next: { user: 100, course: 100, module: 10000, lesson: 100000, enrollment: 100, category: 100, audit: 1 },
  };
}

let db;
function load() {
  if (db) return db;
  try { const raw = localStorage.getItem(KEY); if (raw) db = JSON.parse(raw); } catch { /* ignore */ }
  if (!db) db = seed();
  return db;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } }

const publicUser = ({ password, ...u }) => u;
const userById = (id) => load().users.find((u) => u.id === id);

function currentUser(required = true) {
  const t = getToken();
  const id = t && t.startsWith('demo.') ? Number(t.slice(5)) : null;
  const u = id && userById(id)?.status === 'ACTIVE' ? userById(id) : null;
  if (!u && required) throw new ApiError('Please sign in to continue.', 401);
  return u;
}
const requireRole = (role) => {
  const u = currentUser();
  if (u.role !== role) throw new ApiError('You do not have access to this area.', 403);
  return u;
};
const fail = (message, status = 400) => { throw new ApiError(message, status); };
function audit(actor, action, targetType, targetId, details) {
  const d = load();
  d.audit.unshift({ id: d.next.audit++, actor: actor.email, action, targetType, targetId, details, createdAt: new Date().toISOString() });
  d.audit = d.audit.slice(0, 200);
}
const listed = (c) => c.status === 'PUBLISHED' && userById(c.instructorId)?.status === 'ACTIVE';

const studentCount = (c) => c.students + load().enrollments.filter((e) => e.courseId === c.id && e.id >= 100).length;

function summary(c) {
  const inst = userById(c.instructorId);
  const s = curriculumStats(c.modules);
  return {
    id: c.id, title: c.title, category: c.category, level: c.level, description: c.description,
    price: c.price, originalPrice: c.originalPrice, imageUrl: c.imageUrl, badge: c.badge, rejectionReason: c.rejectionReason || null,
    rating: c.rating, ratingCount: c.ratingCount, students: studentCount(c), status: c.status, createdAt: c.createdAt,
    durationMinutes: s.minutes, lessonCount: s.lessons, instructor: { id: inst.id, name: inst.name, headline: inst.headline },
  };
}
const stripContent = (modules) => modules.map((m) => ({ id: m.id, title: m.title, lessons: m.lessons.map(({ content, ...l }) => l) }));

function enrollmentView(e) {
  const c = load().courses.find((x) => x.id === e.courseId);
  const lessons = c.modules.flatMap((m) => m.lessons);
  const done = lessons.filter((l) => e.done[l.id]).length;
  const next = lessons.find((l) => !e.done[l.id]) || null;
  const last = Object.values(e.done).sort().pop() || e.enrolledAt;
  return {
    id: e.id, courseId: c.id, course: summary(c), enrolledAt: e.enrolledAt, lastActivityAt: last,
    completedLessons: done, totalLessons: lessons.length, progressPercent: percent(done, lessons.length), nextLessonId: next?.id ?? null,
  };
}

const auth = {
  async login({ email, password }) {
    await wait();
    const u = load().users.find((x) => x.email.toLowerCase() === String(email).trim().toLowerCase());
    if (!u || u.password !== password) throw new ApiError('That email and password do not match.', 401);
    if (u.status === 'SUSPENDED') throw new ApiError('This account has been suspended. Please contact support.', 403);
    return { token: `demo.${u.id}`, user: publicUser(u) };
  },
  async register({ name, email, password, role }) {
    await wait();
    const d = load();
    if (d.users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw new ApiError('An account with this email already exists.', 409, { email: 'This email is already registered.' });
    const u = { id: d.next.user++, name: name.trim(), email: email.trim(), role: role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT', headline: '', status: 'ACTIVE', approval: role === 'INSTRUCTOR' ? 'PENDING' : 'APPROVED', createdAt: new Date().toISOString(), password };
    d.users.push(u); save();
    return { token: `demo.${u.id}`, user: publicUser(u) };
  },
  async me() { await wait(80); return publicUser(currentUser()); },
  async updateProfile({ name, headline }) {
    await wait();
    const u = currentUser(); u.name = name.trim() || u.name; u.headline = headline ?? u.headline; save();
    return publicUser(u);
  },
};

const courses = {
  async list() { await wait(); return load().courses.filter(listed).map(summary); },
  async get(id) {
    await wait();
    const c = load().courses.find((x) => x.id === Number(id));
    const me = currentUser(false);
    if (!c || (!listed(c) && me?.id !== c.instructorId && me?.role !== 'ADMIN')) throw new ApiError('We could not find that course.', 404);
    return { ...summary(c), modules: stripContent(c.modules) };
  },
};

const learning = {
  async enrollments() { await wait(); const u = requireRole('STUDENT'); return load().enrollments.filter((e) => e.userId === u.id).map(enrollmentView).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)); },
  async enroll(courseId) {
    await wait(400);
    const u = requireRole('STUDENT'); const d = load();
    const c = d.courses.find((x) => x.id === Number(courseId) && listed(x));
    if (!c) throw new ApiError('We could not find that course.', 404);
    let e = d.enrollments.find((x) => x.userId === u.id && x.courseId === c.id);
    if (!e && c.price > 0) throw new ApiError('This course must be paid for before you can enrol.', 402);
    if (!e) { e = { id: d.next.enrollment++, userId: u.id, courseId: c.id, enrolledAt: new Date().toISOString(), done: {} }; d.enrollments.push(e); save(); }
    return enrollmentView(e);
  },
  async course(courseId) {
    await wait();
    const u = currentUser(); const d = load();
    const c = d.courses.find((x) => x.id === Number(courseId));
    if (!c) throw new ApiError('We could not find that course.', 404);
    const e = d.enrollments.find((x) => x.userId === u.id && x.courseId === c.id);
    if (!e && c.instructorId !== u.id && u.role !== 'ADMIN') throw new ApiError('Enroll in this course to start learning.', 403);
    const done = e?.done || {};
    const view = e ? enrollmentView(e) : { progressPercent: 0, completedLessons: 0, totalLessons: 0 };
    return {
      ...summary(c), progressPercent: view.progressPercent, completedLessons: view.completedLessons, totalLessons: view.totalLessons, preview: !e,
      modules: c.modules.map((m) => ({ id: m.id, title: m.title, lessons: m.lessons.map((l) => ({ ...l, completed: Boolean(done[l.id]) })) })),
    };
  },
  async toggleLesson(courseId, lessonId) {
    await wait(120);
    const u = requireRole('STUDENT'); const d = load();
    const e = d.enrollments.find((x) => x.userId === u.id && x.courseId === Number(courseId));
    if (!e) throw new ApiError('Enroll in this course first.', 403);
    if (e.done[lessonId]) delete e.done[lessonId]; else e.done[lessonId] = new Date().toISOString();
    save();
    const v = enrollmentView(e);
    return { lessonId: Number(lessonId), completed: Boolean(e.done[lessonId]), progressPercent: v.progressPercent, completedLessons: v.completedLessons, totalLessons: v.totalLessons };
  },
  async stats() {
    await wait();
    const u = requireRole('STUDENT'); const d = load();
    const mine = d.enrollments.filter((e) => e.userId === u.id);
    const views = mine.map(enrollmentView);
    const entries = [];
    mine.forEach((e) => {
      const c = d.courses.find((x) => x.id === e.courseId);
      c.modules.flatMap((m) => m.lessons).forEach((l) => { if (e.done[l.id]) entries.push({ at: e.done[l.id], minutes: l.durationMinutes }); });
    });
    return {
      inProgress: views.filter((v) => v.progressPercent < 100).length,
      completed: views.filter((v) => v.progressPercent === 100).length,
      certificates: views.filter((v) => v.progressPercent === 100).length,
      minutesLearned: entries.reduce((s, x) => s + x.minutes, 0),
      streakDays: calculateStreak(entries.map((x) => x.at)),
      weekly: weeklyMinutes(entries),
    };
  },
};

function normaliseCurriculum(modules = []) {
  const d = load();
  return modules.map((m) => ({
    id: m.id || d.next.module++, title: m.title?.trim() || 'Untitled module',
    lessons: (m.lessons || []).map((l) => ({
      id: l.id || d.next.lesson++, title: l.title?.trim() || 'Untitled lesson', type: l.type === 'READING' ? 'READING' : 'VIDEO',
      durationMinutes: Math.max(0, Number(l.durationMinutes) || 0), content: l.content || '',
    })),
  }));
}

function saveCourse(actor, p) {
  const d = load();
  const admin = actor.role === 'ADMIN';
  let c = p.id ? d.courses.find((x) => x.id === Number(p.id) && (admin || x.instructorId === actor.id)) : null;
  if (p.id && !c) throw new ApiError('We could not find that course.', 404);
  const cat = d.categories.find((x) => x.name.toLowerCase() === String(p.category).trim().toLowerCase());
  if (!cat) fail('Choose one of the available categories.');
  const fields = {
    title: p.title.trim(), category: cat.name, level: p.level, description: p.description.trim(), price: Number(p.price),
    originalPrice: p.originalPrice === '' || p.originalPrice == null ? null : Number(p.originalPrice),
    imageUrl: p.imageUrl?.trim() || '', modules: normaliseCurriculum(p.modules),
  };
  if (c) Object.assign(c, fields);
  else {
    c = { id: d.next.course++, instructorId: actor.id, badge: 'NEW', rating: 0, ratingCount: 0, students: 0, status: 'DRAFT', createdAt: new Date().toISOString(), ...fields };
    d.courses.push(c);
  }
  if (admin) audit(actor, 'COURSE_EDITED', 'COURSE', c.id, `Edited by admin: ${c.title}`);
  save();
  return { ...summary(c), modules: clone(c.modules) };
}

const instructor = {
  async courses() {
    await wait(); const u = requireRole('INSTRUCTOR');
    return load().courses.filter((c) => c.instructorId === u.id).map((c) => ({ ...summary(c), revenue: +(studentCount(c) * c.price).toFixed(2) })).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },
  async course(id) {
    await wait(); const u = requireRole('INSTRUCTOR');
    const c = load().courses.find((x) => x.id === Number(id) && x.instructorId === u.id);
    if (!c) throw new ApiError('We could not find that course.', 404);
    return { ...summary(c), modules: clone(c.modules) };
  },
  async save(p) { await wait(350); return saveCourse(requireRole('INSTRUCTOR'), p); },
  async setStatus(id, status) {
    await wait(); const u = requireRole('INSTRUCTOR');
    const c = load().courses.find((x) => x.id === Number(id) && x.instructorId === u.id);
    if (!c) throw new ApiError('We could not find that course.', 404);
    const from = c.status;
    const lessons = curriculumStats(c.modules).lessons;
    const blocked = () => fail(`That change is not available while the course is ${from.toLowerCase().replace('_', ' ')}.`, 409);
    if (status === 'PENDING_REVIEW') {
      if (!['DRAFT', 'REJECTED'].includes(from)) blocked();
      if (u.approval !== 'APPROVED') fail('Your instructor account is awaiting approval. You can keep drafting, but you cannot submit courses yet.', 403);
      if (!lessons) fail('Add at least one lesson before submitting for review.', 422);
      c.rejectionReason = null;
    } else if (status === 'DRAFT') { if (!['PENDING_REVIEW', 'ARCHIVED'].includes(from)) blocked(); }
    else if (status === 'ARCHIVED') { if (!['DRAFT', 'REJECTED', 'PUBLISHED'].includes(from)) blocked(); }
    else fail('Instructors cannot set that status. Submit the course for review instead.');
    c.status = status; save();
    return summary(c);
  },
  async students() {
    await wait(); const u = requireRole('INSTRUCTOR'); const d = load();
    const mine = new Set(d.courses.filter((c) => c.instructorId === u.id).map((c) => c.id));
    return d.enrollments.filter((e) => mine.has(e.courseId)).map((e) => {
      const s = userById(e.userId); const v = enrollmentView(e);
      return { enrollmentId: e.id, studentId: s.id, name: s.name, email: s.email, courseId: v.courseId, courseTitle: v.course.title, progressPercent: v.progressPercent, enrolledAt: e.enrolledAt };
    }).sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt));
  },
  async stats() {
    await wait(); const u = requireRole('INSTRUCTOR'); const d = load();
    const mine = d.courses.filter((c) => c.instructorId === u.id);
    const published = mine.filter((c) => c.status === 'PUBLISHED');
    const rows = mine.map((c) => ({ courseId: c.id, title: c.title, students: studentCount(c), revenue: +(studentCount(c) * c.price).toFixed(2) }));
    const rated = published.filter((c) => c.ratingCount);
    return {
      courses: mine.length, published: published.length,
      students: rows.reduce((s, r) => s + r.students, 0), revenue: +rows.reduce((s, r) => s + r.revenue, 0).toFixed(2),
      averageRating: rated.length ? +(rated.reduce((s, c) => s + c.rating, 0) / rated.length).toFixed(1) : 0,
      byCourse: rows.filter((r) => r.students).sort((a, b) => b.students - a.students).slice(0, 6),
    };
  },
};

// Offline stand-in for M-Pesa: the "customer" approves about 4 seconds after the request.
const PHONE = /^(?:\+?254|0)?[17]\d{8}$/;
const PAY_MESSAGE = { PENDING: 'Check your phone and enter your M-Pesa PIN.', SUCCESS: 'Payment received. You are enrolled.', FAILED: 'The payment failed.', CANCELLED: 'You cancelled the request.' };
const paymentView = (p) => ({ id: p.id, courseId: p.courseId, status: p.status, amountKes: p.amountKes, message: PAY_MESSAGE[p.status], receipt: p.receipt || null });
const payments = {
  async start(courseId, phone) {
    await wait(500);
    const u = requireRole('STUDENT'); const d = load();
    const c = d.courses.find((x) => x.id === Number(courseId) && listed(x)) || fail('We could not find that course.', 404);
    if (d.enrollments.some((x) => x.userId === u.id && x.courseId === c.id)) fail('You are already enrolled in this course.', 409);
    if (!PHONE.test(String(phone).replace(/[\s-]/g, ''))) fail('Enter a valid Safaricom number, e.g. 0712 345 678.');
    d.payments = d.payments || []; d.next.payment = d.next.payment || 1;
    const p = { id: d.next.payment++, userId: u.id, courseId: c.id, amountKes: Math.ceil(c.price), status: 'PENDING', createdAt: Date.now() };
    d.payments.push(p); save();
    return paymentView(p);
  },
  async status(id) {
    await wait(150);
    const u = requireRole('STUDENT'); const d = load();
    const p = (d.payments || []).find((x) => x.id === Number(id) && x.userId === u.id) || fail('We could not find that payment.', 404);
    if (p.status === 'PENDING' && Date.now() - p.createdAt > 4000) {
      p.status = 'SUCCESS'; p.receipt = `DEMO${p.id}`;
      if (!d.enrollments.some((x) => x.userId === u.id && x.courseId === p.courseId)) d.enrollments.push({ id: d.next.enrollment++, userId: u.id, courseId: p.courseId, enrolledAt: new Date().toISOString(), done: {} });
      save();
    }
    return paymentView(p);
  },
};

const categories = { async list() { await wait(80); return load().categories.map((c) => c.name).sort(); } };

// ---------------- admin ----------------
const adminOnly = () => requireRole('ADMIN');
const lastAdminGuard = (target) => {
  const active = load().users.filter((x) => x.role === 'ADMIN' && x.status === 'ACTIVE');
  if (target.role === 'ADMIN' && target.status === 'ACTIVE' && active.length <= 1) fail('This is the last active admin. Create or promote another admin first.', 409);
};
const adminUser = (u) => {
  const d = load();
  const { password, ...rest } = u;
  return { ...rest, approvalNote: u.approvalNote || null, courses: d.courses.filter((c) => c.instructorId === u.id).length, enrollments: d.enrollments.filter((e) => e.userId === u.id).length };
};
const adminCourse = (c) => ({ ...summary(c), revenue: +(studentCount(c) * c.price).toFixed(2) });
const targetUser = (id) => userById(Number(id)) || fail('We could not find that user.', 404);
const targetCourse = (id) => load().courses.find((c) => c.id === Number(id)) || fail('We could not find that course.', 404);
const adminEnrollment = (e) => {
  const s = userById(e.userId); const v = enrollmentView(e);
  return { id: e.id, studentId: s.id, studentName: s.name, studentEmail: s.email, courseId: v.courseId, courseTitle: v.course.title, progressPercent: v.progressPercent, enrolledAt: e.enrolledAt };
};

const admin = {
  async report() {
    await wait(); adminOnly(); const d = load();
    const by = (s) => d.courses.filter((c) => c.status === s).length;
    const rows = d.courses.map((c) => ({ courseId: c.id, title: c.title, students: studentCount(c), revenue: +(studentCount(c) * c.price).toFixed(2) }));
    return {
      users: d.users.length, students: d.users.filter((u) => u.role === 'STUDENT').length, instructors: d.users.filter((u) => u.role === 'INSTRUCTOR').length,
      admins: d.users.filter((u) => u.role === 'ADMIN').length, pendingInstructors: d.users.filter((u) => u.role === 'INSTRUCTOR' && u.approval === 'PENDING').length,
      suspendedUsers: d.users.filter((u) => u.status === 'SUSPENDED').length, courses: d.courses.length, published: by('PUBLISHED'), pendingReview: by('PENDING_REVIEW'),
      drafts: by('DRAFT'), rejected: by('REJECTED'), archived: by('ARCHIVED'), enrollments: d.enrollments.length,
      grossSales: +rows.reduce((a, r) => a + r.revenue, 0).toFixed(2),
      newUsers30d: d.users.filter((u) => Date.now() - new Date(u.createdAt) < 30 * 864e5).length,
      topCourses: rows.filter((r) => r.students).sort((a, b) => b.students - a.students).slice(0, 6),
    };
  },
  async audit() { await wait(); adminOnly(); return clone(load().audit); },

  async users() { await wait(); adminOnly(); return [...load().users].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(adminUser); },
  async createUser({ name, email, password, role }) {
    await wait(); const me = adminOnly(); const d = load();
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) fail('Role must be STUDENT, INSTRUCTOR or ADMIN.');
    if (d.users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) fail('An account with this email already exists.', 409);
    const u = { id: d.next.user++, name: name.trim(), email: email.trim(), role, headline: '', status: 'ACTIVE', approval: 'APPROVED', createdAt: new Date().toISOString(), password };
    d.users.push(u); audit(me, 'USER_CREATED', 'USER', u.id, `${u.email} as ${role}`); save();
    return adminUser(u);
  },
  async updateUser(id, { name, headline }) {
    await wait(); const me = adminOnly(); const u = targetUser(id);
    u.name = name.trim() || u.name; u.headline = headline ?? ''; audit(me, 'USER_UPDATED', 'USER', u.id, u.email); save();
    return adminUser(u);
  },
  async setRole(id, role) {
    await wait(); const me = adminOnly(); const u = targetUser(id);
    if (!['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) fail('Role must be STUDENT, INSTRUCTOR or ADMIN.');
    if (u.id === me.id) fail('You cannot change your own role.', 409);
    if (u.role === role) return adminUser(u);
    if (u.role === 'ADMIN') lastAdminGuard(u);
    if (role === 'STUDENT' && load().courses.some((c) => c.instructorId === u.id)) fail('This user owns courses. Archive or delete them before changing the role to student.', 409);
    audit(me, 'ROLE_CHANGED', 'USER', u.id, `${u.email}: ${u.role} -> ${role}`);
    u.role = role; u.approval = 'APPROVED'; u.approvalNote = null; save();
    return adminUser(u);
  },
  async setUserStatus(id, status) {
    await wait(); const me = adminOnly(); const u = targetUser(id);
    if (!['ACTIVE', 'SUSPENDED'].includes(status)) fail('Status must be ACTIVE or SUSPENDED.');
    if (u.id === me.id) fail('You cannot suspend your own account.', 409);
    if (status === 'SUSPENDED') lastAdminGuard(u);
    u.status = status; audit(me, status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_REACTIVATED', 'USER', u.id, u.email); save();
    return adminUser(u);
  },
  async decideInstructor(id, decision, reason) {
    await wait(); const me = adminOnly(); const u = targetUser(id);
    if (u.role !== 'INSTRUCTOR') fail('Only instructor accounts need approval.', 409);
    if (decision === 'APPROVE') { u.approval = 'APPROVED'; u.approvalNote = null; }
    else if (decision === 'REJECT') {
      if (!reason?.trim()) fail('Give a short reason so the instructor knows what to fix.');
      u.approval = 'REJECTED'; u.approvalNote = reason.trim();
    } else fail('Decision must be APPROVE or REJECT.');
    audit(me, `INSTRUCTOR_${u.approval}`, 'USER', u.id, u.email + (u.approvalNote ? `: ${u.approvalNote}` : '')); save();
    return adminUser(u);
  },
  async deleteUser(id) {
    await wait(); const me = adminOnly(); const d = load(); const u = targetUser(id);
    if (u.id === me.id) fail('You cannot delete your own account.', 409);
    lastAdminGuard(u);
    if (d.courses.some((c) => c.instructorId === u.id) || d.enrollments.some((e) => e.userId === u.id)) fail('This user has courses or enrolments. Suspend the account instead of deleting it.', 409);
    d.users = d.users.filter((x) => x.id !== u.id); audit(me, 'USER_DELETED', 'USER', u.id, u.email); save();
    return null;
  },

  async courses() {
    await wait(); adminOnly();
    return [...load().courses].sort((a, b) => (b.status === 'PENDING_REVIEW') - (a.status === 'PENDING_REVIEW') || b.createdAt.localeCompare(a.createdAt)).map(adminCourse);
  },
  async course(id) { await wait(); adminOnly(); const c = targetCourse(id); return { ...summary(c), modules: clone(c.modules) }; },
  async saveCourse(p) { await wait(350); return saveCourse(adminOnly(), p); },
  async reviewCourse(id, decision, reason) {
    await wait(); const me = adminOnly(); const c = targetCourse(id); const note = reason?.trim() || '';
    if (decision === 'APPROVE') {
      if (c.status === 'PUBLISHED') fail('This course is already published.', 409);
      if (!curriculumStats(c.modules).lessons) fail('A course needs at least one lesson before it can be published.', 422);
      c.status = 'PUBLISHED'; c.rejectionReason = null;
    } else if (decision === 'REJECT') {
      if (c.status !== 'PENDING_REVIEW') fail('Only courses waiting for review can be rejected.', 409);
      if (!note) fail('Give a short reason so the instructor knows what to change.');
      c.status = 'REJECTED'; c.rejectionReason = note;
    } else if (decision === 'UNPUBLISH') {
      if (c.status !== 'PUBLISHED') fail('Only published courses can be taken down.', 409);
      if (!note) fail('Give a short reason for taking the course down.');
      c.status = 'REJECTED'; c.rejectionReason = note;
    } else fail('Decision must be APPROVE, REJECT or UNPUBLISH.');
    audit(me, `COURSE_${decision}`, 'COURSE', c.id, c.title + (note ? `: ${note}` : '')); save();
    return adminCourse(c);
  },
  async setBadge(id, badge) {
    await wait(); const me = adminOnly(); const c = targetCourse(id);
    if (badge && !['NEW', 'HOT', 'FEATURED', 'SPECIAL'].includes(badge)) fail('Badge must be NEW, HOT, FEATURED or SPECIAL (or empty).');
    c.badge = badge || null; audit(me, 'COURSE_BADGE', 'COURSE', c.id, `${c.title} -> ${badge || 'none'}`); save();
    return adminCourse(c);
  },
  async deleteCourse(id) {
    await wait(); const me = adminOnly(); const d = load(); const c = targetCourse(id);
    d.enrollments = d.enrollments.filter((e) => e.courseId !== c.id); d.courses = d.courses.filter((x) => x.id !== c.id);
    audit(me, 'COURSE_DELETED', 'COURSE', c.id, c.title); save();
    return null;
  },

  async categories() {
    await wait(); adminOnly(); const d = load();
    return [...d.categories].sort((a, b) => a.name.localeCompare(b.name)).map((c) => ({ ...c, courses: d.courses.filter((x) => x.category.toLowerCase() === c.name.toLowerCase()).length }));
  },
  async createCategory(name) {
    await wait(); const me = adminOnly(); const d = load(); const n = name.trim();
    if (!n) fail('Enter a category name.');
    if (d.categories.some((c) => c.name.toLowerCase() === n.toLowerCase())) fail('That category already exists.', 409);
    const c = { id: d.next.category++, name: n }; d.categories.push(c); audit(me, 'CATEGORY_CREATED', 'CATEGORY', c.id, n); save();
    return { ...c, courses: 0 };
  },
  async renameCategory(id, name) {
    await wait(); const me = adminOnly(); const d = load(); const n = name.trim();
    const c = d.categories.find((x) => x.id === Number(id)) || fail('We could not find that category.', 404);
    if (!n) fail('Enter a category name.');
    if (d.categories.some((x) => x.id !== c.id && x.name.toLowerCase() === n.toLowerCase())) fail('That category already exists.', 409);
    d.courses.forEach((x) => { if (x.category.toLowerCase() === c.name.toLowerCase()) x.category = n; });
    audit(me, 'CATEGORY_RENAMED', 'CATEGORY', c.id, `${c.name} -> ${n}`); c.name = n; save();
    return { ...c, courses: d.courses.filter((x) => x.category === n).length };
  },
  async deleteCategory(id) {
    await wait(); const me = adminOnly(); const d = load();
    const c = d.categories.find((x) => x.id === Number(id)) || fail('We could not find that category.', 404);
    if (d.courses.some((x) => x.category.toLowerCase() === c.name.toLowerCase())) fail('Courses still use this category. Move or rename them first.', 409);
    d.categories = d.categories.filter((x) => x.id !== c.id); audit(me, 'CATEGORY_DELETED', 'CATEGORY', c.id, c.name); save();
    return null;
  },

  async enrollments() { await wait(); adminOnly(); return [...load().enrollments].sort((a, b) => b.enrolledAt.localeCompare(a.enrolledAt)).slice(0, 200).map(adminEnrollment); },
  async enroll(studentId, courseId) {
    await wait(); const me = adminOnly(); const d = load();
    const s = targetUser(studentId); const c = targetCourse(courseId);
    if (s.role !== 'STUDENT' || s.status !== 'ACTIVE') fail('Only active student accounts can be enrolled.', 409);
    if (c.status !== 'PUBLISHED') fail('Only published courses can be enrolled in.', 409);
    let e = d.enrollments.find((x) => x.userId === s.id && x.courseId === c.id);
    if (!e) { e = { id: d.next.enrollment++, userId: s.id, courseId: c.id, enrolledAt: new Date().toISOString(), done: {} }; d.enrollments.push(e); audit(me, 'ENROLLMENT_CREATED', 'ENROLLMENT', e.id, `${s.email} -> ${c.title}`); save(); }
    return adminEnrollment(e);
  },
  async cancelEnrollment(id) {
    await wait(); const me = adminOnly(); const d = load();
    const e = d.enrollments.find((x) => x.id === Number(id)) || fail('We could not find that enrolment.', 404);
    audit(me, 'ENROLLMENT_CANCELLED', 'ENROLLMENT', e.id, `${userById(e.userId)?.email} / ${d.courses.find((c) => c.id === e.courseId)?.title}`);
    d.enrollments = d.enrollments.filter((x) => x.id !== e.id); save();
    return null;
  },
};

export const demoRepository = { mode: 'demo', auth, courses, categories, learning, payments, instructor, admin };

// Offline repository: the same contract as apiRepository, persisted in localStorage.
// Used automatically when the Spring Boot API is unreachable, so the UI can be explored on its own.
import { ApiError } from './httpClient';
import { getToken } from './session';
import { seedUsers, seedCourses, seedEnrollments, DEMO_PASSWORD } from './demoData';
import { calculateStreak, weeklyMinutes, percent } from '../domain/progress';
import { curriculumStats } from '../domain/course';

const KEY = 'coursely.demo.v2';
const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms));
const clone = (x) => JSON.parse(JSON.stringify(x));
const daysAgo = (n) => new Date(Date.now() - n * 864e5).toISOString();

function seed() {
  const lessonIndex = {};
  seedCourses.forEach((c) => c.modules.forEach((m) => m.lessons.forEach((l) => { lessonIndex[l.id] = true; })));
  return {
    users: clone(seedUsers).map((u) => ({ ...u, password: DEMO_PASSWORD })),
    courses: clone(seedCourses),
    enrollments: seedEnrollments.map((e) => ({
      id: e.id, userId: e.userId, courseId: e.courseId, enrolledAt: daysAgo(e.daysAgo),
      done: Object.fromEntries(e.done.filter(([lid]) => lessonIndex[lid]).map(([lid, d]) => [lid, daysAgo(d)])),
    })),
    next: { user: 100, course: 100, module: 10000, lesson: 100000, enrollment: 100 },
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
  const u = id ? userById(id) : null;
  if (!u && required) throw new ApiError('Please sign in to continue.', 401);
  return u;
}
const requireRole = (role) => {
  const u = currentUser();
  if (u.role !== role) throw new ApiError('You do not have access to this area.', 403);
  return u;
};

const studentCount = (c) => c.students + load().enrollments.filter((e) => e.courseId === c.id && e.id >= 100).length;

function summary(c) {
  const inst = userById(c.instructorId);
  const s = curriculumStats(c.modules);
  return {
    id: c.id, title: c.title, category: c.category, level: c.level, description: c.description,
    price: c.price, originalPrice: c.originalPrice, imageUrl: c.imageUrl, badge: c.badge,
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
    return { token: `demo.${u.id}`, user: publicUser(u) };
  },
  async register({ name, email, password, role }) {
    await wait();
    const d = load();
    if (d.users.some((x) => x.email.toLowerCase() === email.trim().toLowerCase())) throw new ApiError('An account with this email already exists.', 409, { email: 'This email is already registered.' });
    const u = { id: d.next.user++, name: name.trim(), email: email.trim(), role: role === 'INSTRUCTOR' ? 'INSTRUCTOR' : 'STUDENT', headline: '', password };
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
  async list() { await wait(); return load().courses.filter((c) => c.status === 'PUBLISHED').map(summary); },
  async get(id) {
    await wait();
    const c = load().courses.find((x) => x.id === Number(id));
    const me = currentUser(false);
    if (!c || (c.status !== 'PUBLISHED' && me?.id !== c.instructorId)) throw new ApiError('We could not find that course.', 404);
    return { ...summary(c), modules: stripContent(c.modules) };
  },
};

const learning = {
  async enrollments() { await wait(); const u = requireRole('STUDENT'); return load().enrollments.filter((e) => e.userId === u.id).map(enrollmentView).sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt)); },
  async enroll(courseId) {
    await wait(400);
    const u = requireRole('STUDENT'); const d = load();
    const c = d.courses.find((x) => x.id === Number(courseId) && x.status === 'PUBLISHED');
    if (!c) throw new ApiError('We could not find that course.', 404);
    let e = d.enrollments.find((x) => x.userId === u.id && x.courseId === c.id);
    if (!e) { e = { id: d.next.enrollment++, userId: u.id, courseId: c.id, enrolledAt: new Date().toISOString(), done: {} }; d.enrollments.push(e); save(); }
    return enrollmentView(e);
  },
  async course(courseId) {
    await wait();
    const u = currentUser(); const d = load();
    const c = d.courses.find((x) => x.id === Number(courseId));
    if (!c) throw new ApiError('We could not find that course.', 404);
    const e = d.enrollments.find((x) => x.userId === u.id && x.courseId === c.id);
    if (!e && c.instructorId !== u.id) throw new ApiError('Enroll in this course to start learning.', 403);
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
  async save(p) {
    await wait(350); const u = requireRole('INSTRUCTOR'); const d = load();
    let c = p.id ? d.courses.find((x) => x.id === Number(p.id) && x.instructorId === u.id) : null;
    if (p.id && !c) throw new ApiError('We could not find that course.', 404);
    const fields = {
      title: p.title.trim(), category: p.category, level: p.level, description: p.description.trim(), price: Number(p.price),
      originalPrice: p.originalPrice === '' || p.originalPrice == null ? null : Number(p.originalPrice),
      imageUrl: p.imageUrl?.trim() || '', modules: normaliseCurriculum(p.modules),
    };
    if (c) Object.assign(c, fields);
    else {
      c = { id: d.next.course++, instructorId: u.id, badge: 'NEW', rating: 0, ratingCount: 0, students: 0, status: 'DRAFT', createdAt: new Date().toISOString(), ...fields };
      d.courses.push(c);
    }
    save();
    return { ...summary(c), modules: clone(c.modules) };
  },
  async setStatus(id, status) {
    await wait(); const u = requireRole('INSTRUCTOR');
    const c = load().courses.find((x) => x.id === Number(id) && x.instructorId === u.id);
    if (!c) throw new ApiError('We could not find that course.', 404);
    if (status === 'PUBLISHED' && !curriculumStats(c.modules).lessons) throw new ApiError('Add at least one lesson before publishing.', 422);
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

export const demoRepository = { mode: 'demo', auth, courses, learning, instructor };

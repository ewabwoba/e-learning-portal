// Infrastructure layer: talks to the Spring Boot REST API.
import { http } from './httpClient';

const auth = {
  login: (body) => http('/auth/login', { method: 'POST', body, auth: false }),
  register: (body) => http('/auth/register', { method: 'POST', body, auth: false }),
  me: () => http('/auth/me'),
  updateProfile: (body) => http('/auth/me', { method: 'PUT', body }),
};
const courses = {
  list: () => http('/courses', { auth: false }),
  get: (id) => http(`/courses/${id}`),
};
const learning = {
  enrollments: () => http('/enrollments/me'),
  enroll: (courseId) => http('/enrollments', { method: 'POST', body: { courseId } }),
  course: (courseId) => http(`/learn/courses/${courseId}`),
  toggleLesson: (courseId, lessonId) => http(`/learn/courses/${courseId}/lessons/${lessonId}/toggle`, { method: 'POST' }),
  stats: () => http('/learn/stats'),
};
const instructor = {
  courses: () => http('/instructor/courses'),
  course: (id) => http(`/instructor/courses/${id}`),
  save: (p) => (p.id ? http(`/instructor/courses/${p.id}`, { method: 'PUT', body: p }) : http('/instructor/courses', { method: 'POST', body: p })),
  setStatus: (id, status) => http(`/instructor/courses/${id}/status`, { method: 'PATCH', body: { status } }),
  students: () => http('/instructor/students'),
  stats: () => http('/instructor/stats'),
};

const payments = {
  start: (courseId, phone) => http('/payments', { method: 'POST', body: { courseId, phone } }),
  status: (id) => http(`/payments/${id}`),
};

const categories = { list: () => http('/categories', { auth: false }) };
const admin = {
  report: () => http('/admin/report'),
  audit: () => http('/admin/audit'),
  users: () => http('/admin/users'),
  createUser: (body) => http('/admin/users', { method: 'POST', body }),
  updateUser: (id, body) => http(`/admin/users/${id}`, { method: 'PUT', body }),
  setRole: (id, role) => http(`/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  setUserStatus: (id, status) => http(`/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
  decideInstructor: (id, decision, reason) => http(`/admin/users/${id}/approval`, { method: 'PATCH', body: { decision, reason } }),
  deleteUser: (id) => http(`/admin/users/${id}`, { method: 'DELETE' }),
  courses: () => http('/admin/courses'),
  course: (id) => http(`/admin/courses/${id}`),
  saveCourse: (p) => http(`/admin/courses/${p.id}`, { method: 'PUT', body: p }),
  reviewCourse: (id, decision, reason) => http(`/admin/courses/${id}/review`, { method: 'PATCH', body: { decision, reason } }),
  setBadge: (id, badge) => http(`/admin/courses/${id}/badge`, { method: 'PATCH', body: { badge } }),
  deleteCourse: (id) => http(`/admin/courses/${id}`, { method: 'DELETE' }),
  categories: () => http('/admin/categories'),
  createCategory: (name) => http('/admin/categories', { method: 'POST', body: { name } }),
  renameCategory: (id, name) => http(`/admin/categories/${id}`, { method: 'PUT', body: { name } }),
  deleteCategory: (id) => http(`/admin/categories/${id}`, { method: 'DELETE' }),
  enrollments: () => http('/admin/enrollments'),
  enroll: (studentId, courseId) => http('/admin/enrollments', { method: 'POST', body: { studentId, courseId } }),
  cancelEnrollment: (id) => http(`/admin/enrollments/${id}`, { method: 'DELETE' }),
};

export const apiRepository = { mode: 'api', auth, courses, categories, learning, payments, instructor, admin };

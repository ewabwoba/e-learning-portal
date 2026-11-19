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

export const apiRepository = { mode: 'api', auth, courses, learning, instructor };

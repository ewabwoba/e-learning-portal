import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './presentation/layouts/PublicLayout';
import AppLayout, { RoleGuard } from './presentation/layouts/AppLayout';
import Home from './presentation/pages/public/Home';
import Catalog from './presentation/pages/public/Catalog';
import CourseDetail from './presentation/pages/public/CourseDetail';
import AuthPage from './presentation/pages/public/AuthPage';
import NotFound from './presentation/pages/public/NotFound';
import StudentDashboard from './presentation/pages/student/Dashboard';
import MyLearning from './presentation/pages/student/MyLearning';
import Player from './presentation/pages/student/Player';
import InstructorDashboard from './presentation/pages/instructor/Dashboard';
import InstructorCourses from './presentation/pages/instructor/Courses';
import CourseEditor from './presentation/pages/instructor/CourseEditor';
import Students from './presentation/pages/instructor/Students';
import AdminDashboard from './presentation/pages/admin/Dashboard';
import AdminCourses from './presentation/pages/admin/Courses';
import AdminUsers from './presentation/pages/admin/Users';
import AdminCategories from './presentation/pages/admin/Categories';
import AdminEnrollments from './presentation/pages/admin/Enrollments';
import AdminAudit from './presentation/pages/admin/Audit';
import Settings from './presentation/pages/shared/Settings';
import { useAuth } from './application/AuthContext';
import { homeForRole } from './domain/access';

const student = (el) => <RoleGuard role="STUDENT">{el}</RoleGuard>;
const admin = (el) => <RoleGuard role="ADMIN">{el}</RoleGuard>;
const teacher = (el) => <RoleGuard role="INSTRUCTOR">{el}</RoleGuard>;

function AppIndex() {
  const { user } = useAuth();
  return user.role === 'STUDENT' ? <StudentDashboard /> : <Navigate to={homeForRole(user.role)} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Catalog basePath="/courses" />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="login" element={<AuthPage mode="login" />} />
      <Route path="register" element={<AuthPage mode="register" />} />

      <Route path="app" element={<AppLayout />}>
        <Route index element={<AppIndex />} />
        <Route path="learning" element={student(<MyLearning />)} />
        <Route path="learn/:courseId" element={<Player />} />
        <Route path="explore" element={<Catalog basePath="/app/courses" embedded />} />
        <Route path="courses/:id" element={<CourseDetail inApp />} />
        <Route path="teach" element={teacher(<InstructorDashboard />)} />
        <Route path="teach/courses" element={teacher(<InstructorCourses />)} />
        <Route path="teach/courses/new" element={teacher(<CourseEditor />)} />
        <Route path="teach/courses/:id" element={teacher(<CourseEditor />)} />
        <Route path="teach/students" element={teacher(<Students />)} />
        <Route path="admin" element={admin(<AdminDashboard />)} />
        <Route path="admin/courses" element={admin(<AdminCourses />)} />
        <Route path="admin/courses/:id" element={admin(<CourseEditor admin />)} />
        <Route path="admin/users" element={admin(<AdminUsers />)} />
        <Route path="admin/categories" element={admin(<AdminCategories />)} />
        <Route path="admin/enrollments" element={admin(<AdminEnrollments />)} />
        <Route path="admin/audit" element={admin(<AdminAudit />)} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  );
}

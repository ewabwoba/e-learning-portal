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
import Settings from './presentation/pages/shared/Settings';
import { useAuth } from './application/AuthContext';

const student = (el) => <RoleGuard role="STUDENT">{el}</RoleGuard>;
const teacher = (el) => <RoleGuard role="INSTRUCTOR">{el}</RoleGuard>;

function AppIndex() {
  const { user } = useAuth();
  return user.role === 'INSTRUCTOR' ? <Navigate to="/app/teach" replace /> : <StudentDashboard />;
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
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Route>
    </Routes>
  );
}

import React from 'react';
import { Routes, Route } from 'react-router-dom';

import PublicRoute from './PublicRoute';
import PrivateRoute from './PrivateRoute';
import AppLayout from '../components/AppLayout';
import AuthLayout from '../features/auth/components/AuthLayout';

import LoginForm from '../features/auth/views/Login';
import RecoverEmailForm from '../features/auth/views/Recover';
import VerifyCodeForm from '../features/auth/views/VerifyCode';
import ResetPasswordForm from '../features/auth/views/ResetPassword';
import NotFound from '../components/404';

import AdminDashboard from '../features/admin/views/Dashboard';
import AdminProfile from '../features/admin/views/Profile';
import AdminUsersManagement from '../features/admin/views/UsersManagment';
import AdminCareers from '../features/admin/views/Careers';
import AdminCareerGroups from '../features/admin/views/Groups';
import AdminCareerCurriculums from '../features/admin/views/Curriculums'
import AdminModules from '../features/admin/views/Modules'

import TeacherDashboard from '../features/teacher/views/Dashboard';

import StudentDashboard from '../features/student/views/Dashboard';

export default function AppRouter() {
  return (
    <Routes>
      {/* PÚBLICAS */}
      <Route element={<PublicRoute />}>
        <Route
          path="/"
          element={
            <AuthLayout title="Inicio de Sesión" subtitle="Ingresa tus credenciales">
              <LoginForm />
            </AuthLayout>
          }
        />
        <Route
          path="/security/recover"
          element={
            <AuthLayout title="Recuperación de contraseña" subtitle="Ingrese el correo electrónico asociado a su cuenta">
              <RecoverEmailForm />
            </AuthLayout>
          }
        />
        <Route
          path="/security/verify-code"
          element={
            <AuthLayout title="Código de seguridad" subtitle="Ingrese el código de verificación enviado a su correo electrónico">
              <VerifyCodeForm />
            </AuthLayout>
          }
        />
        <Route
          path="/security/reset-password"
          element={
            <AuthLayout title="Nueva contraseña" subtitle="Ingrese una nueva contraseña para su cuenta">
              <ResetPasswordForm />
            </AuthLayout>
          }
        />
      </Route>

      {/* PRIVADAS Y PROTEGIDAS */}
      <Route element={<PrivateRoute allowedRoles={['ADMIN', 'TEACHER', 'STUDENT']} />}>
        <Route element={<AppLayout />}>
          {/* ADMIN */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/profile" element={<AdminProfile />} />
          <Route path="admin/users" element={<AdminUsersManagement />} />
          <Route path="admin/careers" element={<AdminCareers />} />
          <Route path="admin/careers/groups" element={<AdminCareerGroups />} />
          <Route path="admin/careers/curriculums" element={<AdminCareerCurriculums />} />

          {/* DOCENTE */}
          <Route path="teacher" element={<TeacherDashboard />} />

          {/* ESTUDIANTE */}
          <Route path="student" element={<StudentDashboard />} />
        </Route>
      </Route>

      {/* CUALQUIER OTRA → 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

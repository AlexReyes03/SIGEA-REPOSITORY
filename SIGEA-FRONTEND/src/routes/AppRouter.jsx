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

import Profile from '../features/admin/views/Profile';

import AdminDashboard from '../features/admin/views/Dashboard';
import AdminUsersManagement from '../features/admin/views/UsersManagment';
import AdminCareers from '../features/admin/views/Careers';
import AdminCareerGroups from '../features/admin/views/Groups';
import AdminCareerCurriculums from '../features/admin/views/Curriculums';
import AdminGroupDetail from '../features/admin/views/GroupDetail';

import SupervisorDashboard from '../features/supervisor/views/Dashboard';
import SupervisorCampuses from '../features/supervisor/views/Campuses'
import SupervisorTeachersScore from '../features/supervisor/views/TeachersScore';
import SupervisorCareers from '../features/supervisor/views/Careers';
import SupervisorGroups from '../features/supervisor/views/Groups'
import SupervisorGroupDetails from '../features/supervisor/views/GroupDetails'

import TeacherDashboard from '../features/teacher/views/Dashboard';
import TeacherGroups from '../features/teacher/views/Groups';
import TeacherGroupDetails from '../features/teacher/views/GroupDetails';

import StudentDashboard from '../features/student/views/Dashboard';
import StudentGroups from '../features/student/views/Groups';
import StudentQualifications from '../features/student/views/GroupDetails';

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
      <Route element={<PrivateRoute allowedRoles={['ADMIN']} />}>
        <Route element={<AppLayout />}>
          {/* ADMIN */}
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="admin/profile" element={<Profile />} />
          <Route path="admin/users" element={<AdminUsersManagement />} />
          <Route path="admin/careers" element={<AdminCareers />} />
          <Route path="admin/careers/groups" element={<AdminCareerGroups />} />
          <Route path="admin/careers/curriculums" element={<AdminCareerCurriculums />} />
          <Route path="admin/careers/groups/details" element={<AdminGroupDetail />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['TEACHER']} />}>
        <Route element={<AppLayout />}>
          {/* DOCENTE */}
          <Route path="teacher" element={<TeacherDashboard />} />
          <Route path="teacher/groups" element={<TeacherGroups />} />
          <Route path="teacher/groups/details" element={<TeacherGroupDetails />} />
          <Route path="teacher/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['SUPERVISOR']} />}>
        <Route element={<AppLayout />}>
          {/* SUPERVISOR */}
          <Route path="supervisor" element={<SupervisorDashboard />} />
          <Route path="supervisor/campuses" element={<SupervisorCampuses />} />
          <Route path="supervisor/campuses/careers" element={<SupervisorCareers />} />
          <Route path="supervisor/campuses/careers/groups" element={<SupervisorGroups />} />
          <Route path="supervisor/campuses/careers/group-details" element={<SupervisorGroupDetails />} />
          <Route path="supervisor/teacher-score" element={<SupervisorTeachersScore />} />
          <Route path="supervisor/profile" element={<Profile />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['STUDENT']} />}>
        <Route element={<AppLayout />}>
          {/* ESTUDIANTE */}
          <Route path="student" element={<StudentDashboard />} />
          <Route path="student/my-groups" element={<StudentGroups />} />
          <Route path="student/my-groups/qualifications" element={<StudentQualifications />} />
          <Route path="student/profile" element={<Profile />} />
        </Route>
      </Route>

      {/* CUALQUIER OTRA → 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

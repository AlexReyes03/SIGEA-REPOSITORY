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

import AdminDashboard from '../features/admin/views/Dashboard';
import TeacherDashboard from '../features/teacher/views/Dashboard';
import StudentDashboard from '../features/student/views/Dashboard';
import Profile from '../features/admin/views/Profile';

export default function AppRouter() {
  return (
      <Routes>
        {/* Login */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <AuthLayout title="Inicio de Sesión" subtitle="Por favor ingresa tus credenciales">
                <LoginForm />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Recover */}
        <Route
          path="/recover"
          element={
            <PublicRoute>
              <AuthLayout title="Recuperación de contraseña" subtitle="Por favor ingresa el correo electrónico asociado a tu cuenta">
                <RecoverEmailForm />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Verify code */}
        <Route
          path="/verify-code"
          element={
            <PublicRoute>
              <AuthLayout title="Código de seguridad" subtitle="Ingresa el código de seguridad enviado a tu correo">
                <VerifyCodeForm />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Reset password */}
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <AuthLayout title="Nueva contraseña" subtitle="Ingresa una nueva contraseña para tu cuenta">
                <ResetPasswordForm />
              </AuthLayout>
            </PublicRoute>
          }
        />

        {/* Rutas protegidas… */}
        <Route
          path="/admin"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AppLayout pageTitle="Panel de Administración">
                <AdminDashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <PrivateRoute allowedRoles={['ADMIN']}>
              <AppLayout pageTitle="Perfil de Administrador">
                <Profile />
              </AppLayout>
            </PrivateRoute>
          }
        />

        <Route
          path="/teacher"
          element={
            <PrivateRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </PrivateRoute>
          }
        />

        <Route
          path="/student"
          element={
            <PrivateRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </PrivateRoute>
          }
        />

        {/* …otras rutas */}
      </Routes>
  );
}

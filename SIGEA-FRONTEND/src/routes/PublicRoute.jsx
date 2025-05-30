import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PublicRoute() {
  const { user } = useAuth();

  if (user) {
    let redirectTo = '/';
    switch (user.role.name) {
      case 'ADMIN':      redirectTo = '/admin';      break;
      case 'INSTRUCTOR': redirectTo = '/instructor'; break;
      case 'STUDENT':    redirectTo = '/student';    break;
      case 'SUPERVISOR': redirectTo = '/supervisor'; break;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
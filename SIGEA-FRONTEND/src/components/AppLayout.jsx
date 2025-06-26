import React, { useState, useRef, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ActiveUsersCard from './ActiveUsersCard';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen((o) => !o);
  const closeSidebar = () => setSidebarOpen(false);
  const toggleRef = useRef(null);
  const { user, logout } = useAuth();

  const ROLE_NAME = useMemo(() => {
    if (!user) return [];

    switch (user.role.name) {
      case 'ADMIN':
        return 'Administrador';
      case 'SUPERVISOR':
        return 'Supervisor';
      case 'TEACHER':
        return 'Docente';
      case 'STUDENT':
        return 'Alumno';
      default:
        return 'Invitado';
    }
  }, [user]);

  return (
    <>
      <Helmet>
        <title>SIGEA | {ROLE_NAME}</title>
        <meta name="description" content="Sistema de Gestión Académica." />
      </Helmet>

      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} ref={toggleRef} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onClose={closeSidebar} toggleRef={toggleRef} onLogout={logout} />

      {/* Contenido principal */}
      <main style={{ minHeight: '100dvh', paddingTop: '80px', paddingLeft: '4.5rem', bottom: 0, paddingRight: '1rem', zIndex: 1020 }}>
        <Outlet />
      </main>

      <ActiveUsersCard />
    </>
  );
}

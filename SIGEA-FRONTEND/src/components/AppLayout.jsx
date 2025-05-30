import React, { useState, useRef } from 'react';
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
  const { logout } = useAuth();

  return (
    <>
      {/* Navbar */}
      <Navbar toggleSidebar={toggleSidebar} ref={toggleRef} />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onClose={closeSidebar} toggleRef={toggleRef} onLogout={logout} />

      {/* Contenido principal */}
      <main className="bg-main vh-100" style={{ paddingTop: '80px', paddingLeft: '4.5rem', bottom: 0, paddingRight: '1rem', zIndex: 1020, }}>
        <Outlet />
      </main>

      <ActiveUsersCard />
    </>
  );
}

import React, { useState, useRef } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../contexts/AuthContext';

export default function AppLayout({ children }) {
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
      <main className="" style={{ paddingTop: '80px', paddingLeft: '5rem', bottom: 0, paddingRight: '1rem', zIndex: 1020, }}>
        {children}
      </main>
    </>
  );
}

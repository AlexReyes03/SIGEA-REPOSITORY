import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdHome, MdSchool, MdGroups, MdApartment, MdPerson, MdLeaderboard, MdLogout, MdNotifications } from 'react-icons/md';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from './providers/ConfirmDialogProvider';
import { useNotificationContext } from './providers/NotificationProvider';

export default function Sidebar({ isOpen, toggleSidebar, onClose, toggleRef, onLogout }) {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { confirmAction } = useConfirmDialog();
  const { user } = useAuth();
  
  // Usar el contexto de notificaciones
  const { notificationCount } = useNotificationContext();

  const hasRenderedOnce = useRef(false);
  const currentPath = location.pathname;
  const prevOpen = useRef(true);
  const [showBlueBg, setShowBlueBg] = useState(false);

  useEffect(() => {
    let timer;
    if (!hasRenderedOnce.current) {
      hasRenderedOnce.current = true;
      timer = setTimeout(() => {
        setShowBlueBg(true);
      }, 700);
      prevOpen.current = false;
      return () => clearTimeout(timer);
    }
    if (!isOpen && prevOpen.current) {
      setShowBlueBg(false);
      setShowBlueBg(true);
      prevOpen.current = isOpen;
      return;
    }
    if (isOpen) {
      setShowBlueBg(false);
      prevOpen.current = isOpen;
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target) && (!toggleRef.current || !toggleRef.current.contains(e.target))) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, toggleRef]);

  const MENU_ITEMS = useMemo(() => {
    if (!user) return [];
    
    const createNotificationItem = (basePath) => ({
      label: 'Notificaciones',
      path: `${basePath}/notifications`,
      Icon: MdNotifications,
      badge: notificationCount > 0 ? notificationCount : null
    });

    switch (user.role.name) {
      case 'ADMIN':
        return [
          { label: 'Inicio', path: '/admin', Icon: MdHome },
          { label: 'Plantel', path: '/admin/campus', Icon: MdApartment },
          { label: 'Carreras', path: '/admin/careers', Icon: MdSchool },
          { label: 'Usuarios', path: '/admin/users', Icon: MdGroups },
          { label: 'Perfil', path: '/admin/profile', Icon: MdPerson },
          createNotificationItem('/admin'),
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
      case 'DEV':
        return [
          { label: 'Inicio', path: '/developer', Icon: MdHome },
          { label: 'Usuarios', path: '/developer/users', Icon: MdGroups },
          { label: 'Planteles', path: '/developer/campuses', Icon: MdApartment },
          { label: 'Perfil', path: '/developer/profile', Icon: MdPerson },
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
      case 'SUPERVISOR':
        return [
          { label: 'Inicio', path: '/supervisor', Icon: MdHome },
          { label: 'Carreras', path: '/supervisor/campuses-careers', Icon: MdSchool },
          { label: 'Desempeño', path: '/supervisor/campuses-teachers', Icon: MdLeaderboard },
          { label: 'Perfil', path: '/supervisor/profile', Icon: MdPerson },
          createNotificationItem('/supervisor'),
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
      case 'TEACHER':
        return [
          { label: 'Inicio', path: '/teacher', Icon: MdHome },
          { label: 'Mis Cursos', path: '/teacher/groups', Icon: MdSchool },
          { label: 'Perfil', path: '/teacher/profile', Icon: MdPerson },
          createNotificationItem('/teacher'),
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
      case 'STUDENT':
        return [
          { label: 'Inicio', path: '/student', Icon: MdHome },
          { label: 'Grupos', path: '/student/groups', Icon: MdSchool },
          { label: 'Evaluación Docente', path: '/student/teacher-evaluation', Icon: MdLeaderboard },
          { label: 'Perfil', path: '/student/profile', Icon: MdPerson },
          createNotificationItem('/student'),
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
      default:
        return [
          { label: 'Inicio', path: '/', Icon: MdHome },
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
    }
  }, [user, notificationCount]);

  const activeItemPath = useMemo(() => {
    const matches = MENU_ITEMS.filter((item) => item.path && currentPath.startsWith(item.path)).sort((a, b) => b.path.length - a.path.length);
    return matches[0]?.path || null;
  }, [MENU_ITEMS, currentPath]);

  const handleItemClick = useCallback(
    (item) => {
      if (!isOpen) return;
      if (item.path) {
        navigate(item.path);
        onClose();
      } else {
        confirmAction({
          message: '¿Estás seguro de que quieres cerrar sesión?',
          header: 'Cerrar sesión',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Sí, salir',
          rejectLabel: 'Cancelar',
          acceptClassName: 'p-button-danger',
          onAccept: onLogout,
        });
      }
    },
    [isOpen, navigate, onClose, confirmAction, onLogout]
  );

  return (
    <div
      ref={sidebarRef}
      className={`position-fixed bg-white shadow${!isOpen ? ' sidebar-closed' : ''}`}
      style={{
        top: '70px',
        bottom: 0,
        left: 0,
        width: isOpen ? '15.5rem' : '3.5rem',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.33, 1, 0.68, 1)',
        zIndex: 1040,
        cursor: isOpen ? 'auto' : 'pointer',
      }}
      onClick={() => {
        if (!isOpen) toggleSidebar();
      }}
    >
      <ul className="list-unstyled py-2 m-0">
        {MENU_ITEMS.map((item, idx) => {
          const isCurrent = !isOpen && item.path === activeItemPath;
          return (
            <motion.li key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="mb-2" style={{ cursor: 'pointer' }}>
              <button 
                type="button" 
                className={`btn btn-light d-flex align-items-center sidebar-btn w-100 position-relative${isCurrent ? ' sidebar-btn-current' : ''}${isCurrent && showBlueBg ? ' sidebar-btn-current-animate' : ''}`} 
                onClick={() => handleItemClick(item)} 
                tabIndex={0}
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: idx * 0.1 + 0.05 }}
                  className="position-relative"
                >
                  <item.Icon size={28} />
                  {/* Badge de notificaciones */}
                  {item.badge && (
                    <span 
                      className="position-absolute translate-middle badge rounded-pill bg-danger"
                      style={{
                        top: '15%',
                        left: '85%',
                        fontSize: '0.65rem',
                        minWidth: '18px',
                        height: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 5px'
                      }}
                    >
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </motion.div>
                {isOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ delay: idx * 0.1 }} 
                    className="ms-2 text-truncate text-nowrap d-flex align-items-center"
                  >
                    {item.label}
                    {/* Badge cuando sidebar está abierto */}
                    {item.badge && (
                      <span className="badge bg-danger ms-auto" style={{ fontSize: '0.7rem' }}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </motion.span>
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
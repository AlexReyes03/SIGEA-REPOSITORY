import React, { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdHome, MdSchool, MdGroups, MdPerson, MdLogout } from 'react-icons/md';
import { motion } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from './providers/ConfirmDialogProvider';

export default function Sidebar({ isOpen, toggleSidebar, onClose, toggleRef, onLogout }) {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const { confirmAction } = useConfirmDialog();
  const { user } = useAuth();

  const MENU_ITEMS = useMemo(() => {
    if (!user) return [];

    switch (user.role.name) {
      case 'ADMIN':
        return [
          { label: 'Inicio', path: '/admin', Icon: MdHome },
          { label: 'Cursos', path: '/admin/courses', Icon: MdSchool },
          { label: 'Usuarios', path: '/admin/users', Icon: MdGroups },
          { label: 'Perfil', path: '/admin/profile', Icon: MdPerson },
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];

      case 'TEACHER':
        return [
          { label: 'Inicio', path: '/teacher', Icon: MdHome },
          { label: 'Mis Cursos', path: '/teacher/courses', Icon: MdSchool },
          { label: 'Perfil', path: '/teacher/profile', Icon: MdPerson },
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];

      case 'STUDENT':
        return [
          { label: 'Inicio', path: '/student', Icon: MdHome },
          { label: 'Mis Cursos', path: '/student/courses', Icon: MdSchool },
          { label: 'Perfil', path: '/student/profile', Icon: MdPerson },
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];

      default:
        return [
          { label: 'Inicio', path: '/', Icon: MdHome },
          { label: 'Cerrar sesión', path: null, Icon: MdLogout },
        ];
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(e.target) && (!toggleRef.current || !toggleRef.current.contains(e.target))) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, toggleRef]);

  const handleItemClick = (item) => {
    if (!isOpen) return;
    if (item.path) {
      navigate(item.path);
    } else {
      confirmAction({
        message: '¿Estás seguro de que quieres cerrar sesión?',
        header: 'Cerrar sesión',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, salir',
        rejectLabel: 'Cancelar',
        acceptClassName: 'p-button-danger',
        onAccept: () => {
          onLogout();
        },
      });
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="position-fixed bg-white shadow"
      style={{
        top: '70px',
        bottom: 0,
        left: 0,
        width: isOpen ? '15.5rem' : '3.5rem',
        overflow: 'hidden',
        transition: 'width 0.25s ease-in-out',
        zIndex: 1040,
      }}
      onClick={() => {
        if (!isOpen) toggleSidebar();
      }}
    >
      <ul className="list-unstyled py-2 m-0">
        {MENU_ITEMS.map((item, idx) => (
          <motion.li key={item.label} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="mb-2">
            <button type="button" className="btn btn-light d-flex align-items-center sidebar-btn w-100" onClick={() => handleItemClick(item)}>
              {/* Icono */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 + 0.05 }}>
                <item.Icon size={28} />
              </motion.div>

              {/* Texto */}
              {isOpen && (
                <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} className="ms-2 text-truncate text-nowrap">
                  {item.label}
                </motion.span>
              )}
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

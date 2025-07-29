import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { MdMenu, MdKeyboardArrowDown, MdKeyboardArrowUp } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../contexts/AuthContext';
import { useConfirmDialog } from './providers/ConfirmDialogProvider';
import logo from '../assets/img/logo_cetec.png';
import avatarFallback from '../assets/img/profile.png';
import { BACKEND_BASE_URL } from '../api/common-url';

const Navbar = forwardRef(function Navbar({ toggleSidebar }, toggleRef) {
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const [showDropdown, setShow] = useState(false);
  const [expandedWidth, setExpandedWidth] = useState(200);
  const containerRef = useRef(null);
  const textMeasureRef = useRef(null);

  const { user, logout } = useAuth();
  const { confirmAction } = useConfirmDialog();

  function getAvatarUrl(url) {
    if (!url) return avatarFallback;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  const campusName = user.campus?.name || '';
  const fullName = `${user.name} ${user.paternalSurname || ''}`.trim();
  const roleKey = user.role?.name || user.role;
  const roleMap = { ADMIN: 'Administrador', TEACHER: 'Maestro', STUDENT: 'Estudiante', SUPERVISOR: 'Supervisor', DEV: 'Desarrollador' };
  const roleName = roleMap[roleKey] || roleKey;

  // Calcular ancho dinámico basado en el contenido
  useEffect(() => {
    if (textMeasureRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = '14px system-ui';

      const nameWidth = context.measureText(fullName).width;
      const roleWidth = context.measureText(roleName).width;
      const maxTextWidth = Math.max(nameWidth, roleWidth);

      // Ancho base: ícono (20) + margin (8) + avatar (36) + padding (16) + extra (20)
      const baseWidth = 100;
      const calculatedWidth = Math.max(200, baseWidth + maxTextWidth);
      const finalWidth = Math.min(calculatedWidth, 300);

      setExpandedWidth(finalWidth);
    }
  }, [fullName, roleName]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="navbar navbar-light bg-white shadow-sm fixed-top" style={{ height: 70, zIndex: 1050 }}>
      <div className="container-fluid d-flex align-items-center">
        {/* Botón Menú */}
        <button ref={toggleRef} className="btn btn-white border-0 text-secondary me-1" onClick={toggleSidebar}>
          <MdMenu size={24} />
        </button>

        {/* logo + campus */}
        <img src={logo} height={32} alt="logo" className="me-2" title="Corporativo CETEC ©" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} />
        <h6 className="mb-0 me-auto text-truncate fw-semibold fs-5 user-select-none text-blue-500" title={`Sistema de Gestión Académica - ${campusName}`}>{`SIGEA - ${roleName === 'Supervisor' ? 'Supervisión' : campusName}`}</h6>

        {/* Elemento invisible para medir texto */}
        <div
          ref={textMeasureRef}
          style={{
            position: 'absolute',
            visibility: 'hidden',
            height: 'auto',
            width: 'auto',
            whiteSpace: 'nowrap',
            fontSize: '14px',
          }}
        >
          <div>{fullName}</div>
          <div>{roleName}</div>
        </div>

        {/* card usuario */}
        <div ref={containerRef} className="position-relative d-none d-sm-flex align-items-center">
          <motion.div
            className="d-flex align-items-center bg-gray-800 rounded border-0"
            initial={{ width: 80 }}
            animate={{ width: hover || showDropdown ? expandedWidth : 80 }}
            transition={{ duration: 0.3 }}
            style={{
              cursor: 'pointer',
              overflow: 'hidden',
              height: 50,
              padding: '0 8px',
              justifyContent: 'space-between',
            }}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => setShow((prev) => !prev)}
          >
            {/* izquierda: caret */}
            <div className="d-flex align-items-center flex-shrink-0 me-2">{showDropdown ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}</div>

            {/* texto: slide-in */}
            <AnimatePresence>
              {(hover || showDropdown) && (
                <motion.div
                  className="flex-grow-1 text-start text-nowrap"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    overflow: 'hidden',
                    maxWidth: `${expandedWidth - 100}px`,
                  }}
                >
                  <div
                    className="fw-semibold small mb-0"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {fullName}
                  </div>
                  <small
                    className="text-muted"
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {roleName}
                  </small>
                </motion.div>
              )}
            </AnimatePresence>

            {/* derecha: imagen fija */}
            <div style={{ flexShrink: 0 }}>
              <img src={getAvatarUrl(user.avatarUrl) ?? avatarFallback} className="rounded-circle" width={36} height={36} style={{ objectFit: 'cover' }} alt="avatar" />
            </div>
          </motion.div>

          {/* dropdown */}
          <AnimatePresence>
            {showDropdown && (
              <motion.ul
                className="dropdown-menu dropdown-menu-end mt-2 shadow show"
                style={{ position: 'absolute', top: 'calc(100% + 5px)', right: 0 }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <li>
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      navigate(`/${roleKey.toLowerCase()}/profile`);
                      setShow(false);
                    }}
                  >
                    Mi perfil
                  </button>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button
                    className="dropdown-item text-danger"
                    onClick={() => {
                      confirmAction({
                        message: '¿Estás seguro de que quieres cerrar sesión?',
                        header: 'Cerrar sesión',
                        icon: 'pi pi-exclamation-triangle',
                        acceptLabel: 'Sí, salir',
                        rejectLabel: 'Cancelar',
                        acceptClassName: 'p-button-danger',
                        onAccept: () => {
                          logout();
                          setShow(false);
                        },
                      });
                    }}
                  >
                    Cerrar sesión
                  </button>
                </li>
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
});

export default Navbar;

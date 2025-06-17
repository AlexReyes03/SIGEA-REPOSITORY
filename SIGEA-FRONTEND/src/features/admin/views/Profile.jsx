import React, { useState, useEffect, useRef } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { MdOutlineLock, MdOutlinePerson, MdInsertChartOutlined, MdOutlineSchool } from 'react-icons/md';
import { Modal } from 'bootstrap';
import { AnimatePresence, motion } from 'framer-motion';

import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import PasswordInput from '../../../components/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { changePassword } from '../../../api/authService';
import ProfileAvatarUpload from '../components/ProfileAvatarUpload';

export default function Profile() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();

  const [value, setValue] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const interval = useRef(null);
  const changePasswordModalRef = useRef(null);
  const changePasswordButtonRef = useRef(null);

  useBootstrapModalFocus(changePasswordModalRef, changePasswordButtonRef);

  const ROLE_MAP = {
    ADMIN: 'Administrador',
    TEACHER: 'Maestro',
    STUDENT: 'Estudiante',
  };
  const roleLabel = ROLE_MAP[user.role?.name || user.role] || 'Sin rol';

  useEffect(() => {
    let _val = 0;
    interval.current = setInterval(() => {
      _val += Math.floor(Math.random() * 10) + 1;
      if (_val >= 100) {
        _val = 100;
        clearInterval(interval.current);
      }
      setValue(_val);
    }, 2000);

    return () => clearInterval(interval.current);
  }, []);

  useEffect(() => {
    const modalEl = changePasswordModalRef.current;
    if (!modalEl) return;

    const handleHidden = () => changePasswordButtonRef.current?.blur();
    const swallowEnter = (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    modalEl.addEventListener('hidden.bs.modal', handleHidden);
    modalEl.addEventListener('keydown', swallowEnter, true);

    return () => {
      modalEl.removeEventListener('hidden.bs.modal', handleHidden);
      modalEl.removeEventListener('keydown', swallowEnter, true);
    };
  }, []);

  const validateForm = () => {
    if (!currentPassword.trim()) {
      showError('Error', 'La contraseña actual es requerida');
      return false;
    }
    if (!newPassword.trim()) {
      showError('Error', 'La nueva contraseña es requerida');
      return false;
    }
    if (newPassword.length < 8) {
      showError('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (!confirmPassword.trim()) {
      showError('Error', 'Debes confirmar tu nueva contraseña');
      return false;
    }
    if (newPassword !== confirmPassword) {
      showError('Error', 'Las contraseñas no coinciden');
      return false;
    }
    if (currentPassword === newPassword) {
      showError('Error', 'La nueva contraseña debe ser diferente a la actual');
      return false;
    }
    return true;
  };

  const clearForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
  };

  const handleKeyDown = (e, nextFieldId, isLast = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isLast) {
        e.target.blur();
        setTimeout(() => !isSubmitting && handlePasswordReset(), 200);
      } else {
        document.getElementById(nextFieldId)?.focus();
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!validateForm()) return;

    confirmAction({
      message: '¿Estás seguro de que quieres cambiar tu contraseña?',
      header: 'Cambiar contraseña',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      onAccept: async () => {
        setIsSubmitting(true);
        try {
          await changePassword(currentPassword, newPassword);
          showSuccess('Contraseña cambiada', 'Tu contraseña ha sido cambiada exitosamente.');
          Modal.getInstance(changePasswordModalRef.current)?.hide();
          clearForm();
        } catch (error) {
          if (error.status === 401) showError('Error', 'La contraseña actual es incorrecta');
          else if (error.status === 400) showError('Error', error.message || 'Datos inválidos');
          else if (error.status === 404) showError('Error', 'Usuario no encontrado');
          else showError('Error', 'No se pudo cambiar la contraseña');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleModalClose = () => {
    if (!isSubmitting) clearForm();
    changePasswordButtonRef.current?.blur();
  };

  const isShortPass = newPassword && newPassword.length < 8;
  const isMismatch = confirmPassword && newPassword && newPassword !== confirmPassword;

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Perfil</h3>
      </div>

      <div className="row mt-3">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <div className="card border-0 h-100">
            <div className="card-body">
              <div className="d-flex flex-column align-items-center mt-2 mb-3">
                {/* Componente Avatar con modal */}
                <ProfileAvatarUpload />
              </div>

              <div className="text-center mb-3 mt-2">
                <h5 className="text-blue-500 fw-semibold mb-0">
                  {user.name} {user.paternalSurname || ''} {user.maternalSurname || ''}
                </h5>
                <p className="text-secondary my-2">{roleLabel || 'Sin rol'}</p>
                <div className="d-flex flex-row justify-content-center mt-4 gap-2">
                  <Button ref={changePasswordButtonRef} label="Cambiar contraseña" icon={<MdOutlineLock className="me-2" size={20} />} onClick={() => new Modal(changePasswordModalRef.current).show()} />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <div className="card border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlinePerson size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fw-semibold ms-2 mb-0">Información personal</h6>
              </div>

              <div className="row m-3 text-secondary">
                <div className="col-6 text-nowrap overflow-x-auto">
                  <p>Nombre Completo</p>
                  <p>Correo electrónico</p>
                  <p>Contraseña</p>
                  <p>Matrícula</p>
                  <p>Fecha de alta</p>
                  <p>Estado</p>
                </div>
                <div className="col-6 text-nowrap overflow-x-auto">
                  <p>
                    {user.name} {user.paternalSurname || ''} {user.maternalSurname || ''}
                  </p>
                  <p>{user.email}</p>
                  <p>************</p>
                  <p>{user.registrationNumber}</p>
                  <p>16 Mayo 2003</p>
                  <p>{user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-0 mt-md-3">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <div className="card border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdInsertChartOutlined size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fw-semibold ms-2 mb-0">Progreso</h6>
              </div>

              <div className="row text-secondary m-3">
                <p>Nombre de la carrera</p>
                <ProgressBar className="p-0" value={value} />
                <p>Nombre de la carrera</p>
                <ProgressBar className="p-0" value={value} />
                <p>Nombre de la carrera</p>
                <ProgressBar className="p-0" value={value} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <div className="card border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineSchool size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fw-semibold ms-2 mb-0">Información académica</h6>
              </div>
              <div className="d-flex justify-content-center align-items-center text-muted h-75">Sin información</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de cambio de contraseña */}
      <div className="modal fade" ref={changePasswordModalRef} tabIndex={-1} data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Cambiar contraseña</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={handleModalClose} disabled={isSubmitting} />
            </div>

            <div className="modal-body">
              <PasswordInput id="currentPassword" label="Contraseña actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'newPassword')} disabled={isSubmitting} autoFocus />
              <PasswordInput id="newPassword" label="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')} disabled={isSubmitting} />
              <PasswordInput id="confirmPassword" label="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => handleKeyDown(e, '', true)} disabled={isSubmitting} />

              <AnimatePresence>
                {isShortPass && (
                  <motion.div key="short" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <Message severity="error" text="La nueva contraseña debe tener al menos 8 caracteres" className="w-100 mb-2" style={{ borderLeft: '6px solid #d32f2f' }} />
                  </motion.div>
                )}
                {isMismatch && (
                  <motion.div key="mismatch" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <Message severity="error" text="Las contraseñas no coinciden" className="w-100" style={{ borderLeft: '6px solid #d32f2f' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="modal-footer">
              <Button type="button" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" onClick={handleModalClose} disabled={isSubmitting}>
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="button" icon="pi pi-check" severity="primary" disabled={isSubmitting} loading={isSubmitting} onClick={handlePasswordReset}>
                <span className="d-none d-sm-inline ms-1">{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

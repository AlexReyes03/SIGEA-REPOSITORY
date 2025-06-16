import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { MdOutlineEmail } from 'react-icons/md';

import PasswordInput from '../../../components/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authState, setAuthState] = useState('');
  const { login, loading } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();
  const navigate = useNavigate();

  const handleEmailKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('floatingPassword')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    try {
      const user = await login({ email, password });
      setAuthState('');
      showSuccess('Bienvenido', `¡Qué gusto verte, ${user.name}!`);

      switch (user.role.name) {
        case 'ADMIN':
          return navigate('/admin');
        case 'TEACHER':
          return navigate('/teacher');
        case 'STUDENT':
          return navigate('/student');
        default:
          return navigate('/');
      }
    } catch (err) {
      switch (err.status) {
        case 401:
        case 404:
          setAuthState('warn');
          showError('Error al iniciar sesión', 'Usuario o contraseña incorrectos');
          break;

        case 423:
          setAuthState('locked');
          confirmAction({
            header: 'Demasiados intentos fallidos',
            message: 'Tu cuenta está bloqueada temporalmente por seguridad.',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Aceptar',
            rejectClassName: 'd-none',
            acceptClassName: 'p-button-primary',
          });
          break;

        default:
          showError('Error al iniciar sesión', 'Ha ocurrido un problema inesperado. Intenta de nuevo o vuelve a intentarlo más tarde.');
      }
    }
  };

  const isDisabled = !email.trim() || !password.trim() || loading;

  return (
    <>
      <Helmet>
        <title>SIGEA | Iniciar Sesión</title>
        <meta name="description" content="Sistema de Gestión Académica. Por favor, introduce tus credenciales de acceso para consultar tus calificaciones." />
        <meta name="keywords" content="cetec, sigea, calificaciones, alumnos" />
      </Helmet>

      <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
        <div className="px-3">
          <div className="form-floating position-relative mb-4">
            <input id="floatingInput" type="email" className="form-control pe-5" placeholder=" " autoComplete="off" spellCheck="false" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleEmailKeyDown} />
            <label htmlFor="floatingInput">Correo electrónico</label>
            <MdOutlineEmail size={24} className="position-absolute end-0 me-3 top-50 translate-middle-y text-muted user-select-none" />
          </div>

          <div className="mb-4">
            <PasswordInput
              id="floatingPassword"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isDisabled) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <hr className="my-5" />

          <Button type="submit" label="Iniciar Sesión" className="button-blue-800 w-100 rounded-3 fs-4" loading={loading} disabled={isDisabled} />

          {authState === 'warn' && <Message className="mt-2" severity="warn" text="Cuidado. Cinco intentos fallidos bloquearán tu cuenta temporalmente." />}

          {authState === 'locked' && <Message className="mt-2" severity="error" text="Cuenta bloqueada temporalmente por demasiados intentos fallidos. Espera o restablece tu contraseña." />}

          <div className="text-end my-3 text-muted fw-semibold">
            ¿Olvidaste tu contraseña?
            <span onClick={() => navigate('/security/recover')} className="ms-2 text-primary" style={{ cursor: 'pointer' }}>
              Haz click aquí
            </span>
          </div>
        </div>
      </form>
    </>
  );
}

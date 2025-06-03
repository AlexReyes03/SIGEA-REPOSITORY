import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { MdOutlineEmail } from 'react-icons/md';

import PasswordInput from '../../../components/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isFailed, setIsFailed] = useState(false);
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

      console.log(user);

      showSuccess('Bienvenido', `¡Qué gusto verte, ${user.name}!`);

      switch (user.role.name) {
        case 'ADMIN':
          return navigate('/admin');
        case 'INSTRUCTOR':
          return navigate('/teacher');
        case 'STUDENT':
          return navigate('/student');
        default:
          return navigate('/');
      }
    } catch (err) {
      console.log(err.status);

      if (err.status === 401 || err.status === 404) {
        setIsFailed(true);
        showError('Error', 'Usuario o contraseña incorrectos');
      } else if (err.status === 423) {
        showError('Cuenta bloqueada', 'Has superado el número máximo de intentos. Vuelve a intentarlo más tarde.');
        confirmAction({
          message: 'Tu cuenta ha sido bloqueada temporalmente por seguridad.',
          header: 'Demasiados intentos fallidos',
          icon: 'pi pi-exclamation-triangle',
          acceptLabel: 'Aceptar',
          rejectClassName: 'd-none',
          acceptClassName: 'p-button-primary',
          onAccept: () => {
            null;
          },
        });
      } else {
        showError('Error', 'Ha ocurrido un problema inesperado. Intenta más tarde.');
      }
    }
  };
  const isDisabled = !email.trim() || !password.trim() || loading;

  return (
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

        {isFailed && <div className="text-warning fw-semibold text-center mt-2">Por seguridad, tras cinco intentos fallidos tu cuenta se bloqueará temporalmente.</div>}

        <div className="text-end my-3 text-muted fw-semibold">
          ¿Olvidaste tu contraseña?
          <span onClick={() => navigate('/recover')} className="ms-2 text-primary" style={{ cursor: 'pointer' }}>
            Haz click aquí
          </span>
        </div>
      </div>
    </form>
  );
}

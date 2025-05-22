import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';

import PasswordInput from '../../../components/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();
  const { showSuccess, showError } = useToast();
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

      showSuccess('Bienvenido', `¡Hola, ${user.name}!`);

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
      showError('Error', err.message);
    }
  };
  const isDisabled = !email.trim() || !password.trim() || loading;

  return (
    <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
      <div className="px-3">
        <div className="form-floating position-relative mb-4">
          <input id="floatingInput" type="email" className="form-control pe-5" placeholder=" " autoComplete="off" spellCheck="false" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={handleEmailKeyDown} />
          <label htmlFor="floatingInput">Correo electrónico</label>
          <span className="material-symbols-outlined position-absolute end-0 me-3 top-50 translate-middle-y text-muted user-select-none">mail</span>
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

        <div className="text-end my-3 text-muted fw-semibold">
          ¿Olvidaste tu contraseña?
          <a href="/recover" className="ms-2">
            Haz click aquí
          </a>
        </div>
      </div>
    </form>
  );
}

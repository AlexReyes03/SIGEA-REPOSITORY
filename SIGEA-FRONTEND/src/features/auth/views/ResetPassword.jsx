import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';

import { resetPassword } from '../../../api/authService';
import PasswordInput from '../../../components/PasswordInput';
import { useToast } from '../../../components/providers/ToastProvider';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const { state } = useLocation();
  const email = state?.email || '';
  const code = state?.code || '';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('confirmPassword')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) return;

    if (password !== confirmPassword) {
      showError('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      showError('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setSubmitting(true);
      await resetPassword(email, code, password);
      showSuccess('Hecho', 'Contraseña actualizada con éxito.');
      navigate('/');
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const isDisabled = !password.trim() || !confirmPassword.trim() || submitting;

  return (
    <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
      <div className="px-3">
        <div className="mb-4">
          <PasswordInput id="newPassword" label="Nueva contraseña" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} />
        </div>

        <div className="mb-4">
          <PasswordInput
            id="confirmPassword"
            label="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !isDisabled) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>

        <hr className="my-5" />

        <Button type="submit" label="Cambiar Contraseña" className="button-blue-800 w-100 rounded-3 fs-4" loading={submitting} disabled={isDisabled} />

        <div className="text-end my-3 text-muted fw-semibold"></div>
      </div>
    </form>
  );
}

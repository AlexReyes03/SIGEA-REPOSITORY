import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
        
import PasswordInput from '../../../components/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { loading } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();

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
  
      try {
        showSuccess('Código enviado', `Contraseña actualizada por ${password}`);
        navigate('/');
      } catch (err) {
        showError('Error', err.message);
      }
    };
    const isDisabled = !password.trim() || !confirmPassword.trim() || loading;

  return (
    <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
          <div className="px-3">
            
            <div className="mb-4">
              <PasswordInput
                id="newPassword"
                label="Nueva contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
              />
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

            <Button type="submit" label="Solicitar Código" className="button-blue-800 w-100 rounded-3 fs-4" loading={loading} disabled={isDisabled} />

            <div className="text-end my-3 text-muted fw-semibold">
        </div>
          </div>
        </form>
  )
}

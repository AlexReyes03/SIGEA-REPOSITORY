import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputOtp } from 'primereact/inputotp';
        

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';

export default function VerifyCode() {
    const [token, setTokens] = useState('');
    const { loading } = useAuth();
    const { showSuccess, showError } = useToast();
    const navigate = useNavigate();
  
    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!token.trim()) return;
  
      try {
        showSuccess('Hecho', `El código es ${token}`);
        navigate('/reset-password');
      } catch (err) {
        showError('Error', err.message);
      }
    };
    const isDisabled = !token.trim() || loading;

  return (
    <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
          <div className="px-3">
            
            <div className="d-flex justify-content-center mb-4">
              <InputOtp value={token} onChange={(e) => setTokens(e.value)} mask length={6} onKeyDown={(e) => {if (e.key === 'Enter') handleSubmit(e);}} />
            </div>

            <div className='text-center text-danger mt-3'>
              <span>No lo compartas con nadie.</span>
            </div>

            <hr className="my-5" />

            <Button type="submit" label="Verificar" className="button-blue-800 w-100 rounded-3 fs-4" loading={loading} disabled={isDisabled} />

            <div className="text-end my-3 text-muted fw-semibold">
          ¿Este no es tu correo?
          <span onClick={() => navigate('/recover')}
            className="ms-2 text-primary"
            style={{ cursor: 'pointer' }}>
            Volver
          </span>
        </div>
          </div>
        </form>
  )
}

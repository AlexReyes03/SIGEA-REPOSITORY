import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputOtp } from 'primereact/inputotp';

import { verifyOtp } from '../../../api/authService';
import { useToast } from '../../../components/providers/ToastProvider';

export default function VerifyCode() {
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const { state } = useLocation();
  const { showSuccess, showError } = useToast();
  const email = state?.email || '';
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setSubmitting(true);
      await verifyOtp(email, code);
      navigate('/reset-password', { state: { email, code } });
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const isDisabled = !code.trim() || submitting;

  return (
    <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
      <div className="px-3">
        <div className="d-flex justify-content-center mb-4">
          <InputOtp
            value={code}
            onChange={(e) => setCode(e.value)}
            length={6}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit(e);
            }}
          />
        </div>

        <div className="text-center text-danger mt-3">
          <span>No lo compartas con nadie.</span>
        </div>

        <hr className="my-5" />

        <Button type="submit" label="Verificar" className="button-blue-800 w-100 rounded-3 fs-4" loading={submitting} disabled={isDisabled} />

        <div className="text-end my-3 text-muted fw-semibold">
          ¿Este no es tu correo?
          <span onClick={() => navigate('/recover')} className="ms-2 text-primary" style={{ cursor: 'pointer' }}>
            Volver
          </span>
        </div>
      </div>
    </form>
  );
}

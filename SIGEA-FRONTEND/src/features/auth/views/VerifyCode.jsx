import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputOtp } from 'primereact/inputotp';

import { requestOtp } from '../../../api/authService';
import { verifyOtp } from '../../../api/authService';
import { useToast } from '../../../components/providers/ToastProvider';

export default function VerifyCode() {
  const [submitting, setSubmitting] = useState(false);
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [isExpired, setIsExpired] = useState(false);
  const [resending, setResending] = useState(false);
  const { state } = useLocation();
  const { showSuccess, showError } = useToast();
  const email = state?.email || '';
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      navigate('/security/recover');
    }
  }, [email, navigate, showError]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleResendCode = async () => {
    try {
      setResending(true);
      await requestOtp(email);
      setTimeLeft(15 * 60);
      setIsExpired(false);
      showSuccess('Código reenviado', `Hemos enviado un nuevo código a ${email}`);
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      setSubmitting(true);
      await verifyOtp(email, code);
      navigate('/security/reset-password', { state: { email, code } });
    } catch (err) {
      isExpired ? showError('Error', 'El código ha expirado, por favor solicita uno nuevo') :
      showError('Error', 'El código ingresado es incorrecto. Por favor, verifica e intenta nuevamente');
    } finally {
      setSubmitting(false);
    }
  };
  const isDisabled = !code.trim() || submitting;

  return (
    <>
      <Helmet>
        <title>SIGEA | Verificar Código</title>
        <meta name="description" content="Sistema de Gestión Académica. Por favor, introduce el código de seguridad enviado a tu correo." />
      </Helmet>

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
            {isExpired ? (
              <div className="mt-2">
                <Button 
                  label="Solicitar nuevo código" 
                  className="p-button-link p-button-secondary"
                  onClick={handleResendCode}
                  loading={resending}
                />
              </div>
            ) : (
              <small className="d-block mt-2 text-muted">
                El código expirará en {formatTime(timeLeft)}
              </small>
            )}
            <div>No lo compartas con nadie.</div>
          </div>

          <hr className="my-5" />

          <Button type="submit" label="Verificar" className="button-blue-800 w-100 rounded-3 fs-4" loading={submitting} disabled={isDisabled} />

          <div className="text-end my-3 text-muted fw-semibold">
            ¿{email} no es tu correo?
            <span onClick={() => navigate('/security/recover')} className="ms-2 text-primary" style={{ cursor: 'pointer' }}>
              Volver
            </span>
          </div>
        </div>
      </form>
    </>
  );
}

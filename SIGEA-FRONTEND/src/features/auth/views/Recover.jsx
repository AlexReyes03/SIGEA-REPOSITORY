import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { MdOutlineEmail } from 'react-icons/md';

import { requestOtp } from '../../../api/authService';
import { useToast } from '../../../components/providers/ToastProvider';

export default function Recover() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    // Normalizar a minúsculas automáticamente mientras el usuario escribe
    setEmail(e.target.value.toLowerCase().trim());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.toLowerCase().trim();
    
    if (!normalizedEmail) return;

    try {
      setSubmitting(true);
      await requestOtp(normalizedEmail);
      showSuccess('Hecho', `Hemos enviado un código a ${normalizedEmail} revisa tu bandeja de spam`);
      navigate('/security/verify-code', { state: { email: normalizedEmail } });
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = !email.trim() || submitting;

  return (
    <>
      <Helmet>
        <title>SIGEA | Recuperación</title>
        <meta name="description" content="Sistema de Gestión Académica. Por favor, introduce tu correo electrónico." />
      </Helmet>

      <form onSubmit={handleSubmit} autoComplete="off" spellCheck="false">
        <div className="px-3">
          <div className="form-floating position-relative mb-4">
            <input
              id="emailRecover"
              type="email"
              className="form-control pe-5"
              placeholder=" "
              autoComplete="off"
              spellCheck="false"
              value={email}
              onChange={handleEmailChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit(e);
              }}
              style={{ textTransform: 'lowercase' }} // Visual feedback
            />
            <label htmlFor="emailRecover">Correo electrónico</label>
            <MdOutlineEmail size={24} className="position-absolute end-0 me-3 top-50 translate-middle-y text-muted user-select-none" />
          </div>

          <hr className="my-5" />

          <Button type="submit" label="Solicitar Código" className="button-blue-800 w-100 rounded-3 fs-4" loading={submitting} disabled={isDisabled} />

          <div className="text-end my-3 text-muted fw-semibold">
            Volver al
            <span onClick={() => navigate('/')} className="ms-2 text-primary" style={{ cursor: 'pointer' }}>
              Inicio de sesión
            </span>
          </div>
        </div>
      </form>
    </>
  );
}
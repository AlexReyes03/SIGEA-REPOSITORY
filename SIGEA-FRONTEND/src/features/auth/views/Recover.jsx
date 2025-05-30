import React, { useState } from 'react';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    try {
      setSubmitting(true);
      await requestOtp(email);
      showSuccess('Hecho', `Hemos enviado un código a ${email} revisa tu bandeja de spam`);
      navigate('/verify-code', { state: { email } });
    } catch (err) {
      showError('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };
  const isDisabled = !email.trim() || submitting;

  return (
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
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit(e);
            }}
          />
          <label htmlFor="emailRecover">Correo electrónico</label>
          <MdOutlineEmail size={24} className="position-absolute end-0 me-3 top-50 translate-middle-y text-muted user-select-none"/>
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
  );
}

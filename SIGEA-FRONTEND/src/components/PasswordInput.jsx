import React, { useState } from 'react';

export default function PasswordInput({ id, label, value, onChange, className = '', placeholder = ' ' }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="form-floating position-relative mb-4">
      <input id={id} type={visible ? 'text' : 'password'} className={`form-control pe-5 ${className}`} placeholder={placeholder} autoComplete="off" spellCheck="false" value={value} onChange={onChange} />
      <label htmlFor={id}>{label}</label>
      <span role="button" onClick={() => setVisible((v) => !v)} className="material-symbols-outlined position-absolute end-0 me-3 top-50 translate-middle-y text-muted" style={{ cursor: 'pointer' }} title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
        {visible ? 'visibility_off' : 'visibility'}
      </span>
    </div>
  );
}

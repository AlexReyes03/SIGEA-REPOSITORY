import React, { useState } from 'react';
import { MdOutlineVisibility, MdOutlineVisibilityOff } from 'react-icons/md';

export default function PasswordInput({ id, label, value, onChange, onKeyDown, className = '', placeholder = ' ' }) {
  const [visible, setVisible] = useState(false);

  const Icon = visible ? MdOutlineVisibility : MdOutlineVisibilityOff;

  return (
    <div className="form-floating position-relative mb-4">
      <input id={id} type={visible ? 'text' : 'password'} className={`form-control pe-5 ${className}`} placeholder={placeholder} autoComplete="off" spellCheck="false" value={value} onChange={onChange} onKeyDown={onKeyDown} />
      <label htmlFor={id}>{label}</label>
      <Icon role="button" size={24} onClick={() => setVisible((v) => !v)} className="position-absolute end-0 me-3 top-50 translate-middle-y text-muted" style={{ cursor: 'pointer' }} title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}/>
    </div>
  );
}

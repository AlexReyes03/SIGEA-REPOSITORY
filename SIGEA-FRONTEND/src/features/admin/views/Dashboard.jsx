import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from 'primereact/button';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Bienvenido, Administrador</h1>
        <Button label="Cerrar Sesión" icon="pi pi-sign-out" className="p-button-danger" onClick={handleLogout} />
      </div>
    </div>
  );
}

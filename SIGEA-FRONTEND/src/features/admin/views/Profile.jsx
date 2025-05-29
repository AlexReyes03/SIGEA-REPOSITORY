import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from 'primereact/button';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Perfil, {user.role?.name}</h1>
      </div>
    </div>
  );
}

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { MdOutlineEmojiEvents } from 'react-icons/md';

import { useAuth } from '../../../contexts/AuthContext';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      <div className='bg-white rounded-top shadow p-2'>
        <h3>Inicio</h3>
      </div>

      <div className="row mt-3">
        <div className="col-6">

        </div>
        <div className="col-6">
          <div className="card">
            <div className="card-body">
              <div className='d-flex'>
                <MdOutlineEmojiEvents size={40} className='title-icon p-1 rounded-circle'/>
                <h5 className="d-flex align-items-center ms-2">Desempeño docente</h5>
              </div>
              <div className="my-3">
                <div className="row">
                  <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card’s content.</p>
                </div>
                <div className="row">
                  <p className='fs-1 fw-bold'>4.6</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

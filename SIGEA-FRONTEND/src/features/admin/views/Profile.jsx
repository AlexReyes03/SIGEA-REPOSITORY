import React, { useState, useEffect, useRef } from 'react';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { MdOutlineLock, MdOutlinePerson, MdInsertChartOutlined, MdOutlineSchool } from 'react-icons/md';

import avatarFallback from '../../../assets/img/profile.png';
import { useAuth } from '../../../contexts/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  const [value, setValue] = useState(0);
  const interval = useRef(null);

  const ROLE_MAP = {
    ADMIN: 'Administrador',
    INSTRUCTOR: 'Instructor',
    STUDENT: 'Estudiante'
  };
  const userRoleName = user.role?.name || user.role;
  const roleLabel = ROLE_MAP[userRoleName] || 'Sin rol';

  useEffect(() => {
        let _val = value;

        interval.current = setInterval(() => {
            _val += Math.floor(Math.random() * 10) + 1;

            if (_val >= 100) {
                _val = 100;
                clearInterval(interval.current);
            }

            setValue(_val);
        }, 2000);

        return () => {
            if (interval.current) {
                clearInterval(interval.current);
                interval.current = null;
            }
        };
    }, []);

  return (
      <>
        <div className='bg-white rounded-top p-2'>
          <h3 className='text-blue-500 fw-semibold mx-3 my-1'>Perfil</h3>
        </div>

        <div className="row mt-3">
          <div className="col-4">
            <div className="card border-0">
              <div className="card-body">

                <div className="d-flex justify-content-center mt-2 mb-3">
                  <img src={avatarFallback} className='rounded-circle' title='Cambiar foto de Perfil' alt="Foto de perfil" style={{ cursor: 'pointer', height: '150px' }} />
                </div>

                <div className="text-center mb-3">
                  <h5 className="text-blue-500 fw-semibold mb-0">{user.name} {user.paternalSurname || ''} {user.maternalSurname || ''}</h5>
                  <p className="text-secondary my-2">{roleLabel || "Sin rol"}</p>
                  <div className="d-flex flex-row justify-content-center mt-4 gap-2">
                    <Button label="Cambiar contraseña" icon={<MdOutlineLock className='me-2' size={20}/>} />
                  </div>
                </div>

              </div>
            </div>
          </div>
          <div className="col-8">
            <div className="card border-0">
              <div className="card-body">

                <div className="d-flex align-items-center">
                  <div className='title-icon p-1 rounded-circle'>
                    <MdOutlinePerson size={40} className="p-1" />
                  </div>
                  <h6 className="text-blue-500 fw-semibold ms-2 mb-0">Información personal</h6>
                </div>

                <div className="row m-3 text-secondary">
                  <div className="col-6">
                    <p>Nombre Completo</p>
                    <p>Correo electrónico</p>
                    <p>Contraseña</p>
                    <p>Matrícula</p>
                    <p>Fecha de alta</p>
                    <p>Estado</p>
                  </div>
                  <div className="col-6">
                    <p>{user.name} {user.paternalSurname || ''} {user.maternalSurname || ''}</p>
                    <p>{user.email}</p>
                    <p>************</p>
                    <p>{user.registrationNumber}</p>
                    <p>16 Mayo 2003</p>
                    <p>{user.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        <div className="row mt-3">
          <div className="col-4">
            <div className="card border-0">
              <div className="card-body">

                <div className="d-flex align-items-center">
                  <div className='title-icon p-1 rounded-circle'>
                    <MdInsertChartOutlined size={40} className="p-1" />
                  </div>
                  <h6 className="text-blue-500 fw-semibold ms-2 mb-0">Progreso</h6>
                </div>

                <div className='row text-secondary m-3'>
                  <p>Nombre de la carrera</p>
                  <ProgressBar className='p-0' value={value}/>
                  <p>Nombre de la carrera</p>
                  <ProgressBar className='p-0' value={value}/>
                  <p>Nombre de la carrera</p>
                  <ProgressBar className='p-0' value={value}/>
                </div>

              </div>
            </div>
          </div>
          <div className="col-8">
            <div className="card border-0">
              <div className="card-body">

                <div className="d-flex align-items-center">
                  <div className='title-icon p-1 rounded-circle'>
                    <MdOutlineSchool size={40} className="p-1" />
                  </div>
                  <h6 className="text-blue-500 fw-semibold ms-2 mb-0">Información académica</h6>
                </div>

              </div>
            </div>
          </div>
        </div>

      </>
    );
}

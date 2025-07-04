import React from 'react';
import { getUserById } from '../../../api/userService';
import { MdOutlinePerson, MdOutlineGroup, MdSchool } from 'react-icons/md';
import { HiOutlineTrophy } from "react-icons/hi2";
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

import ConsultSubjects from '../../student/views/ConsultSubjects';

export default function Groups() {
  const { user } = useAuth(); // Obtener usuario del contexto
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        if (user?.id) {
          // Obtener datos completos del estudiante
          const userData = await getUserById(user.id);
          setStudentData(userData);
        }
      } catch (error) {
        console.error('Error al cargar datos del estudiante:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  // Datos temporales para testing 
  const selectedGroup = {
    groupId: 1, 
    curriculumId: 1, 
    name: "Grupo A"
  };

  const currentStudentId = user?.id || 1; 

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Calificaciones</h3>
      </div>

      {/* Información de la materia y promedio */}
      <div className="row my-2">
        <div className="col-12 col-lg-4 mb-2 mb-lg-0">
          <div className="card border-0 h-100" style={{ minHeight: '10rem' }}>
            <div className="card-body d-flex flex-column ">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <HiOutlineTrophy size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Promedio General</h6>
              </div>
              <div className="d-flex flex-column flex-grow-1 align-items-center justify-content-center text-center text-blue-500 ">
                <div className="d-flex flex-row align-items-center">
                  <h1 className='fw-bold'>9.0</h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card border-0" style={{ minHeight: '10rem' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdSchool size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Información académica</h6>
              </div>
              <div className="row text-muted p-3">
                <div className='col-6'>
                  <p className='fw-semibold'>{studentData?.career || 'Carrera Técnica en Computación'}</p>
                  <p className="mb-0">Fecha de ingreso</p>
                  <p className="fw-semibold">{studentData?.enrollmentDate || '01/01/2020'}</p>
                  <p className='mb-0'>Estado</p>
                  <p className='fw-semibold'>{studentData?.status || 'Activo'}</p>
                </div>
                <div className='col-6'>
                  <p className='fw-semibold'>{selectedGroup.name || 'Grupo A'}</p>
                  <p className="mb-0">Fecha de Egreso</p>
                  <p className='fw-semibold'>{studentData?.graduationDate || '01/01/2023'}</p>
                  <p className='mb-0'>Horario</p>
                  <p className='fw-semibold'>{studentData?.schedule || 'Sábado 8:00 - 14:00'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de calificaciones */}
      <ConsultSubjects
        group={selectedGroup}
        studentId={currentStudentId}
      />
    </>
  );
}
import React from 'react';
import { getUserById } from '../../../api/userService';
import { getStudentsWithGroup, getGroupById } from '../../../api/academics/groupService';
import { getQualificationsByGroupWithDetails } from '../../../api/academics/qualificationService';
import { MdOutlineSchool } from 'react-icons/md';
import { HiOutlineTrophy } from "react-icons/hi2";
import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

import ConsultSubjects from './ConsultSubjects';

export default function Qualifications() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [generalAverage, setGeneralAverage] = useState(null);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        if (user?.id) {
          const userData = await getUserById(user.id);
          setStudentData(userData);
          const studentsWithGroups = await getStudentsWithGroup();
          const studentGroups = studentsWithGroups.filter(
            item => item.studentId === user.id
          );

          if (studentGroups.length > 0) {
            const primaryGroup = studentGroups.find(
              group => group.additionalEnrollmentsCount === 0
            ) || studentGroups[0];

            const groupDetails = await getGroupById(primaryGroup.groupId);

            const groupForComponent = {
              groupId: primaryGroup.groupId,
              curriculumId: groupDetails.curriculumId,
              name: `Grupo ${groupDetails.name}`,
              careerName: groupDetails.careerName,
              schedule: `${groupDetails.weekDay} ${groupDetails.startTime} - ${groupDetails.endTime}`,
              period: `${groupDetails.startDate} - ${groupDetails.endDate}`,
              teacherName: groupDetails.teacherName
            };

            setSelectedGroup(groupForComponent);

            await calculateGeneralAverage(primaryGroup.groupId, user.id);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos del estudiante:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [user]);

  const calculateGeneralAverage = async (groupId, studentId) => {
    try {
      const qualifications = await getQualificationsByGroupWithDetails(groupId);

      const studentQualifications = qualifications.filter(
        q => q.studentId === studentId && q.grade != null && q.grade >= 6 && q.grade <= 10
      );

      if (studentQualifications.length > 0) {
        const total = studentQualifications.reduce((sum, q) => sum + q.grade, 0);
        const average = (total / studentQualifications.length).toFixed(1);
        setGeneralAverage(average);
      } else {
        setGeneralAverage('S/C');
      }
    } catch (error) {
      console.error('Error al calcular promedio:', error);
      setGeneralAverage('N/A');
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Mensaje si no se encontró grupo
  if (!selectedGroup) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning" role="alert">
          <h4 className="alert-heading">No se encontró información de grupo</h4>
          <p>No se pudo cargar la información de tu grupo actual. Por favor contacta al administrador.</p>
        </div>
      </div>
    );
  }

  //Manejo de estados 
  const STATUS_LABELS = {
    'ACTIVE': 'Activo',
    'INACTIVE': 'Inactivo',
  };

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Calificaciones</h3>
      </div>

      {/* Información de la materia y promedio */}
      <div className="row my-2">
        <div className="col-12 col-lg-4 mb-2 mb-lg-0">
          <div className="card border-0 h-100" style={{ minHeight: '10rem' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <HiOutlineTrophy size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Promedio General</h6>
              </div>
              <div className="d-flex flex-column flex-grow-1 align-items-center justify-content-center text-center text-blue-500">
                <div className="d-flex flex-row align-items-center">
                  <h1 className='fw-bold'>
                    {generalAverage || 'Cargando...'}
                  </h1>
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
                  <MdOutlineSchool size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Información académica</h6>
              </div>
              <div className="row text-muted p-3">
                <div className='col-6'>
                  <p className='fw-semibold'>{selectedGroup?.careerName || 'Carrera no disponible'}</p>
                  <p className="mb-0">Estudiante</p>
                  <p className="fw-semibold">
                    {studentData ?
                      `${studentData.name} ${studentData.paternalSurname}${studentData.maternalSurname ? ` ${studentData.maternalSurname}` : ''}`
                      : 'N/A'
                    }
                  </p>
                  <p className="mb-0">Matrícula</p>
                  <p className="fw-semibold">{studentData?.primaryRegistrationNumber || 'N/A'}</p>
                  <p className='mb-0'>Estado</p>
                  <p className='fw-semibold'>{STATUS_LABELS[studentData?.status] || 'N/A'}</p>
                </div>
                <div className='col-6'>
                  <p className='fw-semibold'>{selectedGroup?.name || 'Grupo A'}</p>
                  <p className="mb-0">Docente a cargo</p>
                  <p className='fw-semibold'>{selectedGroup?.teacherName || 'No asignado'}</p>
                  <p className='mb-0'>Horario</p>
                  <p className='fw-semibold'>{selectedGroup?.schedule || 'No disponible'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Componente de calificaciones */}
      <ConsultSubjects
        group={selectedGroup}
        studentId={user?.id}
        studentData={studentData}
      />
    </>
  );
}
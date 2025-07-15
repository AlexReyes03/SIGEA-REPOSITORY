import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { HiMiniStar, HiCalendar, HiChevronRight } from "react-icons/hi2";

import { BiSolidBookBookmark } from "react-icons/bi";
import { useAuth } from '../../../contexts/AuthContext';
import { getCareerByPlantelId, } from '../../../api/academics/careerService';
import { getEnrollmentsByUser } from '../../../api/academics/enrollmentService';
import { getCurriculumByCareerId } from '../../../api/academics/curriculumService';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  //Estados
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para calcular duración del curriculum (usando la lógica ya probada)
  const getCurriculumDuration = useMemo(() => {
    return (curriculum) => {
      if (!curriculum?.modules || curriculum.modules.length === 0) {
        return { weeks: 0, months: 0, years: 0, text: 'Sin módulos' };
      }

      const totalWeeks = curriculum.modules.reduce((acc, module) => {
        if (!module.subjects) return acc;
        return acc + module.subjects.reduce((subAcc, subject) => subAcc + (subject.weeks || 0), 0);
      }, 0);

      const totalMonths = totalWeeks / 4;
      const years = Math.floor(totalMonths / 12);
      const remainingMonths = Math.floor(totalMonths % 12);

      let text = '';
      if (years > 0 && remainingMonths > 0) {
        text = `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
      } else if (years > 0) {
        text = `${years} año${years > 1 ? 's' : ''}`;
      } else if (remainingMonths > 0) {
        text = `${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
      } else {
        text = `${totalWeeks} ${totalWeeks === 1 ? 'semana' : 'semanas'}`;
      }

      return {
        weeks: totalWeeks,
        months: totalMonths,
        years: years,
        remainingMonths: remainingMonths,
        text: text,
      };
    };
  }, []);

  // Función para calcular el período basado en fecha de inscripción y duración
  const calculatePeriod = (enrolledAt, totalWeeks) => {
    console.log("Datos para calcular período:", { enrolledAt, totalWeeks });

    if (!enrolledAt || !totalWeeks || totalWeeks === 0) {
      console.log("Faltan datos para calcular período");
      return "Período no disponible";
    }

    const startDate = new Date(enrolledAt);
    const endDate = new Date(startDate);

    // Agregar las semanas a la fecha de inicio
    endDate.setDate(startDate.getDate() + (totalWeeks * 7));

    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    const result = `Período ${startYear}-${endYear}`;
    console.log("Período calculado:", result);
    return result;
  };

  const loadStudentEnrollments = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const list = await getEnrollmentsByUser(user.id);
        // Filtrar solo inscripciones activas
        const activeEnrollments = Array.isArray(list) ? list.filter(enrollment => enrollment.status === 'ACTIVE') : [];

        // Para cada inscripción, obtener el curriculum y calcular el período
        const enrollmentsWithPeriod = await Promise.all(
          activeEnrollments.map(async (enrollment) => {
            try {
              const curriculum = await getCurriculumByCareerId(enrollment.careerId);
              console.log("Curriculum obtenido para carrera", enrollment.careerId, ":", curriculum);

              const durationData = getCurriculumDuration(curriculum);
              console.log("Duración calculada:", durationData);

              const period = calculatePeriod(enrollment.enrolledAt, durationData.weeks);

              return {
                ...enrollment,
                period: period
              };
            } catch (error) {
              console.error(`Error loading curriculum for career ${enrollment.careerId}:`, error);
              return {
                ...enrollment,
                period: "Período no disponible"
              };
            }
          })
        );

        setEnrollments(enrollmentsWithPeriod);
      }
    } catch (error) {
      console.error("Error loading student enrollments:", error);
      // showError('Error', 'Error al cargar las inscripciones.')
      console.error('Error al cargar las inscripciones.');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }

  // Función para navegar a calificaciones
  const handleNavigateToQualifications = () => {
    navigate('/student/my-qualifications');
  };

  // Cargar inscripciones al montar el componente
  useEffect(() => {
    loadStudentEnrollments();
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      <div className='row mt-3'>
        {loading ? (
          <div className="col-12 d-flex justify-content-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Cargando...</span>
            </div>
          </div>
        ) : enrollments.length > 0 ? (
          enrollments.map((enrollment) => (
            <div key={enrollment.id} className="col-12 col-md-4 col-lg-4 col-xl-3 mb-3">
              <div className="card border-0 h-100 shadow-sm" style={{ cursor: 'pointer' }} onClick={handleNavigateToQualifications}>
                <div className='card-body'>
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1 text-truncate">
                      <h5 className="fw-semibold lh-sm mb-2 text-dark text-truncate">{enrollment.careerName}</h5>
                      <div className="d-flex justify-content-start ms-1">
                        <div className="d-flex align-items-center">
                          <HiCalendar className="me-1 text-muted" />
                          <span className="text-muted">{enrollment.period}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-light h-100 text-truncate gap-2 mt-5">
                        <BiSolidBookBookmark className="text-secondary mb-1 align-items-center" size={24} />
                        <small className="text-muted"> Calificaciones </small>
                        <HiChevronRight className='text-muted' />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-info" role="alert">
              <h4 className="alert-heading">No tienes inscripciones activas</h4>
              <p>Actualmente no tienes inscripciones activas en ninguna carrera.</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { MdCalendarToday, MdChevronRight, MdOutlineSchool, MdMenuBook } from 'react-icons/md';
import { motion } from 'framer-motion';
import { getEnrollmentsByUser } from '../../../api/academics/enrollmentService';
import { getCurriculumByCareerId } from '../../../api/academics/curriculumService';

export default function Groups() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Fechas no disponibles';
    const start = new Date(startDate);
    const end = new Date(endDate);
    return `${start.getFullYear()}-${end.getFullYear()}`;
  };

  const getCurriculumDuration = (curriculum) => {
    if (!curriculum?.modules || curriculum.modules.length === 0) {
      return { weeks: 0, months: 0, totalModules: 0 };
    }

    const totalModules = curriculum.modules.length; // Contar módulos
    const totalWeeks = curriculum.modules.reduce((acc, module) => {
      const moduleWeeks =
        module.subjects?.reduce((subAcc, subject) => {
          return subAcc + (subject.weeks || 0);
        }, 0) || 0;
      return acc + moduleWeeks;
    }, 0);

    return {
      weeks: totalWeeks,
      months: Math.round(totalWeeks / 4),
      totalModules: totalModules,
    };
  };

  const calculatePeriod = (enrollmentDate, totalWeeks) => {
    if (!enrollmentDate || !totalWeeks) {
      return 'Periodo no disponible';
    }

    const startDate = new Date(enrollmentDate);
    const startYear = startDate.getFullYear();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + totalWeeks * 7);
    const endYear = endDate.getFullYear();

    return `${startYear}-${endYear}`;
  };

  const loadStudentEnrollments = async () => {
    try {
      setLoading(true);
      if (user?.id) {
        const list = await getEnrollmentsByUser(user.id);
        const activeEnrollments = Array.isArray(list) ? list.filter((enrollment) => enrollment.status === 'ACTIVE') : [];

        const enrollmentsWithData = await Promise.all(
          activeEnrollments.map(async (enrollment) => {
            try {
              const curriculumResponse = await getCurriculumByCareerId(enrollment.careerId);
              const curriculum = Array.isArray(curriculumResponse) ? curriculumResponse[0] : curriculumResponse;
              const durationData = getCurriculumDuration(curriculum);
              const period = calculatePeriod(enrollment.enrolledAt, durationData.weeks);

              const enrollmentDate = new Date(enrollment.enrolledAt);
              const currentDate = new Date();
              const weeksDiff = Math.floor((currentDate - enrollmentDate) / (1000 * 60 * 60 * 24 * 7));

              let currentModule = 1;
              let accumulatedWeeks = 0;

              if (curriculum?.modules && curriculum.modules.length > 0) {
                for (let i = 0; i < curriculum.modules.length; i++) {
                  const moduleWeeks = curriculum.modules[i].subjects?.reduce((acc, subject) => acc + (subject.weeks || 0), 0) || 0;

                  if (weeksDiff > accumulatedWeeks + moduleWeeks) {
                    currentModule = Math.min(i + 2, durationData.totalModules);
                    accumulatedWeeks += moduleWeeks;
                  } else {
                    currentModule = i + 1;
                    break;
                  }
                }
              }

              if (weeksDiff >= durationData.weeks) {
                currentModule = durationData.totalModules;
              }

              const completedModules = Math.max(0, currentModule - 1);
              const progress = durationData.totalModules > 0 ? Math.round((completedModules / durationData.totalModules) * 100) : 0;

              return {
                ...enrollment,
                progress: progress,
                completedModules: completedModules,
                currentModule: currentModule,
                totalModules: durationData.totalModules,
                period: period,
                groupName: `Grupo ${enrollment.careerName.split(' ')[0]}-${new Date(enrollment.enrolledAt).getFullYear()}`,
                hasGroup: true,
              };
            } catch (error) {
              console.error('Error calculating data for enrollment:', error);
              return {
                ...enrollment,
                progress: 0,
                completedModules: 0,
                currentModule: 1,
                totalModules: 0,
                period: 'Error al cargar datos',
                groupName: 'Sin grupo asignado',
                hasGroup: false,
              };
            }
          })
        );

        setEnrollments(enrollmentsWithData);
      }
    } catch (error) {
      console.error('Error loading enrollments:', error);
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateToQualifications = (enrollment) => {
    navigate('/student/groups/my-qualifications', {
      state: {
        careerId: enrollment.careerId,
        careerName: enrollment.careerName,
        enrollmentId: enrollment.id,
        period: enrollment.period,
        progress: enrollment.progress,
      },
    });
  };

  const getProgressColor = (progress) => {
    return 'primary';
  };

  // Cargar inscripciones al montar el componente
  useEffect(() => {
    loadStudentEnrollments();
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-top p-2 p-md-3 mb-3">
        <h3 className="text-blue-500 fw-semibold mx-2 mx-md-3 my-1 fs-4 fs-md-3">Mis Grupos</h3>
      </div>

      <div>
        <div className="row mt-2 mt-md-3 gx-2 gx-md-3">
          {loading ? (
            <div className="col-12 d-flex justify-content-center py-4 py-md-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : enrollments.length > 0 ? (
            enrollments.map((enrollment, index) => (
              <motion.div key={enrollment.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3 mb-md-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <div
                  className="card border-0 h-100 shadow-sm position-relative overflow-hidden"
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onClick={() => handleNavigateToQualifications(enrollment)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
                  }}
                >
                  {/* Header con el nombre del grupo - Responsive */}
                  <div
                    className="card-header bg-gradient p-2 p-md-3"
                    style={{
                      background: 'linear-gradient(135deg, #276ba5 0%, #3498db 100%)',
                      border: 'none',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between text-white">
                      <div className="d-flex align-items-center flex-grow-1 me-2">
                        <MdOutlineSchool size={20} className="me-2 d-none d-md-block" />
                        <MdOutlineSchool size={18} className="me-2 d-md-none" />
                        <h6 className="mb-0 fw-semibold fs-6 text-truncate">{enrollment.groupName}</h6>
                      </div>
                      <MdChevronRight size={18} className="d-md-none" />
                      <MdChevronRight size={20} className="d-none d-md-block" />
                    </div>
                  </div>

                  <div className="card-body p-2 p-md-4 pb-3">
                    {/* Información de la carrera - Responsive */}
                    <div className="mb-2 mb-md-3">
                      <h5 className="fw-bold text-dark mb-1 fs-6 fs-md-5 lh-sm text-truncate" title={enrollment.careerName}>
                        {enrollment.careerName}
                      </h5>
                      <div className="d-flex align-items-center text-muted">
                        <MdCalendarToday className="me-2 flex-shrink-0" size={14} />
                        <span className="small">{enrollment.period}</span>
                      </div>
                    </div>

                    {/* Progreso académico - Ajustado para móvil */}
                    <div className="mb-2 mb-md-3">
                      <div className="d-flex justify-content-between align-items-center mb-1 mb-md-2">
                        <small className="text-muted fw-medium">Progreso</small>
                        <span className={`badge bg-${getProgressColor(enrollment.progress)} small`}>{enrollment.progress}%</span>
                      </div>

                      {/* Barra de progreso - Más delgada en móvil */}
                      <div className="progress mb-1 mb-md-2" style={{ height: '6px' }}>
                        <motion.div className={`progress-bar bg-${getProgressColor(enrollment.progress)}`} initial={{ width: 0 }} animate={{ width: `${enrollment.progress}%` }} transition={{ duration: 1, delay: index * 0.2 }} style={{ borderRadius: '3px' }} />
                      </div>

                      {/* Contador de módulos - Stack en móvil, inline en desktop */}
                      <div className="d-flex flex-column flex-md-row justify-content-between">
                        <small className="text-muted mb-1 mb-md-0">
                          {enrollment.completedModules} de {enrollment.totalModules} módulos
                        </small>
                        <small className="text-primary fw-medium">Módulo actual: {enrollment.currentModule}</small>
                      </div>
                    </div>

                    {/* Botón de acción - Más compacto en móvil */}
                    <div className="mt-auto">
                      <div className="d-flex align-items-center justify-content-center p-2 p-md-3 rounded bg-light">
                        <MdMenuBook className="text-primary me-2 flex-shrink-0" size={16} />
                        <span className="text-primary fw-medium small">Ver Calificaciones</span>
                      </div>
                    </div>
                  </div>

                  {/* Indicador de estado - Ajustado para móvil */}
                  {!enrollment.hasGroup && (
                    <div className="position-absolute top-0 end-0 m-1 m-md-2">
                      <span className="badge bg-warning small">Sin grupo</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-12">
              <motion.div className="alert alert-info border-0 shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="d-flex align-items-center">
                  <MdOutlineSchool size={32} className="text-info me-3 d-none d-md-block" />
                  <MdOutlineSchool size={28} className="text-info me-3 d-md-none" />
                  <div>
                    <h4 className="alert-heading mb-1 fs-5 fs-md-4">No hay inscripciones activas</h4>
                    <p className="mb-0 small">Actualmente no tienes inscripciones activas en ninguna carrera.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

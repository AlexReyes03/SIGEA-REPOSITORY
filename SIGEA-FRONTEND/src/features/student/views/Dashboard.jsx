import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineGroup, MdOutlineAssignment, MdOutlineSchool, MdOutlineCalendarMonth, MdOutlineSchedule, MdOutlineCoPresent } from 'react-icons/md';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getEnrollmentsByUser } from '../../../api/academics/enrollmentService';
import { getGroupByCareer, getGroupStudents } from '../../../api/academics/groupService';
import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getQualificationsByGroupWithDetails } from '../../../api/academics/qualificationService';
import { getStudentEvaluationModules } from '../../../api/academics/rankingService';

const weekDayOptions = [
  { label: 'Lunes', value: 'LUN' },
  { label: 'Martes', value: 'MAR' },
  { label: 'Miércoles', value: 'MIE' },
  { label: 'Jueves', value: 'JUE' },
  { label: 'Viernes', value: 'VIE' },
  { label: 'Sábado', value: 'SAB' },
  { label: 'Domingo', value: 'DOM' },
];

const getWeekLabel = (code) => weekDayOptions.find((o) => o.value === code)?.label || code;

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);

  // Estados para los indicadores
  const [activeGroups, setActiveGroups] = useState(0);
  const [completedCareers, setCompletedCareers] = useState(0);
  const [pendingEvaluations, setPendingEvaluations] = useState(0);

  // Estados para las cards de detalle
  const [myGroups, setMyGroups] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);

  const getCurrentWeekDay = useCallback(() => {
    const today = new Date();
    const dayIndex = today.getDay();
    const weekDays = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    return weekDays[dayIndex];
  }, []);

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return 'Sin fechas';

    const start = new Date(startDate);
    const end = new Date(endDate);

    const startYear = start.getFullYear();
    const endYear = end.getFullYear();

    if (startYear === endYear) {
      return `${startYear}`;
    }

    return `${startYear}-${endYear}`;
  };

  const loadStudentData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const enrollments = await getEnrollmentsByUser(user.id);
      const activeEnrollments = Array.isArray(enrollments) ? enrollments.filter((e) => e.status === 'ACTIVE') : [];

      if (activeEnrollments.length === 0) {
        setActiveGroups(0);
        setCompletedCareers(0);
        setPendingEvaluations(0);
        setMyGroups([]);
        setTodaySchedule([]);
        return;
      }

      const studentGroups = [];
      let totalCompleted = 0;

      for (const enrollment of activeEnrollments) {
        try {
          const careerGroups = await getGroupByCareer(enrollment.careerId);
          const groupsArray = Array.isArray(careerGroups) ? careerGroups : careerGroups?.data || [];

          for (const group of groupsArray) {
            try {
              const groupStudents = await getGroupStudents(group.groupId);
              const isStudentInGroup = Array.isArray(groupStudents) && groupStudents.some((student) => student.studentId === user.id);

              if (isStudentInGroup) {
                let progress = 0;
                let completedSubjects = 0;
                let totalSubjects = 0;

                try {
                  const curriculum = await getCurriculumById(group.curriculumId);
                  if (curriculum?.modules) {
                    curriculum.modules.forEach((module) => {
                      if (module.subjects) {
                        totalSubjects += module.subjects.length;
                      }
                    });
                  }

                  const qualifications = await getQualificationsByGroupWithDetails(group.groupId);
                  const studentQualifications = qualifications.filter((q) => q.studentId === user.id);
                  completedSubjects = studentQualifications.length;

                  progress = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0;
                } catch (error) {
                  console.warn(`Error calculating progress for group ${group.groupId}:`, error);
                }

                if (progress >= 100) {
                  totalCompleted++;
                }

                studentGroups.push({
                  ...group,
                  careerName: enrollment.careerName,
                  careerId: enrollment.careerId,
                  enrollmentId: enrollment.id,
                  progress,
                  completedSubjects,
                  totalSubjects,
                });
                break;
              }
            } catch (error) {
              console.warn(`Error checking group ${group.groupId}:`, error);
            }
          }
        } catch (error) {
          console.warn(`Error processing career ${enrollment.careerId}:`, error);
        }
      }
      console.log();
      setActiveGroups(studentGroups.length);
      setCompletedCareers(totalCompleted);
      setMyGroups(studentGroups);

      const currentWeekDay = getCurrentWeekDay();
      const todayGroups = studentGroups.filter((group) => group.weekDay === currentWeekDay && group.status === 'ACTIVE').sort((a, b) => a.startTime.localeCompare(b.startTime));

      setTodaySchedule(todayGroups);

      try {
        const evaluationData = await getStudentEvaluationModules(user.id);
        const pendingCount = evaluationData.filter((module) => !module.isEvaluated).length;
        setPendingEvaluations(pendingCount);
      } catch (error) {
        console.warn('Error loading pending evaluations:', error);
        setPendingEvaluations(0);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
      showError('Error', 'Error al cargar los datos del estudiante');
      setActiveGroups(0);
      setCompletedCareers(0);
      setPendingEvaluations(0);
      setMyGroups([]);
      setTodaySchedule([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError, getCurrentWeekDay]);

  useEffect(() => {
    if (user?.id) {
      loadStudentData();
    }
  }, [loadStudentData]);

  const navigateToGroups = useCallback(() => {
    navigate('/student/groups');
  }, [navigate]);

  const navigateToTeacherEvaluation = useCallback(() => {
    navigate('/student/teacher-evaluation');
  }, [navigate]);

  const handleNavigateToQualifications = useCallback(
    (group) => {
      const period = formatDateRange(group.startDate, group.endDate);
      navigate('/student/groups/my-qualifications', {
        state: {
          careerId: group.careerId,
          careerName: group.careerName,
          enrollmentId: group.enrollmentId,
          period: period,
          progress: group.progress,
        },
      });
    },
    [navigate]
  );

  if (loading) {
    return (
      <>
        <div className="bg-white rounded-top p-2">
          <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando datos académicos...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      {/* FILA 1 - INDICADORES */}
      <div className="row mt-3">
        {/* Grupos activos */}
        <div className="col-12 col-sm-6 col-lg-4 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver mis grupos" onClick={navigateToGroups} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineGroup size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Grupos activos</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{activeGroups}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Carreras completadas */}
        <div className="col-12 col-sm-6 col-lg-4 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver mis grupos" onClick={navigateToGroups} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineSchool size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Carreras completadas</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{completedCareers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pendientes por evaluar */}
        <div className="col-12 col-sm-6 col-lg-4 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver evaluaciones pendientes" onClick={navigateToTeacherEvaluation} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineEmojiEvents size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Pendientes por evaluar</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{pendingEvaluations}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2 - DETALLE */}
      <div className="row">
        {/* Mis grupos - Columna izquierda */}
        <div className="col-12 col-lg-6 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineGroup size={40} className="p-1" />
                </div>
                <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Mis grupos</h5>
              </div>

              {myGroups.length === 0 ? (
                <div className="text-center py-5">
                  <Message severity="info" text="No tienes grupos asignados en este momento." />
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: '20rem' }}>
                  <div className="d-grid gap-3 mb-3">
                    {myGroups.map((group) => (
                      <div key={group.groupId} className="p-3 border rounded hovereable" onClick={() => handleNavigateToQualifications(group)} style={{ cursor: 'pointer' }} title="Ver calificaciones del grupo">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div className="flex-grow-1">
                            <h6 className="fw-semibold mb-1">{group.careerName}</h6>
                            <div className="d-flex align-items-center text-nowrap text-muted small mb-2">
                              <MdOutlineGroup size={16} className="me-1" />
                              <span className="me-3">Grupo {group.name}</span>
                              <MdOutlineCoPresent size={16} className="me-1" />
                              <span>{group.teacherName}</span>
                            </div>
                            <div className="d-flex align-items-center text-muted text-nowrap small">
                              <MdOutlineSchedule size={16} className="me-1" />
                              <span>
                                {getWeekLabel(group.weekDay)} {group.startTime} - {group.endTime}
                              </span>
                            </div>
                          </div>
                          <div className="text-end text-nowrap">
                            <Tag
                              value={group.progress >= 100 ? 'Completado' : 'En curso'}
                              severity={group.progress >= 100 ? 'success' : 'primary'}
                              title={group.progress >= 100 ? 'Has completado todos los módulos de esta carrera' : 'Actualmente estás cursando esta carrera'}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Clases de hoy - Columna derecha */}
        <div className="col-12 col-lg-6 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineCalendarMonth size={40} className="p-1" />
                </div>
                <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Clases hoy</h5>
              </div>

              <div className="d-flex flex-column">
                <div className="mb-3 ms-2">
                  <small className="text-muted">
                    {new Date().toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </small>
                </div>

                {todaySchedule.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="mb-3">
                      <MdOutlineCalendarMonth size={48} className="text-muted opacity-50" />
                    </div>
                    <h6 className="text-muted mb-2">Sin clases</h6>
                    <small className="text-muted">No tienes clases programadas para hoy {getWeekLabel(getCurrentWeekDay())}</small>
                  </div>
                ) : (
                  <>
                    <div className="overflow-auto" style={{ maxHeight: '13rem' }}>
                      <div className="d-grid gap-2">
                        {todaySchedule.map((group, index) => {
                          const now = new Date();
                          const currentTime = now.getHours() * 100 + now.getMinutes();
                          const startTime = parseInt(group.startTime.replace(':', ''));
                          const endTime = parseInt(group.endTime.replace(':', ''));

                          let status = 'future';
                          let statusColor = 'text-primary';
                          let statusText = 'Próxima';

                          if (currentTime >= startTime && currentTime <= endTime) {
                            status = 'current';
                            statusColor = 'text-success';
                            statusText = 'Cursando';
                          } else if (currentTime > endTime) {
                            status = 'past';
                            statusColor = 'text-muted';
                            statusText = 'Finalizada';
                          }

                          return (
                            <div
                              key={`today-${group.groupId}`}
                              className={`p-3 rounded border hovereable ${status === 'current' ? 'bg-success bg-opacity-10 border-success' : status === 'past' ? 'bg-light' : 'bg-primary bg-opacity-10 border-primary'}`}
                              onClick={() => handleNavigateToQualifications(group)}
                              style={{ cursor: 'pointer' }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="flex-grow-1">
                                  <div className="d-flex align-items-center justify-content-between mb-1">
                                    <h6 className="fw-semibold mb-0 text-truncate me-2">{group.careerName}</h6>
                                    <span
                                      className={`badge ${status === 'current' ? 'bg-success' : status === 'past' ? 'bg-secondary' : 'bg-primary'}`}
                                      title={status === 'current' ? 'La clase ha empezado' : status === 'past' ? 'La clase ha finalizado' : 'La clase está por comenzar'}
                                    >
                                      {statusText}
                                    </span>
                                  </div>
                                  <small className="text-muted">
                                    <MdOutlineGroup size={16} className="me-1" />
                                    Grupo {group.name} -<span className="text-muted"> {group.startTime}</span>
                                    <small className="text-muted"> a {group.endTime}</small>
                                  </small>
                                  <div className="mt-1">
                                    <small className="text-muted">
                                      <MdOutlineCoPresent size={14} className="me-1" />
                                      {group.teacherName}
                                    </small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {todaySchedule.length > 0 && (
                      <div className="mt-3 pt-2 border-top">
                        <small className="text-muted d-flex align-items-center justify-content-center">
                          {todaySchedule.length} clase{todaySchedule.length !== 1 ? 's' : ''} programada{todaySchedule.length !== 1 ? 's' : ''} para hoy
                        </small>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

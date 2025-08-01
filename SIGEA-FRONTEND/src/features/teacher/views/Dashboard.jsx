import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineGroup, MdArrowDropUp, MdArrowDropDown, MdOutlineCalendarMonth, MdOutlineSchedule, MdOutlineAssignment } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { Rating } from 'primereact/rating';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';

import { getGroupByTeacher, getGroupStudents } from '../../../api/academics/groupService';
import { getRankingsByTeacherAnon } from '../../../api/academics/rankingService';
import { useAuth } from '../../../contexts/AuthContext';

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

  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Estados para estadísticas
  const [totalStudents, setTotalStudents] = useState(0);
  const [activeGroups, setActiveGroups] = useState(0);
  const [pendingGrades, setPendingGrades] = useState(0);

  // Estados para desempeño real
  const [teacherPerformance, setTeacherPerformance] = useState({
    averageRating: 0,
    totalEvaluations: 0,
    hasEvaluations: false,
  });

  // Función para cargar estudiantes de un grupo
  const loadGroupStudents = useCallback(async (groupId) => {
    try {
      const students = await getGroupStudents(groupId);
      return Array.isArray(students) ? students.length : 0;
    } catch (error) {
      console.error(`Error loading students for group ${groupId}:`, error);
      return 0;
    }
  }, []);

  // Función para cargar desempeño real del docente
  const loadTeacherPerformance = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoadingPerformance(true);
      const response = await getRankingsByTeacherAnon(user.id);

      // Extraer solo los datos necesarios (SIN datos del estudiante por privacidad)
      const rankings = response?.data || response;

      if (rankings && Array.isArray(rankings) && rankings.length > 0) {
        // Filtrar datos sensibles del estudiante por seguridad
        const sanitizedRankings = rankings.map((ranking) => ({
          id: ranking.id,
          star: ranking.star,
          comment: ranking.comment,
          date: ranking.date,
          teacherId: ranking.teacherId,
          // NO incluir datos del estudiante por privacidad
        }));

        // Calcular promedio de ratings usando datos filtrados
        const totalRating = sanitizedRankings.reduce((sum, ranking) => sum + (ranking.star || 0), 0);
        const averageRating = totalRating / sanitizedRankings.length;

        setTeacherPerformance({
          averageRating: Math.round(averageRating * 10) / 10,
          totalEvaluations: sanitizedRankings.length,
          hasEvaluations: true,
        });

        // Log de seguridad (opcional)
        console.log('Teacher performance loaded (student data filtered for privacy)');
      } else {
        setTeacherPerformance({
          averageRating: 0,
          totalEvaluations: 0,
          hasEvaluations: false,
        });
      }
    } catch (error) {
      console.error('Error loading teacher performance:', error);
      setTeacherPerformance({
        averageRating: 0,
        totalEvaluations: 0,
        hasEvaluations: false,
      });
    } finally {
      setLoadingPerformance(false);
    }
  }, [user?.id]);

  // Función para obtener el día de la semana actual en formato de 3 letras
  const getCurrentWeekDay = useCallback(() => {
    const today = new Date();
    const dayIndex = today.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const weekDays = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
    return weekDays[dayIndex];
  }, []);

  // Función para cargar grupos y estadísticas
  const loadTeacherData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const groups = await getGroupByTeacher(user.id);
      const groupsArray = Array.isArray(groups) ? groups : [];

      setMyGroups(groupsArray);
      setActiveGroups(groupsArray.length);

      // Cargar estudiantes para cada grupo
      if (groupsArray.length > 0) {
        setLoadingStudents(true);
        const studentCounts = await Promise.all(groupsArray.map((group) => loadGroupStudents(group.groupId)));
        const totalStudentsCount = studentCounts.reduce((sum, count) => sum + count, 0);
        setTotalStudents(totalStudentsCount);

        // Simular calificaciones pendientes (puedes conectar con API real)
        setPendingGrades(Math.floor(totalStudentsCount * 0.3)); // 30% pendientes
        setLoadingStudents(false);
      } else {
        setTotalStudents(0);
        setPendingGrades(0);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setMyGroups([]);
      setActiveGroups(0);
      setTotalStudents(0);
      setPendingGrades(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadGroupStudents]);

  useEffect(() => {
    if (user?.id) {
      loadTeacherData();
      loadTeacherPerformance();
    }
  }, [loadTeacherData, loadTeacherPerformance]);

  // Función para navegar a grupo específico
  const handleGroupClick = useCallback(
    (group) => {
      navigate('/teacher/groups/details', {
        state: { group, user },
      });
    },
    [navigate, user]
  );

  // Función para navegar a la vista de grupos
  const navigateToGroups = useCallback(() => {
    navigate('/teacher/groups');
  }, [navigate]);

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
      </div>

      {/* FILA 1 - INDICADORES CLAVE: Altura uniforme */}
      <div className="row mt-3">
        {/* Total de grupos a cargo - CLICKEABLE */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver grupos" onClick={navigateToGroups} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineGroup size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Grupos a cargo</h6>
                </div>
              </div>
              <div className="text-center">{loading ? <ProgressSpinner style={{ width: '32px', height: '32px' }} strokeWidth="4" /> : <p className="fs-1 fw-bold text-blue-500 mb-3">{activeGroups}</p>}</div>
            </div>
          </div>
        </div>

        {/* Total de estudiantes */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100">
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlinePerson size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Total estudiantes</h6>
                </div>
              </div>
              <div className="text-center">{loading || loadingStudents ? <ProgressSpinner style={{ width: '32px', height: '32px' }} strokeWidth="4" /> : <p className="fs-1 fw-bold text-blue-500 mb-3">{totalStudents}</p>}</div>
            </div>
          </div>
        </div>

        {/* Calificaciones pendientes */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100">
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineAssignment size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Pendientes</h6>
                </div>
              </div>
              <div className="text-center">{loading || loadingStudents ? <ProgressSpinner style={{ width: '32px', height: '32px' }} strokeWidth="4" /> : <p className="fs-1 fw-bold text-blue-500 mb-3">{pendingGrades}</p>}</div>
            </div>
          </div>
        </div>

        {/* Mi desempeño - DATOS REALES */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100">
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineEmojiEvents size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Mi desempeño</h6>
                </div>
              </div>

              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                {loadingPerformance ? (
                  <ProgressSpinner style={{ width: '32px', height: '32px' }} strokeWidth="4" />
                ) : !teacherPerformance.hasEvaluations ? (
                  <div className="text-center">
                    <Rating value={0} readOnly cancel={false} className="mb-2" />
                    <p className="fs-3 fw-bold text-muted mb-0">N/A</p>
                    <small className="text-muted">Sin evaluaciones</small>
                  </div>
                ) : (
                  <>
                    <Rating value={Math.round(teacherPerformance.averageRating)} readOnly cancel={false} className="mb-2" />
                    <div className="text-center">
                      <p className="fs-3 fw-bold text-blue-500 mb-0">{teacherPerformance.averageRating.toFixed(1)}</p>
                      <small className="text-muted">
                        {teacherPerformance.totalEvaluations} evaluaci{teacherPerformance.totalEvaluations !== 1 ? 'ones' : 'ón'}
                      </small>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2 - DETALLE: Mis grupos (izquierda) y Horarios (derecha) */}
      <div className="row">
        {/* Mis grupos - Columna izquierda */}
        <div className="col-12 col-lg-8 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineGroup size={40} className="p-1" />
                </div>
                <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Mis grupos</h5>
              </div>

              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <div className="text-center">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
                    <p className="mt-3 text-muted">Cargando grupos...</p>
                  </div>
                </div>
              ) : myGroups.length === 0 ? (
                <div className="text-center py-5">
                  <Message severity="info" text="Aún no tienes grupos asignados." />
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                  <div className="d-grid gap-2 mb-3">
                    {myGroups.map((group) => (
                      <div key={group.groupId} className="d-flex justify-content-between align-items-center p-3 border rounded hovereable" onClick={() => handleGroupClick(group)} style={{ cursor: 'pointer' }}>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between">
                            <div>
                              <h6 className="fw-semibold mb-1">{group.careerName}</h6>
                              <div className="d-flex align-items-center text-muted small text-nowrap">
                                <MdOutlineGroup size={16} className="me-1" />
                                <span className="me-3">Grupo {group.name}</span>
                                <MdOutlineSchedule size={16} className="me-1" />
                                <span>
                                  {getWeekLabel(group.weekDay)} {group.startTime} - {group.endTime}
                                </span>
                              </div>
                            </div>
                            <div className="text-end">
                              <Tag>{loadingStudents ? <ProgressSpinner style={{ width: '12px', height: '12px' }} strokeWidth="4" /> : 'Activo'}</Tag>
                            </div>
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

        {/* Horarios de hoy - Columna derecha */}
        <div className="col-12 col-lg-4 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineCalendarMonth size={40} className="p-1" />
                </div>
                <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Horarios de hoy</h5>
              </div>

              {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                  <ProgressSpinner style={{ width: '40px', height: '40px' }} strokeWidth="8" />
                </div>
              ) : (
                (() => {
                  // Filtrar grupos que coincidan con el día de hoy
                  const currentWeekDay = getCurrentWeekDay();
                  const todayGroups = myGroups
                    .filter((group) => group.weekDay === currentWeekDay)
                    .sort((a, b) => {
                      // Ordenar por hora de inicio
                      const timeA = a.startTime.replace(':', '');
                      const timeB = b.startTime.replace(':', '');
                      return timeA.localeCompare(timeB);
                    });

                  return (
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

                      {todayGroups.length === 0 ? (
                        <div className="text-center py-4">
                          <div className="mb-3">
                            <MdOutlineCalendarMonth size={48} className="text-muted opacity-50" />
                          </div>
                          <h6 className="text-muted mb-2">Sin clases</h6>
                          <small className="text-muted">No tienes clases programadas para hoy {getWeekLabel(currentWeekDay)}</small>
                        </div>
                      ) : (
                        <>
                          <div className="d-grid gap-2">
                            {todayGroups.map((group, index) => {
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
                                statusText = 'En curso';
                              } else if (currentTime > endTime) {
                                status = 'past';
                                statusColor = 'text-muted';
                                statusText = 'Finalizada';
                              }

                              return (
                                <div
                                  key={`today-${group.groupId}`}
                                  className={`p-3 rounded border ${status === 'current' ? 'bg-success bg-opacity-10 border-success' : status === 'past' ? 'bg-light' : 'bg-primary bg-opacity-10 border-primary'}`}
                                  onClick={() => handleGroupClick(group)}
                                  style={{ cursor: 'pointer' }}
                                >
                                  <div className="d-flex justify-content-between align-items-center">
                                    <div className="flex-grow-1">
                                      <div className="d-flex align-items-center justify-content-between mb-1">
                                        <h6 className="fw-semibold mb-0 text-truncate me-2">{group.careerName}</h6>
                                        <span className={`badge ${status === 'current' ? 'bg-success' : status === 'past' ? 'bg-secondary' : 'bg-primary'}`}>{statusText}</span>
                                      </div>
                                      <small className="text-muted">
                                        Grupo {group.name} -<span className={`fw-bold ${statusColor}`}> {group.startTime}</span>
                                        <small className="text-muted"> a {group.endTime}</small>
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {todayGroups.length > 0 && (
                            <div className="mt-3 pt-2 border-top">
                              <small className="text-muted d-flex align-items-center justify-content-center">
                                <MdOutlineSchedule size={16} className="me-1" />
                                {todayGroups.length} clase{todayGroups.length !== 1 ? 's' : ''} programada{todayGroups.length !== 1 ? 's' : ''} hoy
                              </small>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

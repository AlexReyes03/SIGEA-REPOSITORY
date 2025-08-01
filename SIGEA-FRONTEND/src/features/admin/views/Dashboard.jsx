import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineCoPresent, MdOutlineGroup, MdOutlineSchool, MdOutlineSettings, MdOutlineGroupAdd, MdOutlineManageAccounts, MdOutlineBolt, MdOutlineNotifications, MdOutlineAssignment } from 'react-icons/md';
import { Rating } from 'primereact/rating';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getCampusRankingStats } from '../../../api/academics/rankingService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { getGroupsByCampus } from '../../../api/academics/groupService';
import { getUserByRoleAndPlantel } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';
import avatarFallback from '../../../assets/img/profile.png';
import { BACKEND_BASE_URL } from '../../../api/common-url';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);

  const [roles, setRoles] = useState([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalCareers, setTotalCareers] = useState(0);
  const [rankingStats, setRankingStats] = useState(null);
  const [topTeachers, setTopTeachers] = useState([]);
  const [recentGroups, setRecentGroups] = useState([]);

  const loadRoles = useCallback(async () => {
    try {
      const rolesData = await getAllRoles();
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setRolesLoaded(true);
    } catch (error) {
      console.error('Error loading roles:', error);
      showError('Error', 'Error al cargar los roles del sistema');
      setRoles([]);
      setRolesLoaded(true);
    }
  }, [showError]);

  const getRoleIdByName = useCallback(
    (roleName) => {
      if (!roles || roles.length === 0) {
        console.warn(`Roles not loaded yet when trying to get ID for ${roleName}`);
        return null;
      }
      const role = roles.find((r) => r && r.roleName === roleName);
      return role?.id || null;
    },
    [roles]
  );

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const loadCampusData = useCallback(async () => {
    if (!user?.campus?.id || !rolesLoaded) return;

    try {
      setLoading(true);

      const studentRoleId = getRoleIdByName('STUDENT');
      const teacherRoleId = getRoleIdByName('TEACHER');

      if (!studentRoleId || !teacherRoleId) {
        console.error('No se pudieron obtener los IDs de roles para STUDENT o TEACHER');
        showError('Error', 'Error en la configuración de roles del sistema');
        return;
      }

      const [rankingStatsResponse, studentsResponse, teachersResponse, careersResponse, groupsResponse] = await Promise.all([
        getCampusRankingStats(user.campus.id),
        getUserByRoleAndPlantel(studentRoleId, user.campus.id),
        getUserByRoleAndPlantel(teacherRoleId, user.campus.id),
        getCareerByPlantelId(user.campus.id),
        getGroupsByCampus(user.campus.id),
      ]);

      const studentsCount = Array.isArray(studentsResponse) ? studentsResponse.length : 0;
      const teachersCount = Array.isArray(teachersResponse) ? teachersResponse.length : 0;
      const careersCount = Array.isArray(careersResponse) ? careersResponse.length : 0;
      const groups = Array.isArray(groupsResponse) ? groupsResponse : groupsResponse?.data || [];

      setTotalStudents(studentsCount);
      setTotalTeachers(teachersCount);
      setTotalCareers(careersCount);
      setRankingStats(rankingStatsResponse);

      setRecentGroups(groups.slice(0, 5));

      if (rankingStatsResponse?.topTeachers) {
        setTopTeachers(rankingStatsResponse.topTeachers.slice(0, 5));
      }
    } catch (err) {
      showError('Error', 'Error al cargar las estadísticas del plantel');

      setTotalStudents(0);
      setTotalTeachers(0);
      setTotalCareers(0);
      setRankingStats(null);
      setRecentGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user?.campus?.id, rolesLoaded, showError, getRoleIdByName]);

  useEffect(() => {
    if (user?.campus?.id && rolesLoaded) {
      loadCampusData();
    }
  }, [user?.campus?.id, rolesLoaded, loadCampusData]);

  const navigateToUsers = useCallback(() => {
    navigate('/admin/users');
  }, [navigate]);

  const navigateToStudents = useCallback(() => {
    const studentRoleId = getRoleIdByName('STUDENT');
    navigate('/admin/users', {
      state: { preselectedRoleId: studentRoleId },
    });
  }, [navigate, getRoleIdByName]);

  const navigateToTeachers = useCallback(() => {
    const teacherRoleId = getRoleIdByName('TEACHER');
    navigate('/admin/users', {
      state: { preselectedRoleId: teacherRoleId },
    });
  }, [navigate, getRoleIdByName]);

  const navigateToCareers = useCallback(() => {
    navigate('/admin/careers');
  }, [navigate]);

  const navigateToGroups = useCallback(() => {
    navigate('/admin/careers/groups');
  }, [navigate]);

  const navigateToNotifications = useCallback(() => {
    navigate('/admin/notifications');
  }, [navigate]);

  const navigateToCampusSettings = useCallback(() => {
    navigate('/admin/campus');
  }, [navigate]);

  const navigateToGroupDetails = useCallback(
    (group) => {
      navigate('/admin/careers/groups/details', {
        state: { group },
      });
    },
    [navigate]
  );

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return avatarFallback;
    if (/^https?:\/\//.test(avatarUrl)) return avatarUrl;
    return `${BACKEND_BASE_URL}${avatarUrl}`;
  };

  if (loading || !rolesLoaded) {
    return (
      <>
        <div className="bg-white rounded-top p-2">
          <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando estadísticas del plantel...</p>
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
        {/* Total de estudiantes */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver estudiantes" onClick={navigateToStudents} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlinePerson size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Estudiantes</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{totalStudents}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total de docentes */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver maestros" onClick={navigateToTeachers} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineCoPresent size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Maestros</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{totalTeachers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total de carreras */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver carreras" onClick={navigateToCareers} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineSchool size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Carreras</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{totalCareers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100" style={{ minHeight: '140px' }}>
            <div className="card-body d-flex flex-column p-3">
              <div className="d-flex align-items-center mb-2">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineBolt size={32} className="p-1" />
                </div>
                <h6 className="text-secondary ms-2 mb-0 text-truncate">Acciones Rápidas</h6>
              </div>

              <div className="flex-grow-1 overflow-y-auto">
                <div className="d-grid gap-1 h-100" style={{ gridTemplateColumns: 'repeat(2, 1fr)', maxHeight: '6.5rem' }}>
                  {/* Primera fila */}
                  <Button icon={<MdOutlineManageAccounts size={16} />} className="p-2 text-start d-flex align-items-center justify-content-start" style={{ minHeight: '32px', fontSize: '0.8rem' }} outlined size="small" onClick={navigateToUsers}>
                    <span className="ms-1 text-truncate">Usuarios</span>
                  </Button>
                  <Button icon={<MdOutlineSchool size={16} />} className="p-2 text-start d-flex align-items-center justify-content-start" style={{ minHeight: '32px', fontSize: '0.8rem' }} outlined size="small" onClick={navigateToCareers}>
                    <span className="ms-1 text-truncate">Carreras</span>
                  </Button>

                  {/* Segunda fila */}
                  <Button icon={<MdOutlineGroupAdd size={16} />} className="p-2 text-start d-flex align-items-center justify-content-start" style={{ minHeight: '32px', fontSize: '0.8rem' }} outlined size="small" onClick={navigateToGroups}>
                    <span className="ms-1 text-truncate">Grupos</span>
                  </Button>
                  <Button icon={<MdOutlineSettings size={16} />} className="p-2 text-start d-flex align-items-center justify-content-start" style={{ minHeight: '32px', fontSize: '0.8rem' }} outlined size="small" onClick={navigateToCampusSettings}>
                    <span className="ms-1 text-truncate">Plantel</span>
                  </Button>

                  {/* Tercera fila */}
                  <Button icon={<MdOutlineNotifications size={16} />} className="p-2 text-start d-flex align-items-center justify-content-start" style={{ minHeight: '32px', fontSize: '0.8rem' }} outlined size="small" onClick={navigateToNotifications}>
                    <span className="ms-1 text-truncate">Notificaciones</span>
                  </Button>
                  <Button icon="pi pi-refresh" className="p-2 text-start d-flex align-items-center justify-content-start" style={{ minHeight: '32px', fontSize: '0.8rem' }} outlined size="small" onClick={loadCampusData}>
                    <span className="ms-1 text-truncate">Actualizar</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2 - DETALLE */}
      <div className="row">
        {/* Desempeño docente - Columna izquierda */}
        <div className="col-12 col-lg-4 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineEmojiEvents size={40} className="p-1" />
                  </div>
                  <h5 className="text-blue-500 text-truncate fw-semibold ms-3 mb-0" title="Desempeño docente">
                    Desempeño docente
                  </h5>
                </div>
              </div>

              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                <Rating value={Math.round(rankingStats?.averageRating || 0)} readOnly cancel={false} className="mb-3" />
                <div className="text-center mb-3">
                  <p className="fs-1 fw-bold text-blue-500 mb-0">{rankingStats?.averageRating ? rankingStats.averageRating.toFixed(1) : 'N/A'}</p>
                </div>

                <small className="text-muted text-center mb-3">
                  Promedio general del plantel {user?.campus?.name}
                  {!rankingStats?.totalEvaluations && (
                    <>
                      <br />
                      Aún no hay evaluaciones
                    </>
                  )}
                </small>

                {/* Distribución de estrellas */}
                {rankingStats?.starDistribution && rankingStats.starDistribution.length > 0 && (
                  <div className="w-100">
                    <h6 className="text-center mb-3">Distribución</h6>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const distribution = rankingStats.starDistribution.find((d) => d.stars === star);
                      const percentage = distribution?.percentage || 0;
                      const count = distribution?.count || 0;

                      return (
                        <div key={star} className="d-flex align-items-center mb-1">
                          <span className="me-2 text-muted" style={{ minWidth: '20px' }}>
                            {star}
                          </span>
                          <div className="flex-grow-1 bg-light rounded me-2" style={{ height: '8px' }}>
                            <div
                              className="bg-info rounded"
                              style={{
                                height: '8px',
                                width: `${percentage}%`,
                                transition: 'width 0.3s ease',
                              }}
                            />
                          </div>
                          <span className="text-muted" style={{ minWidth: '30px', fontSize: '0.875rem' }}>
                            {count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Top Docentes - Columna central */}
        <div className="col-12 col-lg-4 mb-3">
          <div className="card border-0 h-100" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineCoPresent size={40} className="p-1" />
                  </div>
                  <h5 className="text-blue-500 text-truncate fw-semibold ms-3 mb-0" title="Mejores maestros">
                    Mejores maestros
                  </h5>
                </div>
              </div>

              {topTeachers.length === 0 ? (
                <div className="text-center py-5">
                  <Message severity="info" text="Aún no hay evaluaciones de maestros." />
                </div>
              ) : (
                <div className="overflow-auto pb-3" style={{ maxHeight: '320px' }}>
                  <div className="d-grid gap-2">
                    {topTeachers.map((teacher, index) => (
                      <div key={teacher.teacherId} className="d-flex align-items-center p-3 border rounded">
                        <img src={getAvatarUrl(teacher.avatarUrl)} alt="avatar" className="rounded-circle me-3" style={{ width: '50px', height: '50px', objectFit: 'cover', minWidth: '50px' }} />

                        <div className="flex-grow-1 overflow-hidden">
                          <h6 className="mb-1 text-truncate">{teacher.teacherName}</h6>
                          <div className="d-flex align-items-center">
                            <Rating value={Math.round(teacher.averageRating)} readOnly cancel={false} className="me-2" style={{ fontSize: '0.8rem' }} />
                            <small className="text-muted">
                              {teacher.averageRating.toFixed(1)} ({teacher.totalEvaluations})
                            </small>
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

        {/* Grupos Recientes - Columna derecha */}
        <div className="col-12 col-lg-4 mb-3">
          <div className="card border-0 h-100" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineGroup size={40} className="p-1" />
                  </div>
                  <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Grupos</h5>
                </div>
              </div>

              {recentGroups.length === 0 ? (
                <div className="text-center py-5">
                  <Message severity="info" text="Aún no hay grupos creados." />
                </div>
              ) : (
                <div className="overflow-auto pb-3" style={{ maxHeight: '320px' }}>
                  <div className="d-grid gap-2">
                    {recentGroups.map((group) => (
                      <div key={group.groupId} className="d-flex justify-content-between align-items-center p-3 border rounded hovereable" onClick={() => navigateToGroupDetails(group)} style={{ cursor: 'pointer' }}>
                        <div className="flex-grow-1">
                          <h6 className="fw-semibold mb-1 text-truncate">{group.careerName}</h6>
                          <div className="d-flex align-items-center text-muted small">
                            <span className="me-3">Grupo {group.name}</span>
                            <Tag severity="info" value="Activo" />
                          </div>
                          <small className="text-muted">
                            {group.teacherName} • {group.weekDay} {group.startTime}-{group.endTime}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

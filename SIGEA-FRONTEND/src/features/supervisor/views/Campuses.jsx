import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdOutlineSchool, MdOutlineStars, MdOutlineLocationOn, MdOutlinePerson, MdOutlineCoPresent } from 'react-icons/md';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Skeleton } from 'primereact/skeleton';
import { BreadCrumb } from 'primereact/breadcrumb';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getSupervisorCampuses } from '../../../api/supervisorService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { getUserByRoleAndPlantel } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';

export default function Campuses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();

  const [supervisorData, setSupervisorData] = useState(null);
  const [campusWithStats, setCampusWithStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);

  const isTeachersContext = location.pathname.includes('campuses-teachers');
  const contextTitle = isTeachersContext ? 'Planteles - Docentes' : 'Planteles - Carreras';
  const homeRoute = isTeachersContext ? '/supervisor/campuses-teachers' : '/supervisor/campuses-careers';

  const loadCampusStats = useCallback(async (campusId) => {
    try {
      let teacherRoleId = 3;
      try {
        const roles = await getAllRoles();
        const teacherRole = roles.find((role) => role.roleName === 'TEACHER');
        if (teacherRole) {
          teacherRoleId = teacherRole.id;
        }
      } catch (roleError) {
        console.warn('Error loading roles, using default teacher role ID:', roleError);
      }

      const [careers, students, teachers] = await Promise.all([getCareerByPlantelId(campusId), getUserByRoleAndPlantel(4, campusId), getUserByRoleAndPlantel(teacherRoleId, campusId)]);

      return {
        careersCount: Array.isArray(careers) ? careers.length : 0,
        studentsCount: Array.isArray(students) ? students.length : 0,
        teachersCount: Array.isArray(teachers) ? teachers.length : 0,
        careers: Array.isArray(careers) ? careers : [],
      };
    } catch (error) {
      console.error(`Error loading stats for campus ${campusId}:`, error);
      return {
        careersCount: 0,
        studentsCount: 0,
        teachersCount: 0,
        careers: [],
      };
    }
  }, []);

  const loadSupervisorData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getSupervisorCampuses(user.id);
      setSupervisorData(data);

      const supervisedCampus = data.additionalCampuses.map((campus) => ({
        id: campus.campusId,
        name: campus.campusName,
        type: 'SUPERVISED',
        isPrimary: false,
        assignedAt: campus.assignedAt,
      }));

      if (supervisedCampus.length === 0) {
        setCampusWithStats([]);
        return;
      }

      setLoadingStats(true);

      const campusPromises = supervisedCampus.map(async (campus) => {
        const stats = await loadCampusStats(campus.id);
        return {
          ...campus,
          ...stats,
        };
      });

      try {
        const campusWithStatsData = await Promise.all(campusPromises);
        setCampusWithStats(campusWithStatsData);
      } catch (error) {
        console.error('Error loading complete stats:', error);
        setCampusWithStats(
          supervisedCampus.map((campus) => ({
            ...campus,
            careersCount: 0,
            studentsCount: 0,
            teachersCount: 0,
            careers: [],
          }))
        );
      } finally {
        setLoadingStats(false);
      }
    } catch (err) {
      console.error('Error loading supervisor data:', err);
      showError('Error', 'Error al cargar los datos del supervisor');
      setSupervisorData(null);
      setCampusWithStats([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError, loadCampusStats]);

  const handleCampusClick = useCallback(
    (campus) => {
      if (isTeachersContext) {
        navigate('/supervisor/campuses-teachers/teachers', {
          state: {
            campusId: campus.id,
            campusName: campus.name,
          },
        });
      } else {
        navigate('/supervisor/campuses-careers/careers', {
          state: {
            campusId: campus.id,
            campusName: campus.name,
          },
        });
      }
    },
    [navigate, isTeachersContext]
  );

  useEffect(() => {
    if (user?.id) {
      loadSupervisorData();
    }
  }, [loadSupervisorData]);

  const breadcrumbItems = [
    {
      label: 'Planteles',
      command: () => navigate(homeRoute),
    },
  ];

  const breadcrumbHome = {
    icon: 'pi pi-home',
    command: () => navigate('/supervisor'),
  };

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">{contextTitle}</h3>
      </div>

      <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="mt-2 pb-0 ps-0 text-nowrap" />

      {loading ? (
        <>
          <div className="row mt-3">
            <div className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
              <div className="card border-0 h-100 shadow-sm">
                <div className="card-body bg-light">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2"></div>
                      <div className="mb-2">
                        <Skeleton className="mb-2" borderRadius="16px"></Skeleton>
                        <Skeleton className="mb-2" width="7rem" borderRadius="16px"></Skeleton>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="p-3 rounded bg-light w-100 d-flex justify-content-center gap-3">
                      <Skeleton size="5rem"></Skeleton>
                      <Skeleton size="5rem"></Skeleton>
                      <Skeleton size="5rem"></Skeleton>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <div className="text-center">
              <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
              <p className="mt-3 text-600">Cargando planteles...</p>
            </div>
          </div>
        </>
      ) : !supervisorData ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineSchool className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No se pudieron cargar los datos</h5>
            <p className="text-muted">Intenta recargar la página</p>
          </div>
        </div>
      ) : campusWithStats.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineLocationOn className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No hay planteles asignados</h5>
            <p className="text-muted">
              No tienes planteles asignados para supervisión.
              <br />
              Contacta al administrador para solicitar planteles a supervisar.
            </p>
          </div>
        </div>
      ) : (
        <div className="row mt-3">
          {campusWithStats.map((campus) => (
            <div key={campus.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
              <div className="card border-0 h-100 hovereable up shadow-sm" onClick={() => handleCampusClick(campus)} style={{ cursor: 'pointer' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="fw-semibold lh-sm mb-0 text-dark text-truncate">{campus.name}</h6>
                      </div>
                      <div className="mb-3">
                        <small className="text-muted">
                          <i className="pi pi-users me-1"></i>
                          Plantel supervisado
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Contadores (sin cambios) */}
                  <div className="row g-2 text-center">
                    <div className="col-4">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlineSchool className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{loadingStats ? <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="4" /> : campus.careersCount || 0}</div>
                        <small className="text-muted">{campus.careersCount === 1 ? 'Carrera' : 'Carreras'}</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlineCoPresent className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{loadingStats ? <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="4" /> : campus.teachersCount || 0}</div>
                        <small className="text-muted">{campus.teachersCount === 1 ? 'Docente' : 'Docentes'}</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlinePerson className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{loadingStats ? <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="4" /> : campus.studentsCount || 0}</div>
                        <small className="text-muted">{campus.studentsCount === 1 ? 'Estudiante' : 'Estudiantes'}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

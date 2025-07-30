import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineCoPresent, MdOutlineGroup, MdOutlineSchool, MdOutlineLocationOn, MdArrowDropUp, MdArrowDropDown } from 'react-icons/md';
import { Rating } from 'primereact/rating';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getSupervisorCampuses } from '../../../api/supervisorService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { getUserByRoleAndPlantel } from '../../../api/userService';
import { getCampusRankingStats } from '../../../api/academics/rankingService';
import { getAllRoles } from '../../../api/roleService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);

  const [roles, setRoles] = useState([]);
  const [rolesLoaded, setRolesLoaded] = useState(false);

  const [supervisorData, setSupervisorData] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalCareers, setTotalCareers] = useState(0);
  const [campusWithStats, setCampusWithStats] = useState([]);

  const [consolidatedRankingStats, setConsolidatedRankingStats] = useState(null);

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

  // Función para obtener ID de rol por nombre
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

  const loadCampusStats = useCallback(async (campusId, studentRoleId, teacherRoleId) => {
    try {
      if (!studentRoleId || !teacherRoleId) {
        console.warn('Role IDs not available for campus stats loading');
        return {
          careersCount: 0,
          studentsCount: 0,
          teachersCount: 0,
          rankingStats: null,
        };
      }

      let careers = [];
      let students = [];
      let teachers = [];
      let rankingStats = null;

      try {
        [careers, students, teachers] = await Promise.all([getCareerByPlantelId(campusId), getUserByRoleAndPlantel(studentRoleId, campusId), getUserByRoleAndPlantel(teacherRoleId, campusId)]);
      } catch (error) {
        console.error(`Error loading basic stats for campus ${campusId}:`, error);
      }

      try {
        rankingStats = await getCampusRankingStats(campusId);
      } catch (error) {
        console.warn(`Error loading ranking stats for campus ${campusId}:`, error);
        rankingStats = null;
      }

      return {
        careersCount: Array.isArray(careers) ? careers.length : 0,
        studentsCount: Array.isArray(students) ? students.length : 0,
        teachersCount: Array.isArray(teachers) ? teachers.length : 0,
        rankingStats: rankingStats || null,
      };
    } catch (error) {
      console.error(`Error loading stats for campus ${campusId}:`, error);
      return {
        careersCount: 0,
        studentsCount: 0,
        teachersCount: 0,
        rankingStats: null,
      };
    }
  }, []);

  const consolidateRankingStats = useCallback((campusStatsArray) => {
    const totalSupervisedCampuses = campusStatsArray.length;

    const validStats = campusStatsArray.map((campus) => campus.rankingStats).filter((stats) => stats && stats.totalEvaluations > 0);

    if (validStats.length === 0) {
      return null;
    }

    let totalWeightedRating = 0;
    let totalEvaluations = 0;
    let starDistributionMap = new Map();

    validStats.forEach((stats) => {
      const evaluations = stats.totalEvaluations || 0;
      const rating = stats.averageRating || 0;

      totalWeightedRating += rating * evaluations;
      totalEvaluations += evaluations;

      if (stats.starDistribution && Array.isArray(stats.starDistribution)) {
        stats.starDistribution.forEach((dist) => {
          const currentCount = starDistributionMap.get(dist.stars) || 0;
          starDistributionMap.set(dist.stars, currentCount + (dist.count || 0));
        });
      }
    });

    const averageRating = totalEvaluations > 0 ? totalWeightedRating / totalEvaluations : 0;

    const starDistribution = [];
    for (let i = 1; i <= 5; i++) {
      const count = starDistributionMap.get(i) || 0;
      const percentage = totalEvaluations > 0 ? (count / totalEvaluations) * 100 : 0;
      starDistribution.push({
        stars: i,
        count,
        percentage: Math.round(percentage * 10) / 10,
      });
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalEvaluations,
      starDistribution,
      supervisedCampusesCount: totalSupervisedCampuses,
    };
  }, []);

  const loadSupervisorData = useCallback(async () => {
    if (!user?.id || !rolesLoaded) return;

    try {
      setLoading(true);

      const studentRoleId = getRoleIdByName('STUDENT');
      const teacherRoleId = getRoleIdByName('TEACHER');

      if (!studentRoleId || !teacherRoleId) {
        console.error('No se pudieron obtener los IDs de roles para STUDENT o TEACHER');
        showError('Error', 'Error en la configuración de roles del sistema');
        return;
      }

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
        setTotalStudents(0);
        setTotalTeachers(0);
        setTotalCareers(0);
        setConsolidatedRankingStats(null);
        return;
      }

      const campusStatsPromises = supervisedCampus.map(async (campus) => {
        const stats = await loadCampusStats(campus.id, studentRoleId, teacherRoleId);
        return {
          ...campus,
          ...stats,
        };
      });

      const campusWithStatsData = await Promise.all(campusStatsPromises);
      setCampusWithStats(campusWithStatsData);

      const totals = campusWithStatsData.reduce(
        (acc, campus) => ({
          students: acc.students + campus.studentsCount,
          teachers: acc.teachers + campus.teachersCount,
          careers: acc.careers + campus.careersCount,
        }),
        { students: 0, teachers: 0, careers: 0 }
      );

      setTotalStudents(totals.students);
      setTotalTeachers(totals.teachers);
      setTotalCareers(totals.careers);

      const consolidatedStats = consolidateRankingStats(campusWithStatsData);
      setConsolidatedRankingStats(consolidatedStats);
    } catch (err) {
      console.error('Error loading supervisor data:', err);
      showError('Error', 'Error al cargar los datos del supervisor');
      setSupervisorData(null);
      setCampusWithStats([]);
      setConsolidatedRankingStats(null);
    } finally {
      setLoading(false);
    }
  }, [user?.id, rolesLoaded, showError, loadCampusStats, consolidateRankingStats, getRoleIdByName]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    if (user?.id && rolesLoaded) {
      loadSupervisorData();
    }
  }, [user?.id, rolesLoaded, loadSupervisorData]);

  const navigateToCampuses = useCallback(() => {
    navigate('/supervisor/campuses-careers');
  }, [navigate]);

  const navigateToTeachers = useCallback(() => {
    navigate('/supervisor/campuses-teachers');
  }, [navigate]);

  const handleCampusClick = useCallback(
    (campus) => {
      navigate('/supervisor/campuses-careers/careers', {
        state: {
          campusId: campus.id,
          campusName: campus.name,
          isPrimary: campus.isPrimary,
        },
      });
    },
    [navigate]
  );

  if (loading || !rolesLoaded) {
    return (
      <>
        <div className="bg-white rounded-top p-2">
          <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">{!rolesLoaded ? 'Cargando configuración del sistema...' : 'Cargando datos del supervisor...'}</p>
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

      {/* FILA 1 - Cards clickeables */}
      <div className="row mt-3">
        {/* Total de planteles supervisados */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver planteles supervisados" onClick={navigateToCampuses} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineLocationOn size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Planteles supervisados</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{supervisorData ? supervisorData.additionalCampuses.length : 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total de carreras */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver carreras" onClick={navigateToCampuses} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineSchool size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Total de carreras</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{totalCareers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total de docentes */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver docentes" onClick={navigateToTeachers} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineCoPresent size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Total de docentes</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{totalTeachers}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Total de estudiantes */}
        <div className="col-12 col-sm-6 col-lg-3 mb-3">
          <div className="card border-0 h-100 hovereable up" title="Ver estudiantes" onClick={navigateToCampuses} style={{ cursor: 'pointer' }}>
            <div className="card-body d-flex flex-column justify-content-between" style={{ minHeight: '140px' }}>
              <div className="d-flex align-items-center justify-content-between mb-2">
                <div className="d-flex text-truncate text-nowrap align-items-center">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlinePerson size={32} className="p-1" />
                  </div>
                  <h6 className="text-secondary ms-2 mb-0 text-truncate">Total de estudiantes</h6>
                </div>
              </div>
              <div className="text-center">
                <p className="fs-1 fw-bold text-blue-500 mb-3">{totalStudents}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILA 2 - DETALLE: Planteles (izquierda) y Desempeño (derecha) */}
      <div className="row">
        {/* Planteles supervisados - Columna izquierda */}
        <div className="col-12 col-lg-8 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body">
              <div className="d-flex align-items-center mb-4">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineLocationOn size={40} className="p-1" />
                </div>
                <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Planteles supervisados</h5>
              </div>

              {campusWithStats.length === 0 ? (
                <div className="text-center py-5">
                  <Message severity="info" text="No tienes planteles asignados para supervisión." />
                </div>
              ) : (
                <div className="overflow-auto" style={{ maxHeight: '300px' }}>
                  <div className="d-grid gap-2 mb-3">
                    {campusWithStats.map((campus) => (
                      <div key={campus.id} className="d-flex flex-column p-3 border rounded hovereable" onClick={() => handleCampusClick(campus)} style={{ cursor: 'pointer' }}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <span className="fw-medium text-truncate me-2">{campus.name}</span>
                          {campus.isPrimary ? <Tag severity="success" value="Principal" /> : <Tag severity="primary" value="Supervisado" />}
                        </div>

                        <div className="d-flex justify-content-between text-center text-muted small">
                          <span>
                            <MdOutlineSchool size={16} className="me-1" />
                            {campus.careersCount} carreras
                          </span>
                          <span>
                            <MdOutlineCoPresent size={16} className="me-1" />
                            {campus.teachersCount} docentes
                          </span>
                          <span>
                            <MdOutlinePerson size={16} className="me-1" />
                            {campus.studentsCount} estudiantes
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desempeño general consolidado - Columna derecha */}
        <div className="col-12 col-lg-4 mb-3">
          <div className="card border-0" style={{ minHeight: '400px' }}>
            <div className="card-body d-flex flex-column">
              <div className="d-flex align-items-center mb-4">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineEmojiEvents size={40} className="p-1" />
                </div>
                <h5 className="text-blue-500 fw-semibold ms-3 mb-0">Desempeño general</h5>
              </div>

              <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                {!consolidatedRankingStats ? (
                  <div className="text-center">
                    <Message severity="info" text="Aún no hay evaluaciones en los planteles supervisados." className="mb-3" />
                  </div>
                ) : (
                  <>
                    {/* Rating principal */}
                    <Rating value={Math.round(consolidatedRankingStats.averageRating)} readOnly cancel={false} className="mb-3" />

                    <div className="text-center mb-3">
                      <p className="fs-1 fw-bold text-blue-500 mb-0">{consolidatedRankingStats.averageRating.toFixed(1)}</p>
                    </div>

                    <small className="text-muted text-center mb-3">
                      Promedio de {consolidatedRankingStats.supervisedCampusesCount} plantel{consolidatedRankingStats.supervisedCampusesCount !== 1 ? 'es' : ''} supervisado{consolidatedRankingStats.supervisedCampusesCount !== 1 ? 's' : ''}
                      <br />
                      {consolidatedRankingStats.totalEvaluations} evaluaciones totales
                    </small>
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

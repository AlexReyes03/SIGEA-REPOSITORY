import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdOutlineEmojiEvents, MdOutlinePerson, MdOutlineCoPresent, MdOutlineGroup, MdOutlineSchool, MdOutlineLocationOn, MdArrowDropUp, MdArrowDropDown } from 'react-icons/md';
import { Rating } from 'primereact/rating';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getSupervisorCampuses } from '../../../api/supervisorService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { getUserByRoleAndPlantel } from '../../../api/userService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [ratingValue, setRatingValue] = useState(4.6);
  const [isUp, setIsUp] = useState(true);
  
  // Estados para estadísticas
  const [supervisorData, setSupervisorData] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [totalCareers, setTotalCareers] = useState(0);
  const [campusWithStats, setCampusWithStats] = useState([]);

  // Animación del rating
  useEffect(() => {
    let mounted = true;

    const adjustRating = () => {
      setRatingValue((prev) => {
        if (!mounted) return prev;

        const deltas = [-0.3, -0.2, -0.1, 0.1, 0.2, 0.3];
        const delta = deltas[Math.floor(Math.random() * deltas.length)];
        let next = Math.round((prev + delta) * 10) / 10;
        if (next > 5) next = 5.0;
        if (next < 0) next = 0.0;

        setIsUp(next >= prev);
        return next;
      });
    };

    const interval = setInterval(adjustRating, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Función para cargar estadísticas de un campus
  const loadCampusStats = useCallback(async (campusId) => {
    try {
      const [careers, students, teachers] = await Promise.all([
        getCareerByPlantelId(campusId),
        getUserByRoleAndPlantel(4, campusId), // 4 = STUDENT
        getUserByRoleAndPlantel(3, campusId)  // 3 = TEACHER
      ]);

      return {
        careersCount: Array.isArray(careers) ? careers.length : 0,
        studentsCount: Array.isArray(students) ? students.length : 0,
        teachersCount: Array.isArray(teachers) ? teachers.length : 0
      };
    } catch (error) {
      console.error(`Error loading stats for campus ${campusId}:`, error);
      return {
        careersCount: 0,
        studentsCount: 0,
        teachersCount: 0
      };
    }
  }, []);

  // Función principal para cargar datos del supervisor
  const loadSupervisorData = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const data = await getSupervisorCampuses(user.id);
      setSupervisorData(data);
      
      // Preparar array de todos los campus
      const allCampus = [
        {
          id: data.primaryCampusId,
          name: data.primaryCampusName,
          type: 'PRIMARY',
          isPrimary: true
        },
        ...data.additionalCampuses.map(campus => ({
          id: campus.campusId,
          name: campus.campusName,
          type: 'ADDITIONAL',
          isPrimary: false,
          assignedAt: campus.assignedAt
        }))
      ];

      // Cargar estadísticas para cada campus
      const campusStatsPromises = allCampus.map(async (campus) => {
        const stats = await loadCampusStats(campus.id);
        return {
          ...campus,
          ...stats
        };
      });

      const campusWithStatsData = await Promise.all(campusStatsPromises);
      setCampusWithStats(campusWithStatsData);

      // Calcular totales
      const totals = campusWithStatsData.reduce(
        (acc, campus) => ({
          students: acc.students + campus.studentsCount,
          teachers: acc.teachers + campus.teachersCount,
          careers: acc.careers + campus.careersCount
        }),
        { students: 0, teachers: 0, careers: 0 }
      );

      setTotalStudents(totals.students);
      setTotalTeachers(totals.teachers);
      setTotalCareers(totals.careers);
      
    } catch (err) {
      console.error('Error loading supervisor data:', err);
      showError('Error', 'Error al cargar los datos del supervisor');
      setSupervisorData(null);
      setCampusWithStats([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError, loadCampusStats]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (user?.id) {
      loadSupervisorData();
    }
  }, [loadSupervisorData]);

  // Función para navegar a un campus específico
  const handleCampusClick = useCallback((campus) => {
    navigate('/supervisor/campuses/careers', { 
      state: { 
        campusId: campus.id, 
        campusName: campus.name,
        isPrimary: campus.isPrimary
      } 
    });
  }, [navigate]);

  if (loading) {
    return (
      <>
        <div className="bg-white rounded-top p-2">
          <h3 className="text-blue-500 fw-semibold mx-3 my-1">Inicio</h3>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando datos del supervisor...</p>
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

      <div className="row mt-3">
        {/* COLUMNA IZQUIERDA - Estadísticas generales */}
        <div className="col-12 col-lg-6">
          <div className="row">
            {/* Total de campus */}
            <div className="col-12 col-md-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineLocationOn size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Campus supervisados</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">
                      {supervisorData ? (1 + supervisorData.additionalCampuses.length) : 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total de carreras */}
            <div className="col-12 col-md-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineSchool size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de carreras</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{totalCareers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total de docentes */}
            <div className="col-12 col-md-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineCoPresent size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de docentes</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{totalTeachers}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total de estudiantes */}
            <div className="col-12 col-md-6 mb-3">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlinePerson size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Total de estudiantes</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <p className="fs-1 fw-bold text-blue-500 mb-0">{totalStudents}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA */}
        <div className="col-12 col-lg-6">
          {/* Desempeño general */}
          <div className="row">
            <div className="col-12 mb-3">
              <div className="card border-0" style={{ height: '200px' }}>
                <div className="card-body d-flex flex-column h-100">
                  <div className="d-flex align-items-center mb-3">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineEmojiEvents size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Desempeño general</h6>
                  </div>
                  <div className="d-flex flex-column align-items-center justify-content-center flex-grow-1">
                    <div>
                      <Rating value={Math.round(ratingValue)} readOnly cancel={false} />
                    </div>
                    <div className="d-flex flex-row align-items-center mt-3">
                      <p className="fs-1 fw-bold text-blue-500 me-3 mb-0">{ratingValue.toFixed(1)}</p>
                      <div className={`${isUp ? 'icon-average-up' : 'icon-average-down'} rounded-circle`}>
                        {isUp ? <MdArrowDropUp size={40} /> : <MdArrowDropDown size={40} />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campus supervisados */}
          <div className="row">
            <div className="col-12">
              <div className="card border-0" style={{ minHeight: '300px' }}>
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="title-icon p-1 rounded-circle">
                      <MdOutlineGroup size={40} className="p-1" />
                    </div>
                    <h6 className="text-secondary ms-2 mb-0">Mis campus</h6>
                  </div>
                  
                  <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '250px', cursor: 'pointer' }}>
                    {campusWithStats.length === 0 ? (
                      <div className="text-center mt-3">
                        <Message severity="info" text="No tienes campus asignados." />
                      </div>
                    ) : (
                      campusWithStats.map((campus) => (
                        <div 
                          key={campus.id} 
                          className="d-flex flex-column p-3 border rounded my-1 hovereable"
                          onClick={() => handleCampusClick(campus)}
                        >
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <span className="fw-medium text-truncate me-2">{campus.name}</span>
                            {campus.isPrimary ? (
                              <span className="badge bg-primary">Principal</span>
                            ) : (
                              <span className="badge bg-secondary">Supervisado</span>
                            )}
                          </div>
                          
                          <div className="d-flex justify-content-between text-muted small">
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
                      ))
                    )}
                  </div>

                  {campusWithStats.length > 0 && (
                    <div className="text-center mt-2">
                      <button 
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => navigate('/supervisor/campuses')}
                      >
                        Ver todos los campus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
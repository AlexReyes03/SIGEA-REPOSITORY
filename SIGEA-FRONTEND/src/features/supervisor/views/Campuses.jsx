import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Skeleton } from 'primereact/skeleton';
import { MdOutlineSchool, MdOutlineStars, MdOutlineLocationOn } from 'react-icons/md';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getSupervisorCampuses } from '../../../api/supervisorService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';

export default function Campuses() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showError } = useToast();

  const [supervisorData, setSupervisorData] = useState(null);
  const [campusWithCareers, setCampusWithCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCareers, setLoadingCareers] = useState(false);

  // Función para cargar datos del supervisor
  const loadSupervisorData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await getSupervisorCampuses(user.id);
      setSupervisorData(data);

      // Preparar array de todos los campus (principal + adicionales)
      const allCampus = [
        {
          id: data.primaryCampusId,
          name: data.primaryCampusName,
          type: 'PRIMARY',
          isPrimary: true,
        },
        ...data.additionalCampuses.map((campus) => ({
          id: campus.campusId,
          name: campus.campusName,
          type: 'ADDITIONAL',
          isPrimary: false,
          assignedAt: campus.assignedAt,
        })),
      ];

      // Cargar cantidad de carreras para cada campus
      await loadCareersCount(allCampus);
    } catch (err) {
      console.error('Error loading supervisor data:', err);
      showError('Error', 'Error al cargar los datos del supervisor');
      setSupervisorData(null);
      setCampusWithCareers([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, showError]);

  // Función para cargar cantidad de carreras por campus
  const loadCareersCount = useCallback(async (campusList) => {
    setLoadingCareers(true);

    const campusPromises = campusList.map(async (campus) => {
      try {
        const careers = await getCareerByPlantelId(campus.id);
        const careersArray = Array.isArray(careers) ? careers : [];

        return {
          ...campus,
          careersCount: careersArray.length,
          careers: careersArray,
        };
      } catch (error) {
        console.error(`Error loading careers for campus ${campus.id}:`, error);
        return {
          ...campus,
          careersCount: 0,
          careers: [],
        };
      }
    });

    try {
      const campusWithCareersData = await Promise.all(campusPromises);
      setCampusWithCareers(campusWithCareersData);
    } catch (error) {
      console.error('Error loading careers count:', error);
      setCampusWithCareers(
        campusList.map((campus) => ({
          ...campus,
          careersCount: 0,
          careers: [],
        }))
      );
    } finally {
      setLoadingCareers(false);
    }
  }, []);

  // Función para navegar a careers
  const handleCampusClick = useCallback(
    (campus) => {
      navigate('/supervisor/campuses/careers', {
        state: {
          campusId: campus.id,
          campusName: campus.name,
          isPrimary: campus.isPrimary,
        },
      });
    },
    [navigate]
  );

  // Efecto optimizado
  useEffect(() => {
    if (user?.id) {
      loadSupervisorData();
    }
  }, [loadSupervisorData]);

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Planteles</h3>
      </div>

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
              <p className="mt-3 text-600">Cargando campus...</p>
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
      ) : campusWithCareers.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineLocationOn className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No hay campus asignados</h5>
            <p className="text-muted">Contacta al administrador para asignar campus</p>
          </div>
        </div>
      ) : (
        <div className="row mt-3">
          {campusWithCareers.map((campus) => (
            <div key={campus.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
              <div className="card border-0 h-100 hovereable up shadow-sm" onClick={() => handleCampusClick(campus)} style={{ cursor: 'pointer' }}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="fw-semibold lh-sm mb-0 text-dark text-truncate">{campus.name}</h6>
                      </div>
                      <div className="mb-2">
                        {campus.isPrimary ? (
                          <small className="text-muted">
                            <i className="pi pi-star me-1"></i>
                            Campus principal
                          </small>
                        ) : (
                          <small className="text-muted">
                            <i className="pi pi-users me-1"></i>
                            Campus supervisado
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="p-3 rounded bg-light">
                      <MdOutlineSchool className="text-secondary mb-2" size={32} />
                      <div className="fw-bold text-secondary fs-4">{loadingCareers ? <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="4" /> : campus.careersCount || 0}</div>
                      <small className="text-muted">{campus.careersCount === 1 ? 'Carrera' : 'Carreras'}</small>
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

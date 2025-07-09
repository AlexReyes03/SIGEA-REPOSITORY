import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdOutlineCoPresent, MdOutlineBook, MdOutlineSchool } from 'react-icons/md';

import { useToast } from '../../../components/providers/ToastProvider';
import { getCareerByPlantelId } from '../../../api/academics/careerService';

export default function Careers() {
    const location = useLocation();
    const navigate = useNavigate();
    const { showError } = useToast();

    // Obtener datos del campus desde el state de navegación
    const campusData = location.state;
    const campusId = campusData?.campusId;
    const campusName = campusData?.campusName || 'Campus';
    const isPrimary = campusData?.isPrimary || false;

    const [careers, setCareers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Función optimizada para cargar carreras
    const loadCareers = useCallback(async () => {
        if (!campusId) {
            showError('Error', 'No se especificó el campus a consultar');
            navigate('/supervisor/campuses');
            return;
        }

        try {
            setLoading(true);
            const list = await getCareerByPlantelId(campusId);
            setCareers(Array.isArray(list) ? list : []);
        } catch (err) {
            console.error('Error loading careers:', err);
            showError('Error', 'Error al cargar las carreras del campus');
            setCareers([]);
        } finally {
            setLoading(false);
        }
    }, [campusId, showError, navigate]);

    // Efecto optimizado
    useEffect(() => {
        if (campusId) {
            loadCareers();
        } else {
            // Si no hay campus ID, redirigir al dashboard
            navigate('/supervisor/campuses');
        }
    }, [loadCareers, campusId, navigate]);

    // Función para navegar a grupos
    const handleCareerClick = useCallback((career) => {
        navigate('/supervisor/campuses/careers/groups', { 
            state: { 
                career,
                campusId,
                campusName,
                isPrimary
            } 
        });
    }, [navigate, campusId, campusName, isPrimary]);

    // Breadcrumb items
    const breadcrumbItems = [
        { 
            label: 'Campus', 
            command: () => navigate('/supervisor/campuses') 
        },
        { 
            label: campusName 
        }
    ];

    const breadcrumbHome = { 
        icon: 'pi pi-home', 
        command: () => navigate('/supervisor/campuses') 
    };

    if (loading) {
        return (
            <>
                <div className="bg-white rounded-top p-2">
                    <h3 className="text-blue-500 fw-semibold mx-3 my-1">Carreras - {campusName}</h3>
                </div>

                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
                    <div className="text-center">
                        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
                        <p className="mt-3 text-600">Cargando carreras...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <div className="bg-white rounded-top p-2">
                <h3 className="text-blue-500 fw-semibold mx-3 my-1">Carreras - {campusName}</h3>
            </div>

            <BreadCrumb
                model={breadcrumbItems}
                home={breadcrumbHome}
                className="mt-2 pb-0 ps-0 text-nowrap"
            />

            {careers.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
                    <div className="text-center">
                        <MdOutlineSchool className="text-secondary" size={70} />
                        <h5 className="mt-3 text-muted">No hay carreras registradas</h5>
                        <p className="text-muted">Este campus no tiene carreras configuradas</p>
                        <Button 
                            label="Volver a campus" 
                            icon="pi pi-home" 
                            severity="secondary" 
                            outlined
                            onClick={() => navigate('/supervisor/campuses')}
                        />
                    </div>
                </div>
            ) : (
                <>
                    {/* Grid de carreras */}
                    <div className="row mt-3">
                        {careers.map((career) => (
                            <div key={career.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
                                <div 
                                    className="card border-0 h-100 hovereable up shadow-sm" 
                                    onClick={() => handleCareerClick(career)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="flex-grow-1 text-truncate">
                                                <h6 className="fw-semibold lh-sm mb-2 text-dark text-truncate">
                                                    {career.name}
                                                </h6>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-light text-dark border">
                                                        {career.differentiator}
                                                    </span>
                                                </div>
                                                <div className="mt-2">
                                                    {career.studentsCount === 0 && career.teachersCount === 0 && career.groupsCount === 0 ? (
                                                        <small className="text-muted">
                                                            <i className="pi pi-info-circle me-1"></i>
                                                            Sin actividad
                                                        </small>
                                                    ) : (
                                                        <small className="text-success">
                                                            <i className="pi pi-check-circle me-1"></i>
                                                            {career.studentsCount > 0 && career.groupsCount > 0 
                                                                ? 'Operativa' 
                                                                : career.studentsCount > 0 
                                                                    ? 'Con estudiantes' 
                                                                    : 'Con personal'
                                                            }
                                                        </small>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="row g-2 text-center">
                                            <div className="col-4">
                                                <div className="p-2 rounded bg-light h-100 text-truncate">
                                                    <MdOutlineCoPresent className="text-secondary mb-1" size={24} />
                                                    <div className="fw-bold text-secondary">{career.studentsCount || 0}</div>
                                                    <small className="text-muted">Estudiantes</small>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="p-2 rounded bg-light h-100 text-truncate">
                                                    <MdOutlineBook className="text-secondary mb-1" size={24} />
                                                    <div className="fw-bold text-secondary">{career.groupsCount || 0}</div>
                                                    <small className="text-muted">Grupos</small>
                                                </div>
                                            </div>
                                            <div className="col-4">
                                                <div className="p-2 rounded bg-light h-100 text-truncate">
                                                    <i className="pi pi-users text-secondary mb-1" style={{ fontSize: '1.5rem' }}></i>
                                                    <div className="fw-bold text-secondary">{career.teachersCount || 0}</div>
                                                    <small className="text-muted">Maestros</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </>
    );
}
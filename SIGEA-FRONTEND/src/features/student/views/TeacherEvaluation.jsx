import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { ProgressSpinner } from 'primereact/progressspinner';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import * as rankingService from '../../../api/academics/rankingService';

export default function TeacherEvaluation() {
    const toast = useRef(null);
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Referencias y estado para el slider animado
    const containerRef = useRef(null);
    const tabRefs = useRef({});
    const [slider, setSlider] = useState({ left: 0, width: 0 });


    useEffect(() => {
        const loadEvaluationData = async () => {
            if (!user?.id) {
                setError('No se pudo obtener la información del usuario');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const evaluationData = await rankingService.getStudentEvaluationModules(user.id);
                setModules(evaluationData);
                setError(null);
            } catch (error) {
                console.error('Error loading evaluation data:', error);
                setError('No se pudieron cargar los datos de evaluación');
            } finally {
                setLoading(false);
            }
        };

        loadEvaluationData();
    }, [user?.id]);

    // Filtrar módulos por estado
    const pendingModules = modules.filter(module => !module.isEvaluated);
    const evaluatedModules = modules.filter(module => module.isEvaluated);

    // Configuración de las pestañas
    const tabs = [
        { key: 'pending', label: `Pendientes (${pendingModules.length})` },
        { key: 'evaluated', label: `Evaluados (${evaluatedModules.length})` }
    ];

    // Efecto para actualizar la posición del slider
    useLayoutEffect(() => {
        const btn = tabRefs.current[activeTab];
        const cont = containerRef.current;
        if (!btn || !cont) return;

        const { left: cLeft } = cont.getBoundingClientRect();
        const { left, width } = btn.getBoundingClientRect();
        setSlider({ left: left - cLeft, width });
    }, [activeTab, pendingModules.length, evaluatedModules.length]);

    const handleRatingChange = (moduleId, value) => {
        setModules(modules.map(module =>
            module.id === moduleId
                ? { ...module, rating: value }
                : module
        ));
    };

    const handleCommentChange = (moduleId, value) => {
        setModules(modules.map(module =>
            module.id === moduleId
                ? { ...module, comment: value }
                : module
        ));
    };

    const handleSubmitEvaluation = async (moduleId) => {

        const moduleToEvaluate = modules.find(m => m.id === moduleId);


        if (!moduleToEvaluate) {
            toast.current.show({
                severity: 'error',
                summary: 'Error',
                detail: 'No se encontró el módulo a evaluar',
                life: 3000
            });
            return;
        }

        // Parseo del moduleId
        const parsedModuleId = moduleToEvaluate.id.split('-')[2];

        // Validate evaluation data
        const evaluationData = {
            studentId: user.id,
            moduleId: parsedModuleId,
            teacherId: moduleToEvaluate.teacherId,
            star: moduleToEvaluate.rating,
            comment: moduleToEvaluate.comment
        };

        const validation = rankingService.validateEvaluation(evaluationData);

        console.log('Datos a enviar:', evaluationData);
        console.log('Datos validados:', validation.sanitizedData);

        if (!validation.isValid) {
            toast.current.show({
                severity: 'warn',
                summary: 'Datos incompletos',
                detail: validation.errors[0],
                life: 3000
            });
            return;
        }

        try {
            // Submit evaluation
            await rankingService.submitEvaluation(validation.sanitizedData);

            // Update local state
            setModules(modules.map(module =>
                module.id === moduleId
                    ? {
                        ...module,
                        isEvaluated: true,
                        submittedRating: module.rating,
                        submittedComment: module.comment,
                        rating: 0,
                        comment: ""
                    }
                    : module
            ));

            toast.current.show({
                severity: 'success',
                summary: 'Evaluación enviada',
                detail: 'Tu evaluación ha sido registrada exitosamente',
                life: 4000
            });

        } catch (error) {
            console.error('Error submitting evaluation:', error);
            toast.current.show({
                severity: 'error',
                summary: 'Error al enviar',
                detail: error.message || 'No se pudo enviar la evaluación',
                life: 5000
            });
        }
    };

    const renderModuleCard = (module) => {
        const cardHeader = (
            <div className="d-flex justify-content-between align-items-center mt-3 p-3">
                <div>
                    <h5 className="text-blue-500 fw-semibold">{module.moduleName}</h5>
                </div>
            </div>
        );

        const cardContent = (
            <div>
                {/* Información del docente */}
                <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="pi pi-user text-muted"></i>
                        <small className="fw-medium">{module.teacherName}</small>
                    </div>
                    <div className="d-flex align-items-start gap-2 mb-2">
                        <i className="pi pi-book text-muted mt-1"></i>
                        <small className="text-muted">{module.subjects.join(", ")}</small>
                    </div>
                    {module.schedule && (
                        <div className="d-flex align-items-center gap-2">
                            <i className="pi pi-clock text-muted"></i>
                            <small className="text-muted">{module.schedule}</small>
                        </div>
                    )}
                </div>

                {/* Estado de evaluación */}
                {module.isEvaluated ? (
                    <div className="text-center py-3">
                        <div className="d-flex flex-column align-items-center gap-2">
                            <i className="pi pi-check-circle text-success" style={{ fontSize: '2rem' }}></i>
                            <span className="text-success fw-medium">Evaluación completada</span>
                            <small className="text-muted">Tu evaluación ha sido registrada exitosamente</small>
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Rating */}
                        <div className="mb-3">
                            <div className="text-center mb-2">
                                <Rating
                                    value={module.rating}
                                    onChange={(e) => handleRatingChange(module.id, e.value)}
                                    cancel={false}
                                    className="custom-rating"
                                />
                            </div>
                            <small className="form-label fw-medium text-start d-block">
                                Califica el desempeño del docente
                            </small>
                        </div>

                        {/* Comentario obligatorio */}
                        <div className="mb-3" >
                            <label className="form-label fw-medium small text-muted mb-2">
                                Comentario sobre el docente *
                            </label>
                            <div className='overflow-y-auto' style={{ maxHeight: '15rem' }}>
                                <InputTextarea
                                    value={module.comment}
                                    onChange={(e) => handleCommentChange(module.id, e.target.value)}
                                    rows={2}
                                    placeholder="Comparte tu experiencia..."
                                    className="w-100"
                                />
                            </div>
                            <hr />
                        </div>

                        {/* Botón enviar */}
                        <div className="text-center">
                            <Button
                                label="Enviar"
                                icon="pi pi-send"
                                onClick={() => handleSubmitEvaluation(module.id)}
                                className="p-button-primary"
                                disabled={module.rating === 0 || !module.comment?.trim()}
                                style={{
                                    fontSize: '0.8rem',
                                    padding: '0.4rem 0.8rem',
                                    height: 'auto'
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        );

        return (
            <div key={module.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3">
                <div className={`card h-100 shadow-sm ${module.isEvaluated ? 'bg-light' : ''}`} style={{ fontSize: '0.9rem', maxHeight: '37.5rem' }}>
                    <div>
                        {cardHeader}
                    </div>
                    <div className="card-body pt-0">
                        {cardContent}
                    </div>
                </div>
            </div>
        );
    };

    const renderTabContent = () => {
        if (loading) {
            return (
                <div className="col-12 text-center py-5">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <p className="mt-3 text-muted">Cargando módulos...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="col-12">
                    <Message
                        severity="error"
                        text={error}
                        className="w-100"
                    />
                </div>
            );
        }

        if (activeTab === 'pending') {
            return (
                <div className="row">
                    {pendingModules.length > 0 ? (
                        pendingModules.map(module => renderModuleCard(module))
                    ) : (
                        <div className="col-12 text-center py-5">
                            <i className="pi pi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                            <h5 className="mt-3 text-muted">¡No tienes módulos pendientes por evaluar!</h5>
                        </div>
                    )}
                </div>
            );
        } else {
            return (
                <div className="row">
                    {evaluatedModules.length > 0 ? (
                        evaluatedModules.map(module => renderModuleCard(module))
                    ) : (
                        <div className="col-12 text-center py-5">
                            <i className="pi pi-info-circle text-muted" style={{ fontSize: '3rem' }}></i>
                            <h5 className="mt-3 text-muted">Aún no has evaluado ningún módulo</h5>
                            <p className="text-muted">Ve a la pestaña "Pendientes" para comenzar a evaluar.</p>
                        </div>
                    )}
                </div>
            );
        }
    };

    const baseBtn = 'bg-transparent border-0 px-3 py-2 h6 text-gray-600 fw-semibold position-relative';
    const activeColor = '#276ba5';

    //Validación de acceso
    if (user && user.role?.name !== 'STUDENT') {
        return (
            <div className="container-fluid py-5">
                <div className="row justify-content-center">
                    <div className="col-md-6">
                        <Message
                            severity="warn"
                            text="Solo los estudiantes pueden acceder a las evaluaciones docentes"
                            className="w-100"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-top p-2">
                <h3 className="text-blue-500 fw-semibold mx-3 my-1">Evaluación Docente</h3>
            </div>

            <Toast ref={toast} />

            <div className="row my-2">
                <div className="mt-0">
                    {/* Pestañas personalizadas */}
                    <div className="bg-white p-3 mb-0">
                        <div ref={containerRef} className="d-inline-flex position-relative">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    ref={(el) => (tabRefs.current[tab.key] = el)}
                                    className={baseBtn}
                                    style={{ color: activeTab === tab.key ? activeColor : '#707070' }}
                                    role="tab"
                                    aria-selected={activeTab === tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                >
                                    {tab.label}
                                </button>
                            ))}

                            {/* Slider animado */}
                            <motion.div
                                layout
                                animate={{ left: slider.left, width: slider.width }}
                                transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    height: 3,
                                    borderRadius: 9999,
                                    background: 'linear-gradient(90deg, #276ba5 0%, #276ba5 100%)',
                                }}
                            />
                        </div>
                    </div>

                    {/* render de los Modulos */}
                    <div className="mt-3">
                        {renderTabContent()}
                    </div>  
                </div>
            </div>
        </>
    );
}
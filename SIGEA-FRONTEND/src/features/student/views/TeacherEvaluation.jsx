import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { Rating } from 'primereact/rating';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { Toast } from 'primereact/toast';
import { useRef } from 'react';

export default function TeacherEvaluation() {
    const toast = useRef(null);
    
    // Datos de ejemplo - reemplaza con tus datos reales
    const [modules, setModules] = useState([
        {
            id: 1,
            name: "Módulo 1",
            average: 9.7,
            teacher: "Leandro Arturo Estrada Velazquez",
            subjects: ["Matemáticas", "Español"],
            isEvaluated: false,
            rating: 0,
            comment: "",
            submittedRating: null
        },
        {
            id: 2,
            name: "Módulo 2", 
            average: 8.5,
            teacher: "Ana María González López",
            subjects: ["Ciencias Naturales", "Historia"],
            isEvaluated: true,
            rating: 0,
            comment: "",
            submittedRating: 4
        },
        {
            id: 3,
            name: "Módulo 3",
            average: 9.2,
            teacher: "Carlos Eduardo Ramírez",
            subjects: ["Educación Física"],
            isEvaluated: false,
            rating: 0,
            comment: ""
        }
    ]);

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

    const handleSubmitEvaluation = (moduleId) => {
        const moduleToEvaluate = modules.find(m => m.id === moduleId);
        
        if (moduleToEvaluate.rating === 0) {
            toast.current.show({
                severity: 'warn', 
                summary: 'Calificación requerida', 
                detail: 'Debes seleccionar al menos 1 estrella para evaluar',
                life: 3000
            });
            return;
        }

        setModules(modules.map(module => 
            module.id === moduleId 
                ? { 
                    ...module, 
                    isEvaluated: true, 
                    submittedRating: module.rating,
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
    };

    const renderModuleCard = (module) => {
        const cardHeader = (
            <div className="d-flex justify-content-between align-items-center" style={{ padding: '1rem 1.5rem 0.5rem 1.5rem' }}>
                <div>
                    <h5 className="mb-1 text-primary fw-semibold">{module.name}</h5>
                    <small className="text-muted">Promedio: {module.average}</small>
                </div>
                {module.isEvaluated && (
                    <div className="d-flex align-items-center gap-2">
                        <i className="pi pi-check-circle text-success fs-5"></i>
                        <span className="text-success fw-medium">Evaluado</span>
                    </div>
                )}
            </div>
        );

        const cardContent = (
            <div>
                {/* Información del docente */}
                <div className="mb-4">
                    <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="pi pi-user text-muted"></i>
                        <span className="fw-medium">{module.teacher}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <i className="pi pi-book text-muted"></i>
                        <span className="text-muted">{module.subjects.join(", ")}</span>
                    </div>
                </div>

                {/* Estado de evaluación */}
                {module.isEvaluated ? (
                    <div className="text-center py-3">
                        <div className="mb-3">
                            <Rating 
                                value={module.submittedRating} 
                                readOnly 
                                cancel={false}
                                className="custom-rating"
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        {/* Rating */}
                        <div className="mb-3">
                            <label className="form-label fw-medium">
                                Califica el desempeño general del docente:
                            </label>
                            <div className="text-center">
                                <Rating 
                                    value={module.rating} 
                                    onChange={(e) => handleRatingChange(module.id, e.value)}
                                    cancel={false}
                                    className="custom-rating"
                                />
                            </div>
                        </div>

                        {/* Comentario opcional */}
                        <div className="mb-4">
                            <InputTextarea 
                                value={module.comment}
                                onChange={(e) => handleCommentChange(module.id, e.target.value)}
                                rows={3}
                                placeholder="Comparte tu experiencia con este docente..."
                                className="w-100"
                                autoResize
                            />
                        </div>

                        {/* Botón enviar */}
                        <div className="text-center">
                            <Button 
                                label="Enviar Evaluación"
                                icon="pi pi-send"
                                onClick={() => handleSubmitEvaluation(module.id)}
                                className="p-button-primary"
                                disabled={module.rating === 0}
                            />
                        </div>
                    </div>
                )}
            </div>
        );

        return (
            <div key={module.id} className="col-12 col-md-6 col-lg-4 mb-4">
                <Card 
                    header={cardHeader}
                    className={`h-100 ${module.isEvaluated ? 'bg-light' : ''}`}
                >
                    {cardContent}
                </Card>
            </div>
        );
    };

    return (
        <>
            <div className="bg-white rounded-top p-2">
                <h3 className="text-blue-500 fw-semibold mx-3 my-1">Evaluación Docente</h3>
            </div>
            
            <div className="bg-white p-4">
                {/* Descripción */}
                <div className="mb-4">
                    <p className="text-muted mb-0">
                        Evalúa el desempeño de tus docentes para ayudar a mejorar la calidad educativa
                    </p>
                </div>

                <Toast ref={toast} />

                {/* Grid de módulos */}
                <div className="row">
                    {modules.map(module => renderModuleCard(module))}
                </div>
            </div>
        </>
    );
}
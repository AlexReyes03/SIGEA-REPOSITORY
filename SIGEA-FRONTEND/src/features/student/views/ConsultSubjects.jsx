import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { MdOutlineGroup } from 'react-icons/md';
import { motion } from 'framer-motion';

import { useToast } from '../../../components/providers/ToastProvider';
import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getQualificationsByGroupWithDetails } from '../../../api/academics/qualificationService';

export default function ConsultSubjects({ group, studentId }) {
    console.log('ConsultSubjects - Componente renderizado con props:', { group, studentId });

    const [loading, setLoading] = useState(true);
    const { showError } = useToast();

    const [searchTerms, setSearchTerms] = useState({});
    const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
    const [curriculum, setCurriculum] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [qualificationDetails, setQualificationDetails] = useState({});
    const [showQualificationDetails, setShowQualificationDetails] = useState({});

    const loadData = useCallback(async () => {
        try {
            console.log('ConsultSubjects - Props recibidas:', { group, studentId });

            if (!group?.curriculumId || !group?.groupId || !studentId) {
                console.error('ConsultSubjects - Faltan datos requeridos:', {
                    curriculumId: group?.curriculumId,
                    groupId: group?.groupId,
                    studentId
                });
                setLoading(false);
                return;
            }

            const curriculumData = await getCurriculumById(group.curriculumId);
            setCurriculum(curriculumData);
            const qualificationsData = await getQualificationsByGroupWithDetails(group.groupId);
            const studentQualifications = qualificationsData.filter(q => q.studentId === studentId);
            
            const gradeMap = {};
            const detailsMap = {};
            const teacherMap = {}; 

            studentQualifications.forEach((q) => {
                gradeMap[q.subjectId] = q.grade;
                detailsMap[q.subjectId] = {
                    teacherName: q.teacherName,
                    dateFormatted: q.dateFormatted,
                };
                teacherMap[q.subjectId] = q.teacherName;
            });

            setQualificationDetails(detailsMap);
            const moduleData = {};

            curriculumData.modules.forEach((module) => {
                const subjects = module.subjects.map((subject) => ({
                    subjectId: subject.id,
                    subjectName: subject.name,
                    teacherName: teacherMap[subject.id] || 'Sin asignar',
                    grade: gradeMap[subject.id] ?? null,
                    moduleId: module.id,
                    moduleName: module.name
                }));

                moduleData[module.id] = subjects;
            });

            setTableData(moduleData);
        } catch (err) {
            showError('Error', 'Error al cargar los datos');
        } finally {
            setLoading(false);
        }
    }, [group, studentId, showError]);

    useEffect(() => {
        console.log('ConsultSubjects - useEffect ejecutado');
        console.log('ConsultSubjects - Evaluando condición:', {
            groupExists: !!group,
            curriculumId: group?.curriculumId,
            studentIdExists: !!studentId,
            studentId: studentId
        });

        if (group?.curriculumId && studentId) {
            console.log('ConsultSubjects - Condición cumplida, iniciando carga...');
            setLoading(true);
            loadData();
        } else {
            console.log('ConsultSubjects - Condición NO cumplida, no se carga nada');
            setLoading(false);
        }
    }, [group, studentId, loadData]);

    // Módulos ordenados
    const sortedModules = useMemo(() => {
        if (!curriculum?.modules) return [];
        return [...curriculum.modules].sort((a, b) => a.id - b.id);
    }, [curriculum?.modules]);

    // Crear header groups para todos los módulos
    const headerGroups = useMemo(() => {
        const groups = {};
        sortedModules.forEach((module) => {
            groups[module.id] = (
                <ColumnGroup>
                    <Row>
                        <Column
                            header="Materia"
                            style={{ border: '1px solid #ededed', minWidth: '250px' }}
                        />
                        <Column
                            header="Docente"
                            style={{ border: '1px solid #ededed', minWidth: '200px' }}
                        />
                        <Column
                            header="Calificación"
                            style={{ border: '1px solid #ededed', minWidth: '120px', textAlign: 'center' }}
                        />
                    </Row>
                </ColumnGroup>
            );
        });
        return groups;
    }, [sortedModules]);

    // Crear table keys para todos los módulos
    const tableKeys = useMemo(() => {
        const keys = {};
        sortedModules.forEach((module) => {
            keys[module.id] = `${module.id}-consult-${showQualificationDetails[module.id] ? 'details' : 'nodetails'}`;
        });
        return keys;
    }, [sortedModules, showQualificationDetails]);

    // Filtrar datos por búsqueda
    const getFilteredData = useCallback((moduleId, searchTerm) => {
        if (!tableData[moduleId]) return [];

        if (!searchTerm) return tableData[moduleId];

        return tableData[moduleId].filter(item =>
            item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tableData]);

    // Renderizar badge de calificación
    const renderGradeBadge = (grade) => {
        if (grade == null) {
            return (
                <Badge
                    value="S/C"
                    severity="secondary"
                    style={{ fontSize: '0.9rem' }}
                />
            );
        }

        const severity = grade >= 8 ? 'success' : grade >= 7 ? 'warning' : 'danger';
        return (
            <Badge
                value={grade}
                severity={severity}
                style={{ fontSize: '0.9rem' }}
            />
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
                <ProgressSpinner
                    style={{ width: '50px', height: '50px' }}
                    strokeWidth="8"
                    fill="var(--surface-ground)"
                    animationDuration=".5s"
                />
                <span className="ms-3">Cargando calificaciones...</span>
            </div>
        );
    }

    // Verificar si faltan props necesarias
    if (!group || !studentId) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
                <div className="text-center">
                    <i className="pi pi-exclamation-triangle text-warning" style={{ fontSize: '2rem' }}></i>
                    <p className="mt-3 mb-0">Faltan datos para cargar las calificaciones</p>
                    <small className="text-muted">
                        {!group && 'Información del grupo no disponible'}
                        {!studentId && 'ID del estudiante no disponible'}
                    </small>
                </div>
            </div>
        );
    }

    return (
        <>
            <Tooltip target="[data-pr-tooltip]" />

            {sortedModules.map((module) => {
                const isCollapsed = isModuleCollapsed[module.id];
                const search = searchTerms[module.id] || '';
                const filteredData = getFilteredData(module.id, search);

                // Obtener header group y table key
                const headerGroup = headerGroups[module.id];
                const tableKey = tableKeys[module.id];

                // Calcular estadísticas del módulo
                const moduleGrades = filteredData
                    .map(item => item.grade)
                    .filter(grade => grade != null && grade >= 6 && grade <= 10);

                const moduleAverage = moduleGrades.length > 0
                    ? (moduleGrades.reduce((a, b) => a + b, 0) / moduleGrades.length).toFixed(1)
                    : null;

                return (
                    <div className="card border-0 mt-3" key={module.id}>
                        {/* Header módulo */}
                        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-center my-md-3 mt-3 mx-3">
                                <div className="title-icon p-1 rounded-circle">
                                    <MdOutlineGroup size={40} className="p-1" />
                                </div>
                                <div className="ms-3">
                                    <h6 className="text-blue-500 fs-5 fw-semibold mb-1">{module.name}</h6>
                                    {moduleAverage && (
                                        <small className="text-muted">
                                            Promedio del módulo: <span className="fw-semibold">{moduleAverage}</span>
                                        </small>
                                    )}
                                </div>
                                <Button
                                    icon={isCollapsed ? 'pi pi-plus' : 'pi pi-minus'}
                                    title={isCollapsed ? 'Expandir módulo' : 'Ocultar módulo'}
                                    size="small"
                                    text
                                    className="rounded-circle ms-2"
                                    onClick={() =>
                                        setIsModuleCollapsed((prev) => ({
                                            ...prev,
                                            [module.id]: !prev[module.id],
                                        }))
                                    }
                                />
                            </div>

                            {!isCollapsed && (
                                <div className="d-flex align-items-center justify-content-end mx-3 mb-3 mb-md-0">
                                    <Button
                                        icon="pi pi-info-circle"
                                        className={`me-2 ${showQualificationDetails[module.id] ? 'p-button-info' : 'p-button-secondary'}`}
                                        outlined={!showQualificationDetails[module.id]}
                                        onClick={() =>
                                            setShowQualificationDetails((prev) => ({
                                                ...prev,
                                                [module.id]: !prev[module.id],
                                            }))
                                        }
                                        data-pr-tooltip={showQualificationDetails[module.id] ? 'Ocultar detalles de calificación' : 'Mostrar detalles de calificación'}
                                        data-pr-position="top"
                                    />

                                    <div className="p-fluid">
                                        <InputText
                                            placeholder="Buscar materia o docente..."
                                            value={search}
                                            onChange={(e) =>
                                                setSearchTerms((prev) => ({
                                                    ...prev,
                                                    [module.id]: e.target.value,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* DataTable */}
                        <motion.div
                            initial={false}
                            animate={{
                                height: isCollapsed ? 0 : 'auto',
                                opacity: isCollapsed ? 0 : 1,
                            }}
                            transition={{
                                height: {
                                    duration: 0.4,
                                    ease: [0.04, 0.62, 0.23, 0.98],
                                },
                                opacity: {
                                    duration: 0.3,
                                    ease: 'easeOut',
                                },
                            }}
                            style={{
                                overflow: 'hidden',
                            }}
                        >
                            <div className="m-3 mt-0">
                                <DataTable
                                    key={tableKey}
                                    value={filteredData}
                                    headerColumnGroup={headerGroup}
                                    size="small"
                                    stripedRows
                                    paginator
                                    rows={10}
                                    rowsPerPageOptions={[5, 10, 25]}
                                    emptyMessage={
                                        !search ? (
                                            <p className="text-center my-5">No hay materias en este módulo</p>
                                        ) : (
                                            <p className="text-center my-5">No se encontraron resultados</p>
                                        )
                                    }
                                    tableStyle={{
                                        borderBottom: '1px solid #ededed',
                                        borderLeft: '1px solid #ededed',
                                        borderRight: '1px solid #ededed',
                                    }}
                                >
                                    {/* Nombre de la materia */}
                                    <Column
                                        field="subjectName"
                                        header="Materia"
                                        style={{
                                            border: '1px solid #ededed',
                                            minWidth: '250px'
                                        }}
                                        body={(rowData) => (
                                            <span className="fw-medium">{rowData.subjectName}</span>
                                        )}
                                    />

                                    {/* Docente */}
                                    <Column
                                        field="teacherName"
                                        header="Docente"
                                        style={{
                                            border: '1px solid #ededed',
                                            minWidth: '200px'
                                        }}
                                        body={(rowData) => (
                                            <span
                                                className={rowData.teacherName === 'Sin asignar' ? 'text-muted fst-italic' : ''}
                                            >
                                                {rowData.teacherName}
                                            </span>
                                        )}
                                    />

                                    {/* Calificación */}
                                    <Column
                                        field="grade"
                                        header="Calificación"
                                        style={{
                                            border: '1px solid #ededed',
                                            textAlign: 'center',
                                            minWidth: '120px'
                                        }}
                                        body={(rowData) => {
                                            const grade = rowData.grade;
                                            const details = qualificationDetails[rowData.subjectId];

                                            if (grade != null) {
                                                const tooltipContent = details
                                                    ? `Calificado por: ${details.teacherName}\nFecha: ${details.dateFormatted}`
                                                    : 'Sin información adicional';

                                                return (
                                                    <div className="d-flex justify-content-center">
                                                        <span
                                                            data-pr-tooltip={showQualificationDetails[module.id] ? tooltipContent : undefined}
                                                            data-pr-position={showQualificationDetails[module.id] ? 'top' : undefined}
                                                            style={{
                                                                cursor: showQualificationDetails[module.id] ? 'help' : 'default',
                                                            }}
                                                        >
                                                            {renderGradeBadge(grade)}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            // Sin calificación
                                            return (
                                                <div className="d-flex justify-content-center">
                                                    {renderGradeBadge(null)}
                                                </div>
                                            );
                                        }}
                                    />
                                </DataTable>
                            </div>
                        </motion.div>
                    </div>
                );
            })}
        </>
    );
}
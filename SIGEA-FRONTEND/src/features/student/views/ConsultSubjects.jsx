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
import { ReportCard } from './ReportCard'; 

export default function ConsultSubjects({ group, studentId, studentData }) {
    const [loading, setLoading] = useState(true);
    const { showError } = useToast();

    const [searchTerms, setSearchTerms] = useState({});
    const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
    const [curriculum, setCurriculum] = useState(null);
    const [tableData, setTableData] = useState([]);
    const [qualificationDetails, setQualificationDetails] = useState({});

    const loadData = useCallback(async () => {
        try {
            if (!group?.curriculumId || !group?.groupId || !studentId) {
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
        if (group?.curriculumId && studentId) {
            setLoading(true);
            loadData();
        } else {
            setLoading(false);
        }
    }, [group, studentId, loadData]);

    const sortedModules = useMemo(() => {
        if (!curriculum?.modules) return [];
        return [...curriculum.modules].sort((a, b) => a.id - b.id);
    }, [curriculum?.modules]);

    // Crea los header groups para todos los módulos
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

    // Filtra datos por búsqueda
    const getFilteredData = useCallback((moduleId, searchTerm) => {
        if (!tableData[moduleId]) return [];

        if (!searchTerm) return tableData[moduleId];

        return tableData[moduleId].filter(item =>
            item.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.teacherName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tableData]);

    // Renderiza badge de calificación
    const renderGradeBadge = (grade) => {
        const badgeStyle = {
            width: '45px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
            fontWeight: '600',
            borderRadius: '50px',
            minWidth: '45px',
            textAlign: 'center'
        };

        if (grade == null) {
            return (
                <Badge
                    value="S/C"
                    severity="secondary"
                    style={badgeStyle}
                />
            );
        }

        const severity = grade >= 8 ? 'success' : grade >= 7 ? 'warning' : 'danger';
        return (
            <Badge
                value={grade}
                severity={severity}
                style={badgeStyle}
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
                const headerGroup = headerGroups[module.id];

                // Calcular estadísticas del módulo
                const moduleGrades = filteredData
                    .map(item => item.grade)
                    .filter(grade => grade != null && grade >= 6 && grade <= 10);

                const moduleAverage = moduleGrades.length > 0
                    ? (moduleGrades.reduce((a, b) => a + b, 0) / moduleGrades.length).toFixed(1)
                    : null;

                // Preparar datos para la boleta PDF
                const moduleDataForPDF = {
                    id: module.id,
                    name: module.name,
                    subjects: filteredData
                };

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
                                            Promedio: <span className="fw-semibold">{moduleAverage}</span>
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
                                <div className="d-flex align-items-center justify-content-end mx-3 mb-3 mb-md-0 gap-2">
                                    {/* Botón de descarga de boleta PDF */}
                                    {studentData && (
                                        <ReportCard
                                            studentData={studentData}
                                            groupData={group}
                                            moduleData={moduleDataForPDF}
                                            qualificationDetails={qualificationDetails}
                                            moduleId={module.id}
                                        />
                                    )}

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

                                            return (
                                                <div className="d-flex justify-content-center">
                                                    {renderGradeBadge(grade)}
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
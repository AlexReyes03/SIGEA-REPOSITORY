import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { MdOutlineGroup } from 'react-icons/md';
import { motion } from 'framer-motion';

import { useToast } from '../../../components/providers/ToastProvider';
import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { getQualificationsByGroupWithDetails } from '../../../api/academics/qualificationService';
import { getUserById } from '../../../api/userService';

export default function GroupModulesTable({ group }) {
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  const [searchTerms, setSearchTerms] = useState({});
  const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
  const [curriculum, setCurriculum] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [qualificationDetails, setQualificationDetails] = useState({});
  const [showQualificationDetails, setShowQualificationDetails] = useState({});
  const [showHistoricalStudents, setShowHistoricalStudents] = useState(true);

  const [forceUpdate, setForceUpdate] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const curriculumData = await getCurriculumById(group.curriculumId);
      setCurriculum(curriculumData);

      const [activeStudentsData, qualificationsData] = await Promise.all([getGroupStudents(group.groupId), getQualificationsByGroupWithDetails(group.groupId)]);

      const gradeMap = {};
      const detailsMap = {};
      const studentsWithGrades = new Set();

      qualificationsData.forEach((q) => {
        if (!gradeMap[q.studentId]) gradeMap[q.studentId] = {};
        if (!detailsMap[q.studentId]) detailsMap[q.studentId] = {};

        gradeMap[q.studentId][q.subjectId] = q.grade;
        detailsMap[q.studentId][q.subjectId] = {
          teacherName: q.teacherName,
          dateFormatted: q.dateFormatted,
        };

        studentsWithGrades.add(q.studentId);
      });

      setQualificationDetails(detailsMap);

      const activeStudentsMap = new Map();
      activeStudentsData.forEach((s) => {
        activeStudentsMap.set(s.studentId, {
          studentId: s.studentId,
          fullName: s.fullName,
          isActive: true,
        });
      });

      const allStudents = new Map(activeStudentsMap);

      const historicalStudentIds = Array.from(studentsWithGrades).filter((id) => !allStudents.has(id));

      if (historicalStudentIds.length > 0) {
        try {
          const historicalStudentsInfo = await Promise.all(
            historicalStudentIds.map(async (studentId) => {
              try {
                const studentInfo = await getUserById(studentId);
                return {
                  studentId: studentId,
                  fullName: `${studentInfo.name || ''} ${studentInfo.paternalSurname || ''} ${studentInfo.maternalSurname || ''}`.trim(),
                  isActive: false,
                };
              } catch (error) {
                console.error(`Error obteniendo información del estudiante ${studentId}:`, error);
                return {
                  studentId: studentId,
                  fullName: `Estudiante ${studentId}`,
                  isActive: false,
                };
              }
            })
          );

          historicalStudentsInfo.forEach((student) => {
            allStudents.set(student.studentId, student);
          });
        } catch (error) {
          console.error('Error obteniendo información de estudiantes históricos:', error);
          historicalStudentIds.forEach((studentId) => {
            allStudents.set(studentId, {
              studentId: studentId,
              fullName: `Estudiante ${studentId}`,
              isActive: false,
            });
          });
        }
      }

      const rows = Array.from(allStudents.values()).map((s) => {
        const row = {
          studentId: s.studentId,
          fullName: s.fullName,
          isActive: s.isActive,
        };
        curriculumData.modules.forEach((mod) =>
          mod.subjects.forEach((subj) => {
            row[subj.id] = gradeMap[s.studentId]?.[subj.id] ?? null;
          })
        );
        return row;
      });

      rows.sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return a.fullName.localeCompare(b.fullName);
      });

      setTableData(rows);

      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 100);
    } catch (err) {
      showError('Error', 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, [group, showError]);

  useEffect(() => {
    if (group?.curriculumId) {
      setLoading(true);
      loadData();
    }
  }, [group, loadData]);

  const handleToggleCollapse = useCallback((moduleId) => {
    setShowQualificationDetails((prev) => ({
      ...prev,
      [moduleId]: false,
    }));

    setIsModuleCollapsed((prev) => {
      const wasCollapsed = prev[moduleId];
      const nextState = { ...prev, [moduleId]: !wasCollapsed };

      setTimeout(
        () => {
          setForceUpdate((u) => u + 1);
        },
        wasCollapsed ? 400 : 100
      );

      return nextState;
    });
  }, []);

  const handleToggleDetails = useCallback((moduleId) => {
    setShowQualificationDetails((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  }, []);

  const toggleHistoricalStudents = useCallback(() => {
    setShowHistoricalStudents((prev) => !prev);
  }, []);

  const sortedModules = useMemo(() => {
    if (!curriculum?.modules) return [];
    return [...curriculum.modules].sort((a, b) => b.id - a.id);
  }, [curriculum?.modules]);

  const filteredTableData = useMemo(() => {
    if (showHistoricalStudents) {
      return tableData;
    }
    return tableData.filter((row) => row.isActive);
  }, [tableData, showHistoricalStudents]);

  const gridLinesX = useMemo(
    () => ({
      borderLeft: '1px solid #ededed',
      borderRight: '1px solid #ededed',
    }),
    []
  );

  const headerGroups = useMemo(() => {
    const groups = {};
    sortedModules.forEach((module) => {
      groups[module.id] = (
        <ColumnGroup key={`header-${module.id}`}>
          <Row>
            <Column header="Nombre del estudiante" rowSpan={2} style={{ border: '1px solid #ededed' }} />
            <Column header="Materias" colSpan={module.subjects.length} style={{ border: '1px solid #ededed' }} />
            <Column header="Promedio" rowSpan={2} style={{ border: '1px solid #ededed' }} />
          </Row>
          <Row>
            {module.subjects.map((subj, idx) => (
              <Column key={subj.id} header={<span className="fw-bold">{idx + 1}</span>} headerTooltip={subj.name} headerTooltipOptions={{ position: 'top' }} className="text-center" style={{ border: '1px solid #ededed' }} />
            ))}
          </Row>
        </ColumnGroup>
      );
    });
    return groups;
  }, [sortedModules]);

  const tableKeys = useMemo(() => {
    const keys = {};
    sortedModules.forEach((module) => {
      const detailsShown = showQualificationDetails[module.id];
      keys[module.id] = `${module.id}-enhanced-${detailsShown ? 'details' : 'nodetails'}-${forceUpdate}-${showHistoricalStudents}`;
    });
    return keys;
  }, [sortedModules, showQualificationDetails, forceUpdate, showHistoricalStudents]);

  const studentNameTemplate = (row) => {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className={row.isActive ? '' : 'text-muted'}>{row.fullName}</span>
        {!row.isActive && <Tag value="Inactivo" severity="danger" className="text-xs" style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }} />}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
      </div>
    );
  }

  return (
    <>
      <Tooltip key={`tooltip-enhanced-${forceUpdate}`} target="[data-pr-tooltip]" />

      {sortedModules.map((module) => {
        const isCollapsed = isModuleCollapsed[module.id];
        const search = searchTerms[module.id] || '';

        const headerGroup = headerGroups[module.id];
        const tableKey = tableKeys[module.id];

        const historicalCount = tableData.filter((row) => !row.isActive).length;

        return (
          <div className="card border-0 mt-3" key={`module-${module.id}`}>
            <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
              <div className="d-flex align-items-center my-md-3 mt-3 mx-3">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineGroup size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-3 mb-0">{module.name}</h6>
                <Button icon={isCollapsed ? 'pi pi-plus' : 'pi pi-minus'} title={isCollapsed ? 'Expandir módulo' : 'Ocultar módulo'} size="small" text className="rounded-circle ms-2" onClick={() => handleToggleCollapse(module.id)} />
              </div>

              {!isCollapsed && (
                <div className="d-flex align-items-center justify-content-end mx-3 mb-3 mb-md-0 gap-2">
                  {historicalCount > 0 && (
                    <Button
                      icon={showHistoricalStudents ? 'pi pi-eye-slash' : 'pi pi-eye'}
                      className={`${showHistoricalStudents ? 'p-button-info' : 'p-button-secondary'}`}
                      outlined={!showHistoricalStudents}
                      onClick={toggleHistoricalStudents}
                      data-pr-tooltip={showHistoricalStudents ? `Ocultar ${historicalCount} estudiante(s) del historial` : `Mostrar ${historicalCount} estudiante(s) del historial`}
                      data-pr-position="top"
                      size="small"
                    />
                  )}

                  <Button
                    icon="pi pi-question-circle"
                    className={`${showQualificationDetails[module.id] ? 'p-button-help' : 'p-button-secondary'}`}
                    outlined={!showQualificationDetails[module.id]}
                    onClick={() => handleToggleDetails(module.id)}
                    data-pr-tooltip={showQualificationDetails[module.id] ? 'Ocultar detalles de calificación' : 'Mostrar detalles de calificación'}
                    data-pr-position="top"
                    size="small"
                  />

                  <div className="p-fluid">
                    <InputText
                      placeholder="Buscar..."
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
                  value={filteredTableData}
                  headerColumnGroup={headerGroup}
                  size="small"
                  stripedRows
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25]}
                  globalFilter={search}
                  globalFilterFields={['fullName']}
                  emptyMessage={!search ? <p className="text-center my-5">Aún no hay estudiantes</p> : <p className="text-center my-5">No se encontraron resultados</p>}
                  tableStyle={{
                    borderBottom: '1px solid #ededed',
                    borderLeft: '1px solid #ededed',
                    borderRight: '1px solid #ededed',
                  }}
                  rowClassName={(row) => (row.isActive ? '' : 'bg-light')}
                >
                  <Column field="fullName" header="Nombre del estudiante" body={studentNameTemplate} bodyClassName="text-nowrap" style={gridLinesX} />

                  {module.subjects.map((subj) => (
                    <Column
                      key={`subject-enhanced-${subj.id}`}
                      field={String(subj.id)}
                      header={<span className="fw-bold">{subj.id}</span>}
                      style={{
                        ...gridLinesX,
                        width: '8rem',
                        textAlign: 'center',
                        minHeight: showQualificationDetails[module.id] ? '80px' : 'auto',
                      }}
                      body={(row) => {
                        const grade = row[subj.id];
                        const details = qualificationDetails[row.studentId]?.[subj.id];

                        if (grade != null) {
                          const tooltipContent = details ? `Calificado por: ${details.teacherName}\nFecha: ${details.dateFormatted}` : 'Sin información del docente';

                          return (
                            <span
                              style={{
                                display: 'block',
                                textAlign: 'center',
                                cursor: showQualificationDetails[module.id] ? 'help' : 'default',
                                opacity: row.isActive ? 1 : 0.7,
                              }}
                              data-pr-tooltip={showQualificationDetails[module.id] ? tooltipContent : undefined}
                              data-pr-position={showQualificationDetails[module.id] ? 'top' : undefined}
                            >
                              {grade}
                            </span>
                          );
                        }

                        return (
                          <span
                            style={{
                              display: 'block',
                              textAlign: 'center',
                              color: '#6c757d',
                              fontStyle: 'italic',
                              opacity: row.isActive ? 1 : 0.5,
                            }}
                          >
                            SC
                          </span>
                        );
                      }}
                    />
                  ))}

                  <Column
                    header="Promedio"
                    className="fw-semibold"
                    style={gridLinesX}
                    body={(row) => {
                      const grades = module.subjects.map((s) => row[s.id]).filter((v) => v != null && v >= 6 && v <= 10);
                      const average = grades.length ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : '—';

                      return <span style={{ opacity: row.isActive ? 1 : 0.7 }}>{average}</span>;
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

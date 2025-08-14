import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { MdOutlineGroup } from 'react-icons/md';
import { motion } from 'framer-motion';

import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { getQualificationsByGroupWithDetails, saveQualification } from '../../../api/academics/qualificationService';
import { getUserById } from '../../../api/userService';

export default function GroupModulesTable({ group }) {
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();

  const [searchTerms, setSearchTerms] = useState({});
  const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
  const [isEditingModule, setIsEditingModule] = useState({});
  const [invalidCells, setInvalidCells] = useState({});
  const [editedGrades, setEditedGrades] = useState({});
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

      // Crear las filas de la tabla
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

  const hasInvalidValues = useCallback(
    (moduleId) => {
      const moduleInvalidCells = invalidCells[moduleId] || {};
      return Object.values(moduleInvalidCells).some((studentCells) => Object.values(studentCells).some((isInvalid) => isInvalid));
    },
    [invalidCells]
  );

  const hasValidGradesToSave = useCallback(
    (moduleId) => {
      const edits = editedGrades[moduleId] || {};
      return Object.values(edits).some((studentGrades) => Object.values(studentGrades).some((grade) => grade !== null && grade !== undefined && Number.isInteger(grade) && grade >= 6 && grade <= 10));
    },
    [editedGrades]
  );

  const areAllGradesComplete = useCallback(
    (moduleId) => {
      if (!tableData.length || !curriculum) return true;

      const module = curriculum.modules.find((m) => m.id === moduleId);
      if (!module || !module.subjects.length) return true;

      const activeStudents = tableData.filter((student) => student.isActive);
      if (activeStudents.length === 0) return true;

      return activeStudents.every((student) => {
        return module.subjects.every((subject) => {
          const gradeFromDB = student[subject.id];
          return gradeFromDB !== null && gradeFromDB !== undefined;
        });
      });
    },
    [tableData, curriculum]
  );

  const getCurrentValue = useCallback(
    (moduleId, studentId, subjectId, originalValue) => {
      const editedValue = editedGrades[moduleId]?.[studentId]?.[subjectId];
      return editedValue !== undefined ? editedValue : originalValue;
    },
    [editedGrades]
  );

  const buildNumberEditor = useCallback(
    (moduleId, subjId) => (options) => {
      const studentId = options.rowData.studentId;
      const currentValue = getCurrentValue(moduleId, studentId, subjId, options.value);

      if (!options.rowData.isActive) {
        return <span style={{ display: 'block', textAlign: 'center', opacity: 0.7 }}>{currentValue || '—'}</span>;
      }

      const handleChange = (e) => {
        const val = e.value;

        setEditedGrades((prev) => {
          const newState = {
            ...prev,
            [moduleId]: {
              ...prev[moduleId],
              [studentId]: {
                ...prev[moduleId]?.[studentId],
                [subjId]: val,
              },
            },
          };
          return newState;
        });

        const isValid = val === null || (Number.isInteger(val) && val >= 6 && val <= 10);
        setInvalidCells((prev) => ({
          ...prev,
          [moduleId]: {
            ...prev[moduleId],
            [studentId]: {
              ...prev[moduleId]?.[studentId],
              [subjId]: !isValid,
            },
          },
        }));

        setTimeout(() => {
          options.editorCallback(val);
          setForceUpdate((prev) => prev + 1);
        }, 0);
      };

      const isInvalid = invalidCells[moduleId]?.[studentId]?.[subjId] || false;

      return <InputNumber value={currentValue} onValueChange={handleChange} showButtons={false} min={1} max={10} inputStyle={{ width: '100%', textAlign: 'center' }} className={`p-inputtext-sm ${isInvalid ? 'p-invalid' : ''}`} autoFocus />;
    },
    [getCurrentValue, invalidCells]
  );

  const createHandleSave = useCallback(
    (moduleId) => async () => {
      const hasInvalidGrades = hasInvalidValues(moduleId);

      if (hasInvalidGrades) {
        showWarn('Advertencia', 'Hay calificaciones inválidas. Por favor corrige los valores antes de guardar.');
        return;
      }

      if (!hasValidGradesToSave(moduleId)) {
        showWarn('Advertencia', 'No hay calificaciones nuevas para guardar.');
        return;
      }

      confirmAction({
        message: 'Esta calificación no se puede modificar una vez guardada.',
        header: 'Registrar calificación',
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: 'Sí, registrar',
        rejectLabel: 'Cancelar',
        acceptClassName: 'p-button-danger',
        onAccept: async () => {
          try {
            const edits = editedGrades[moduleId] || {};
            const gradesToSave = [];

            Object.entries(edits).forEach(([studentId, subjMap]) => {
              const student = tableData.find((s) => s.studentId === Number(studentId));
              if (!student || !student.isActive) {
                console.warn(`Intento de guardar calificación para estudiante inactivo: ${studentId}`);
                return;
              }

              Object.entries(subjMap).forEach(([subjectId, grade]) => {
                if (grade !== null && grade !== undefined && Number.isInteger(grade) && grade >= 6 && grade <= 10) {
                  gradesToSave.push({
                    studentId: Number(studentId),
                    subjectId: Number(subjectId),
                    grade,
                  });
                }
              });
            });

            if (gradesToSave.length === 0) {
              showWarn('Advertencia', 'No hay calificaciones válidas para guardar.');
              return;
            }

            await Promise.all(gradesToSave.map(({ studentId, subjectId, grade }) => saveQualification(studentId, group.groupId, subjectId, group.teacherId, grade)));

            showSuccess('Hecho', 'Calificaciones registradas exitosamente');

            setEditedGrades((prev) => ({
              ...prev,
              [moduleId]: {},
            }));
            setInvalidCells((prev) => ({
              ...prev,
              [moduleId]: {},
            }));
            setIsEditingModule((prev) => ({
              ...prev,
              [moduleId]: false,
            }));

            setTimeout(() => {
              loadData();
            }, 500);
          } catch (error) {
            showError('Error', error.message || 'Ocurrió un error al registrar las calificaciones');
          }
        },
      });
    },
    [hasInvalidValues, hasValidGradesToSave, editedGrades, group, showWarn, showSuccess, showError, confirmAction, loadData, tableData]
  );

  const createHandleCancelEdit = useCallback(
    (moduleId) => () => {
      setIsEditingModule((prev) => ({
        ...prev,
        [moduleId]: false,
      }));
      setEditedGrades((prev) => ({
        ...prev,
        [moduleId]: {},
      }));
      setInvalidCells((prev) => ({
        ...prev,
        [moduleId]: {},
      }));

      setTimeout(() => {
        setForceUpdate((prev) => prev + 1);
      }, 100);
    },
    []
  );

  const handleToggleDetails = useCallback((moduleId) => {
    setShowQualificationDetails((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  }, []);

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
  }, [sortedModules, forceUpdate]);

  const tableKeys = useMemo(() => {
    const keys = {};
    sortedModules.forEach((module) => {
      const isEditing = isEditingModule[module.id];
      const editedCount = Object.keys(editedGrades[module.id] || {}).length;
      const detailsShown = showQualificationDetails[module.id];
      const forceKey = isEditing ? forceUpdate : 0;
      keys[module.id] = `${module.id}-${isEditing ? 'edit' : 'view'}-${detailsShown ? 'details' : 'nodetails'}-${editedCount}-${forceKey}-${showHistoricalStudents}`;
    });
    return keys;
  }, [sortedModules, isEditingModule, editedGrades, showQualificationDetails, forceUpdate, showHistoricalStudents]);

  const studentNameTemplate = (row) => {
    return (
      <div className="d-flex align-items-center gap-2">
        <span className={row.isActive ? '' : 'text-muted'}>{row.fullName}</span>
        {!row.isActive && <Tag value="Inactivo" severity="danger" className="text-xs" style={{ fontSize: '0.65rem', padding: '0.25rem 0.5rem' }} />}
      </div>
    );
  };

  if (loading) {
    return <span>Cargando...</span>;
  }

  return (
    <>
      <Tooltip key={`tooltip-${forceUpdate}`} target="[data-pr-tooltip]" />

      {sortedModules.map((module) => {
        const isCollapsed = isModuleCollapsed[module.id];
        const isEditing = isEditingModule[module.id];
        const search = searchTerms[module.id] || '';

        const hasInvalidGrades = hasInvalidValues(module.id);
        const hasValidGrades = hasValidGradesToSave(module.id);
        const allGradesComplete = areAllGradesComplete(module.id);

        const handleSave = createHandleSave(module.id);
        const handleCancelEdit = createHandleCancelEdit(module.id);

        const headerGroup = headerGroups[module.id];
        const tableKey = tableKeys[module.id];

        const historicalCount = tableData.filter((row) => !row.isActive).length;

        return (
          <div className="card border-0 mt-3" key={`module-${module.id}`}>
            {/* Header módulo */}
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
                  {isEditing ? (
                    <>
                      <Button icon="pi pi-times" severity="secondary" outlined className="me-2" onClick={handleCancelEdit}>
                        <span className="ms-2 d-none d-lg-inline">Cancelar</span>
                      </Button>
                      <Button icon="pi pi-save" severity="success" className="me-2" onClick={handleSave} disabled={hasInvalidGrades || !hasValidGrades}>
                        <span className="ms-2 d-none d-lg-inline">Guardar</span>
                      </Button>
                    </>
                  ) : (
                    <>
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
                        className={`me-2 ${showQualificationDetails[module.id] ? 'p-button-help' : 'p-button-secondary'}`}
                        outlined={!showQualificationDetails[module.id]}
                        onClick={() => handleToggleDetails(module.id)}
                        data-pr-tooltip={showQualificationDetails[module.id] ? 'Ocultar detalles de calificación' : 'Mostrar detalles de calificación'}
                        data-pr-position="top"
                        size="small"
                      />
                      <Button
                        icon="pi pi-pencil"
                        className="me-2"
                        disabled={allGradesComplete}
                        title={allGradesComplete ? 'No se pueden asignar calificaciones a este módulo' : undefined}
                        onClick={() => {
                          setIsEditingModule((prev) => ({
                            ...prev,
                            [module.id]: true,
                          }));
                          setShowQualificationDetails((prev) => ({
                            ...prev,
                            [module.id]: false,
                          }));
                        }}
                      >
                        <span className="ms-2 d-none d-lg-inline">Registrar</span>
                      </Button>
                    </>
                  )}

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
                  value={filteredTableData}
                  editMode={isEditing ? 'cell' : undefined}
                  headerColumnGroup={headerGroup}
                  size="small"
                  stripedRows
                  paginator
                  rows={10}
                  rowsPerPageOptions={[5, 10, 25]}
                  globalFilter={search}
                  globalFilterFields={['fullName']}
                  emptyMessage={!searchTerms ? <p className="text-center my-5">Aún no hay estudiantes</p> : <p className="text-center my-5">No se encontraron resultados</p>}
                  tableStyle={{
                    borderBottom: '1px solid #ededed',
                    borderLeft: '1px solid #ededed',
                    borderRight: '1px solid #ededed',
                  }}
                  rowClassName={(row) => (row.isActive ? '' : 'bg-light')}
                >
                  {/* Nombre */}
                  <Column field="fullName" header="Nombre del estudiante" body={studentNameTemplate} bodyClassName="text-nowrap" style={gridLinesX} />

                  {/* Materias */}
                  {module.subjects.map((subj) => (
                    <Column
                      key={`subject-${subj.id}`}
                      field={String(subj.id)}
                      header={<span className="fw-bold">{subj.id}</span>}
                      style={{
                        ...gridLinesX,
                        width: '8rem',
                        textAlign: 'center',
                        minHeight: showQualificationDetails[module.id] ? '80px' : 'auto',
                      }}
                      body={(row) => {
                        const originalValue = row[subj.id];
                        const currentValue = getCurrentValue(module.id, row.studentId, subj.id, originalValue);
                        const isInvalid = invalidCells[module.id]?.[row.studentId]?.[subj.id] || false;
                        const details = qualificationDetails[row.studentId]?.[subj.id];

                        if (originalValue != null) {
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
                              {originalValue}
                            </span>
                          );
                        }

                        if (isEditing && row.isActive) {
                          if (currentValue !== null && currentValue !== undefined) {
                            const isValidGrade = Number.isInteger(currentValue) && currentValue >= 6 && currentValue <= 10;

                            return (
                              <span
                                title={isInvalid ? 'Se necesita un valor entre 6 y 10' : ''}
                                style={{
                                  display: 'block',
                                  textAlign: 'center',
                                  color: isInvalid ? '#dc3545' : 'inherit',
                                  fontWeight: isInvalid ? 'bold' : 'normal',
                                  opacity: isValidGrade ? 0.7 : 1,
                                }}
                              >
                                {currentValue}
                              </span>
                            );
                          }

                          return <span style={{ display: 'block', textAlign: 'center', color: '#6c757d' }}>SC</span>;
                        }

                        if (isEditing && !row.isActive) {
                          return (
                            <span
                              style={{
                                display: 'block',
                                textAlign: 'center',
                                color: '#6c757d',
                                fontStyle: 'italic',
                                opacity: 0.5,
                              }}
                            >
                              {originalValue || 'SC'}
                            </span>
                          );
                        }

                        return '';
                      }}
                      editor={(options) => {
                        const { rowData, field } = options;
                        const originalValue = rowData[field];

                        if (!isEditing) {
                          return <span>{originalValue ?? ''}</span>;
                        }

                        if (!rowData.isActive) {
                          setTimeout(() => options.editorCallback(originalValue));
                          return <span style={{ display: 'block', textAlign: 'center', opacity: 0.5 }}>{originalValue || 'SC'}</span>;
                        }

                        if (originalValue != null) {
                          setTimeout(() => options.editorCallback(originalValue));
                          return <span style={{ display: 'block', textAlign: 'center' }}>{originalValue}</span>;
                        }
                        return buildNumberEditor(module.id, subj.id)(options);
                      }}
                    />
                  ))}

                  {/* Promedio mejorado */}
                  <Column
                    header="Promedio"
                    className="fw-semibold"
                    style={gridLinesX}
                    body={(row) => {
                      const grades = module.subjects
                        .map((s) => {
                          const originalValue = row[s.id];
                          const currentValue = getCurrentValue(module.id, row.studentId, s.id, originalValue);
                          return currentValue;
                        })
                        .filter((v) => v != null && v >= 6 && v <= 10);

                      if (grades.length === 0) return <span style={{ opacity: row.isActive ? 1 : 0.7 }}>—</span>;

                      const average = grades.reduce((a, b) => a + b, 0) / grades.length;
                      return <span style={{ opacity: row.isActive ? 1 : 0.7 }}>{average.toFixed(1)}</span>;
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

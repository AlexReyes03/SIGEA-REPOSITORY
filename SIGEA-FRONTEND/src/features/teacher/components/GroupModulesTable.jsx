import React, { useState, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { MdOutlineGroup } from 'react-icons/md';

import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { getQualificationsByGroupWithDetails, saveQualification } from '../../../api/academics/qualificationService';

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

  const loadData = useCallback(async () => {
    try {
      const curriculumData = await getCurriculumById(group.curriculumId);
      setCurriculum(curriculumData);

      const studentsData = await getGroupStudents(group.groupId);
      const qualificationsData = await getQualificationsByGroupWithDetails(group.groupId);

      const gradeMap = {};
      const detailsMap = {};

      qualificationsData.forEach((q) => {
        if (!gradeMap[q.studentId]) gradeMap[q.studentId] = {};
        if (!detailsMap[q.studentId]) detailsMap[q.studentId] = {};

        gradeMap[q.studentId][q.subjectId] = q.grade;
        detailsMap[q.studentId][q.subjectId] = {
          teacherName: q.teacherName,
          dateFormatted: q.dateFormatted,
        };
      });

      setQualificationDetails(detailsMap);

      const rows = studentsData.map((s) => {
        const row = {
          studentId: s.studentId,
          fullName: s.fullName,
        };
        curriculumData.modules.forEach((mod) =>
          mod.subjects.forEach((subj) => {
            row[subj.id] = gradeMap[s.studentId]?.[subj.id] ?? null;
          })
        );
        return row;
      });

      setTableData(rows);
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

  const hasInvalidValues = (moduleId) => {
    const moduleInvalidCells = invalidCells[moduleId] || {};
    return Object.values(moduleInvalidCells).some((studentCells) => Object.values(studentCells).some((isInvalid) => isInvalid));
  };

  const getCurrentValue = (moduleId, studentId, subjectId, originalValue) => {
    const editedValue = editedGrades[moduleId]?.[studentId]?.[subjectId];
    return editedValue !== undefined ? editedValue : originalValue;
  };

  const buildNumberEditor = (moduleId, subjId) => (options) => {
    const studentId = options.rowData.studentId;
    const currentValue = getCurrentValue(moduleId, studentId, subjId, options.value);

    const handleChange = (e) => {
      const val = e.value;

      setEditedGrades((prev) => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [studentId]: {
            ...prev[moduleId]?.[studentId],
            [subjId]: val,
          },
        },
      }));

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

      options.editorCallback(val);
    };

    const isInvalid = invalidCells[moduleId]?.[studentId]?.[subjId] || false;

    return <InputNumber value={currentValue} onValueChange={handleChange} showButtons={false} min={1} max={10} inputStyle={{ width: '100%', textAlign: 'center' }} className={`p-inputtext-sm ${isInvalid ? 'p-invalid' : ''}`} autoFocus />;
  };

  const gridLinesX = {
    borderLeft: '1px solid #ededed',
    borderRight: '1px solid #ededed',
  };

  if (loading) {
    return <span>Cargando...</span>;
  }

  return (
    <>
      <Tooltip target="[data-pr-tooltip]" />

      {[...curriculum.modules]
        .sort((a, b) => b.id - a.id)
        .map((module) => {
          const isCollapsed = isModuleCollapsed[module.id];
          const isEditing = isEditingModule[module.id];
          const search = searchTerms[module.id] || '';
          const hasInvalidGrades = hasInvalidValues(module.id);

          const handleSave = async () => {
            if (hasInvalidGrades) {
              showWarn('Advertencia', 'Hay calificaciones inválidas. Por favor corrige los valores antes de guardar.');
              return;
            }

            const edits = editedGrades[module.id] || {};
            const hasGradesToSave = Object.keys(edits).length > 0 && Object.values(edits).some((studentGrades) => Object.keys(studentGrades).length > 0);

            if (!hasGradesToSave) {
              showWarn('Advertencia', 'No hay calificaciones nuevas para guardar.');
              return;
            }

            confirmAction({
              message: '¿Estás seguro? Esta calificación no se puede cambiar una vez guardada.',
              header: 'Registrar calificación',
              icon: 'pi pi-exclamation-triangle',
              acceptLabel: 'Sí, registrar',
              rejectLabel: 'Cancelar',
              acceptClassName: 'p-button-danger',
              onAccept: async () => {
                try {
                  // Validación del lado del cliente antes de enviar
                  const gradesToSave = [];
                  Object.entries(edits).forEach(([studentId, subjMap]) => {
                    Object.entries(subjMap).forEach(([subjectId, grade]) => {
                      if (grade !== null && grade !== undefined) {
                        if (!Number.isInteger(grade) || grade < 6 || grade > 10) {
                          throw new Error(`Calificación inválida: ${grade}`);
                        }
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
                    [module.id]: {},
                  }));
                  setInvalidCells((prev) => ({
                    ...prev,
                    [module.id]: {},
                  }));
                  setIsEditingModule((prev) => ({
                    ...prev,
                    [module.id]: false,
                  }));
                  loadData();
                } catch (error) {
                  showError('Error', error.message || 'Ocurrió un error al registrar las calificaciones');
                }
              },
            });
          };

          const handleCancelEdit = () => {
            setIsEditingModule((prev) => ({
              ...prev,
              [module.id]: false,
            }));
            setEditedGrades((prev) => ({
              ...prev,
              [module.id]: {},
            }));
            setInvalidCells((prev) => ({
              ...prev,
              [module.id]: {},
            }));
          };

          const headerGroup = (
            <ColumnGroup>
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

          return (
            <div className="card border-0 mt-3" key={module.id}>
              {/* Header módulo */}
              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center my-md-3 mt-3 mx-3">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineGroup size={40} className="p-1" />
                  </div>
                  <h6 className="text-blue-500 fs-5 fw-semibold ms-3 mb-0">{module.name}</h6>
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
                      icon="pi pi-question-circle"
                      className={`me-2 ${showQualificationDetails[module.id] ? 'p-button-help' : 'p-button-secondary'}`}
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

                    {isEditing ? (
                      <>
                        <Button icon="pi pi-times" severity="secondary" outlined className="me-2" onClick={handleCancelEdit}>
                          <span className="ms-2 d-none d-lg-inline">Cancelar</span>
                        </Button>
                        <Button icon="pi pi-save" severity="success" className="me-2" onClick={handleSave} disabled={hasInvalidGrades} title={hasInvalidGrades ? 'Corrige las calificaciones inválidas antes de guardar' : ''}>
                          <span className="ms-2 d-none d-lg-inline">Guardar</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        icon="pi pi-pencil"
                        className="me-2"
                        onClick={() =>
                          setIsEditingModule((prev) => ({
                            ...prev,
                            [module.id]: true,
                          }))
                        }
                        data-pr-tooltip="Asignar calificaciones"
                        data-pr-position="top"
                      >
                        <span className="ms-2 d-none d-lg-inline">Asignar</span>
                      </Button>
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

              {!isCollapsed && (
                <div className="m-3 mt-0">
                  <DataTable
                    key={`${module.id}-${isEditing ? 'edit' : 'view'}-${showQualificationDetails[module.id] ? 'details' : 'nodetails'}`}
                    value={tableData}
                    editMode={isEditing ? 'cell' : undefined}
                    headerColumnGroup={headerGroup}
                    size="small"
                    stripedRows
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    globalFilter={search}
                    globalFilterFields={['fullName']}
                    emptyMessage={!searchTerms[module.id] ? <p className="text-center my-5">Aún no hay registros</p> : <p className="text-center my-5">No se encontraron resultados</p>}
                    tableStyle={{
                      borderBottom: '1px solid #ededed',
                      borderLeft: '1px solid #ededed',
                      borderRight: '1px solid #ededed',
                    }}
                  >
                    {/* Nombre */}
                    <Column field="fullName" header="Nombre del estudiante" bodyClassName="text-nowrap" style={gridLinesX} />

                    {/* Materias */}
                    {module.subjects.map((subj) => (
                      <Column
                        key={subj.id}
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

                          // Si hay un valor desde la BD
                          if (originalValue != null) {
                            const tooltipContent = details ? `Calificado por: ${details.teacherName}\nFecha: ${details.dateFormatted}` : 'Sin información del docente';

                            return (
                              <span
                                style={{
                                  display: 'block',
                                  textAlign: 'center',
                                  cursor: showQualificationDetails[module.id] ? 'help' : 'default',
                                }}
                                /* sólo incluimos el tooltip cuando está activado */
                                data-pr-tooltip={showQualificationDetails[module.id] ? tooltipContent : undefined}
                                data-pr-position={showQualificationDetails[module.id] ? 'top' : undefined}
                              >
                                {originalValue}
                              </span>
                            );
                          }

                          if (isEditing && currentValue !== null && currentValue !== undefined) {
                            return (
                              <span
                                style={{
                                  display: 'block',
                                  textAlign: 'center',
                                  color: isInvalid ? '#dc3545' : 'inherit',
                                  fontWeight: isInvalid ? 'bold' : 'normal',
                                }}
                              >
                                {currentValue}
                              </span>
                            );
                          }

                          return isEditing ? 'SC' : '';
                        }}
                        editor={(options) => {
                          const { rowData, field } = options;
                          const originalValue = rowData[field];

                          if (!isEditing) {
                            return <span>{originalValue ?? ''}</span>;
                          }

                          // Si hay un valor original de la BD, no permitir edición
                          if (originalValue != null) {
                            setTimeout(() => options.editorCallback(originalValue));
                            return <span style={{ display: 'block', textAlign: 'center' }}>{originalValue}</span>;
                          }
                          return buildNumberEditor(module.id, subj.id)(options);
                        }}
                      />
                    ))}

                    {/* Promedio */}
                    <Column
                      header="Promedio"
                      style={gridLinesX}
                      body={(row) => {
                        const notas = module.subjects
                          .map((s) => {
                            const originalValue = row[s.id];
                            const currentValue = getCurrentValue(module.id, row.studentId, s.id, originalValue);
                            return currentValue;
                          })
                          .filter((v) => v != null && v >= 6 && v <= 10);

                        return notas.length ? (notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : '—';
                      }}
                    />
                  </DataTable>
                </div>
              )}
            </div>
          );
        })}
    </>
  );
}

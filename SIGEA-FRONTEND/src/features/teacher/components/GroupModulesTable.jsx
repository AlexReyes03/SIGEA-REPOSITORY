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
import { getQualificationsByGroup, saveQualification } from '../../../api/academics/qualificationService';

export default function GroupModulesTable({ group }) {
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();

  const [searchTerms, setSearchTerms] = useState({});
  const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
  const [isEditingModule, setIsEditingModule] = useState({});
  const [invalidCells, setInvalidCells] = useState({});
  const [editedGrades, setEditedGrades] = useState({});
  const [tempGrades, setTempGrades] = useState({}); // Estado para mantener valores temporales
  const [curriculum, setCurriculum] = useState(null);
  const [tableData, setTableData] = useState([]);

  const loadData = useCallback(async () => {
    try {
      const curriculumData = await getCurriculumById(group.curriculumId);
      setCurriculum(curriculumData);

      const studentsData = await getGroupStudents(group.groupId);
      const qualificationsData = await getQualificationsByGroup(group.groupId);

      const gradeMap = {};
      qualificationsData.forEach((q) => {
        if (!gradeMap[q.studentId]) gradeMap[q.studentId] = {};
        gradeMap[q.studentId][q.subjectId] = q.grade;
      });

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

  // Función para obtener el valor mostrado (persistente o temporal)
  const getDisplayValue = (studentId, subjectId, moduleId) => {
    // Primero buscar en valores temporales
    const tempValue = tempGrades[moduleId]?.[studentId]?.[subjectId];
    if (tempValue !== undefined) {
      return tempValue;
    }

    // Luego en valores editados
    const editedValue = editedGrades[moduleId]?.[studentId]?.[subjectId];
    if (editedValue !== undefined) {
      return editedValue;
    }

    // Finalmente en los datos originales
    const originalRow = tableData.find((row) => row.studentId === studentId);
    return originalRow?.[subjectId] ?? null;
  };

  // Función para validar si una celda es válida
  const isCellValid = (moduleId, studentId, subjectId) => {
    const value = getDisplayValue(studentId, subjectId, moduleId);
    if (value === null || value === undefined) return true;
    return Number.isInteger(value) && value >= 6 && value <= 10;
  };

  // Función para verificar si hay celdas inválidas en un módulo
  const hasInvalidCells = (moduleId) => {
    const module = curriculum?.modules.find((m) => m.id === moduleId);
    if (!module) return false;

    for (const row of tableData) {
      for (const subject of module.subjects) {
        const value = getDisplayValue(row.studentId, subject.id, moduleId);
        if (value !== null && value !== undefined) {
          if (!Number.isInteger(value) || value < 6 || value > 10) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const buildNumberEditor = (moduleId, subjId) => (options) => {
    const studentId = options.rowData.studentId;
    const currentValue = getDisplayValue(studentId, subjId, moduleId);
    const cellKey = `${moduleId}-${studentId}-${subjId}`;
    const isInvalid = !isCellValid(moduleId, studentId, subjId);

    const handleChange = (e) => {
      const val = e.value;

      // Actualizar valores temporales
      setTempGrades((prev) => ({
        ...prev,
        [moduleId]: {
          ...prev[moduleId],
          [studentId]: {
            ...prev[moduleId]?.[studentId],
            [subjId]: val,
          },
        },
      }));

      // Validar y actualizar estado de celdas inválidas
      const isValid = val === null || val === undefined || (Number.isInteger(val) && val >= 6 && val <= 10);

      setInvalidCells((prev) => ({
        ...prev,
        [cellKey]: !isValid,
      }));

      // Si es válido, agregar a editedGrades
      if (isValid && val !== null && val !== undefined) {
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
      } else {
        // Si no es válido, remover de editedGrades
        setEditedGrades((prev) => {
          const newState = { ...prev };
          if (newState[moduleId]?.[studentId]) {
            delete newState[moduleId][studentId][subjId];
            if (Object.keys(newState[moduleId][studentId]).length === 0) {
              delete newState[moduleId][studentId];
            }
            if (Object.keys(newState[moduleId]).length === 0) {
              delete newState[moduleId];
            }
          }
          return newState;
        });
      }

      // Llamar al callback del editor
      options.editorCallback(val);
    };

    return (
      <InputNumber
        value={currentValue}
        onValueChange={handleChange}
        showButtons={false}
        min={6}
        max={10}
        invalid={isInvalid}
        inputStyle={{
          width: '100%',
          textAlign: 'center',
          ...(isInvalid && { borderColor: '#e24c4c' }),
        }}
        className="p-inputtext-sm"
        autoFocus
        placeholder="6-10"
      />
    );
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
          const hasInvalidData = hasInvalidCells(module.id);
          const hasEditedData = Object.keys(editedGrades[module.id] || {}).length > 0;

          const handleSave = () => {
            if (hasInvalidData) {
              showError('Error', 'Por favor, corrige las calificaciones inválidas antes de guardar. Las calificaciones deben estar entre 6 y 10.');
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
                const edits = editedGrades[module.id] || {};
                try {
                  await Promise.all(Object.entries(edits).flatMap(([studentId, subjMap]) => Object.entries(subjMap).map(([subjectId, grade]) => saveQualification(Number(studentId), group.groupId, Number(subjectId), group.teacherId, grade))));
                  showSuccess('Hecho', 'Calificaciones registradas exitosamente');

                  // Limpiar estados
                  setEditedGrades((prev) => ({
                    ...prev,
                    [module.id]: {},
                  }));
                  setTempGrades((prev) => ({
                    ...prev,
                    [module.id]: {},
                  }));
                  setInvalidCells({});
                  setIsEditingModule((prev) => ({
                    ...prev,
                    [module.id]: false,
                  }));

                  loadData();
                } catch {
                  showError('Error', 'Ocurrió un error al registrar las calificaciones');
                }
              },
            });
          };

          const handleCancel = () => {
            // Limpiar todos los estados relacionados con este módulo
            setEditedGrades((prev) => ({
              ...prev,
              [module.id]: {},
            }));
            setTempGrades((prev) => ({
              ...prev,
              [module.id]: {},
            }));
            setInvalidCells((prev) => {
              const newState = { ...prev };
              Object.keys(newState).forEach((key) => {
                if (key.startsWith(`${module.id}-`)) {
                  delete newState[key];
                }
              });
              return newState;
            });
            setIsEditingModule((prev) => ({
              ...prev,
              [module.id]: false,
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
                    {isEditing ? (
                      <>
                        <Button icon="pi pi-times" severity="secondary" outlined className="me-2" onClick={handleCancel}>
                          <span className="ms-2 d-none d-lg-inline">Cancelar</span>
                        </Button>
                        <Button
                          icon="pi pi-save"
                          severity={hasInvalidData ? 'danger' : 'success'}
                          className="me-2"
                          onClick={handleSave}
                          disabled={hasInvalidData || !hasEditedData}
                          title={hasInvalidData ? 'Corrige las calificaciones inválidas' : !hasEditedData ? 'No hay cambios para guardar' : 'Guardar calificaciones'}
                        >
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
                    key={`${module.id}-${isEditing ? 'edit' : 'view'}`}
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
                        style={{ ...gridLinesX, width: '8rem', textAlign: 'center' }}
                        body={(row) => {
                          const val = getDisplayValue(row.studentId, subj.id, module.id);
                          const cellKey = `${module.id}-${row.studentId}-${subj.id}`;
                          const isInvalid = invalidCells[cellKey];

                          if (val !== null && val !== undefined) {
                            return (
                              <span
                                style={{
                                  display: 'block',
                                  textAlign: 'center',
                                  color: isInvalid ? '#e24c4c' : 'inherit',
                                  fontWeight: isInvalid ? 'bold' : 'normal',
                                }}
                              >
                                {val}
                                {isInvalid && <small style={{ display: 'block', fontSize: '0.7em' }}>Inválido</small>}
                              </span>
                            );
                          }
                          return isEditing ? 'SC' : '—';
                        }}
                        editor={(options) => {
                          const { rowData, field } = options;
                          const currentVal = getDisplayValue(rowData.studentId, parseInt(field), module.id);

                          if (!isEditing) {
                            return <span>{currentVal ?? '—'}</span>;
                          }

                          // Si ya tiene una calificación guardada, no permitir edición
                          const originalRow = tableData.find((row) => row.studentId === rowData.studentId);
                          const originalValue = originalRow?.[field];

                          if (originalValue !== null && originalValue !== undefined) {
                            return <span style={{ display: 'block', textAlign: 'center' }}>{originalValue}</span>;
                          }

                          return buildNumberEditor(module.id, parseInt(field))(options);
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
                            const val = getDisplayValue(row.studentId, s.id, module.id);
                            return val;
                          })
                          .filter((v) => v !== null && v !== undefined);

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

import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { MdOutlineGroup } from 'react-icons/md';

import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { getQualificationsByGroup } from '../../../api/academics/qualificationService';

export default function ColumnGroupDemo({ group }) {
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({});
  const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
  const [curriculum, setCurriculum] = useState(null);
  const [students, setStudents] = useState([]);
  const [gradesMap, setGradesMap] = useState({});

  useEffect(() => {
    if (group && group.curriculumId) {
      setLoading(true);
      (async () => {
        try {
          const curriculumData = await getCurriculumById(group.curriculumId);
          console.log('Plan', curriculumData);

          setCurriculum(curriculumData);
          const studentsData = await getGroupStudents(group.groupId);
          setStudents(studentsData);

          const qualificationsData = await getQualificationsByGroup(group.groupId);
          const m = {};
          qualificationsData.forEach((q) => {
            if (!m[q.studentId]) m[q.studentId] = {};
            m[q.studentId][q.subjectId] = q.grade;
          });
          setGradesMap(m);
        } catch (err) {
          console.error('Error', 'Error al cargar los datos');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [group]);

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
          const search = searchTerms[module.id] || '';

          const headerGroup = (
            <ColumnGroup>
              <Row>
                <Column header="Nombre del estudiante" rowSpan={2} style={{ border: '1px solid #ededed' }} />
                <Column header="Materias" colSpan={module.subjects.length} style={{ border: '1px solid #ededed' }} />
                <Column header="Promedio" rowSpan={2} style={{ border: '1px solid #ededed' }} />
              </Row>
              <Row>
                {module.subjects.map((subj, index) => (
                  <Column key={subj.id} header={<span className="fw-bold">{index + 1}</span>} headerTooltip={subj.name} headerTooltipOptions={{ position: 'top' }} className="text-center" style={{ border: '1px solid #ededed' }} />
                ))}
              </Row>
            </ColumnGroup>
          );

          return (
            <div className="card border-0 mt-3" key={module.id}>
              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center my-3 mx-3">
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
                <div className="d-flex align-items-center justify-content-end mx-3">
                  <Button icon="pi pi-save" className="me-2">
                    <span className="ms-2 fw-semibold d-none d-lg-inline">Guardar</span>
                  </Button>
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

              <div className="m-3 mt-0">
                {!isCollapsed && (
                  <DataTable
                    value={students}
                    headerColumnGroup={headerGroup}
                    size="small"
                    stripedRows
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25]}
                    globalFilter={search}
                    emptyMessage={<p className="text-center my-5">Aún no hay registros</p>}
                    tableStyle={{
                      minWidth: '50rem',
                      borderBottom: '1px solid #ededed',
                      borderLeft: '1px solid #ededed',
                      borderRight: '1px solid #ededed',
                    }}
                  >
                    {/* Columna de nombre */}
                    <Column field="fullName" body={(row) => row.fullName} style={gridLinesX} />

                    {/* Una columna por cada materia */}
                    {module.subjects.map((subj) => (
                      <Column
                        key={subj.id}
                        header={<span className="fw-bold">-</span>}
                        body={(row) => {
                          const studentGrades = gradesMap[row.studentId] || {};
                          const grade = studentGrades[subj.id];
                          return grade != null ? grade : '—';
                        }}
                        style={gridLinesX}
                      />
                    ))}

                    {/* Columna de promedio */}
                    <Column
                      header="Promedio"
                      body={(row) => {
                        const studentGrades = gradesMap[row.studentId] || {};
                        const notas = module.subjects.map((s) => studentGrades[s.id]).filter((g) => g != null);
                        if (!notas.length) return '—';
                        const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
                        return avg.toFixed(1);
                      }}
                      style={gridLinesX}
                    />
                  </DataTable>
                )}
              </div>
            </div>
          );
        })}
    </>
  );
}

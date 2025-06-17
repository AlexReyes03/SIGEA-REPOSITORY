import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { MdAdd, MdOutlineGroup, MdRemove } from 'react-icons/md';

import { getCurriculumById } from '../../../api/academics/curriculumService';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';

export default function ColumnGroupDemo({ group }) {
  const [loading, setLoading] = useState(true);
  const [searchTerms, setSearchTerms] = useState({});
  const [isModuleCollapsed, setIsModuleCollapsed] = useState({});
  const [curriculum, setCurriculum] = useState(null);

  // Solo datos de ejemplo: nombres de estudiantes
  const [qualifications] = useState([
    { id: 1, name: 'Juan Pérez Pérez' },
    { id: 2, name: 'Ana Martínez' },
    { id: 3, name: 'Luis Sánchez' },
    { id: 4, name: 'María López' },
    { id: 5, name: 'Carlos Díaz' },
    { id: 6, name: 'Elena Torres' },
    { id: 7, name: 'Juan Pérez Pérez' },
    { id: 8, name: 'Ana Martínez' },
    { id: 9, name: 'Luis Sánchez' },
    { id: 10, name: 'María López' },
  ]);

  useEffect(() => {
    if (group && group.curriculumId) {
      setLoading(true);
      (async () => {
        try {
          const data = await getCurriculumById(group.curriculumId);
          setCurriculum(data);
        } catch (err) {
          console.error('Error', 'Error al cargar el plan de estudios');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [group]);

  const gridLinesX = {
    borderLeft: '2px solid #ededed',
    borderRight: '2px solid #ededed',
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
                <Column header="Nombre del estudiante" rowSpan={2} style={{ border: '2px solid #ededed', maxWidth: '1rem' }} />
                <Column header="Materias" colSpan={module.subjects.length} style={{ border: '2px solid #ededed' }} />
                <Column header="Promedio" rowSpan={2} style={{ border: '2px solid #ededed' }} />
              </Row>
              <Row>
                {module.subjects.map((subj, index) => (
                  <Column key={subj.id} header={<span className="fw-bold">{index + 1}</span>} headerTooltip={subj.name} headerTooltipOptions={{ position: 'top' }} className="text-center" style={{ border: '2px solid #ededed' }} />
                ))}
              </Row>
            </ColumnGroup>
          );

          return (
            <div className="card border-0 mt-3" key={module.id}>
              <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center mt-3 ms-3">
                  <div className="title-icon p-1 rounded-circle">
                    <MdOutlineGroup size={40} className="p-1" />
                  </div>
                  <h6 className="text-blue-500 fs-5 fw-semibold ms-3 mb-0">{module.name}</h6>
                  <Button
                    icon={isCollapsed ? 'pi pi-plus' : 'pi pi-minus'}
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
                <div className="d-flex align-items-center justify-content-end mx-3 mt-3">
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

              <div className="m-3">
                {!isCollapsed && (
                  <DataTable
                    value={qualifications}
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
                      borderBottom: '2px solid #ededed',
                      borderLeft: '2px solid #ededed',
                      borderRight: '2px solid #ededed',
                    }}
                  >
                    {/* Columna de nombre */}
                    <Column field="name" style={gridLinesX} />

                    {/* Una columna por cada materia */}
                    {module.subjects.map((subj) => (
                      <Column key={subj.id} header={<span className="fw-bold">-</span>} body={() => null} style={gridLinesX} />
                    ))}

                    {/* Columna de promedio */}
                    <Column header="Promedio" body={() => null} style={gridLinesX} />
                  </DataTable>
                )}
              </div>
            </div>
          );
        })}
    </>
  );
}

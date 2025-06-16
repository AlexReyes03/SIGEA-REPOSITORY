import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { MdOutlineAssignment } from 'react-icons/md';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Tooltip } from 'primereact/tooltip';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { getCurriculumById } from '../../../api/academics/curriculumService';

const demoStudents = [
  { id: 1, name: 'Juan Pérez Pérez' },
  { id: 2, name: 'Ana Martínez' },
  { id: 3, name: 'Luis Sánchez' },
  { id: 4, name: 'María López' },
  { id: 5, name: 'Carlos Díaz' },
  { id: 6, name: 'Elena Torres' },
];

// Calificaciones de ejemplo: { [studentId]: { [subjectId]: { grade, teacher } } }
const qualifications = {
  1: { 1: { grade: 9, teacher: 'Mtro. Martín' }, 2: { grade: 10, teacher: 'Mtro. Martín' } },
  2: { 1: { grade: 8, teacher: 'Mtro. Martín' }, 2: { grade: 9, teacher: 'Mtro. Martín' } },
  3: { 1: { grade: 7, teacher: 'Mtro. Martín' }, 2: { grade: 8, teacher: 'Mtro. Martín' } },
  4: { 1: { grade: 9, teacher: 'Mtro. Martín' }, 2: { grade: 8, teacher: 'Mtro. Martín' } },
  5: { 1: { grade: 6, teacher: 'Mtro. Martín' }, 2: { grade: 7, teacher: 'Mtro. Martín' } },
  6: { 1: { grade: 10, teacher: 'Mtro. Martín' }, 2: { grade: 9, teacher: 'Mtro. Martín' } },
};

export default function GroupModulesTable({ group }) {
  const [curriculum, setCurriculum] = useState(null);
  const [loading, setLoading] = useState(true);

  const [expandedHeaders, setExpandedHeaders] = useState({});
  const [search, setSearch] = useState('');
  const dt = useRef(null);

  // Filtrar estudiantes por nombre
  const filteredStudents = useMemo(() => {
    return demoStudents.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getCurriculumById(group.curriculumId);
        setCurriculum(result);
      } catch {
        setCurriculum(null);
      } finally {
        setLoading(false);
      }
    }
    if (group?.curriculumId) loadData();
  }, [group?.curriculumId]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
        <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
      </div>
    );
  }

  if (!curriculum?.modules?.length) {
    return <div className="alert alert-info text-center my-4">No hay módulos registrados en el plan de estudios.</div>;
  }

  return curriculum.modules.map((mod) => {
    // Header interactivo y divisores
    const handleHeaderClick = (subjectId) => {
      setExpandedHeaders((prev) => ({
        ...prev,
        [mod.id]: prev[mod.id] === subjectId ? null : subjectId,
      }));
    };

    const headerGroup = (
      <ColumnGroup>
        <Row>
          <Column header="Nombre del estudiante" rowSpan={3} style={{ minWidth: 220, maxWidth: 250, width: 220 }} frozen alignFrozen="left" />
          <Column header="Materias" colSpan={mod.subjects.length} />
          <Column header="Promedio" rowSpan={3} style={{ minWidth: 120, width: 120, textAlign: 'center' }} />
        </Row>

        <Row>
          {mod.subjects.map((subj, idx) => (
            <Column key={subj.id} header={null} />
          ))}
        </Row>

        <Row>
          {mod.subjects.map((subj, idx) => (
            <Column
              key={subj.id}
              header={
                <div
                  style={{
                    width: 40,
                    margin: 'auto',
                    cursor: 'pointer',
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    textAlign: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                  }}
                  onClick={() => handleHeaderClick(subj.id)}
                  data-pr-tooltip={expandedHeaders[mod.id] === subj.id ? undefined : subj.name}
                  data-pr-position="top"
                  tabIndex={0}
                >
                  {expandedHeaders[mod.id] === subj.id ? <span className="text-nowrap px-2">{subj.name}</span> : <span className="fw-bold">{idx + 1}</span>}
                  <Tooltip target={`[data-pr-tooltip="${subj.name}"]`} />
                </div>
              }
            />
          ))}
        </Row>
      </ColumnGroup>
    );

    // Calificación estática con tooltip
    const gradeBody = (student, subj) => {
      const q = qualifications[student.id]?.[subj.id];
      return q ? (
        <span style={{ fontWeight: 500, cursor: 'pointer', borderRadius: 5, background: '#f1f8e9', padding: '3px 9px', display: 'inline-block' }} data-pr-tooltip={`Docente: ${q.teacher}`} data-pr-position="top" tabIndex={0}>
          {q.grade}
          <Tooltip target={`[data-pr-tooltip="Docente: ${q.teacher}"]`} />
        </span>
      ) : (
        <span style={{ color: '#bbb' }}>—</span>
      );
    };

    // Promedio calculado (dummy)
    const avgBody = (student) => {
      const notas = Object.values(qualifications[student.id] || {}).map((q) => q.grade);
      if (!notas.length) return <span style={{ color: '#bbb' }}>—</span>;
      const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
      return <span style={{ fontWeight: 600 }}>{avg.toFixed(1)}</span>;
    };

    const tableHeader = (
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100 px-2 py-2">
        <div className="d-flex align-items-center">
          <div className="title-icon p-1 rounded-circle">
            <MdOutlineAssignment size={32} className="p-1" />
          </div>
          <h6 className="text-blue-500 fs-6 fw-semibold ms-2 mb-0">{mod.name}</h6>
        </div>
        <div className="d-flex align-items-center">
          <span className="p-input-icon-left me-2">
            <InputText placeholder="Buscar estudiante..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ minWidth: 180 }} />
          </span>
          <Button icon="pi pi-upload" severity="help" size="small" outlined onClick={() => dt.current.exportCSV()} />
        </div>
      </div>
    );

    return (
      <div className="mb-4" key={mod.id}>
        <DataTable ref={dt} value={filteredStudents} header={tableHeader} headerColumnGroup={headerGroup} scrollable scrollHeight="flex" className="p-datatable-gridlines" emptyMessage="No hay estudiantes." tableStyle={{ minWidth: '900px', width: '100%' }}>
          <Column
            field="name"
            header="Nombre del estudiante"
            style={{
              minWidth: 220,
              maxWidth: 250,
              width: 220,
              fontWeight: 500,
              background: '#f9f9f9',
              position: 'sticky',
              left: 0,
              zIndex: 2,
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
            body={(row) => <div style={{ overflowX: 'auto', maxWidth: 230 }}>{row.name}</div>}
            frozen
            alignFrozen="left"
          />
          {mod.subjects.map((subj) => (
            <Column
              key={subj.id}
              field={subj.id.toString()}
              body={(row) => gradeBody(row, subj)}
              style={{
                textAlign: 'center',
                minWidth: 100,
                borderLeft: '1.5px solid #e1e1e1',
                borderRight: '1.5px solid #e1e1e1',
                background: '#f9f9f9',
              }}
            />
          ))}
          <Column
            header="Promedio"
            body={avgBody}
            style={{
              textAlign: 'center',
              minWidth: 120,
              width: 120,
              fontWeight: 600,
              background: '#f5f5f5',
            }}
          />
        </DataTable>
      </div>
    );
  });
}

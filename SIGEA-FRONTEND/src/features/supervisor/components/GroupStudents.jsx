// src/features/supervisor/components/GroupStudents.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { InputText } from 'primereact/inputtext';
import { Tooltip } from 'primereact/tooltip';
import { MdOutlineAssessment, MdOutlineGroup, MdOutlinePersonSearch } from 'react-icons/md';

import { useToast } from '../../../components/providers/ToastProvider';
import { getCurriculumById } from '../../../api/academics/curriculumService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { getRankingsByTeacher } from '../../../api/academics/rankingService';

export default function GroupStudents({ 
  group, 
  teacher, 
  campusId, 
  campusName, 
  isPrimary,
  navigate
}) {
  const { showError } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [curriculum, setCurriculum] = useState(null);
  const [students, setStudents] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Cargar datos del componente
  const loadData = useCallback(async () => {
    if (!group?.curriculumId || !group?.groupId || !teacher?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Cargar datos en paralelo
      const [curriculumData, studentsData, evaluationsData] = await Promise.all([
        getCurriculumById(group.curriculumId),
        getGroupStudents(group.groupId),
        getRankingsByTeacher(teacher.id)
      ]);

      setCurriculum(curriculumData);
      setStudents(studentsData || []);

      // Mapear evaluaciones para fácil acceso
      const evaluationsMap = {};
      if (evaluationsData && evaluationsData.data) {
        evaluationsData.data.forEach(evaluation => {
          evaluationsMap[evaluation.student.id] = evaluation;
        });
      } else if (Array.isArray(evaluationsData)) {
        evaluationsData.forEach(evaluation => {
          evaluationsMap[evaluation.student.id] = evaluation;
        });
      }
      setEvaluations(evaluationsMap);

    } catch (err) {
      console.error('Error loading data:', err);
      showError('Error', 'Error al cargar los datos del grupo');
    } finally {
      setLoading(false);
    }
  }, [group?.curriculumId, group?.groupId, teacher?.id, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Función para navegar a TeacherScore
  const handleViewTeacherScore = () => {
    if (navigate && teacher) {
      navigate('/supervisor/campuses-teachers/teachers/teacher-score', {
        state: {
          teacherId: teacher.id,
          teacherName: `${teacher.name} ${teacher.paternalSurname} ${teacher.maternalSurname}`,
          campusId,
          campusName,
          isPrimary
        }
      });
    }
  };

  // Preparar datos para la tabla
  const tableData = useMemo(() => {
    if (!students || !curriculum) return [];

    return students.map(student => {
      const hasEvaluated = evaluations[student.studentId];
      
      // Objeto base del estudiante
      const row = {
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        primaryRegistrationNumber: student.primaryRegistrationNumber,
        hasEvaluated: !!hasEvaluated,
        evaluationDate: hasEvaluated ? hasEvaluated.date : null,
        evaluationRating: hasEvaluated ? hasEvaluated.star : null
      };

      // Agregar columnas para cada módulo
      if (curriculum.modules) {
        curriculum.modules.forEach(module => {
          row[`module_${module.id}`] = hasEvaluated;
        });
      }

      return row;
    });
  }, [students, curriculum, evaluations]);

  // Datos filtrados para la búsqueda personalizada
  const filteredData = useMemo(() => {
    if (!globalFilter || globalFilter.trim() === '') {
      return tableData;
    }

    const searchTerm = globalFilter.toLowerCase().trim();
    
    return tableData.filter(student => {
      const fullName = (student.fullName || '').toLowerCase();
      const email = (student.email || '').toLowerCase();
      const registrationNumber = (student.primaryRegistrationNumber || '').toLowerCase();

      return fullName.includes(searchTerm) || 
             email.includes(searchTerm) || 
             registrationNumber.includes(searchTerm);
    });
  }, [tableData, globalFilter]);

  // Grid lines como en GroupModulesTable
  const gridLinesX = useMemo(
    () => ({
      borderLeft: '1px solid #ededed',
      borderRight: '1px solid #ededed',
    }),
    []
  );

  // Columna del estudiante sin avatar
  const studentTemplate = (rowData) => (
    <div className="text-nowrap">
      <div className="fw-medium">{rowData.fullName}</div>
      <small className="text-muted d-block">{rowData.email}</small>
      {rowData.primaryRegistrationNumber && (
        <small className="text-muted d-block">
          {rowData.primaryRegistrationNumber}
        </small>
      )}
    </div>
  );

  // Template para el estado de evaluación
  const evaluationStatusTemplate = (rowData) => {
    if (rowData.hasEvaluated) {
      return (
        <Tag 
          value="Evaluado" 
          severity="success" 
          icon="pi pi-check"
          className="fw-medium"
        />
      );
    } else {
      return (
        <Tag 
          value="Pendiente" 
          severity="warning" 
          icon="pi pi-clock"
          className="fw-medium"
        />
      );
    }
  };

  // Template para columnas de módulos
  const moduleTemplate = (rowData, module) => {
    if (rowData.hasEvaluated) {
      return (
        <div className="text-center">
          <i className="pi pi-check text-success" title='Evaluación docente realizada' style={{ fontSize: '1.2rem' }}></i>
        </div>
      );
    } else {
      return (
        <div className="text-center">
          <i className="pi pi-clock text-warning" title='Evaluación docente pendiente' style={{ fontSize: '1.2rem' }}></i>
        </div>
      );
    }
  };

  // Filtro global
  const onGlobalFilterChange = (e) => {
    setGlobalFilter(e.target.value);
  };

  // Header de la tabla
  const renderHeader = () => (
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
      <div className="d-flex align-items-center">
        <div className="title-icon p-1 rounded-circle me-2">
          <MdOutlineGroup size={32} className="p-1" />
        </div>
        <div>
          <h6 className="text-blue-500 fs-5 fw-semibold mb-0">
            Estudiantes y evaluaciones
          </h6>
          <small className="text-muted text-nowrap">
            {students.length} estudiante{students.length !== 1 ? 's' : ''} inscrito{students.length !== 1 ? 's' : ''}
          </small>
        </div>
      </div>

      <div className="d-flex align-items-center gap-2">
        <InputText
          value={globalFilter}
          onChange={onGlobalFilterChange}
          placeholder="Buscar..."
          className="p-inputtext-sm"
          
        />
        
        {teacher && (
          <Button
            icon="pi pi-chart-bar"
            severity="info"
            size="small"
            onClick={handleViewTeacherScore}
            title="Ver todas las evaluaciones del docente"
            className="d-flex align-items-center gap-1"
          >
            <span className='d-none d-md-inline'>Ver evaluaciones</span>
          </Button>
        )}
      </div>
    </div>
  );

  // Estadísticas rápidas
  const evaluatedCount = tableData.filter(student => student.hasEvaluated).length;
  const pendingCount = tableData.length - evaluatedCount;
  const evaluationPercentage = tableData.length > 0 ? (evaluatedCount / tableData.length) * 100 : 0;

  if (loading) {
    return (
      <div className="card border-0">
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <div className="text-center">
              <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
              <p className="mt-3 text-600">Cargando estudiantes y evaluaciones...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Tooltip target="[data-pr-tooltip]" />
      
      <div className="card border-0">
        <div className="card-body">
          {/* Estadísticas rápidas */}
          <div className="row mb-4">
            <div className="col-12 col-md-4 mb-3 mb-md-0">
              <div className="text-center p-3 border rounded">
                <div className="fs-4 fw-bold text-secondary">{evaluatedCount}</div>
                <small className="text-muted">Evaluaciones completadas</small>
              </div>
            </div>
            <div className="col-12 col-md-4 mb-3 mb-md-0">
              <div className="text-center p-3 border rounded">
                <div className="fs-4 fw-bold text-secondary">{pendingCount}</div>
                <small className="text-muted">Evaluaciones pendientes</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="text-center p-3 border rounded">
                <div className="fs-4 fw-bold text-blue-500">{evaluationPercentage.toFixed(1)}%</div>
                <small className="text-muted">Porcentaje completado</small>
              </div>
            </div>
          </div>

          {/* DataTable con grid lines y responsividad corregida */}
          <DataTable
            value={filteredData}
            paginator
            rows={5}
            rowsPerPageOptions={[5, 10, 25]}
            header={renderHeader()}
            emptyMessage="No se encontraron estudiantes"
            className="p-datatable-sm"
            scrollable
            scrollHeight="flex"
            stripedRows
            tableStyle={{
              borderBottom: '1px solid #ededed',
              borderLeft: '1px solid #ededed',
              borderRight: '1px solid #ededed',
            }}
          >
            {/* Columna del estudiante */}
            <Column
              field="fullName"
              header="Estudiante"
              body={studentTemplate}
              sortable
              style={{ ...gridLinesX, minWidth: '250px' }}
              bodyClassName="text-nowrap"
            />

            {/* Columna de estado de evaluación */}
            <Column
              field="hasEvaluated"
              header="Estado"
              body={evaluationStatusTemplate}
              sortable
              style={{ ...gridLinesX, minWidth: '120px' }}
              bodyClassName="text-nowrap"
            />

            {/* Columnas dinámicas para cada módulo */}
            {curriculum?.modules?.map((module, index) => (
              <Column
                key={module.id}
                field={`module_${module.id}`}
                header={<span className="fw-bold">M{index + 1}</span>}
                headerTooltip={module.name}
                headerTooltipOptions={{ position: 'top' }}
                body={(rowData) => moduleTemplate(rowData, module)}
                style={{ ...gridLinesX, width: '80px', textAlign: 'center', minWidth: '80px' }}
                headerStyle={{ textAlign: 'center' }}
                className="text-center"
              />
            ))}
          </DataTable>
        </div>
      </div>
    </>
  );
}
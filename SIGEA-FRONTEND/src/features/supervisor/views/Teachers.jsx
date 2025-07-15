import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { BreadCrumb } from 'primereact/breadcrumb';
import { MdOutlineCoPresent, MdOutlineAssessment } from 'react-icons/md';

import { useToast } from '../../../components/providers/ToastProvider';
import { getUserByRoleAndPlantel } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';

const STATUS_CONFIG = {
  ACTIVE: { name: 'ACTIVE', label: 'Activo', severity: 'success' },
  INACTIVE: { name: 'INACTIVE', label: 'Inactivo', severity: 'danger' },
  Activo: { name: 'ACTIVE', label: 'Activo', severity: 'success' },
  Inactivo: { name: 'INACTIVE', label: 'Inactivo', severity: 'danger' },
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || { name: status, label: status, severity: 'info' };

export default function Teachers() {
  const dt = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();

  // Obtener datos del plantel desde el state de navegación
  const { campusId, campusName, isPrimary } = location.state || {};

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  // Función para cargar docentes del plantel
  const loadTeachers = useCallback(async () => {
    if (!campusId) {
      showError('Error', 'No se pudo identificar el plantel seleccionado');
      navigate('/supervisor/campuses-teachers');
      return;
    }

    try {
      setLoading(true);
      
      // Obtener el ID del rol TEACHER
      let teacherRoleId = 3; // Valor por defecto
      try {
        const roles = await getAllRoles();
        const teacherRole = roles.find(role => role.roleName === 'TEACHER');
        if (teacherRole) {
          teacherRoleId = teacherRole.id;
        }
      } catch (roleError) {
        console.warn('Error loading roles, using default teacher role ID:', roleError);
      }

      const data = await getUserByRoleAndPlantel(teacherRoleId, campusId);
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading teachers:', err);
      showError('Error', 'Error al cargar los docentes del plantel');
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [campusId, showError, navigate]);

  // Función para refrescar datos manualmente
  const refreshTeachers = useCallback(async () => {
    if (!campusId) return;

    try {
      setRefreshing(true);
      
      // Obtener el ID del rol TEACHER
      let teacherRoleId = 3; // Valor por defecto
      try {
        const roles = await getAllRoles();
        const teacherRole = roles.find(role => role.roleName === 'TEACHER');
        if (teacherRole) {
          teacherRoleId = teacherRole.id;
        }
      } catch (roleError) {
        console.warn('Error loading roles, using default teacher role ID:', roleError);
      }

      const data = await getUserByRoleAndPlantel(teacherRoleId, campusId);
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error refreshing teachers:', error);
      showError('Error', 'No se pudieron actualizar los datos de los docentes');
    } finally {
      setRefreshing(false);
    }
  }, [campusId, showError]);

  // Cargar datos al montar el componente
  useEffect(() => {
    if (campusId) {
      loadTeachers();
    } else {
      // Si no hay campusId, redirigir a la selección de planteles
      navigate('/supervisor/campuses-teachers');
    }
  }, [loadTeachers, campusId, navigate]);

  // Procesar datos de docentes para la tabla
  const processedTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];

    return teachers.map((teacher) => {
      const statusLabel = getStatusConfig(teacher.status).label;
      const fullName = `${teacher.name || ''} ${teacher.paternalSurname || ''} ${teacher.maternalSurname || ''}`.trim();

      const displayCreatedAt = teacher.createdAt
        ? new Date(teacher.createdAt).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '';

      return {
        ...teacher,
        fullName,
        statusLabel,
        displayCreatedAt,
        searchableStatus: `${teacher.status || ''} ${statusLabel}`.toLowerCase(),
      };
    });
  }, [teachers]);

  // Función para navegar a teacher-score
  const handleViewTeacherScore = useCallback(
    (teacher) => {
      navigate('/supervisor/campuses-teachers/teachers/teacher-score', {
        state: {
          teacherId: teacher.id,
          teacherName: teacher.fullName,
          campusId,
          campusName,
          isPrimary,
        },
      });
    },
    [navigate, campusId, campusName, isPrimary]
  );

  // Breadcrumb
  const breadcrumbItems = [
    {
      label: 'Planteles',
      command: () => navigate('/supervisor/campuses-teachers'),
    },
    {
      label: campusName || 'Plantel',
      command: () => navigate('/supervisor/campuses-teachers/teachers', { 
        state: { campusId, campusName, isPrimary } 
      }),
    },
  ];

  const breadcrumbHome = {
    icon: 'pi pi-home',
    command: () => navigate('/supervisor'),
  };

  // Header de la tabla
  const header = useMemo(
    () => (
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
        <div className="col-12 col-md d-flex align-items-center flex-wrap gap-2">
          <div className="title-icon p-1 rounded-circle">
            <MdOutlineCoPresent className="p-1" size={38} />
          </div>
          <h5 className="title-text ms-2 me-2 mb-0">Docentes de {campusName}</h5>
          <span className="badge bg-blue-500 p-2 me-2">{processedTeachers.length}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <InputText 
            placeholder="Buscar docente..." 
            value={globalFilter} 
            onChange={(e) => setGlobalFilter(e.target.value)} 
            disabled={loading} 
            className="me-2" 
            style={{ minWidth: '250px' }} 
          />
          <Button 
            icon={refreshing ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'} 
            severity="primary" 
            onClick={refreshTeachers} 
            disabled={loading || refreshing} 
            tooltip="Actualizar datos" 
            tooltipOptions={{ position: 'top' }} 
          />
          <Button 
            icon="pi pi-upload" 
            outlined={loading || !processedTeachers.length} 
            severity="help" 
            onClick={() => dt.current?.exportCSV()} 
            disabled={loading || !processedTeachers.length}
          >
            <span className="d-none d-sm-inline ms-2">Exportar</span>
          </Button>
        </div>
      </div>
    ),
    [campusName, processedTeachers.length, isPrimary, globalFilter, loading, refreshing, refreshTeachers]
  );

  // Templates para las columnas
  const statusBodyTemplate = useCallback((rowData) => {
    const statusConfig = getStatusConfig(rowData.status);
    return <Tag value={statusConfig.label} severity={statusConfig.severity} />;
  }, []);

  const registrationBodyTemplate = useCallback((rowData) => {
    if (!rowData.primaryRegistrationNumber) return <span className="text-muted">-</span>;
    return <span className="font-monospace">{rowData.primaryRegistrationNumber}</span>;
  }, []);

  const actionsTemplate = useCallback(
    (row) => {
      return (
        <Button 
          icon="pi pi-chart-line" 
          rounded 
          outlined 
          severity="info" 
          disabled={loading} 
          tooltip="Ver desempeño" 
          tooltipOptions={{ position: 'top' }} 
          onClick={() => handleViewTeacherScore(row)}
        />
      );
    },
    [loading, handleViewTeacherScore]
  );

  const dateTemplate = useCallback(
    (row) =>
      new Date(row.createdAt).toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    []
  );

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Docentes</h3>
      </div>

      <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="mt-2 pb-0 ps-0 text-nowrap" />

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando docentes...</p>
          </div>
        </div>
      ) : processedTeachers.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineCoPresent className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No hay docentes registrados</h5>
            <p className="text-muted">Este plantel no tiene docentes asignados</p>
            <Button 
              label="Volver a planteles" 
              severity="secondary" 
              outlined 
              onClick={() => navigate('/supervisor/campuses-teachers')} 
            />
          </div>
        </div>
      ) : (
        <div className="mt-3">
          <DataTable
            ref={dt}
            value={processedTeachers}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            filterDisplay="menu"
            globalFilter={globalFilter}
            globalFilterFields={[
              'name', 
              'paternalSurname', 
              'maternalSurname', 
              'fullName', 
              'email', 
              'primaryRegistrationNumber', 
              'searchableStatus', 
              'displayCreatedAt'
            ]}
            header={header}
            className="text-nowrap"
            emptyMessage={
              <div className="text-center my-5">
                <MdOutlineCoPresent size={70} className="text-secondary" />
                <p className="mt-2">
                  {!globalFilter 
                    ? 'No hay docentes registrados en este plantel' 
                    : `No se encontraron docentes para "${globalFilter}"`
                  }
                </p>
              </div>
            }
          >
            <Column 
              field="primaryRegistrationNumber" 
              header="Matrícula" 
              body={registrationBodyTemplate} 
              sortable 
              style={{ minWidth: '120px' }} 
            />
            <Column 
              field="fullName" 
              header="Nombre Completo" 
              sortable 
              style={{ minWidth: '200px' }} 
            />
            <Column 
              field="email" 
              header="Correo Electrónico" 
              sortable 
              style={{ minWidth: '200px' }} 
            />
            <Column 
              field="statusLabel" 
              header="Estado" 
              body={statusBodyTemplate} 
              sortable 
              style={{ minWidth: '100px' }} 
            />
            <Column 
              field="createdAt" 
              header="Fecha de Registro" 
              body={dateTemplate} 
              sortable 
              style={{ minWidth: '150px' }} 
            />
            <Column 
              body={actionsTemplate} 
              header="Acciones" 
              exportable={false} 
              style={{ minWidth: '80px' }} 
            />
          </DataTable>
        </div>
      )}
    </>
  );
}
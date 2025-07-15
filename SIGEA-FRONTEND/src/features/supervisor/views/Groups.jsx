import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { BreadCrumb } from 'primereact/breadcrumb';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdOutlineGroup, MdOutlineSchool, MdOutlineAccessTime, MdOutlinePerson, MdOutlineCheckCircle, MdOutlineCircle } from 'react-icons/md';

import { useToast } from '../../../components/providers/ToastProvider';
import { getGroupByCareer, getGroupStudents } from '../../../api/academics/groupService';

const weekDayOptions = [
  { label: 'Lunes', value: 'LUN' },
  { label: 'Martes', value: 'MAR' },
  { label: 'Miércoles', value: 'MIE' },
  { label: 'Jueves', value: 'JUE' },
  { label: 'Viernes', value: 'VIE' },
  { label: 'Sábado', value: 'SAB' },
  { label: 'Domingo', value: 'DOM' },
];

const getWeekLabel = (code) => weekDayOptions.find((o) => o.value === code)?.label || code;

export default function Groups() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showError } = useToast();

  // Obtener datos de navegación
  const { career, campusId, campusName, isPrimary } = location.state || {};

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudentCounts, setLoadingStudentCounts] = useState(false);

  // Función para cargar cantidad de estudiantes de un grupo
  const loadGroupStudentCount = useCallback(async (groupId) => {
    try {
      const students = await getGroupStudents(groupId);
      return Array.isArray(students) ? students.length : 0;
    } catch (error) {
      console.error(`Error loading students for group ${groupId}:`, error);
      return 0;
    }
  }, []);

  // Función para cargar contadores de estudiantes para todos los grupos
  const loadStudentCounts = useCallback(
    async (groupsList) => {
      setLoadingStudentCounts(true);

      const groupPromises = groupsList.map(async (group) => {
        const studentsCount = await loadGroupStudentCount(group.groupId);
        return {
          ...group,
          studentsCount,
        };
      });

      try {
        const groupsWithCounts = await Promise.all(groupPromises);
        setGroups(groupsWithCounts);
      } catch (error) {
        console.error('Error loading student counts:', error);
        // Si falla, mantener los grupos sin contador
        setGroups(
          groupsList.map((group) => ({
            ...group,
            studentsCount: 0,
          }))
        );
      } finally {
        setLoadingStudentCounts(false);
      }
    },
    [loadGroupStudentCount]
  );

  // Función para cargar grupos
  const loadGroups = useCallback(async () => {
    if (!career?.id) {
      showError('Error', 'No se especificó la carrera a consultar');
      navigate('/supervisor/campuses-careers/careers', {
        state: { campusId, campusName, isPrimary },
      });
      return;
    }

    try {
      setLoading(true);
      const response = await getGroupByCareer(career.id);
      const groupsData = Array.isArray(response) ? response : response?.data ?? [];

      // Cargar contadores de estudiantes para cada grupo
      if (groupsData.length > 0) {
        await loadStudentCounts(groupsData);
      } else {
        setGroups([]);
      }
    } catch (err) {
      console.error('Error loading groups:', err);
      showError('Error', 'Error al cargar los grupos de la carrera');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [career?.id, showError, navigate, campusId, campusName, isPrimary, loadStudentCounts]);

  // Efecto para cargar datos
  useEffect(() => {
    if (career?.id) {
      loadGroups();
    } else {
      navigate('/supervisor/campuses-careers/careers', {
        state: { campusId, campusName, isPrimary },
      });
    }
  }, [loadGroups, career?.id, navigate, campusId, campusName, isPrimary]);

  // Breadcrumb items
  const breadcrumbItems = [
    {
      label: 'Planteles',
      command: () => navigate('/supervisor/campuses-careers'),
    },
    {
      label: campusName,
      command: () =>
        navigate('/supervisor/campuses-careers/careers', {
          state: { campusId, campusName, isPrimary },
        }),
    },
    {
      label: career?.name || 'Carrera',
    },
  ];

  const breadcrumbHome = {
    icon: 'pi pi-home',
    command: () => navigate('/supervisor'),
  };

  // Función para navegar a detalles del grupo
  const handleGroupClick = useCallback(
    (group) => {
      navigate('/supervisor/campuses-careers/careers/group-details', {
        state: { group, career, campusId, campusName, isPrimary },
      });
    },
    [navigate, career, campusId, campusName, isPrimary]
  );

  return (
  <>
    <div className="bg-white rounded-top p-2">
      <h3 className="text-blue-500 fw-semibold mx-3 my-1">Grupos</h3>
    </div>

    <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="mt-2 pb-0 ps-0 text-nowrap" />

    {loading ? (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
        <div className="text-center">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
          <p className="mt-3 text-600">Cargando grupos...</p>
        </div>
      </div>
    ) : groups.length === 0 ? (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
        <div className="text-center">
          <MdOutlineGroup className="text-secondary" size={70} />
          <h5 className="mt-3 text-muted">No hay grupos registrados</h5>
          <p className="text-muted">Esta carrera no tiene grupos</p>
          <Button
            label="Volver a carreras"
            severity="secondary"
            outlined
            onClick={() =>
              navigate('/supervisor/campuses-careers/careers', {
                state: { campusId, campusName, isPrimary },
              })
            }
          />
        </div>
      </div>
    ) : (
      <div className="row mt-3">
        {groups.map((group) => (
          <div key={group.groupId} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
            <div className="card border-0 h-100 hovereable up shadow-sm" onClick={() => handleGroupClick(group)} style={{ cursor: 'pointer' }}>
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div className="flex-grow-1 text-truncate">
                    <h6 className="fw-semibold lh-sm mb-2 text-dark text-truncate">Grupo {group.name}</h6>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-light text-dark border">{getWeekLabel(group.weekDay)}</span>
                      <span className="badge bg-light text-dark border">
                        {group.startTime} - {group.endTime}
                      </span>
                    </div>
                    <div className="mt-2 text-uppercase">
                      <small className="text-muted">
                        <MdOutlinePerson className="me-1" size={14} />
                        {group.teacherName || 'Sin docente asignado'}
                      </small>
                    </div>
                    <div className="mt-1 text-uppercase">
                      <small className="text-muted">
                        <MdOutlineSchool className="me-1" size={14} />
                        {group.curriculumName || 'Sin plan de estudios'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Contadores mejorados */}
                <div className="row g-2 text-center">
                  <div className="col-6">
                    <div className="p-2 rounded bg-light h-100 text-truncate">
                      <MdOutlineGroup className="text-secondary mb-1" size={24} />
                      <div className="fw-bold text-secondary">{loadingStudentCounts ? <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="4" /> : group.studentsCount || 0}</div>
                      <small className="text-muted">{group.studentsCount === 1 ? 'Estudiante' : 'Estudiantes'}</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 rounded bg-light h-100 text-truncate">
                      {group.studentsCount > 0 ? <MdOutlineCheckCircle className="text-secondary mb-1" size={24} /> : <MdOutlineCircle className="text-secondary mb-1" size={24} />}
                      <div className="fw-bold text-secondary">{loadingStudentCounts ? <ProgressSpinner style={{ width: '16px', height: '16px' }} strokeWidth="4" /> : group.studentsCount > 0 ? 'Activo' : 'Vacío'}</div>
                      <small className="text-muted">Estado</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )}
  </>
);
}

import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MdOutlinePerson, MdOutlineGroup } from 'react-icons/md';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Rating } from 'primereact/rating';
import { ProgressSpinner } from 'primereact/progressspinner';

import { useToast } from '../../../components/providers/ToastProvider';
import avatarFallback from '../../../assets/img/profile.png';
import { getUserById } from '../../../api/userService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { BACKEND_BASE_URL } from '../../../api/common-url';
import GroupModulesTable from '../../admin/components/GroupModulesTable';

const weekDayOptions = [
  { label: 'Lunes', value: 'LUN' },
  { label: 'Martes', value: 'MAR' },
  { label: 'Miércoles', value: 'MIE' },
  { label: 'Jueves', value: 'JUE' },
  { label: 'Viernes', value: 'VIE' },
  { label: 'Sábado', value: 'SAB' },
  { label: 'Domingo', value: 'DOM' },
];

const weekLabel = (code) => weekDayOptions.find((o) => o.value === code)?.label || code;

export default function GroupDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);

  // Obtener datos del state de navegación
  const { group, career, campusId, campusName, isPrimary } = location.state || {};

  const [teacher, setTeacher] = useState(null);
  const [studentCount, setStudentCount] = useState(0);

  function getAvatarUrl(url) {
    if (!url) return avatarFallback;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Cargar datos del grupo
  useEffect(() => {
    if (!group) {
      navigate('/supervisor/campuses/careers/groups', {
        state: { career, campusId, campusName, isPrimary }
      });
      return;
    }

    let isMounted = true;
    setLoading(true);

    (async () => {
      try {
        const teacherPromise = group.teacherId ? getUserById(group.teacherId) : Promise.resolve(null);
        const studentsPromise = group.groupId ? getGroupStudents(group.groupId) : Promise.resolve(null);

        const [teacherData, studentsData] = await Promise.all([teacherPromise, studentsPromise]);

        if (!isMounted) return;

        setTeacher(teacherData);
        setStudentCount(studentsData ? studentsData.length : 0);
      } catch (err) {
        console.error('Error loading group details:', err);
        showError('Error', 'Error al cargar los detalles del grupo');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [group, navigate, showError, career, campusId, campusName, isPrimary]);

  // Información del grupo
  const infoLeft = [
    { label: 'Plan de estudios', value: group?.curriculumName || 'No asignado' },
    { label: 'Fecha de inicio', value: 'MAYO - 2025' },
    { label: 'Estado', value: 'Activo' },
  ];

  const infoRight = [
    { label: 'Horario', value: `${weekLabel(group?.weekDay)} ${group?.startTime} - ${group?.endTime}` },
    { label: 'Fecha de fin', value: 'MAYO - 2026' },
    { label: 'Total de alumnos', value: studentCount === 0 ? 'Sin alumnos' : studentCount },
  ];

  // Breadcrumb para supervisor
  const breadcrumbItems = [
    { 
      label: 'Campus', 
      command: () => navigate('/supervisor/campuses') 
    },
    { 
      label: campusName,
      command: () => navigate('/supervisor/campuses/careers', { 
        state: { campusId, campusName, isPrimary } 
      })
    },
    { 
      label: career?.name || 'Carrera',
      command: () => navigate('/supervisor/campuses/careers/groups', {
        state: { career, campusId, campusName, isPrimary }
      })
    },
    { 
      label: `Grupo ${group?.name}` || 'Grupo' 
    }
  ];

  const breadcrumbHome = { 
    icon: 'pi pi-home', 
    command: () => navigate('/supervisor/campuses') 
  };

  if (loading) {
    return (
      <>
        <div className="bg-white rounded-top p-2">
          <h3 className="text-blue-500 fw-semibold mx-3 my-1">Detalles del grupo</h3>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando detalles del grupo...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Detalles del grupo</h3>
      </div>

      {/* Breadcrumb */}
      <BreadCrumb
        model={breadcrumbItems}
        home={breadcrumbHome}
        className="mt-2 pb-0 ps-0 text-nowrap"
      />

      {/* Información del grupo y docente */}
      <div className="row my-3">
        <div className="col-12 col-lg-4 mb-3 mb-lg-0">
          <div className="card border-0" style={{ minHeight: '22rem' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlinePerson size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Docente</h6>
              </div>
              <div className="d-flex align-items-center justify-content-center fw-medium">
                <div className="d-flex flex-column align-items-center text-center">
                  <img 
                    alt="Avatar docente" 
                    src={getAvatarUrl(teacher?.avatarUrl)} 
                    className="rounded-circle shadow-sm mb-3" 
                    width={140} 
                    height={140} 
                    style={{ objectFit: 'cover' }} 
                  />
                  <span className="text-muted text-uppercase">
                    {teacher ? `${teacher.name} ${teacher.paternalSurname} ${teacher.maternalSurname}` : 'No asignado'}
                  </span>
                  <span className="text-muted mb-2">{teacher?.email || 'No asignado'}</span>
                  <Rating value={5} readOnly cancel={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="card border-0" style={{ minHeight: '22rem' }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlineGroup size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Información del grupo</h6>
              </div>
              <div className="d-flex align-items-center fw-medium">
                <div className="row text-muted text-start text-uppercase ms-5 gx-4 gy-3">
                  <div className="col-6">
                    <span>{career?.name}</span>
                  </div>
                  <div className="col-6">
                    <span>Grupo - {group?.name}</span>
                  </div>

                  {infoLeft.map(({ label, value }) => (
                    <div className="col-6 d-flex flex-column" key={label}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}

                  {infoRight.map(({ label, value }) => (
                    <div className="col-6 d-flex flex-column" key={label}>
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de calificaciones - Solo lectura */}
      <div className="col-12 mb-3">
        <GroupModulesTable group={group} readOnly={true} />
      </div>
    </>
  );
}
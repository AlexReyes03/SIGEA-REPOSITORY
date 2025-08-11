import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MdOutlinePerson, MdOutlineGroup, MdArrowForwardIos, MdArrowBackIosNew } from 'react-icons/md';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Rating } from 'primereact/rating';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';

import { useToast } from '../../../components/providers/ToastProvider';
import avatarFallback from '../../../assets/img/profile.png';
import { getUserById } from '../../../api/userService';
import { getGroupStudents } from '../../../api/academics/groupService';
import { BACKEND_BASE_URL } from '../../../api/common-url';
import GroupModulesTable from '../../admin/components/GroupModulesTable';
import GroupStudents from '../components/GroupStudents';

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

// Función helper para formatear fechas a "MES - AÑO"
const formatDateToMonthYear = (dateString) => {
  if (!dateString) return 'No definida';

  const date = new Date(dateString);
  const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${month} ${year}`;
};

// Función helper para calcular el estado del grupo
const getGroupStatus = (startDate, endDate) => {
  if (!startDate || !endDate) return 'Sin fecha';

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) {
    return 'Programado';
  } else if (now >= start && now <= end) {
    return 'Activo';
  } else {
    return 'Finalizado';
  }
};

// Variantes de animación para las transiciones (igual que en Admin)
const slideVariants = {
  modulesEnter: {
    x: '100%',
    opacity: 0,
  },
  modulesCenter: {
    x: 0,
    opacity: 1,
  },
  modulesExit: {
    x: '100%',
    opacity: 0,
  },

  studentsEnter: {
    x: '-100%',
    opacity: 0,
  },
  studentsCenter: {
    x: 0,
    opacity: 1,
  },
  studentsExit: {
    x: '-100%',
    opacity: 0,
  },
};

const transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4,
};

export default function GroupDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);

  const { group, career, campusId, campusName, isPrimary } = location.state || {};

  // Estados para el cambio de vista (igual que en Admin)
  const [currentView, setCurrentView] = useState(true); // true = módulos, false = estudiantes
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [teacher, setTeacher] = useState(null);
  const [studentCount, setStudentCount] = useState(0);

  function getAvatarUrl(url) {
    if (!url) return avatarFallback;
    if (/^https?:\/\//.test(url)) return url;
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Función para manejar el cambio de vista con animaciones (igual que en Admin)
  const handleViewChange = useCallback(() => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setCurrentView((prev) => !prev);

    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  }, [isTransitioning]);

  useEffect(() => {
    if (!group) {
      navigate('/supervisor/campuses-careers/careers/groups', {
        state: { career, campusId, campusName, isPrimary },
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
  const groupInfo = [
    {
      label: 'Carrera',
      value: career?.name || 'No asignada',
    },
    {
      label: 'Grupo',
      value: group?.name ? `Grupo ${group.name}` : 'Sin nombre',
    },
    {
      label: 'Plan de estudios',
      value: group?.curriculumName || 'No asignado',
    },
    {
      label: 'Horario',
      value: `${weekLabel(group?.weekDay)} ${group?.startTime} - ${group?.endTime}`,
    },
    {
      label: 'Estado',
      value: getGroupStatus(group?.startDate, group?.endDate),
    },
    {
      label: 'Periodo',
      value: `${formatDateToMonthYear(group?.startDate)} — ${formatDateToMonthYear(group?.endDate)}`,
    },
  ];

  // Configuración de la vista actual (actualizada para supervisor)
  const getViewConfig = () => {
    if (currentView) {
      return {
        headerText: 'Detalles del grupo',
        buttonIcon: 'pi pi-angle-left',
        buttonContent: 'pi pi-users',
        buttonTooltip: 'Ver estudiantes y evaluaciones',
      };
    } else {
      return {
        headerText: 'Estudiantes y evaluaciones',
        buttonIcon: 'pi pi-clipboard',
        buttonContent: 'pi pi-angle-right',
        buttonTooltip: 'Volver a detalles del grupo',
      };
    }
  };

  const viewConfig = getViewConfig();

  // Breadcrumb para supervisor
  const breadcrumbItems = [
    {
      label: 'Campus',
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
      command: () =>
        navigate('/supervisor/campuses-careers/careers/groups', {
          state: { career, campusId, campusName, isPrimary },
        }),
    },
    {
      label: `Grupo ${group?.name}` || 'Grupo',
    },
  ];

  const breadcrumbHome = {
    icon: 'pi pi-home',
    command: () => navigate('/supervisor'),
  };

  return (
    <>
      {/* Header con botón de cambio de vista (igual que en Admin) */}
      <div className="d-flex flex-row justify-content-between align-items-center bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold text-truncate mx-3 my-1">{viewConfig.headerText}</h3>
        <Button 
          icon={viewConfig.buttonIcon} 
          severity="primary" 
          size="small" 
          onClick={handleViewChange} 
          disabled={isTransitioning} 
          tooltip={viewConfig.buttonTooltip} 
          tooltipOptions={{ position: 'left' }} 
          className="d-flex align-items-center gap-1"
        >
          <i className={viewConfig.buttonContent}></i>
        </Button>
      </div>

      {/* Breadcrumb */}
      <BreadCrumb model={breadcrumbItems} home={breadcrumbHome} className="mt-2 pb-0 ps-0 text-nowrap" />

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando detalles del grupo...</p>
          </div>
        </div>
      ) : !group ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineGroup className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No se pudieron cargar los datos del grupo</h5>
            <p className="text-muted">Intenta recargar la página o volver a grupos</p>
            <Button
              label="Volver a grupos"
              icon="pi pi-arrow-left"
              severity="secondary"
              outlined
              onClick={() =>
                navigate('/supervisor/campuses-careers/careers/groups', {
                  state: { career, campusId, campusName, isPrimary },
                })
              }
            />
          </div>
        </div>
      ) : (
        <>
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
                    <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0 text-truncate">Información del grupo</h6>
                  </div>
    
                  <div className="mt-3">
                    <div className="table-responsive">
                      <table className="table table-borderless">
                        <tbody>
                          {groupInfo.map((info, index) => (
                            <tr key={index}>
                              <td 
                                className="text-secondary fw-medium text-nowrap ps-3" 
                                style={{ width: '40%', verticalAlign: 'middle' }}
                              >
                                {info.label}
                              </td>
                              <td 
                                className="text-dark text-nowrap" 
                                style={{ verticalAlign: 'middle' }}
                              >
                                {info.value}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenedor con animaciones para las vistas (igual que en Admin) */}
          <div className="col-12 mb-3" style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence mode="wait" initial={false}>
              {currentView ? (
                <motion.div 
                  key="modules-view" 
                  initial="modulesEnter" 
                  animate="modulesCenter" 
                  exit="modulesExit" 
                  variants={slideVariants} 
                  transition={transition} 
                  style={{ width: '100%' }}
                >
                  <GroupModulesTable group={group} readOnly={true} />
                </motion.div>
              ) : (
                <motion.div 
                  key="students-view" 
                  initial="studentsEnter" 
                  animate="studentsCenter" 
                  exit="studentsExit" 
                  variants={slideVariants} 
                  transition={transition} 
                  style={{ width: '100%' }}
                >
                  <GroupStudents 
                    group={group} 
                    teacher={teacher}
                    campusId={campusId}
                    campusName={campusName}
                    isPrimary={isPrimary}
                    navigate={navigate}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </>
  );
}
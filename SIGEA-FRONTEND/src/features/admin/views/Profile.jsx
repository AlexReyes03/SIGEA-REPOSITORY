import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ProgressBar } from 'primereact/progressbar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Badge } from 'primereact/badge';
import { Rating } from 'primereact/rating';
import { Tag } from 'primereact/tag';
import { 
  MdOutlineLock, 
  MdOutlinePerson, 
  MdInsertChartOutlined, 
  MdOutlineSchool,
  MdManageHistory,
  MdOutlineNotifications,
  MdSchedule,
  MdOutlineGroup,
  MdOutlineLocationOn,
  MdOutlineEmojiEvents,
  MdOutlineCalendarMonth,
  MdOutlineCoPresent
} from 'react-icons/md';
import { Modal } from 'bootstrap';
import { AnimatePresence, motion } from 'framer-motion';

import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import PasswordInput from '../../../components/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';
import { changePassword } from '../../../api/authService';
import ProfileAvatarUpload from '../components/ProfileAvatarUpload';

// APIs reales del sistema
import { getGroupByCareer, getGroupByTeacher, getGroupStudents, getStudentGroupHistory, getGroupById } from '../../../api/academics/groupService';
import { getAllCareers, getCareerByPlantelId } from '../../../api/academics/careerService';
import { getCurriculumByCareerId, getCurriculumById } from '../../../api/academics/curriculumService';
import { getEnrollmentsByUser, getTeachersByCareer } from '../../../api/academics/enrollmentService';
import { getSupervisorCampuses } from '../../../api/supervisorService';
import { getUserByRoleAndPlantel } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';
import { getCampusRankingStats, getRankingsByTeacherAnon } from '../../../api/academics/rankingService';
import { getQualificationsByGroupWithDetails } from '../../../api/academics/qualificationService';

export default function Profile() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();
  const location = useLocation();
  const navigate = useNavigate();

  // Estados existentes del modal de contraseña
  const [value, setValue] = useState(0);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  // Estados para datos dinámicos por rol
  const [roleData, setRoleData] = useState({
    loading: true,
    card1Data: null,
    card2Data: null,
    error: null
  });

  const interval = useRef(null);
  const changePasswordModalRef = useRef(null);
  const changePasswordButtonRef = useRef(null);

  useBootstrapModalFocus(changePasswordModalRef, changePasswordButtonRef);

  const ROLE_MAP = {
    ADMIN: 'Administrador',
    TEACHER: 'Maestro', 
    STUDENT: 'Estudiante',
    SUPERVISOR: 'Supervisor',
    DEV: 'Desarrollador',
  };
  const roleLabel = ROLE_MAP[user.role?.name || user.role] || 'Sin rol';

  // Funciones auxiliares para cálculos
  const calculateCurriculumDuration = (curriculum) => {
    if (!curriculum?.modules || curriculum.modules.length === 0) {
      return { weeks: 0, months: 0, years: 0, text: 'Sin módulos' };
    }

    const totalWeeks = curriculum.modules.reduce((acc, module) => {
      if (!module.subjects) return acc;
      return acc + module.subjects.reduce((subAcc, subject) => subAcc + (subject.weeks || 0), 0);
    }, 0);

    const totalMonths = totalWeeks / 4;
    const years = Math.floor(totalMonths / 12);
    const remainingMonths = Math.floor(totalMonths % 12);

    let text = '';
    if (years > 0 && remainingMonths > 0) {
      text = `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
    } else if (years > 0) {
      text = `${years} año${years > 1 ? 's' : ''}`;
    } else if (remainingMonths > 0) {
      text = `${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
    } else {
      text = `${totalWeeks} ${totalWeeks === 1 ? 'semana' : 'semanas'}`;
    }

    return { weeks: totalWeeks, months: totalMonths, years, remainingMonths, text };
  };

  const formatDateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return "Fechas no disponibles";
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const formatDate = (date) => {
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };
    
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Funciones de carga de datos por rol usando APIs reales
  const loadAdminData = async () => {
    try {
      if (!user?.campus?.id) {
        throw new Error('No se encontró información del plantel del administrador');
      }

      // Obtener roles para filtrar correctamente
      const roles = await getAllRoles();
      const teacherRole = roles.find(r => r.roleName === 'TEACHER');

      // Datos del plantel específico del admin
      const [careers, teachers] = await Promise.all([
        getCareerByPlantelId(user.campus.id),
        getUserByRoleAndPlantel(teacherRole.id, user.campus.id)
      ]);

      const careersArray = Array.isArray(careers) ? careers : careers?.data || [];
      const teachersArray = Array.isArray(teachers) ? teachers : [];

      // Verificar carreras sin plan de estudios
      let careersWithoutCurriculum = 0;
      for (const career of careersArray) {
        try {
          const curriculums = await getCurriculumByCareerId(career.id);
          const curriculumsArray = Array.isArray(curriculums) ? curriculums : curriculums?.data || [];
          if (curriculumsArray.length === 0) {
            careersWithoutCurriculum++;
          }
        } catch (error) {
          careersWithoutCurriculum++; // Asume que no tiene plan si hay error
        }
      }

      // Contar grupos sin docente
      let groupsWithoutTeacher = 0;
      for (const career of careersArray) {
        try {
          const groups = await getGroupByCareer(career.id);
          const groupsArray = Array.isArray(groups) ? groups : groups?.data || [];
          groupsWithoutTeacher += groupsArray.filter(group => !group.teacherId).length;
        } catch (error) {
          console.warn(`Error procesando grupos de carrera ${career.id}:`, error);
        }
      }

      // Simular notificaciones pendientes (por ahora)
      const pendingNotifications = Math.floor(Math.random() * 3); // 0-2 notificaciones

      return {
        card1Data: {
          title: 'Gestión del Plantel',
          icon: MdManageHistory,
          campusName: user.campus.name,
          totalCareers: careersArray.length,
          totalTeachers: teachersArray.length,
          tasks: [
            { 
              label: 'Grupos sin docente', 
              count: groupsWithoutTeacher,
              severity: groupsWithoutTeacher > 0 ? 'warning' : 'primary'
            },
            { 
              label: 'Carreras sin plan', 
              count: careersWithoutCurriculum,
              severity: careersWithoutCurriculum > 0 ? 'warning' : 'primary'
            }
          ]
        },
        card2Data: {
          title: 'Notificaciones',
          icon: MdOutlineNotifications,
          pendingNotifications: pendingNotifications,
          hasNotifications: pendingNotifications > 0,
          clickAction: () => navigate('/admin/notifications')
        }
      };
    } catch (error) {
      throw new Error('Error al cargar datos de administrador: ' + error.message);
    }
  };

  const loadTeacherData = async () => {
    try {
      // Obtener grupos del docente
      const groups = await getGroupByTeacher(user.id);
      const groupsArray = Array.isArray(groups) ? groups : [];

      let totalStudents = 0;
      const groupsWithStudents = [];

      // Calcular estudiantes por grupo
      for (const group of groupsArray) {
        try {
          const students = await getGroupStudents(group.groupId);
          const studentsCount = Array.isArray(students) ? students.length : 0;
          totalStudents += studentsCount;
          groupsWithStudents.push({
            ...group,
            studentsCount
          });
        } catch (error) {
          console.warn(`Error cargando estudiantes del grupo ${group.groupId}:`, error);
          groupsWithStudents.push({
            ...group,
            studentsCount: 0
          });
        }
      }

      // Obtener evaluaciones del docente
      let teacherPerformance = {
        averageRating: 0,
        totalEvaluations: 0,
        hasEvaluations: false
      };

      try {
        const response = await getRankingsByTeacherAnon(user.id);
        const rankings = response?.data || response;

        if (rankings && Array.isArray(rankings) && rankings.length > 0) {
          const totalRating = rankings.reduce((sum, ranking) => sum + (ranking.star || 0), 0);
          const averageRating = totalRating / rankings.length;

          teacherPerformance = {
            averageRating: Math.round(averageRating * 10) / 10,
            totalEvaluations: rankings.length,
            hasEvaluations: true
          };
        }
      } catch (error) {
        console.warn('Error cargando evaluaciones del docente:', error);
      }

      // Obtener día actual para horarios
      const today = new Date();
      const dayIndex = today.getDay();
      const weekDays = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
      const currentWeekDay = weekDays[dayIndex];

      const todayGroups = groupsArray
        .filter(group => group.weekDay === currentWeekDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      return {
        card1Data: {
          title: 'Mis Grupos Activos',
          icon: MdOutlineGroup,
          activeGroups: groupsArray.length,
          totalStudents: totalStudents,
          groups: groupsWithStudents.slice(0, 3), // Mostrar solo los primeros 3
          todayGroups: todayGroups,
          currentWeekDay: currentWeekDay
        },
        card2Data: {
          title: 'Mi Desempeño',
          icon: MdOutlineEmojiEvents,
          ...teacherPerformance
        }
      };
    } catch (error) {
      throw new Error('Error al cargar datos de docente: ' + error.message);
    }
  };

  const loadSupervisorData = async () => {
    try {
      // Por ahora sin cards como solicitado
      return {
        card1Data: null,
        card2Data: null
      };
    } catch (error) {
      throw new Error('Error al cargar datos de supervisor: ' + error.message);
    }
  };

  const loadStudentData = async () => {
    try {
      // Obtener inscripciones activas del estudiante
      const enrollments = await getEnrollmentsByUser(user.id);
      const activeEnrollments = Array.isArray(enrollments) 
        ? enrollments.filter(enrollment => enrollment.status === 'ACTIVE')
        : [];

      if (activeEnrollments.length === 0) {
        return {
          card1Data: {
            title: 'Progreso Académico',
            icon: MdInsertChartOutlined,
            message: 'No tienes inscripciones activas'
          },
          card2Data: null
        };
      }

      // Procesar cada inscripción para obtener progreso académico real
      const progressData = [];

      for (const enrollment of activeEnrollments) {
        try {
          // Obtener grupos de esta carrera
          const careerGroups = await getGroupByCareer(enrollment.careerId);
          const groupsArray = Array.isArray(careerGroups) ? careerGroups : careerGroups?.data || [];

          let foundActiveGroup = null;
          let groupDetails = null;

          // Buscar en qué grupo está inscrito el estudiante
          for (const group of groupsArray) {
            try {
              const groupStudents = await getGroupStudents(group.groupId);
              const isStudentInGroup = Array.isArray(groupStudents) && 
                groupStudents.some(student => student.studentId === user.id);

              if (isStudentInGroup) {
                foundActiveGroup = group;
                groupDetails = group; // Ya tenemos la info del grupo
                break;
              }
            } catch (error) {
              console.warn(`Error verificando grupo ${group.groupId}:`, error);
              continue;
            }
          }

          if (!foundActiveGroup) {
            progressData.push({
              careerName: enrollment.careerName,
              progress: 0,
              completedSubjects: 0,
              totalSubjects: 0,
              period: 'No asignado a grupo',
              hasGroup: false
            });
            continue;
          }

          // Obtener el curriculum del grupo
          const curriculum = await getCurriculumById(foundActiveGroup.curriculumId);
          
          // Calcular total de materias en el curriculum
          let totalSubjects = 0;
          if (curriculum?.modules) {
            curriculum.modules.forEach(module => {
              if (module.subjects) {
                totalSubjects += module.subjects.length;
              }
            });
          }

          // Obtener calificaciones del estudiante en este grupo
          const qualifications = await getQualificationsByGroupWithDetails(foundActiveGroup.groupId);
          
          // Contar materias calificadas por este estudiante
          const studentQualifications = qualifications.filter(q => q.studentId === user.id);
          const completedSubjects = studentQualifications.length;
          
          // Calcular progreso basado en materias completadas
          const progress = totalSubjects > 0 ? Math.round((completedSubjects / totalSubjects) * 100) : 0;
          
          // Formatear período con fechas reales del grupo
          const period = formatDateRange(groupDetails.startDate, groupDetails.endDate);

          progressData.push({
            careerName: enrollment.careerName,
            progress: progress,
            completedSubjects: completedSubjects,
            totalSubjects: totalSubjects,
            period: period,
            groupName: foundActiveGroup.name || 'Grupo sin nombre',
            hasGroup: true
          });

        } catch (error) {
          console.warn(`Error procesando carrera ${enrollment.careerId}:`, error);
          progressData.push({
            careerName: enrollment.careerName,
            progress: 0,
            completedSubjects: 0,
            totalSubjects: 0,
            period: 'Error al cargar datos',
            hasGroup: false
          });
        }
      }

      return {
        card1Data: {
          title: 'Mi Progreso Académico',
          icon: MdInsertChartOutlined,
          progressData: progressData,
          totalCareers: activeEnrollments.length
        },
        card2Data: {
          title: activeEnrollments.length > 1 ? 'Mis Carreras' : 'Mi Carrera',
          icon: MdOutlineSchool,
          enrollments: activeEnrollments.map(enrollment => ({
            careerName: enrollment.careerName,
            registrationNumber: enrollment.registrationNumber,
            status: enrollment.status,
            enrolledAt: enrollment.enrolledAt
          })),
          totalCareers: activeEnrollments.length
        }
      };
    } catch (error) {
      throw new Error('Error al cargar datos de estudiante: ' + error.message);
    }
  };

  // Cargar datos según el rol del usuario
  const loadRoleData = async () => {
    setRoleData(prev => ({ ...prev, loading: true, error: null }));

    try {
      let data = { card1Data: null, card2Data: null };

      switch (user.role?.name || user.role) {
        case 'ADMIN':
          data = await loadAdminData();
          break;
        case 'TEACHER':
          data = await loadTeacherData();
          break;
        case 'SUPERVISOR':
          data = await loadSupervisorData();
          break;
        case 'STUDENT':
          data = await loadStudentData();
          break;
        default:
          data = {
            card1Data: { title: 'Sin información', message: 'Rol no reconocido' },
            card2Data: { title: 'Sin información', message: 'Rol no reconocido' }
          };
      }

      setRoleData({
        loading: false,
        error: null,
        ...data
      });
    } catch (error) {
      console.error('Error loading role data:', error);
      setRoleData({
        loading: false,
        error: error.message,
        card1Data: null,
        card2Data: null
      });
    }
  };

  // Effects existentes
  useEffect(() => {
    if (location.state?.shouldChangePassword) {
      setIsOpening(true);

      setTimeout(() => {
        if (changePasswordButtonRef.current) {
          changePasswordButtonRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          setTimeout(() => {
            changePasswordButtonRef.current.click();
            setIsOpening(false);
          }, 500);
        } else {
          setIsOpening(false);
        }
      }, 1000);

      if (location.state) {
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state]);

  useEffect(() => {
    let _val = 0;
    interval.current = setInterval(() => {
      _val += Math.floor(Math.random() * 10) + 1;
      if (_val >= 100) {
        _val = 100;
        clearInterval(interval.current);
      }
      setValue(_val);
    }, 2000);

    return () => clearInterval(interval.current);
  }, []);

  useEffect(() => {
    const modalEl = changePasswordModalRef.current;
    if (!modalEl) return;

    const handleHidden = () => changePasswordButtonRef.current?.blur();
    const swallowEnter = (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    modalEl.addEventListener('hidden.bs.modal', handleHidden);
    modalEl.addEventListener('keydown', swallowEnter, true);

    return () => {
      modalEl.removeEventListener('hidden.bs.modal', handleHidden);
      modalEl.removeEventListener('keydown', swallowEnter, true);
    };
  }, []);

  // Cargar datos del rol al montar el componente
  useEffect(() => {
    if (user) {
      loadRoleData();
    }
  }, [user]);

  // Funciones existentes de formateo y validación
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  };

  const personalInfo = [
    {
      label: 'Nombre Completo',
      value: `${user.name || ''} ${user.paternalSurname || ''} ${user.maternalSurname || ''}`.trim(),
    },
    {
      label: 'Correo electrónico',
      value: user.email || 'Sin email',
    },
    {
      label: 'Contraseña',
      value: '************',
    },
    ...(user.role.name === 'TEACHER' || user.role.name === 'STUDENT'
      ? [
          {
            label: 'Matrícula',
            value: user.registrationNumber || (user.additionalEnrollmentsCount > 0 ? `${user.registrationNumber} +${user.additionalEnrollmentsCount}` : 'Sin matrícula'),
          },
        ]
      : []),
    {
      label: 'Fecha de alta',
      value: formatDate(user.createdAt),
    },
    {
      label: 'Estado',
      value: user.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
    },
  ];

  // Funciones existentes de validación y manejo de contraseña
  const validateForm = () => {
    if (!currentPassword.trim()) {
      showError('Error', 'La contraseña actual es requerida');
      return false;
    }
    if (!newPassword.trim()) {
      showError('Error', 'La nueva contraseña es requerida');
      return false;
    }
    if (newPassword.length < 8) {
      showError('Error', 'La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (!confirmPassword.trim()) {
      showError('Error', 'Debes confirmar tu nueva contraseña');
      return false;
    }
    if (newPassword !== confirmPassword) {
      showError('Error', 'Las contraseñas no coinciden');
      return false;
    }
    if (currentPassword === newPassword) {
      showError('Error', 'La nueva contraseña debe ser diferente a la actual');
      return false;
    }
    return true;
  };

  const clearForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsSubmitting(false);
  };

  const handleKeyDown = (e, nextFieldId, isLast = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (isLast) {
        e.target.blur();
        setTimeout(() => !isSubmitting && handlePasswordReset(), 200);
      } else {
        document.getElementById(nextFieldId)?.focus();
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!validateForm()) return;

    confirmAction({
      message: '¿Estás seguro de que quieres cambiar tu contraseña?',
      header: 'Cambiar contraseña',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      onAccept: async () => {
        setIsSubmitting(true);
        try {
          await changePassword(currentPassword, newPassword);
          showSuccess('Contraseña cambiada', 'Tu contraseña ha sido cambiada exitosamente.');
          Modal.getInstance(changePasswordModalRef.current)?.hide();
          clearForm();
        } catch (error) {
          if (error.status === 401) showError('Error', 'La contraseña actual es incorrecta');
          else if (error.status === 400) showError('Error', error.message || 'Datos inválidos');
          else if (error.status === 404) showError('Error', 'Usuario no encontrado');
          else showError('Error', 'No se pudo cambiar la contraseña');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleModalClose = () => {
    if (!isSubmitting) clearForm();
    changePasswordButtonRef.current?.blur();
  };

  const isShortPass = newPassword && newPassword.length < 8;
  const isMismatch = confirmPassword && newPassword && newPassword !== confirmPassword;

  // Helper para obtener labels de días
  const getWeekLabel = (code) => {
    const weekDayOptions = [
      { label: 'Lunes', value: 'LUN' },
      { label: 'Martes', value: 'MAR' },
      { label: 'Miércoles', value: 'MIE' },
      { label: 'Jueves', value: 'JUE' },
      { label: 'Viernes', value: 'VIE' },
      { label: 'Sábado', value: 'SAB' },
      { label: 'Domingo', value: 'DOM' },
    ];
    return weekDayOptions.find((o) => o.value === code)?.label || code;
  };

  // Renderizar cards dinámicos por rol
  const renderCard1 = () => {
    if (roleData.loading) {
      return (
        <div className="card border-0 h-100">
          <div className="card-body d-flex justify-content-center align-items-center">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        </div>
      );
    }

    if (roleData.error) {
      return (
        <div className="card border-0 h-100">
          <div className="card-body">
            <Message severity="error" text={roleData.error} />
          </div>
        </div>
      );
    }

    const { card1Data } = roleData;
    if (!card1Data) {
      // Para SUPERVISOR que no tiene cards
      return (
        <div className="card border-0 h-100">
          <div className="card-body">
            <div className="d-flex justify-content-center align-items-center text-muted h-75">
              Funcionalidad en desarrollo
            </div>
          </div>
        </div>
      );
    }

    const IconComponent = card1Data.icon;

    return (
      <div className="card border-0 h-100">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className="title-icon p-1 rounded-circle">
              <IconComponent size={40} className="p-1" />
            </div>
            <h6 className="text-blue-500 fw-semibold ms-2 mb-0 text-truncate">{card1Data.title}</h6>
          </div>

          <div className="mt-3">
            {/* ADMIN - Gestión del Plantel */}
            {user.role?.name === 'ADMIN' && card1Data.tasks && (
              <div>
                <div className="mb-3">
                  <small className="text-muted">
                    Plantel: <strong>{card1Data.campusName}</strong>
                  </small>
                </div>
                <div className="row text-center mb-3">
                  <div className="col-6">
                    <div className="text-blue-500 fs-5 fw-bold">{card1Data.totalCareers}</div>
                    <small className="text-muted">Carreras</small>
                  </div>
                  <div className="col-6">
                    <div className="text-blue-500 fs-5 fw-bold">{card1Data.totalTeachers}</div>
                    <small className="text-muted">Docentes</small>
                  </div>
                </div>
                <div className="d-grid gap-2">
                  {card1Data.tasks.map((task, index) => (
                    <div key={index} className="d-flex justify-content-between align-items-center">
                      <span className="text-secondary small">{task.label}</span>
                      <Badge 
                        value={task.count} 
                        severity={task.severity}
                        size="large"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEACHER - Mis Grupos */}
            {user.role?.name === 'TEACHER' && (
              <div>
                <div className="row text-center mb-3">
                  <div className="col-6">
                    <div className="text-blue-500 fs-4 fw-bold">{card1Data.activeGroups}</div>
                    <small className="text-muted">Grupos activos</small>
                  </div>
                  <div className="col-6">
                    <div className="text-blue-500 fs-4 fw-bold">{card1Data.totalStudents}</div>
                    <small className="text-muted">Estudiantes</small>
                  </div>
                </div>
                
                {card1Data.groups && card1Data.groups.length > 0 && (
                  <div className="mb-3">
                    <small className="fw-semibold text-muted">Mis grupos:</small>
                    <div className="overflow-y-auto" style={{ maxHeight: '7rem' }}>
                      {card1Data.groups.map((group, index) => (
                        <div key={index} className="small text-muted d-flex justify-content-between mb-1">
                          <span>• {group.careerName} - Grupo {group.name}</span>
                          <Badge value={group.studentsCount} severity="info" size="small" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {card1Data.todayGroups && card1Data.todayGroups.length > 0 && (
                  <div>
                    <small className="fw-semibold text-muted">Hoy {getWeekLabel(card1Data.currentWeekDay)}:</small>
                    {card1Data.todayGroups.map((group, index) => (
                      <div key={index} className="small text-success">
                        • {group.startTime} - {group.endTime} ({group.name})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STUDENT - Progreso Académico por carrera */}
            {user.role?.name === 'STUDENT' && (
              <div>
                {card1Data.message ? (
                  <Message severity="info" text={card1Data.message} />
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: '13rem' }}>
                    {card1Data.progressData.map((careerProgress, index) => (
                      <div key={index} className={`mb-3 p-3 border rounded ${careerProgress.progress === 100 && 'hovereable'} ${index > 0 ? 'mt-3' : ''}`} onClick={careerProgress.progress === 100 && (() => navigate('/student/teacher-evaluation'))}>
                        <div className="mb-2">
                          <small className="fw-semibold">{careerProgress.careerName}</small>
                          {careerProgress.hasGroup && (
                            <small className="text-muted d-block">Grupo: {careerProgress.groupName}</small>
                          )}
                        </div>
                        <div className="mb-2">
                          <small className="text-muted">Período: {careerProgress.period}</small>
                        </div>
                        {careerProgress.hasGroup ? (
                          <>
                            <div className="mb-2">
                              <small className='text-muted'>Progreso académico: {careerProgress.completedSubjects} de {careerProgress.totalSubjects} materias</small>
                              <ProgressBar value={careerProgress.progress} className="mt-1" />
                            </div>
                          </>
                        ) : (
                          <small className="text-warning">Sin grupo asignado</small>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {card1Data.message && !card1Data.progressData && !card1Data.campusName && !card1Data.activeGroups && (
              <div className="d-flex justify-content-center align-items-center text-muted h-75">
                {card1Data.message}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCard2 = () => {
    if (roleData.loading) {
      return (
        <div className="card border-0 h-100">
          <div className="card-body d-flex justify-content-center align-items-center">
            <ProgressSpinner style={{ width: '40px', height: '40px' }} />
          </div>
        </div>
      );
    }

    if (roleData.error) {
      return (
        <div className="card border-0 h-100">
          <div className="card-body">
            <Message severity="error" text={roleData.error} />
          </div>
        </div>
      );
    }

    const { card2Data } = roleData;
    if (!card2Data) {
      return (
        <div className="card border-0 h-100">
          <div className="card-body">
            <div className="d-flex justify-content-center align-items-center text-muted h-75">
              Sin información adicional
            </div>
          </div>
        </div>
      );
    }

    const IconComponent = card2Data.icon;

    return (
      <div className="card border-0 h-100">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className="title-icon p-1 rounded-circle">
              <IconComponent size={40} className="p-1" />
            </div>
            <h6 className="text-blue-500 fw-semibold ms-2 mb-0 text-truncate">{card2Data.title}</h6>
          </div>

          <div className="mt-3">
            {/* ADMIN - Solo Notificaciones */}
            {user.role?.name === 'ADMIN' && (
              <div className="text-center">
                {card2Data.hasNotifications ? (
                  <>
                    <div className="mb-3">
                      <Badge 
                        value={card2Data.pendingNotifications} 
                        severity="warning" 
                        size="large"
                        style={{ fontSize: '1.2rem' }}
                      />
                    </div>
                    <p className="text-secondary mb-3">
                      {card2Data.pendingNotifications} notificación{card2Data.pendingNotifications > 1 ? 'es' : ''} pendiente{card2Data.pendingNotifications > 1 ? 's' : ''}
                    </p>
                    <Button 
                      icon="pi pi-bell" 
                      label="Ver notificaciones"
                      size="small"
                      className="p-button-warning"
                      onClick={card2Data.clickAction}
                    />
                  </>
                ) : (
                  <>
                    <div className="mb-3">
                      <i className="pi pi-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                    </div>
                    <p className="text-muted">
                      Todo está en orden.<br/>
                      No hay notificaciones pendientes.
                    </p>
                  </>
                )}
              </div>
            )}

            {/* TEACHER - Mi Evaluación */}
            {user.role?.name === 'TEACHER' && (
              <div className="text-center">
                {card2Data.hasEvaluations ? (
                  <>
                    <div className='d-flex justify-content-center'>
                      <Rating 
                        value={Math.round(card2Data.averageRating)} 
                        readOnly 
                        cancel={false} 
                        className="mb-3" 
                      />
                    </div>
                    <div className="text-center mb-3">
                      <p className="fs-1 fw-bold text-blue-500 mb-0">
                        {card2Data.averageRating.toFixed(1)}
                      </p>
                    </div>
                    <small className="text-muted">
                      Mi promedio de todos los grupos<br/>                      
                    </small>
                  </>
                ) : (
                  <div>
                    <Rating value={0} readOnly cancel={false} className="mb-3" />
                    <p className="text-muted">Aún no tienes evaluaciones</p>
                  </div>
                )}
              </div>
            )}

            {/* STUDENT - Mis Carreras */}
            {user.role?.name === 'STUDENT' && (
              <div>
                <div className="overflow-y-auto" style={{ maxHeight: '18rem' }}>
                  {card2Data.enrollments && card2Data.enrollments.map((enrollment, index) => (
                    <div key={index} className="mb-2 p-2 border rounded">
                      <div className='d-flex justify-content-between align-items-center'>
                        <div className="fw-semibold small">{enrollment.careerName}</div>
                        <Badge 
                          value={enrollment.status === 'ACTIVE' ? 'Activo' : 'Inactivo'} 
                          severity={enrollment.status === 'ACTIVE' ? 'success' : 'danger'}
                          size="small"
                        />
                      </div>
                      <small className="text-muted d-block">
                        Matrícula: {enrollment.registrationNumber}
                      </small>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          Inscripción: {formatDate(enrollment.enrolledAt)}
                        </small>
                        
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Perfil</h3>
      </div>

      {/* PRIMERA FILA - NO MODIFICAR: Avatar + Información Personal */}
      <div className="row mt-3">
        <div className="col-12 col-md-4 mb-3 mb-md-0">
          <div className="card border-0 h-100">
            <div className="card-body">
              <div className="d-flex flex-column align-items-center mt-2 mb-3">
                <ProfileAvatarUpload />
              </div>

              <div className="text-center mb-3 mt-2">
                <h5 className="text-blue-500 fw-semibold mb-0">
                  {user.name} {user.paternalSurname || ''} {user.maternalSurname || ''}
                </h5>
                <p className="text-secondary my-2">{roleLabel || 'Sin rol'}</p>
                <div className="d-flex flex-row justify-content-center mt-4 gap-2">
                  <Button 
                    ref={changePasswordButtonRef} 
                    label="Cambiar contraseña" 
                    icon={isOpening ? 
                      <i className="pi pi-spin pi-spinner me-2"></i> : 
                      <MdOutlineLock className="me-2" size={20} />
                    } 
                    onClick={() => new Modal(changePasswordModalRef.current).show()} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-8 mb-3 mb-md-0">
          <div className="card border-0 h-100">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="title-icon p-1 rounded-circle">
                  <MdOutlinePerson size={40} className="p-1" />
                </div>
                <h6 className="text-blue-500 fw-semibold ms-2 mb-0 text-truncate">Información Personal</h6>
              </div>

              <div className="mt-3">
                <div className="table-responsive">
                  <table className="table table-borderless">
                    <tbody>
                      {personalInfo.map((info, index) => (
                        <tr key={index}>
                          <td className="text-secondary fw-medium text-nowrap ps-3" style={{ width: '40%', verticalAlign: 'middle' }}>
                            {info.label}
                          </td>
                          <td className="text-dark text-nowrap" style={{ verticalAlign: 'middle' }}>
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

      {/* SEGUNDA FILA - CARDS DINÁMICOS POR ROL */}
      {roleLabel !== 'Supervisor' && (
        <div className="row mt-0 mt-md-3">
          <div className="col-12 col-md-4 mb-3 mb-md-0">
            {renderCard1()}
          </div>
          <div className="col-12 col-md-8 mb-3 mb-md-0">
            {renderCard2()}
          </div>
        </div>
      )}

      {/* Modal de cambio de contraseña - SIN CAMBIOS */}
      <div className="modal fade" ref={changePasswordModalRef} tabIndex={-1} data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Cambiar contraseña</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={handleModalClose} disabled={isSubmitting} />
            </div>

            <div className="modal-body">
              <PasswordInput id="currentPassword" label="Contraseña actual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'newPassword')} disabled={isSubmitting} autoFocus />
              <PasswordInput id="newPassword" label="Nueva contraseña" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} onKeyDown={(e) => handleKeyDown(e, 'confirmPassword')} disabled={isSubmitting} />
              <PasswordInput id="confirmPassword" label="Confirmar contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} onKeyDown={(e) => handleKeyDown(e, '', true)} disabled={isSubmitting} />

              <AnimatePresence>
                {isShortPass && (
                  <motion.div key="short" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <Message severity="error" text="La nueva contraseña debe tener al menos 8 caracteres" className="w-100 mb-2" style={{ borderLeft: '6px solid #d32f2f' }} />
                  </motion.div>
                )}
                {isMismatch && (
                  <motion.div key="mismatch" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}>
                    <Message severity="error" text="Las contraseñas no coinciden" className="w-100" style={{ borderLeft: '6px solid #d32f2f' }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="modal-footer">
              <Button type="button" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" onClick={handleModalClose} disabled={isSubmitting}>
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="button" icon="pi pi-check" severity="primary" disabled={isSubmitting} loading={isSubmitting} onClick={handlePasswordReset}>
                <span className="d-none d-sm-inline ms-1">{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
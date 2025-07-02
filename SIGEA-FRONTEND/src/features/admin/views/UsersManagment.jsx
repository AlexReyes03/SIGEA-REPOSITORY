import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Checkbox } from 'primereact/checkbox';
import { Toolbar } from 'primereact/toolbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { MdOutlineGroup } from 'react-icons/md';
import { Toast } from 'primereact/toast';
import * as bootstrap from 'bootstrap';

import { getUserByRole, getUserByRoleAndPlantel, createUser, updateUser, toggleUserStatus } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { createEnrollment, generateRegistrationNumber, getEnrollmentsByUser, updateEnrollmentRegistration, deleteEnrollment, canRemoveUserFromCareer } from '../../../api/academics/enrollmentService';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { useAuth } from '../../../contexts/AuthContext';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';

const STATUS_CONFIG = {
  ACTIVE: { name: 'ACTIVE', label: 'Activo', severity: 'success' },
  INACTIVE: { name: 'INACTIVE', label: 'Inactivo', severity: 'danger' },
  Activo: { name: 'ACTIVE', label: 'Activo', severity: 'success' },
  Inactivo: { name: 'INACTIVE', label: 'Inactivo', severity: 'danger' },
};

const ROLE_LABELS = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  TEACHER: 'Maestro',
  STUDENT: 'Estudiante',
};

const ROLE_NEEDS_CAREERS = ['TEACHER', 'STUDENT'];

const DEFAULT_ROLES = [
  { id: 1, roleName: 'ADMIN' },
  { id: 2, roleName: 'SUPERVISOR' },
  { id: 3, roleName: 'TEACHER' },
  { id: 4, roleName: 'STUDENT' },
];

const INITIAL_USER_STATE = {
  name: '',
  paternalSurname: '',
  maternalSurname: '',
  email: '',
  roleId: '',
  status: 'ACTIVE',
};

const getStatusConfig = (status) => STATUS_CONFIG[status] || { name: status, label: status, severity: 'info' };
const getRoleFriendlyName = (roleName) => ROLE_LABELS[roleName] || roleName;

const extractMatriculaParts = (registrationNumber) => {
  if (!registrationNumber) return { year: '', differentiator: '', last4: '' };

  const match = registrationNumber.match(/^(\d{2})([A-Z0-9]+)(\d{4})$/);
  if (match) {
    return {
      year: match[1],
      differentiator: match[2],
      last4: match[3],
    };
  }

  if (registrationNumber.length >= 4) {
    return {
      year: new Date().getFullYear().toString().slice(-2),
      differentiator: '',
      last4: registrationNumber.slice(-4),
    };
  }

  return { year: new Date().getFullYear().toString().slice(-2), differentiator: '', last4: '0001' };
};

const buildFullRegistrationNumber = (year, differentiator, last4) => {
  return `${year}${differentiator}${last4.padStart(4, '0')}`;
};

const extractLast4Digits = (registrationNumber) => {
  if (!registrationNumber) return '';
  const match = registrationNumber.match(/(\d{4})$/);
  return match ? match[1] : '';
};

const buildFullRegistrationNumberForEdit = (enrollment, newLast4) => {
  const { registrationNumber } = enrollment;
  if (!registrationNumber) return '';

  const prefix = registrationNumber.replace(/\d{4}$/, '');
  return `${prefix}${newLast4.padStart(4, '0')}`;
};

export default function UsersManagement() {
  const dt = useRef(null);
  const toast = useRef(null);
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  const openModalBtnRef = useRef(null);
  const { user } = useAuth();
  const { showError, showSuccess, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();

  const [users, setUsers] = useState([]);
  const [cachedUsersByRole, setCachedUsersByRole] = useState({});
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [originalUserEnrollments, setOriginalUserEnrollments] = useState([]);
  const [enrollmentInputs, setEnrollmentInputs] = useState({});
  const [roles, setRoles] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedTipoUsuario, setSelectedTipoUsuario] = useState(null);
  const [selected, setSelected] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [formData, setFormData] = useState({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '' });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [careerChips, setCareerChips] = useState([]);
  const [editCareerChips, setEditCareerChips] = useState([]);
  const [registerMore, setRegisterMore] = useState(false);
  const [generatingMatriculas, setGeneratingMatriculas] = useState(false);

  useBootstrapModalFocus(createModalRef, openModalBtnRef);
  useBootstrapModalFocus(editModalRef, null);

  const rolesMap = useMemo(() => {
    const map = {};
    roles.forEach((role) => {
      map[role.id] = role;
      map[role.roleName] = role;
    });
    return map;
  }, [roles]);

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: getRoleFriendlyName(role.roleName),
        value: role.id,
      })),
    [roles]
  );

  const getCurrentRole = useMemo(() => {
    const roleId = formData.roleId || selectedTipoUsuario;
    if (!roleId) return null;
    return rolesMap[roleId];
  }, [formData.roleId, selectedTipoUsuario, rolesMap]);

  const currentRoleNeedsCareers = useMemo(() => {
    if (!getCurrentRole) return false;
    return ROLE_NEEDS_CAREERS.includes(getCurrentRole.roleName);
  }, [getCurrentRole]);

  const careerOptions = useMemo(
    () =>
      careers.map((career) => ({
        label: `${career.name} - ${career.differentiator}`,
        value: career.id,
        differentiator: career.differentiator,
        name: career.name,
      })),
    [careers]
  );

  const getRoleLabel = useCallback(
    (roleName, roleId) => {
      const role = rolesMap[roleId] || rolesMap[roleName];
      return role ? getRoleFriendlyName(role.roleName) : 'Sin rol';
    },
    [rolesMap]
  );

  const updateLast4Digits = (enrollmentId, newLast4) => {
    setEnrollmentInputs((prev) => ({
      ...prev,
      [enrollmentId]: newLast4,
    }));
  };

const processedUsers = useMemo(() => {
  if (!Array.isArray(users)) return [];

  return users
    .filter((userItem) => userItem.id !== user.id)
    .map((userItem) => {
      const roleLabel = getRoleLabel(userItem.roleName, userItem.roleId);
      const statusLabel = getStatusConfig(userItem.status).label;
      const fullName = `${userItem.name || ''} ${userItem.paternalSurname || ''} ${userItem.maternalSurname || ''}`.trim();

      let displayRegistration = '';
      if (userItem.primaryRegistrationNumber) {
        displayRegistration = userItem.primaryRegistrationNumber;
        if (userItem.additionalEnrollmentsCount > 0) {
          displayRegistration += ` +${userItem.additionalEnrollmentsCount}`;
        }
      }

      const displayCreatedAt = userItem.createdAt
        ? new Date(userItem.createdAt).toLocaleDateString('es-MX', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
        : '';

      return {
        ...userItem,
        fullName,
        roleLabel,
        statusLabel,
        displayRegistration,
        searchableRole: `${userItem.roleName || ''} ${roleLabel}`.toLowerCase(),
        searchableStatus: `${userItem.status || ''} ${statusLabel}`.toLowerCase(),
        displayCreatedAt,
      };
    });
}, [users, getRoleLabel, user.id]);


  const generateMatriculaForCareer = async (careerId) => {
    try {
      const matricula = await generateRegistrationNumber(careerId);
      return matricula;
    } catch (error) {
      console.error('Error generating matricula:', error);
      throw error;
    }
  };

  const handleCareerSelection = async (selectedCareerIds) => {
    setSelectedCareers(selectedCareerIds);
    setGeneratingMatriculas(true);

    try {
      const newChips = [];

      for (const careerId of selectedCareerIds) {
        const career = careers.find((c) => c.id === careerId);
        if (career) {
          try {
            const matricula = await generateMatriculaForCareer(careerId);
            const parts = extractMatriculaParts(matricula);

            newChips.push({
              careerId: careerId,
              careerName: career.name,
              differentiator: career.differentiator,
              matricula: matricula,
              year: parts.year,
              last4: parts.last4,
              editable: false,
            });
          } catch (error) {
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const defaultMatricula = buildFullRegistrationNumber(currentYear, career.differentiator, '0001');

            newChips.push({
              careerId: careerId,
              careerName: career.name,
              differentiator: career.differentiator,
              matricula: defaultMatricula,
              year: currentYear,
              last4: '0001',
              editable: true,
              hasError: true,
            });
          }
        }
      }

      setCareerChips(newChips);
    } catch (error) {
      showError('Error', 'Error al generar algunas matrículas');
    } finally {
      setGeneratingMatriculas(false);
    }
  };

  const updateChipMatricula = (careerId, newYear, newLast4) => {
    setCareerChips((prev) =>
      prev.map((chip) => {
        if (chip.careerId === careerId) {
          const year = newYear !== undefined ? newYear : chip.year;
          const last4 = newLast4 !== undefined ? newLast4 : chip.last4;
          const newMatricula = buildFullRegistrationNumber(year, chip.differentiator, last4);

          return {
            ...chip,
            matricula: newMatricula,
            year: year,
            last4: last4,
            hasError: false,
          };
        }
        return chip;
      })
    );
  };

  const removeCareerChip = (careerId) => {
    setCareerChips((prev) => prev.filter((chip) => chip.careerId !== careerId));
    setSelectedCareers((prev) => prev.filter((id) => id !== careerId));
  };

  // Función optimizada para cargar usuarios por rol y plantel con cache
  const loadUsersByRoleAndPlantel = useCallback(
    async (roleId, plantelId) => {
      const cacheKey = `${roleId}_${plantelId}`;

      // Verificar si ya tenemos los datos en cache
      if (cachedUsersByRole[cacheKey]) {
        setUsers(cachedUsersByRole[cacheKey]);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserByRoleAndPlantel(roleId, plantelId);
        const usersArray = Array.isArray(data) ? data : [];

        // Guardar en cache
        setCachedUsersByRole((prev) => ({
          ...prev,
          [cacheKey]: usersArray,
        }));

        setUsers(usersArray);
      } catch (error) {
        console.error('Error loading data:', error);
        setUsers([]);
        showError('Error', 'No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    },
    [cachedUsersByRole, showError]
  );

  // Función para refrescar datos manualmente
  const refreshCurrentView = useCallback(async () => {
    if (!selectedTipoUsuario || !user?.campus?.id) return;

    setRefreshing(true);
    const cacheKey = `${selectedTipoUsuario}_${user.campus.id}`;

    // Limpiar cache para este rol específico y recargar
    setCachedUsersByRole((prev) => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });

    try {
      const data = await getUserByRoleAndPlantel(selectedTipoUsuario, user.campus.id);
      const usersArray = Array.isArray(data) ? data : [];

      // Actualizar cache
      setCachedUsersByRole((prev) => ({
        ...prev,
        [cacheKey]: usersArray,
      }));

      setUsers(usersArray);
    } catch (error) {
      console.error('Error refreshing data:', error);
      showError('Error', 'No se pudieron actualizar los usuarios');
    } finally {
      setRefreshing(false);
    }
  }, [selectedTipoUsuario, user?.campus?.id, showError]);

  const reloadCurrentView = useCallback(() => {
    if (selectedTipoUsuario && user?.campus?.id) {
      const cacheKey = `${selectedTipoUsuario}_${user.campus.id}`;

      if (editingUser) {
        setCachedUsersByRole((prev) => {
          const newCache = { ...prev };
          if (newCache[cacheKey]) {
            newCache[cacheKey] = newCache[cacheKey].map((cachedUser) => (cachedUser.id === editingUser.id ? { ...cachedUser, needsRefresh: true } : cachedUser));
          }
          return newCache;
        });
      }

      setCachedUsersByRole((prev) => {
        const newCache = { ...prev };
        delete newCache[cacheKey];
        return newCache;
      });

      loadUsersByRoleAndPlantel(selectedTipoUsuario, user.campus.id);
    }
  }, [selectedTipoUsuario, user?.campus?.id, loadUsersByRoleAndPlantel, editingUser]);

  const loadCareers = useCallback(async () => {
    try {
      const data = await getCareerByPlantelId(user?.campus?.id);
      setCareers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading careers:', error);
      setCareers([]);
    }
  }, [user?.campus?.id]);

  // Effects
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const data = await getAllRoles();
        setRoles(Array.isArray(data) ? data : DEFAULT_ROLES);
      } catch (error) {
        setRoles(DEFAULT_ROLES);
        showError('Error', 'No se pudieron cargar los roles desde el servidor. Usando configuración por defecto.');
      }
    };
    loadRoles();
    loadCareers();
  }, [showError, loadCareers]);

  useEffect(() => {
    if (roles.length > 0 && isInitialLoad && user?.campus?.id) {
      const studentRole = roles.find((role) => role.roleName === 'STUDENT' || role.id === 4);
      if (studentRole) {
        setSelectedTipoUsuario(studentRole.id);
        loadUsersByRoleAndPlantel(studentRole.id, user.campus.id);
      }
      setIsInitialLoad(false);
    }
  }, [roles, isInitialLoad, user?.campus?.id, loadUsersByRoleAndPlantel]);

  useEffect(() => {
    if (!isInitialLoad && selectedTipoUsuario && user?.campus?.id) {
      loadUsersByRoleAndPlantel(selectedTipoUsuario, user.campus.id);
    }
  }, [selectedTipoUsuario, isInitialLoad, user?.campus?.id, loadUsersByRoleAndPlantel]);

  // función para manejar confirmación de eliminación de carreras
  const handleCareerRemovalWithConfirmation = useCallback(
    (removedCareerIds, onConfirm) => {
      if (removedCareerIds.length === 0) {
        onConfirm();
        return;
      }

      const removedCareers = careers.filter((career) => removedCareerIds.includes(career.id));
      const careerNames = removedCareers.map((c) => c.name).join(', ');

      confirmAction({
        message: `¿Estás seguro de que deseas eliminar las siguientes carreras del usuario?\n\n${careerNames}\n\nEsta acción no se puede deshacer.`,
        header: 'Confirmar eliminación de carreras',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        acceptLabel: 'Sí, eliminar',
        rejectLabel: 'Cancelar',
        onAccept: onConfirm,
      });
    },
    [careers, confirmAction]
  );

  const handleFormSubmit = useCallback(
    async (e, isEdit = false) => {
      e.preventDefault();
      try {
        setLoading(true);

        const finalRoleId = formData.roleId || selectedTipoUsuario;

        if (!formData.name || !formData.paternalSurname || !formData.email || !finalRoleId) {
          showWarn('Campos incompletos', 'Por favor llena todos los campos obligatorios.');
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          showWarn('Email inválido', 'Por favor ingresa un email válido.');
          return;
        }

        const userData = {
          ...formData,
          roleId: finalRoleId,
          maternalSurname: formData.maternalSurname || null,
          plantelId: formData.plantelId || null,
        };

        if (!isEdit) {
          userData.password = 'usuarioCetec@';
        }

        let savedUser;
        if (isEdit) {
          // Detectar carreras que se van a eliminar antes de proceder
          if (currentRoleNeedsCareers && originalUserEnrollments.length > 0) {
            const originalCareerIds = originalUserEnrollments.map((e) => e.careerId);
            const removedCareerIds = originalCareerIds.filter((careerId) => !selectedCareers.includes(careerId));

            if (removedCareerIds.length > 0) {
              handleCareerRemovalWithConfirmation(removedCareerIds, async () => {
                await proceedWithUserUpdate();
              });
              return;
            }
          }
          await proceedWithUserUpdate();
        } else {
          if (!formData.plantelId) {
            showWarn('Campos incompletos', 'Por favor llena todos los campos obligatorios.');
            return;
          }

          savedUser = await createUser(userData);

          if (currentRoleNeedsCareers && careerChips.length > 0) {
            for (const chip of careerChips) {
              try {
                await createEnrollment({
                  userId: savedUser.id,
                  careerId: chip.careerId,
                  customRegistrationNumber: chip.matricula,
                });
              } catch (enrollmentError) {
                console.error('Error creating enrollment:', enrollmentError);
                showWarn('Advertencia', `Usuario creado pero hubo un error al inscribirlo en ${chip.careerName}`);
              }
            }
          }

          showSuccess('Éxito', 'Usuario registrado correctamente');

          if (registerMore) {
            setFormData({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '', roleId: finalRoleId });
            setSelectedCareers([]);
            setCareerChips([]);
            setEditCareerChips([]);
            setUserEnrollments([]);
            setOriginalUserEnrollments([]);
            setEnrollmentInputs({});
          } else {
            bootstrap.Modal.getInstance(createModalRef.current)?.hide();
            resetAllStates();
          }

          reloadCurrentView();
        }

        async function proceedWithUserUpdate() {
          try {
            savedUser = await updateUser(formData.id, userData);

            if (currentRoleNeedsCareers) {
              const updatePromises = userEnrollments
                .filter((enrollment) => selectedCareers.includes(enrollment.careerId))
                .map(async (enrollment) => {
                  const fullMatricula = enrollmentInputs[`${enrollment.id}_full`];
                  if (fullMatricula && fullMatricula !== enrollment.registrationNumber) {
                    return updateEnrollmentRegistration(enrollment.id, fullMatricula);
                  }
                  const newLast4 = enrollmentInputs[enrollment.id];
                  if (newLast4 && newLast4 !== extractLast4Digits(enrollment.registrationNumber)) {
                    const newFullRegistration = buildFullRegistrationNumberForEdit(enrollment, newLast4);
                    return updateEnrollmentRegistration(enrollment.id, newFullRegistration);
                  }
                  return null;
                })
                .filter((promise) => promise !== null);

              await Promise.all(updatePromises);

              for (const chip of editCareerChips) {
                try {
                  await createEnrollment({
                    userId: savedUser.id,
                    careerId: chip.careerId,
                    customRegistrationNumber: chip.matricula,
                  });
                } catch (enrollmentError) {
                  console.error('Error creating new enrollment:', enrollmentError);
                  showWarn('Advertencia', `Error al inscribir en ${chip.careerName}`);
                }
              }

              // Remover carreras (con validación de grupos)
              const existingCareerIds = originalUserEnrollments.map((e) => e.careerId);
              const removedCareerIds = existingCareerIds.filter((careerId) => !selectedCareers.includes(careerId));

              for (const careerId of removedCareerIds) {
                try {
                  const canRemove = await canRemoveUserFromCareer(savedUser.id, careerId);
                  if (!canRemove) {
                    const career = careers.find((c) => c.id === careerId);
                    showWarn('Advertencia', `No se puede quitar ${career?.name} porque el usuario tiene grupos activos`);
                    return;
                  }

                  const enrollment = originalUserEnrollments.find((e) => e.careerId === careerId);
                  if (enrollment) {
                    await deleteEnrollment(enrollment.id);
                  }
                } catch (error) {
                  console.error('Error removing enrollment:', error);
                  const career = careers.find((c) => c.id === careerId);
                  showWarn('Advertencia', `Error al quitar ${career?.name || 'carrera'}`);
                }
              }
            }

            showSuccess('Éxito', `Usuario ${formData.name} actualizado correctamente`);
            bootstrap.Modal.getInstance(editModalRef.current)?.hide();
            resetAllStates();
            reloadCurrentView();
          } catch (updateError) {
            console.error('Error updating user:', updateError);
            throw updateError;
          }
        }
      } catch (err) {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} user:`, err);
        const message = err.response?.data?.message || `No se pudo ${isEdit ? 'actualizar' : 'registrar'} el usuario`;
        showError('Error', message);
      } finally {
        setLoading(false);
      }
    },
    [
      formData,
      selectedTipoUsuario,
      user?.campus?.id,
      currentRoleNeedsCareers,
      careerChips,
      editCareerChips,
      registerMore,
      userEnrollments,
      originalUserEnrollments,
      enrollmentInputs,
      selectedCareers,
      careers,
      showWarn,
      showSuccess,
      showError,
      reloadCurrentView,
      handleCareerRemovalWithConfirmation,
    ]
  );

  const handleToggleStatus = useCallback(
    async (userIds, userData) => {
      const isMultiple = Array.isArray(userIds);

      if (isMultiple) {
        const firstUser = processedUsers.find((u) => u.id === userIds[0]);
        const action = firstUser?.status === 'ACTIVE' ? 'desactivar' : 'activar';

        confirmAction({
          message: `¿Estás seguro de que deseas ${action} ${userIds.length} usuario(s) seleccionado(s)?`,
          header: `Confirmar ${action} múltiple`,
          icon: 'pi pi-exclamation-triangle',
          acceptClassName: firstUser?.status === 'ACTIVE' ? 'p-button-warning' : 'p-button-success',
          acceptLabel: action === 'desactivar' ? 'Sí, desactivar' : 'Sí, activar',
          onAccept: async () => {
            try {
              const promises = userIds.map(async (id) => {
                const targetUser = processedUsers.find((u) => u.id === id);
                return toggleUserStatus(id, targetUser?.status);
              });

              await Promise.all(promises);
              setSelected([]);
              showSuccess('Éxito', `${userIds.length} usuario(s) ${action === 'desactivar' ? 'desactivados' : 'activados'} correctamente`);
              reloadCurrentView();
            } catch (error) {
              showError('Error', `Error al ${action} los usuarios`);
            }
          },
        });
      } else {
        const currentStatus = userData.status;
        const action = currentStatus === 'ACTIVE' ? 'desactivar' : 'activar';
        const actionPast = currentStatus === 'ACTIVE' ? 'desactivado' : 'activado';

        confirmAction({
          message: `¿Estás seguro de que deseas ${action} al usuario ${userData.fullName}?`,
          header: `Confirmar ${action} usuario`,
          icon: 'pi pi-exclamation-triangle',
          acceptClassName: currentStatus === 'ACTIVE' ? 'p-button-warning' : 'p-button-success',
          acceptLabel: action === 'desactivar' ? 'Sí, desactivar' : 'Sí, activar',
          onAccept: async () => {
            try {
              await toggleUserStatus(userIds, currentStatus);
              showSuccess('Éxito', `Usuario ${userData.fullName} ${actionPast} correctamente`);
              reloadCurrentView();
            } catch (error) {
              showError('Error', `Error al ${action} el usuario`);
            }
          },
        });
      }
    },
    [processedUsers, confirmAction, showSuccess, showError, reloadCurrentView]
  );

  // Función para resetear todos los estados
  const resetAllStates = () => {
    setFormData({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '' });
    setSelectedCareers([]);
    setCareerChips([]);
    setEditCareerChips([]);
    setRegisterMore(false);
    setEditingUser(null);
    setUserEnrollments([]);
    setOriginalUserEnrollments([]);
    setEnrollmentInputs({});
  };

  const openModal = useCallback(
    async (userData = null) => {
      if (userData) {
        setEditingUser(userData); 
        setFormData({
          id: userData.id,
          name: userData.name || '',
          paternalSurname: userData.paternalSurname || '',
          maternalSurname: userData.maternalSurname || '',
          email: userData.email || '',
          roleId: userData.roleId || '',
          plantelId: userData.plantelId || '',
          status: userData.status || 'ACTIVE',
        });

        try {
          const enrollments = await getEnrollmentsByUser(userData.id);
          const activeEnrollments = enrollments.filter((e) => e.status === 'ACTIVE');

          console.log('Total enrollments:', enrollments.length);
          console.log('Active enrollments:', activeEnrollments.length);
          console.log(
            'Enrollments:',
            enrollments.map((e) => ({ id: e.id, careerName: e.careerName, status: e.status }))
          );

          setUserEnrollments(activeEnrollments);
          setOriginalUserEnrollments([...activeEnrollments]);

          const initialInputs = {};
          activeEnrollments.forEach((enrollment) => {
            initialInputs[enrollment.id] = extractLast4Digits(enrollment.registrationNumber);
          });
          setEnrollmentInputs(initialInputs);

          setSelectedCareers(activeEnrollments.map((e) => e.careerId));
          setEditCareerChips([]);
        } catch (error) {
          console.error('Error loading user enrollments:', error);
          setUserEnrollments([]);
          setOriginalUserEnrollments([]);
          setEnrollmentInputs({});
          setSelectedCareers([]);
          setEditCareerChips([]);
        }

        new bootstrap.Modal(editModalRef.current).show();
      } else {
        const initialFormData = {
          ...INITIAL_USER_STATE,
          plantelId: user?.campus?.id || '',
        };

        if (selectedTipoUsuario) {
          initialFormData.roleId = selectedTipoUsuario;
        }

        setFormData(initialFormData);
        setSelectedCareers([]);
        setCareerChips([]);
        setRegisterMore(false);
        setUserEnrollments([]);
        setOriginalUserEnrollments([]);
        setEnrollmentInputs({});
        new bootstrap.Modal(createModalRef.current).show();
      }
    },
    [user?.campus?.id, selectedTipoUsuario]
  );

  const handleEditCareerSelection = async (newSelectedCareerIds) => {
    setSelectedCareers(newSelectedCareerIds);

    const removedCareers = userEnrollments.filter((e) => !newSelectedCareerIds.includes(e.careerId)).map((e) => e.id);
    setEnrollmentInputs((prev) => {
      const updated = { ...prev };
      removedCareers.forEach((enrollmentId) => {
        delete updated[enrollmentId];
        delete updated[`${enrollmentId}_full`];
        delete updated[`${enrollmentId}_year`];
      });
      return updated;
    });

    const existingCareerIds = originalUserEnrollments.map((e) => e.careerId);
    const newCareerIds = newSelectedCareerIds.filter((careerId) => !existingCareerIds.includes(careerId));

    if (newCareerIds.length > 0) {
      const newChips = [];

      for (const careerId of newCareerIds) {
        const career = careers.find((c) => c.id === careerId);
        if (career) {
          try {
            const matricula = await generateMatriculaForCareer(careerId);
            const parts = extractMatriculaParts(matricula);

            newChips.push({
              careerId: careerId,
              careerName: career.name,
              differentiator: career.differentiator,
              matricula: matricula,
              year: parts.year,
              last4: parts.last4,
              isNew: true,
            });
          } catch (error) {
            const currentYear = new Date().getFullYear().toString().slice(-2);
            const defaultMatricula = buildFullRegistrationNumber(currentYear, career.differentiator, '0001');

            newChips.push({
              careerId: careerId,
              careerName: career.name,
              differentiator: career.differentiator,
              matricula: defaultMatricula,
              year: currentYear,
              last4: '0001',
              isNew: true,
              hasError: true,
            });
          }
        }
      }

      setEditCareerChips(newChips);
    } else {
      setEditCareerChips([]);
    }
  };

  const updateEditChipMatricula = (careerId, newYear, newLast4) => {
    setEditCareerChips((prev) =>
      prev.map((chip) => {
        if (chip.careerId === careerId) {
          const year = newYear !== undefined ? newYear : chip.year;
          const last4 = newLast4 !== undefined ? newLast4 : chip.last4;
          const newMatricula = buildFullRegistrationNumber(year, chip.differentiator, last4);

          return {
            ...chip,
            matricula: newMatricula,
            year: year,
            last4: last4,
            hasError: false,
          };
        }
        return chip;
      })
    );
  };

  const removeEditCareerChip = (careerId) => {
    setEditCareerChips((prev) => prev.filter((chip) => chip.careerId !== careerId));
    setSelectedCareers((prev) => prev.filter((id) => id !== careerId));
  };

  const updateExistingCareerMatricula = (enrollmentId, field, value) => {
    if (field === 'year') {
      // Para cambiar año de una carrera existente, necesitamos reconstruir toda la matrícula
      const enrollment = userEnrollments.find((e) => e.id === enrollmentId);
      if (enrollment) {
        const parts = extractMatriculaParts(enrollment.registrationNumber);
        const newYear = value || parts.year;
        const currentLast4 = enrollmentInputs[enrollmentId] || parts.last4;
        const newMatricula = buildFullRegistrationNumber(newYear, parts.differentiator, currentLast4);

        // Guardar toda la nueva matrícula, no solo los últimos 4 dígitos
        setEnrollmentInputs((prev) => ({
          ...prev,
          [`${enrollmentId}_full`]: newMatricula,
          [`${enrollmentId}_year`]: newYear,
          [enrollmentId]: currentLast4,
        }));
      }
    } else if (field === 'last4') {
      updateLast4Digits(enrollmentId, value);
    }
  };

  // Función para obtener preview de matrícula existente
  const getExistingCareerPreview = (enrollment) => {
    const fullMatricula = enrollmentInputs[`${enrollment.id}_full`];
    if (fullMatricula) {
      return fullMatricula;
    }

    const currentLast4 = enrollmentInputs[enrollment.id] || '';
    if (currentLast4) {
      return buildFullRegistrationNumberForEdit(enrollment, currentLast4);
    }

    return enrollment.registrationNumber;
  };

  const resetEditModal = () => {
    setEditCareerChips([]);
    setUserEnrollments([]);
    setOriginalUserEnrollments([]);
    setEnrollmentInputs({});
    setSelectedCareers([]);
    setEditingUser(null);
  };

  // Computed values
  const getCurrentFilterLabel = useCallback(() => {
    if (!selectedTipoUsuario) return 'Usuarios';
    return getRoleLabel(null, selectedTipoUsuario) || 'Usuarios';
  }, [selectedTipoUsuario, getRoleLabel]);

  const getModalTitle = useCallback(() => {
    if (!getCurrentRole) return 'Registrar nuevo usuario';
    return `Registrar ${getRoleFriendlyName(getCurrentRole.roleName)}`;
  }, [getCurrentRole]);

  const getRegisterButtonText = useCallback(() => {
    if (!selectedTipoUsuario) return 'Agregar Usuario';
    const role = rolesMap[selectedTipoUsuario];
    if (!role) return 'Agregar Usuario';
    return `Registrar ${getRoleFriendlyName(role.roleName)}`;
  }, [selectedTipoUsuario, rolesMap]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = e.target.form;
      const formElements = Array.from(form.elements).filter((el) => el.type !== 'submit' && el.type !== 'button' && !el.disabled && !el.hidden);
      const currentIndex = formElements.indexOf(e.target);
      const nextElement = formElements[currentIndex + 1];

      if (nextElement) {
        nextElement.focus();
      } else {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }
  }, []);

  const header = useMemo(
    () => (
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
        <div className="col-12 col-md d-flex align-items-center flex-wrap gap-2">
          <div className="title-icon p-1 rounded-circle">
            <MdOutlineGroup className="p-1" size={38} />
          </div>
          <h5 className="title-text ms-2 me-2 mb-0">{getCurrentFilterLabel()}</h5>
          <span className="badge bg-blue-500 p-2 me-2">{processedUsers.length}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <InputText placeholder="Buscar ..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} disabled={loading} className="me-2" style={{ minWidth: '250px' }} />
          <Button icon={refreshing ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'} severity="primary" onClick={refreshCurrentView} disabled={loading || refreshing || !selectedTipoUsuario} tooltip="Actualizar datos" tooltipOptions={{ position: 'top' }} />
          <Button icon="pi pi-upload" outlined={loading || !processedUsers.length} severity="help" onClick={() => dt.current?.exportCSV()} disabled={loading || !processedUsers.length}>
            <span className="d-none d-sm-inline ms-2">Exportar</span>
          </Button>
        </div>
      </div>
    ),
    [getCurrentFilterLabel, processedUsers.length, globalFilter, loading, refreshing, refreshCurrentView, selectedTipoUsuario]
  );

  // Templates
  const statusBodyTemplate = useCallback((rowData) => {
    const statusConfig = getStatusConfig(rowData.status);
    return <Tag value={statusConfig.label} severity={statusConfig.severity} />;
  }, []);

  const registrationBodyTemplate = useCallback((rowData) => {
    if (!rowData.displayRegistration) return <span className="text-muted">-</span>;
    return <span className="font-monospace">{rowData.displayRegistration}</span>;
  }, []);

  const actionsTemplate = useCallback(
    (row) => {
      const isActive = row.status === 'ACTIVE';
      const toggleIcon = isActive ? 'pi pi-ban' : 'pi pi-check';
      const toggleSeverity = isActive ? 'warning' : 'success';
      const toggleTooltip = isActive ? 'Desactivar usuario' : 'Activar usuario';

      return (
        <>
          <Button icon="pi pi-pencil" rounded outlined className="me-2" severity="info" disabled={loading} tooltip="Editar usuario" tooltipOptions={{ position: 'top' }} onClick={() => openModal(row)} />
          <Button icon={toggleIcon} rounded outlined severity={toggleSeverity} disabled={loading} tooltip={toggleTooltip} tooltipOptions={{ position: 'top' }} onClick={() => handleToggleStatus(row.id, row)} />
        </>
      );
    },
    [loading, openModal, handleToggleStatus]
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

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === 'roleId') {
      setSelectedCareers([]);
      setCareerChips([]);
    }
  }, []);

  const renderFormField = useCallback(
    (label, field, props = {}) => (
      <div className="col-md-6">
        <label className="form-label">{label}</label>
        <input {...props} className="form-control" value={formData[field]} onChange={(e) => updateFormField(field, e.target.value)} onKeyDown={handleKeyDown} />
      </div>
    ),
    [formData, updateFormField, handleKeyDown]
  );

  // Componente de chip de carrera para el modal de crear
  const CareerChipComponent = useCallback(
    ({ chip, onUpdateYear, onUpdateLast4, onRemove }) => (
      <div className="col-md-6 mb-3">
        <div className="border rounded p-3">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <small className="text-muted fw-bold">{chip.careerName}</small>
            <button type="button" className="btn btn-sm btn-light border-0 p-1" onClick={() => onRemove(chip.careerId)} title={`Quitar ${chip.careerName}`}>
              <i className="pi pi-times"></i>
            </button>
          </div>

          <div className="row g-2">
            {/* Input para año */}
            <div className="col-3">
              <label className="form-label small">Año</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={chip.year}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                  onUpdateYear(chip.careerId, value);
                }}
                placeholder="25"
                maxLength="2"
              />
            </div>

            {/* Diferenciador (solo lectura) */}
            <div className="col-4">
              <label className="form-label small">Carrera</label>
              <input type="text" className="form-control form-control-sm" value={chip.differentiator} disabled style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }} />
            </div>

            {/* Input para últimos 4 dígitos */}
            <div className="col-5">
              <label className="form-label small">Número</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={chip.last4}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                  onUpdateLast4(chip.careerId, value);
                }}
                placeholder="0001"
                maxLength="4"
              />
            </div>
          </div>

          {/* Preview de matrícula */}
          <div className="mt-2">
            <small className="text-muted">
              Matrícula: <strong className="font-monospace">{chip.matricula}</strong>
            </small>
            {chip.hasError && (
              <div className="text-danger small mt-1">
                <i className="pi pi-exclamation-triangle me-1"></i>
                Error al generar automáticamente
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    []
  );

  return (
    <>
      <Toast ref={toast} />

      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1 mb-0">Usuarios</h3>
      </div>

      <div className="my-2 p-2 bg-white rounded">
        <Toolbar
          className="p-0 bg-white border-0"
          start={() => (
            <Dropdown
              value={selectedTipoUsuario}
              options={roleOptions}
              onChange={(e) => setSelectedTipoUsuario(e.value)}
              placeholder="Filtrar por tipo de usuario"
              className="me-2 mb-2 mb-md-0"
              style={{ minWidth: 200 }}
              optionLabel="label"
              disabled={loading || roles.length === 0}
            />
          )}
          end={() => (
            <div className="d-flex align-items-center gap-2">
              {selected.length > 0 && (
                <Button icon="pi pi-toggle-off" severity="warning" className="me-2" onClick={() => handleToggleStatus(selected.map((u) => u.id))} disabled={loading}>
                  <span className="d-none d-sm-inline ms-1">Deshabilitar ({selected.length})</span>
                </Button>
              )}
              <Button icon="pi pi-user-plus" className="cetec-btn-blue" onClick={() => openModal()} ref={openModalBtnRef} disabled={loading}>
                <span className="d-none d-sm-inline ms-1">{getRegisterButtonText()}</span>
              </Button>
            </div>
          )}
        />
      </div>

      <div>
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
          </div>
        ) : (
          <DataTable
            ref={dt}
            value={processedUsers}
            selection={selected}
            onSelectionChange={(e) => setSelected(e.value)}
            dataKey="id"
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            filterDisplay="menu"
            globalFilter={globalFilter}
            globalFilterFields={['name', 'paternalSurname', 'maternalSurname', 'fullName', 'email', 'displayRegistration', 'plantelName', 'roleName', 'roleLabel', 'searchableRole', 'statusLabel', 'createdAt','searchableStatus', 'displayCreatedAt']}
            header={header}
            className="text-nowrap"
            emptyMessage={
              <div className="text-center my-5">
                <i className="pi pi-users" style={{ fontSize: '2rem', color: '#ccc' }} />
                <p className="mt-2">{!globalFilter ? (selectedTipoUsuario === null ? 'No hay usuarios registrados' : `No hay ${getCurrentFilterLabel().toLowerCase()}s registrados`) : `No se encontraron resultados para "${globalFilter}"`}</p>
              </div>
            }
          >
            <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
            <Column field="displayRegistration" header="Matrícula" body={registrationBodyTemplate} sortable style={{ minWidth: '120px' }} />
            <Column field="fullName" header="Nombre" sortable style={{ minWidth: '200px' }} />
            <Column field="email" header="Correo Electrónico" sortable style={{ minWidth: '200px' }} />
            <Column field="statusLabel" header="Estado" body={statusBodyTemplate} sortable style={{ minWidth: '100px' }} />
            <Column field="createdAt" header="Fecha de Registro" body={dateTemplate} sortable style={{ minWidth: '150px' }} />
            <Column body={actionsTemplate} header="Acciones" exportable={false} style={{ minWidth: '120px' }} />
          </DataTable>
        )}
      </div>

      {/* Modal CREAR USUARIO */}
      <div className="modal fade" ref={createModalRef} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{getModalTitle()}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={resetAllStates} />
            </div>
            <form onSubmit={(e) => handleFormSubmit(e, false)}>
              <div className="modal-body row g-3 px-3">
                {renderFormField('Nombre *', 'name', { required: true, autoComplete: 'given-name' })}
                {renderFormField('Apellido paterno *', 'paternalSurname', { required: true, autoComplete: 'family-name' })}
                {renderFormField('Apellido materno', 'maternalSurname', { autoComplete: 'family-name' })}
                {renderFormField('Correo electrónico *', 'email', { required: true, type: 'email', autoComplete: 'email', placeholder: 'usuario@ejemplo.com' })}

                <div className="col-md-6 mb-4">
                  <label className="form-label">Rol *</label>
                  {selectedTipoUsuario ? (
                    <input className="form-control" value={getRoleFriendlyName(rolesMap[selectedTipoUsuario]?.roleName || '')} disabled style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }} />
                  ) : (
                    <Dropdown value={formData.roleId} options={roleOptions} onChange={(e) => updateFormField('roleId', e.value)} placeholder="Selecciona un rol" className="w-100" required />
                  )}
                </div>

                <hr />

                {currentRoleNeedsCareers && (
                  <div className="col-12">
                    <label className="form-label">
                      Carreras <small className="text-muted">(opcional)</small>
                    </label>
                    <MultiSelect
                      value={selectedCareers}
                      options={careerOptions}
                      onChange={(e) => handleCareerSelection(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecciona las carreras"
                      className="w-100"
                      maxSelectedLabels={0}
                      selectedItemsLabel="{0} carreras seleccionadas"
                      disabled={generatingMatriculas}
                    />

                    {generatingMatriculas && (
                      <div className="d-flex align-items-center mt-2">
                        <ProgressSpinner style={{ width: '20px', height: '20px' }} strokeWidth="4" />
                        <span className="ms-2 text-muted">Generando matrículas...</span>
                      </div>
                    )}

                    {careerChips.length > 0 && (
                      <div className="mt-3">
                        <div className="row g-2">
                          {careerChips.map((chip) => (
                            <CareerChipComponent
                              key={chip.careerId}
                              chip={chip}
                              onUpdateYear={(careerId, newYear) => updateChipMatricula(careerId, newYear, chip.last4)}
                              onUpdateLast4={(careerId, newLast4) => updateChipMatricula(careerId, chip.year, newLast4)}
                              onRemove={removeCareerChip}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div className="form-check">
                  <Checkbox inputId="registerMore" checked={registerMore} onChange={(e) => setRegisterMore(e.checked)} />
                  <label className="form-check-label ms-2" htmlFor="registerMore">
                    Registro múltiple
                  </label>
                </div>
                <div>
                  <Button type="button" outlined className="me-2" severity="secondary" data-bs-dismiss="modal" onClick={resetAllStates}>
                    Cancelar
                  </Button>
                  <Button type="submit" severity="primary" disabled={loading || generatingMatriculas}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Guardando...
                      </>
                    ) : (
                      'Registrar'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal EDITAR USUARIO */}
      <div className="modal fade" ref={editModalRef} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Editar usuario</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={resetEditModal} />
            </div>
            <form onSubmit={(e) => handleFormSubmit(e, true)}>
              <div className="modal-body row g-3 px-3">
                {renderFormField('Nombre *', 'name', { required: true, autoComplete: 'given-name' })}
                {renderFormField('Apellido paterno *', 'paternalSurname', { required: true, autoComplete: 'family-name' })}
                {renderFormField('Apellido materno', 'maternalSurname', { autoComplete: 'family-name' })}
                {renderFormField('Correo electrónico *', 'email', { required: true, type: 'email', autoComplete: 'email' })}

                <div className="col-md-6">
                  <label className="form-label">Rol</label>
                  <input className="form-control" value={getRoleFriendlyName(rolesMap[formData.roleId]?.roleName || '')} disabled style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }} />
                </div>

                {/* ESTADO REMOVIDO - Solo se puede cambiar desde el DataTable */}

                <hr />

                {currentRoleNeedsCareers && (
                  <div className="col-12">
                    <label className="form-label">Carreras asignadas</label>
                    <MultiSelect
                      value={selectedCareers}
                      options={careerOptions}
                      onChange={(e) => handleEditCareerSelection(e.value)}
                      optionLabel="label"
                      optionValue="value"
                      placeholder="Selecciona las carreras"
                      className="w-100"
                      maxSelectedLabels={0}
                      selectedItemsLabel="{0} carreras seleccionadas"
                    />

                    {/* CARRERAS EXISTENTES */}
                    {userEnrollments.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted d-block mb-2">
                          <strong>Carreras actuales:</strong>
                        </small>
                        <div className="row g-2">
                          {userEnrollments
                            .filter((enrollment) => selectedCareers.includes(enrollment.careerId))
                            .map((enrollment) => {
                              const career = careers.find((c) => c.id === enrollment.careerId);
                              const parts = extractMatriculaParts(enrollment.registrationNumber);
                              const currentYear = enrollmentInputs[`${enrollment.id}_year`] || parts.year;
                              const currentLast4 = enrollmentInputs[enrollment.id] || parts.last4;
                              const preview = getExistingCareerPreview(enrollment);

                              return (
                                <div key={enrollment.id} className="col-md-6 mb-3">
                                  <div className="border rounded p-3 bg-light">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <small className="text-muted fw-bold">{career?.name || enrollment.careerName}</small>
                                      <span className="badge bg-info">Existente</span>
                                    </div>

                                    <div className="row g-2">
                                      {/* Input para año */}
                                      <div className="col-3">
                                        <label className="form-label small">Año</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={currentYear}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                                            updateExistingCareerMatricula(enrollment.id, 'year', value);
                                          }}
                                          placeholder="25"
                                          maxLength="2"
                                        />
                                      </div>

                                      {/* Diferenciador (solo lectura) */}
                                      <div className="col-4">
                                        <label className="form-label small">Carrera</label>
                                        <input type="text" className="form-control form-control-sm" value={parts.differentiator || career?.differentiator || ''} disabled style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }} />
                                      </div>

                                      {/* Input para últimos 4 dígitos */}
                                      <div className="col-5">
                                        <label className="form-label small">Número</label>
                                        <input
                                          type="text"
                                          className="form-control form-control-sm"
                                          value={currentLast4}
                                          onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                            updateExistingCareerMatricula(enrollment.id, 'last4', value);
                                          }}
                                          placeholder="0001"
                                          maxLength="4"
                                        />
                                      </div>
                                    </div>

                                    {/* Preview de matrícula */}
                                    <div className="mt-2">
                                      <small className="text-muted">
                                        Matrícula: <strong className="font-monospace">{preview}</strong>
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}

                    {/* NUEVAS CARRERAS */}
                    {editCareerChips.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted d-block mb-2">
                          <strong>Nuevas carreras:</strong>
                        </small>
                        <div className="row g-2">
                          {editCareerChips.map((chip) => (
                            <div key={chip.careerId} className="col-md-6 mb-3">
                              <div className="border rounded p-3 bg-success bg-opacity-10">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <small className="text-muted fw-bold">{chip.careerName}</small>
                                  <div className="d-flex gap-1">
                                    <button type="button" className="btn btn-sm btn-light border-0 p-1" onClick={() => removeEditCareerChip(chip.careerId)} title={`Quitar ${chip.careerName}`}>
                                      <i className="pi pi-times"></i>
                                    </button>
                                  </div>
                                </div>

                                <div className="row g-2">
                                  {/* Input para año */}
                                  <div className="col-3">
                                    <label className="form-label small">Año</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={chip.year}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 2);
                                        updateEditChipMatricula(chip.careerId, value, chip.last4);
                                      }}
                                      placeholder="25"
                                      maxLength="2"
                                    />
                                  </div>

                                  {/* Diferenciador (solo lectura) */}
                                  <div className="col-4">
                                    <label className="form-label small">Carrera</label>
                                    <input type="text" className="form-control form-control-sm" value={chip.differentiator} disabled style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }} />
                                  </div>

                                  {/* Input para últimos 4 dígitos */}
                                  <div className="col-5">
                                    <label className="form-label small">Número</label>
                                    <input
                                      type="text"
                                      className="form-control form-control-sm"
                                      value={chip.last4}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        updateEditChipMatricula(chip.careerId, chip.year, value);
                                      }}
                                      placeholder="0001"
                                      maxLength="4"
                                    />
                                  </div>
                                </div>

                                {/* Preview de matrícula */}
                                <div className="mt-2">
                                  <small className="text-muted">
                                    Matrícula: <strong className="font-monospace">{chip.matricula}</strong>
                                  </small>
                                  {chip.hasError && (
                                    <div className="text-danger small mt-1">
                                      <i className="pi pi-exclamation-triangle me-1"></i>
                                      Error al generar automáticamente
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <Button type="button" outlined severity="secondary" data-bs-dismiss="modal" onClick={resetEditModal}>
                  Cancelar
                </Button>
                <Button type="submit" severity="primary" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

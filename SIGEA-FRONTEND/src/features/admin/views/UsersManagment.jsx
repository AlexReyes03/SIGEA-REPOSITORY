import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Chip } from 'primereact/chip';
import { Checkbox } from 'primereact/checkbox';
import { Toolbar } from 'primereact/toolbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { MdOutlineGroup } from 'react-icons/md';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import * as bootstrap from 'bootstrap';

import { getAllUsers, getUserByRole, createUser, deleteUser, updateUser } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';
import { getCareerByPlantelId } from '../../../api/academics/careerService';
import { createEnrollment, generateRegistrationNumber, getEnrollmentsByUser, updateEnrollmentRegistration, deleteEnrollment, canRemoveUserFromCareer } from '../../../api/academics/enrollmentService';
import { useToast } from '../../../components/providers/ToastProvider';
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

// Helper functions
const getStatusConfig = (status) => STATUS_CONFIG[status] || { name: status, label: status, severity: 'info' };
const getRoleFriendlyName = (roleName) => ROLE_LABELS[roleName] || roleName;

export default function UsersManagement() {
  const dt = useRef(null);
  const toast = useRef(null);
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  const openModalBtnRef = useRef(null);
  const { user } = useAuth();
  const { showError, showSuccess, showWarn } = useToast();

  const [users, setUsers] = useState([]);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [enrollmentInputs, setEnrollmentInputs] = useState({});
  const [roles, setRoles] = useState([]);
  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedTipoUsuario, setSelectedTipoUsuario] = useState(null);
  const [selected, setSelected] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [formData, setFormData] = useState({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '' });
  const [editingUser, setEditingUser] = useState(null);
  const [selectedCareers, setSelectedCareers] = useState([]);
  const [careerChips, setCareerChips] = useState([]);
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
        label: career.name,
        value: career.id,
        differentiator: career.differentiator,
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

  const extractLast4Digits = (registrationNumber) => {
    if (!registrationNumber) return '';
    const match = registrationNumber.match(/(\d{4})$/);
    return match ? match[1] : '';
  };

  const updateLast4Digits = (enrollmentId, newLast4) => {
    setEnrollmentInputs((prev) => ({
      ...prev,
      [enrollmentId]: newLast4,
    }));
  };

  const buildFullRegistrationNumber = (enrollment, newLast4) => {
    const { registrationNumber } = enrollment;
    if (!registrationNumber) return '';

    const prefix = registrationNumber.replace(/\d{4}$/, '');
    return `${prefix}${newLast4.padStart(4, '0')}`;
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

        return {
          ...userItem,
          fullName,
          roleLabel,
          statusLabel,
          displayRegistration,
          searchableRole: `${userItem.roleName || ''} ${roleLabel}`.toLowerCase(),
          searchableStatus: `${userItem.status || ''} ${statusLabel}`.toLowerCase(),
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
            newChips.push({
              careerId: careerId,
              careerName: career.name,
              matricula: matricula,
              editable: false,
            });
          } catch (error) {
            const year = new Date().getFullYear().toString().slice(-2);
            const defaultMatricula = `${career.differentiator}${year}0001`;
            newChips.push({
              careerId: careerId,
              careerName: career.name,
              matricula: defaultMatricula,
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

  const updateChipMatricula = (careerId, newMatricula) => {
    setCareerChips((prev) => prev.map((chip) => (chip.careerId === careerId ? { ...chip, matricula: newMatricula, hasError: false } : chip)));
  };

  const removeCareerChip = (careerId) => {
    setCareerChips((prev) => prev.filter((chip) => chip.careerId !== careerId));
    setSelectedCareers((prev) => prev.filter((id) => id !== careerId));
  };

  const loadData = useCallback(
    async (dataLoader) => {
      try {
        setLoading(true);
        const data = await dataLoader();
        const usersArray = Array.isArray(data) ? data : [];
        setUsers(usersArray);
      } catch (error) {
        console.error('Error loading data:', error);
        setUsers([]);
        showError('Error', 'No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    },
    [showError]
  );

  const loadUsers = useCallback(() => loadData(() => getAllUsers()), [loadData]);
  const loadUsersByRole = useCallback((roleId) => loadData(() => getUserByRole(roleId)), [loadData]);

  const reloadCurrentView = useCallback(() => {
    const loader = typeof selectedTipoUsuario === 'number' ? () => loadUsersByRole(selectedTipoUsuario) : () => loadUsers();
    loader();
  }, [selectedTipoUsuario, loadUsers, loadUsersByRole]);

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
    if (roles.length > 0 && isInitialLoad) {
      const studentRole = roles.find((role) => role.roleName === 'STUDENT' || role.id === 4);
      if (studentRole) {
        setSelectedTipoUsuario(studentRole.id);
        loadUsersByRole(studentRole.id);
      } else {
        loadUsers();
      }
      setIsInitialLoad(false);
    }
  }, [roles, isInitialLoad, loadUsers, loadUsersByRole]);

  useEffect(() => {
    if (!isInitialLoad) {
      if (typeof selectedTipoUsuario === 'number') {
        loadUsersByRole(selectedTipoUsuario);
      } else {
        loadUsers();
      }
    }
  }, [selectedTipoUsuario, isInitialLoad, loadUsers, loadUsersByRole]);

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
          savedUser = await updateUser(formData.id, userData);

          if (currentRoleNeedsCareers) {
            const updatePromises = userEnrollments
              .filter((enrollment) => selectedCareers.includes(enrollment.careerId))
              .map(async (enrollment) => {
                const newLast4 = enrollmentInputs[enrollment.id];
                if (newLast4 && newLast4 !== extractLast4Digits(enrollment.registrationNumber)) {
                  const newFullRegistration = buildFullRegistrationNumber(enrollment, newLast4);
                  return updateEnrollmentRegistration(enrollment.id, newFullRegistration);
                }
                return null;
              })
              .filter((promise) => promise !== null);

            await Promise.all(updatePromises);

            // Agregar nuevas carreras
            const existingCareerIds = userEnrollments.map((e) => e.careerId);
            const newCareerIds = selectedCareers.filter((careerId) => !existingCareerIds.includes(careerId));

            for (const careerId of newCareerIds) {
              try {
                const matricula = await generateMatriculaForCareer(careerId);
                await createEnrollment({
                  userId: savedUser.id,
                  careerId: careerId,
                  customRegistrationNumber: matricula,
                });
              } catch (enrollmentError) {
                console.error('Error creating new enrollment:', enrollmentError);
                const career = careers.find((c) => c.id === careerId);
                showWarn('Advertencia', `Error al inscribir en ${career?.name || 'carrera'}`);
              }
            }

            // Remover carreras (con validación de grupos)
            const removedCareerIds = existingCareerIds.filter((careerId) => !selectedCareers.includes(careerId));

            for (const careerId of removedCareerIds) {
              try {
                const canRemove = await canRemoveUserFromCareer(savedUser.id, careerId);
                if (!canRemove) {
                  const career = careers.find((c) => c.id === careerId);
                  showWarn('Advertencia', `No se puede quitar ${career?.name} porque el usuario tiene grupos activos`);
                  continue;
                }

                const enrollment = userEnrollments.find((e) => e.careerId === careerId);
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
        } else {
          if (!formData.plantelId) {
            showWarn('Campos incompletos', 'Por favor llena todos los campos obligatorios.');
            return;
          }

          if (currentRoleNeedsCareers && careerChips.length === 0) {
            showWarn('Carreras requeridas', `Los ${getRoleFriendlyName(getCurrentRole.roleName)}s deben tener al menos una carrera asignada.`);
            return;
          }

          if (careerChips.some((chip) => !chip.matricula || chip.matricula.trim() === '')) {
            showWarn('Matrículas incompletas', 'Todas las carreras deben tener una matrícula válida.');
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
        }

        if (!isEdit && registerMore) {
          setFormData({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '', roleId: finalRoleId });
          setSelectedCareers([]);
          setCareerChips([]);
          setUserEnrollments([]);
          setEnrollmentInputs({});
        } else {
          const modalRef = isEdit ? editModalRef : createModalRef;
          bootstrap.Modal.getInstance(modalRef.current)?.hide();
          setFormData({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '' });
          setSelectedCareers([]);
          setCareerChips([]);
          setRegisterMore(false);
          setEditingUser(null);
          setUserEnrollments([]);
          setEnrollmentInputs({});
        }

        reloadCurrentView();
      } catch (err) {
        console.error(`Error ${isEdit ? 'updating' : 'creating'} user:`, err);
        const message = err.response?.data?.message || `No se pudo ${isEdit ? 'actualizar' : 'registrar'} el usuario`;
        showError('Error', message);
      } finally {
        setLoading(false);
      }
    },
    [formData, selectedTipoUsuario, user?.campus?.id, currentRoleNeedsCareers, careerChips, registerMore, getCurrentRole, userEnrollments, enrollmentInputs, selectedCareers, careers, showWarn, showSuccess, showError, reloadCurrentView]
  );

  const handleDelete = useCallback(
    async (userIds, userName) => {
      const isMultiple = Array.isArray(userIds);
      const message = isMultiple ? `¿Estás seguro de que deseas eliminar ${userIds.length} usuario(s) seleccionado(s)?` : `¿Estás seguro de que deseas eliminar al usuario ${userName}?`;

      confirmDialog({
        message,
        header: isMultiple ? 'Confirmar eliminación múltiple' : 'Confirmar eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        accept: async () => {
          try {
            if (isMultiple) {
              await Promise.all(userIds.map((id) => deleteUser(id)));
              setSelected([]);
              showSuccess('Éxito', `${userIds.length} usuario(s) eliminado(s) correctamente`);
            } else {
              await deleteUser(userIds);
              showSuccess('Éxito', `Usuario ${userName} eliminado correctamente`);
            }
            reloadCurrentView();
          } catch (error) {
            showError('Error', 'Error al eliminar el/los usuario(s)');
          }
        },
      });
    },
    [showSuccess, showError, reloadCurrentView]
  );

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
          setUserEnrollments(enrollments);

          const initialInputs = {};
          enrollments.forEach((enrollment) => {
            initialInputs[enrollment.id] = extractLast4Digits(enrollment.registrationNumber);
          });
          setEnrollmentInputs(initialInputs);

          setSelectedCareers(enrollments.map((e) => e.careerId));
        } catch (error) {
          console.error('Error loading user enrollments:', error);
          setUserEnrollments([]);
          setEnrollmentInputs({});
          setSelectedCareers([]);
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
        setEnrollmentInputs({});
        new bootstrap.Modal(createModalRef.current).show();
      }
    },
    [user?.campus?.id, selectedTipoUsuario]
  );

  const handleEditCareerSelection = (newSelectedCareerIds) => {
    setSelectedCareers(newSelectedCareerIds);

    const removedCareers = userEnrollments.filter((e) => !newSelectedCareerIds.includes(e.careerId)).map((e) => e.id);

    setEnrollmentInputs((prev) => {
      const updated = { ...prev };
      removedCareers.forEach((enrollmentId) => {
        delete updated[enrollmentId];
      });
      return updated;
    });
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
        <span className="p-input-icon-left">
          <InputText placeholder="Buscar ..." value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} disabled={loading} className="me-2" style={{ minWidth: '250px' }} />
          <Button icon="pi pi-upload" className="cetec-btn-primary" onClick={() => dt.current?.exportCSV()} disabled={loading || !processedUsers.length}>
            <span className="d-none d-sm-inline ms-2">Exportar</span>
          </Button>
        </span>
      </div>
    ),
    [getCurrentFilterLabel, processedUsers.length, globalFilter, loading]
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
    (row) => (
      <>
        <Button icon="pi pi-pencil" rounded outlined className="me-2" disabled={loading} tooltip="Editar usuario" tooltipOptions={{ position: 'top' }} onClick={() => openModal(row)} />
        <Button icon="pi pi-trash" rounded outlined severity="danger" disabled={loading} tooltip="Deshabilitar usuario" tooltipOptions={{ position: 'top' }} onClick={() => handleDelete(row.id, row.fullName)} />
      </>
    ),
    [loading, openModal, handleDelete]
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

  return (
    <>
      <Toast ref={toast} />
      <ConfirmDialog />

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
                <Button icon="pi pi-trash" severity="danger" className="me-2" onClick={() => handleDelete(selected.map((u) => u.id))} disabled={loading}>
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
            globalFilterFields={['name', 'paternalSurname', 'maternalSurname', 'fullName', 'email', 'displayRegistration', 'plantelName', 'roleName', 'roleLabel', 'searchableRole', 'statusLabel', 'searchableStatus']}
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
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <form onSubmit={(e) => handleFormSubmit(e, false)}>
              <div className="modal-body row g-3 px-3">
                {renderFormField('Nombre *', 'name', { required: true, autoComplete: 'given-name' })}
                {renderFormField('Apellido paterno *', 'paternalSurname', { required: true, autoComplete: 'family-name' })}
                {renderFormField('Apellido materno', 'maternalSurname', { autoComplete: 'family-name' })}
                {renderFormField('Correo electrónico *', 'email', { required: true, type: 'email', autoComplete: 'email', placeholder: 'usuario@ejemplo.com' })}

                <div className="col-md-6">
                  <label className="form-label">Rol *</label>
                  {selectedTipoUsuario ? (
                    <input className="form-control" value={getRoleFriendlyName(rolesMap[selectedTipoUsuario]?.roleName || '')} disabled style={{ backgroundColor: '#f8f9fa', color: '#6c757d' }} />
                  ) : (
                    <Dropdown value={formData.roleId} options={roleOptions} onChange={(e) => updateFormField('roleId', e.value)} placeholder="Selecciona un rol" className="w-100" required />
                  )}
                </div>

                {currentRoleNeedsCareers && (
                  <div className="col-6">
                    <label className="form-label">
                      Carreras *<small className="text-muted ms-2">(matrícula autogenerada)</small>
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
                        <small className="text-muted d-block mb-2">Matrículas generadas:</small>
                        <div className="d-flex flex-wrap gap-2">
                          {careerChips.map((chip) => (
                            <div key={chip.careerId} className="d-flex align-items-center">
                              <Chip label={chip.matricula} removable onRemove={() => removeCareerChip(chip.careerId)} className={chip.hasError ? 'p-chip-warning' : ''} title={chip.careerName} />
                              {chip.editable && <InputText value={chip.matricula} onChange={(e) => updateChipMatricula(chip.careerId, e.target.value)} className="ms-2" style={{ width: '120px' }} placeholder="Matrícula" />}
                            </div>
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
                  <Button type="button" outlined className="me-2" severity="secondary" data-bs-dismiss="modal">
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
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
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

                <div className="col-md-6">
                  <label className="form-label">Estado *</label>
                  <Dropdown
                    value={formData.status}
                    options={[
                      { label: 'Activo', value: 'ACTIVE' },
                      { label: 'Inactivo', value: 'INACTIVE' },
                    ]}
                    onChange={(e) => updateFormField('status', e.value)}
                    className="w-100"
                    required
                  />
                </div>

                {currentRoleNeedsCareers && (
                  <>
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
                        maxSelectedLabels={3}
                        selectedItemsLabel="{0} carreras seleccionadas"
                      />
                    </div>

                    {/* Editar últimos 4 dígitos de matrículas */}
                    {userEnrollments.length > 0 && (
                      <div className="col-12">
                        <label className="form-label">Editar matrículas</label>
                        <small className="text-muted d-block mb-2">Solo puedes modificar los últimos 4 dígitos de cada matrícula</small>

                        <div className="row g-2">
                          {userEnrollments
                            .filter((enrollment) => selectedCareers.includes(enrollment.careerId))
                            .map((enrollment) => {
                              const career = careers.find((c) => c.id === enrollment.careerId);
                              const currentLast4 = enrollmentInputs[enrollment.id] || '';
                              const preview = buildFullRegistrationNumber(enrollment, currentLast4);

                              return (
                                <div key={enrollment.id} className="col-md-6 mb-2">
                                  <label className="form-label small">{career?.name || enrollment.careerName}</label>
                                  <div className="input-group">
                                    <span className="input-group-text small">{enrollment.registrationNumber?.slice(0, -4) || ''}</span>
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={currentLast4}
                                      onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                                        updateLast4Digits(enrollment.id, value);
                                      }}
                                      placeholder="0000"
                                      maxLength="4"
                                      style={{ width: '80px' }}
                                    />
                                  </div>
                                  <small className="text-muted">Preview: {preview}</small>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                    {selectedCareers.length > userEnrollments.length && (
                      <div className="col-12">
                        <Message severity="info" text={`Se agregarán ${selectedCareers.length - userEnrollments.length} nueva(s) carrera(s) con matrícula autogenerada.`} />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="modal-footer">
                <Button type="button" outlined severity="secondary" data-bs-dismiss="modal">
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

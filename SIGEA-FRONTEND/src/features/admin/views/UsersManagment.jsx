import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { Tag } from "primereact/tag";
import { Toolbar } from 'primereact/toolbar';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdOutlineGroup } from "react-icons/md";
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import * as bootstrap from 'bootstrap';
import {
    getAllUsers,
    getUserByRole,
    createUser,
    deleteUser,
    updateUser
} from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';
import { useToast } from '../../../components/providers/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';

// Constants
const STATUS_CONFIG = {
    'ACTIVE': { name: 'ACTIVE', label: 'Activo', severity: 'success' },
    'INACTIVE': { name: 'INACTIVE', label: 'Inactivo', severity: 'danger' },
    'Activo': { name: 'ACTIVE', label: 'Activo', severity: 'success' },
    'Inactivo': { name: 'INACTIVE', label: 'Inactivo', severity: 'danger' }
};

const ROLE_LABELS = {
    'ADMIN': 'Administrador',
    'SUPERVISOR': 'Supervisor', 
    'TEACHER': 'Maestro',
    'STUDENT': 'Estudiante'
};

const DEFAULT_ROLES = [
    { id: 1, roleName: 'ADMIN' },
    { id: 2, roleName: 'SUPERVISOR' },
    { id: 3, roleName: 'TEACHER' },
    { id: 4, roleName: 'STUDENT' }
];

const INITIAL_USER_STATE = {
    name: '', paternalSurname: '', maternalSurname: '', email: '', 
    registrationNumber: '', roleId: '', status: 'ACTIVE'
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

    // States
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedTipoUsuario, setSelectedTipoUsuario] = useState(null);
    const [selected, setSelected] = useState([]);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [formData, setFormData] = useState({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '' });
    const [editingUser, setEditingUser] = useState(null);

    useBootstrapModalFocus(createModalRef, openModalBtnRef);
    useBootstrapModalFocus(editModalRef, null);

    // Memoized values
    const rolesMap = useMemo(() => {
        const map = {};
        roles.forEach(role => {
            map[role.id] = role;
            map[role.roleName] = role;
        });
        return map;
    }, [roles]);

    const roleOptions = useMemo(() => 
        roles.map(role => ({
            label: getRoleFriendlyName(role.roleName),
            value: role.id
        })), [roles]
    );

    const getRoleLabel = useCallback((roleName, roleId) => {
        const role = rolesMap[roleId] || rolesMap[roleName];
        return role ? getRoleFriendlyName(role.roleName) : 'Sin rol';
    }, [rolesMap]);

    const processedUsers = useMemo(() => {
        if (!Array.isArray(users)) return [];
        
        return users.map(user => {
            const roleLabel = getRoleLabel(user.roleName, user.roleId);
            const statusLabel = getStatusConfig(user.status).label;
            const fullName = `${user.name || ''} ${user.paternalSurname || ''} ${user.maternalSurname || ''}`.trim();
            
            return {
                ...user,
                fullName,
                roleLabel,
                statusLabel,
                searchableRole: `${user.roleName || ''} ${roleLabel}`.toLowerCase(),
                searchableStatus: `${user.status || ''} ${statusLabel}`.toLowerCase()
            };
        });
    }, [users, getRoleLabel]);

    // Data loading functions
    const loadData = useCallback(async (dataLoader, showToast = false) => {
        try {
            setLoading(true);
            const data = await dataLoader();
            const usersArray = Array.isArray(data) ? data : [];
            setUsers(usersArray);
            
            if (showToast && usersArray.length === 0) {
                showWarn("Sin resultados", "No se encontraron usuarios registrados");
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setUsers([]);
            if (showToast) showError("Error", "No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
        }
    }, [showError, showWarn]);

    const loadUsers = useCallback((showToast = false) => 
        loadData(() => getAllUsers(), showToast), [loadData]
    );

    const loadUsersByRole = useCallback((roleId, showToast = false) => 
        loadData(() => getUserByRole(roleId), showToast), [loadData]
    );

    const reloadCurrentView = useCallback(() => {
        const loader = typeof selectedTipoUsuario === 'number' 
            ? () => loadUsersByRole(selectedTipoUsuario, false)
            : () => loadUsers(false);
        loader();
    }, [selectedTipoUsuario, loadUsers, loadUsersByRole]);

    // Effects
    useEffect(() => {
        const loadRoles = async () => {
            try {
                const data = await getAllRoles();
                setRoles(Array.isArray(data) ? data : DEFAULT_ROLES);
            } catch (error) {
                setRoles(DEFAULT_ROLES);
                showError("Error", "No se pudieron cargar los roles desde el servidor. Usando configuración por defecto.");
            }
        };
        loadRoles();
    }, [showError]);

    useEffect(() => {
        if (roles.length > 0 && isInitialLoad) {
            const studentRole = roles.find(role => role.roleName === 'STUDENT' || role.id === 4);
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
                loadUsersByRole(selectedTipoUsuario, true);
            } else {
                loadUsers(true);
            }
        }
    }, [selectedTipoUsuario, isInitialLoad, loadUsers, loadUsersByRole]);

    // Event handlers
    const handleFormSubmit = useCallback(async (e, isEdit = false) => {
        e.preventDefault();
        try {
            setLoading(true);
            
            if (!formData.name || !formData.paternalSurname || !formData.email || !formData.roleId) {
                showWarn("Campos incompletos", "Por favor llena todos los campos obligatorios.");
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                showWarn("Email inválido", "Por favor ingresa un email válido.");
                return;
            }

            const userData = {
                ...formData,
                maternalSurname: formData.maternalSurname || null,
                registrationNumber: formData.registrationNumber || null,
                plantelId: formData.plantelId || null
            };

            // Solo agregar contraseña por defecto al crear usuarios
            if (!isEdit) {
                userData.password = 'usuarioCetec@';
            }

            if (isEdit) {
                await updateUser(formData.id, userData);
                showSuccess("Éxito", `Usuario ${formData.name} actualizado correctamente`);
            } else {
                if (!formData.plantelId) {
                    showWarn("Campos incompletos", "Por favor llena todos los campos obligatorios.");
                    return;
                }
                await createUser(userData);
                showSuccess("Éxito", "Usuario registrado correctamente");
            }

            const modalRef = isEdit ? editModalRef : createModalRef;
            bootstrap.Modal.getInstance(modalRef.current)?.hide();
            
            setFormData({ ...INITIAL_USER_STATE, plantelId: user?.campus?.id || '' });
            setEditingUser(null);
            reloadCurrentView();
        } catch (err) {
            console.error(`Error ${isEdit ? 'updating' : 'creating'} user:`, err);
            const message = err.response?.data?.message || `No se pudo ${isEdit ? 'actualizar' : 'registrar'} el usuario`;
            showError("Error", message);
        } finally {
            setLoading(false);
        }
    }, [formData, user?.campus?.id, showWarn, showSuccess, showError, reloadCurrentView]);

    const handleDelete = useCallback(async (userIds, userName) => {
        const isMultiple = Array.isArray(userIds);
        const message = isMultiple 
            ? `¿Estás seguro de que deseas eliminar ${userIds.length} usuario(s) seleccionado(s)?`
            : `¿Estás seguro de que deseas eliminar al usuario ${userName}?`;

        confirmDialog({
            message,
            header: isMultiple ? 'Confirmar eliminación múltiple' : 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    if (isMultiple) {
                        await Promise.all(userIds.map(id => deleteUser(id)));
                        setSelected([]);
                        showSuccess("Éxito", `${userIds.length} usuario(s) eliminado(s) correctamente`);
                    } else {
                        await deleteUser(userIds);
                        showSuccess("Éxito", `Usuario ${userName} eliminado correctamente`);
                    }
                    reloadCurrentView();
                } catch (error) {
                    showError("Error", "Error al eliminar el/los usuario(s)");
                }
            }
        });
    }, [showSuccess, showError, reloadCurrentView]);

    const openModal = useCallback((userData = null) => {
        if (userData) {
            setEditingUser(userData);
            setFormData({
                id: userData.id,
                name: userData.name || '',
                paternalSurname: userData.paternalSurname || '',
                maternalSurname: userData.maternalSurname || '',
                email: userData.email || '',
                registrationNumber: userData.registrationNumber || '',
                roleId: userData.roleId || '',
                plantelId: userData.plantelId || '',
                status: userData.status || 'ACTIVE'
            });
            new bootstrap.Modal(editModalRef.current).show();
        } else {
            new bootstrap.Modal(createModalRef.current).show();
        }
    }, []);

    // Computed values
    const getCurrentFilterLabel = useCallback(() => {
        if (selectedTipoUsuario === null || selectedTipoUsuario === undefined) {
            return "Todos los usuarios";
        }
        return getRoleLabel(null, selectedTipoUsuario) || "Usuarios";
    }, [selectedTipoUsuario, getRoleLabel]);

    const header = useMemo(() => (
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
            <div className="col-12 col-md d-flex align-items-center flex-wrap gap-2">
                <div className='title-icon p-1 rounded-circle'>
                    <MdOutlineGroup className='p-1' size={38} />
                </div>
                <h5 className="title-text ms-2 me-2 mb-0">{getCurrentFilterLabel()}</h5>
                <span className="badge bg-blue-500 p-2 me-2">{processedUsers.length}</span>
            </div>
            <span className="p-input-icon-left">
                <InputText
                    placeholder="Buscar ..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    disabled={loading}
                    className='me-2'
                    style={{ minWidth: '250px' }}
                />
                <Button
                    icon="pi pi-upload"
                    className="cetec-btn-primary"
                    onClick={() => dt.current?.exportCSV()}
                    disabled={loading || !processedUsers.length}
                >
                    <span className="d-none d-sm-inline ms-2">Exportar</span>
                </Button>
            </span>
        </div>
    ), [getCurrentFilterLabel, processedUsers.length, globalFilter, loading]);

    // Templates
    const statusBodyTemplate = useCallback((rowData) => {
        const statusConfig = getStatusConfig(rowData.status);
        return <Tag value={statusConfig.label} severity={statusConfig.severity} />;
    }, []);

    const roleBodyTemplate = useCallback((rowData) => 
        getRoleLabel(rowData.roleName, rowData.roleId), [getRoleLabel]
    );

    const actionsTemplate = useCallback((row) => (
        <>
            <Button
                icon="pi pi-pencil" rounded outlined className="me-2"
                disabled={loading} tooltip="Editar usuario"
                tooltipOptions={{ position: 'top' }}
                onClick={() => openModal(row)}
            />
            <Button
                icon="pi pi-trash" rounded outlined severity="danger"
                disabled={loading} tooltip="Deshabilitar usuario"
                tooltipOptions={{ position: 'top' }}
                onClick={() => handleDelete(row.id, row.fullName)}
            />
        </>
    ), [loading, openModal, handleDelete]);

    const dateTemplate = useCallback((row) => 
        new Date(row.createdAt).toLocaleDateString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric'
        }), []
    );

    // Form helpers
    const updateFormField = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const renderFormField = useCallback((label, field, props = {}) => (
        <div className="col-md-6">
            <label className="form-label">{label}</label>
            <input
                {...props}
                className="form-control"
                value={formData[field]}
                onChange={(e) => updateFormField(field, e.target.value)}
            />
        </div>
    ), [formData, updateFormField]);

    const renderSelectField = useCallback((label, field, options, props = {}) => (
        <div className="col-md-6">
            <label className="form-label">{label}</label>
            <select
                {...props}
                className="form-select"
                value={formData[field]}
                onChange={(e) => updateFormField(field, props.type === 'number' ? Number(e.target.value) : e.target.value)}
            >
                {options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    ), [formData, updateFormField]);

    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="bg-white rounded-top p-2">
                <h3 className="text-blue-500 fw-semibold mx-3 my-1 mb-0">Usuarios</h3>
            </div>
            
            <div className="shadow-sm my-2 p-2 bg-white rounded">
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
                                <Button
                                    icon="pi pi-trash" severity="danger" className="me-2"
                                    onClick={() => handleDelete(selected.map(u => u.id))}
                                    disabled={loading}
                                >
                                    <span className="d-none d-sm-inline ms-1">Deshabilitar ({selected.length})</span>
                                </Button>
                            )}
                            <Button
                                icon="pi pi-user-plus" className="cetec-btn-blue"
                                onClick={() => openModal()} ref={openModalBtnRef}
                                disabled={loading}
                            >
                                <span className="d-none d-sm-inline ms-1">Agregar Usuario</span>
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
                        ref={dt} value={processedUsers} selection={selected}
                        onSelectionChange={(e) => setSelected(e.value)} dataKey="id"
                        paginator rows={10} rowsPerPageOptions={[5, 10, 25, 50]}
                        filterDisplay="menu" globalFilter={globalFilter}
                        globalFilterFields={['name', 'paternalSurname', 'maternalSurname', 'fullName', 'email', 'registrationNumber', 'plantelName', 'roleName', 'roleLabel', 'searchableRole', 'statusLabel', 'searchableStatus']}
                        header={header} className="shadow-sm"
                        emptyMessage={
                            <div className="text-center my-5">
                                <i className="pi pi-users" style={{ fontSize: '2rem', color: '#ccc' }} />
                                <p className="mt-2">
                                    {!globalFilter 
                                        ? (selectedTipoUsuario === null ? "No hay usuarios registrados" : `No hay ${getCurrentFilterLabel().toLowerCase()}s registrados`)
                                        : `No se encontraron resultados para "${globalFilter}"`
                                    }
                                </p>
                            </div>
                        }
                    >
                        <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />
                        <Column field="registrationNumber" header="Matrícula" sortable style={{ minWidth: '120px' }} />
                        <Column field="fullName" header="Nombre" sortable style={{ minWidth: '200px' }} />
                        <Column header="Rol" field="roleLabel" body={roleBodyTemplate} sortable style={{ minWidth: '120px' }} />
                        <Column field="email" header="Correo Electrónico" sortable style={{ minWidth: '200px' }} />
                        <Column field="statusLabel" header="Estado" body={statusBodyTemplate} sortable style={{ minWidth: '100px' }} />
                        <Column field="createdAt" header="Fecha de Registro" body={dateTemplate} sortable style={{ minWidth: '150px' }} />
                        <Column body={actionsTemplate} header="Acciones" exportable={false} style={{ minWidth: '120px' }} />
                    </DataTable>
                )}
            </div>

            {/* Modal CREAR USUARIO */}
            <div className="modal fade" ref={createModalRef} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Registrar nuevo usuario</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" />
                        </div>
                        <form onSubmit={(e) => handleFormSubmit(e, false)}>
                            <div className="modal-body row g-3 px-3">
                                {renderFormField("Nombre *", "name", { required: true, autoComplete: "given-name" })}
                                {renderFormField("Apellido paterno *", "paternalSurname", { required: true, autoComplete: "family-name" })}
                                {renderFormField("Apellido materno", "maternalSurname", { autoComplete: "family-name" })}
                                {renderFormField("Correo electrónico *", "email", { required: true, type: "email", autoComplete: "email", placeholder: "usuario@ejemplo.com" })}
                                {renderFormField("Matrícula *", "registrationNumber", { required: true })}
                                {renderSelectField("Rol *", "roleId", [{ label: "Selecciona un rol", value: "" }, ...roleOptions], { required: true, type: "number" })}
                            </div>
                            <div className="modal-footer">
                                <Button type="button" severity="secondary" data-bs-dismiss="modal">Cancelar</Button>
                                <Button type="submit" severity="primary" disabled={loading}>
                                    {loading ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</> : 'Guardar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal EDITAR USUARIO */}
            <div className="modal fade" ref={editModalRef} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Editar usuario</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" />
                        </div>
                        <form onSubmit={(e) => handleFormSubmit(e, true)}>
                            <div className="modal-body row g-3 px-3">
                                {renderFormField("Nombre *", "name", { required: true, autoComplete: "given-name" })}
                                {renderFormField("Apellido paterno *", "paternalSurname", { required: true, autoComplete: "family-name" })}
                                {renderFormField("Apellido materno", "maternalSurname", { autoComplete: "family-name" })}
                                {renderFormField("Correo electrónico *", "email", { required: true, type: "email", autoComplete: "email" })}
                                {renderFormField("Matrícula", "registrationNumber")}
                                {renderSelectField("Estado *", "status", [{ label: "Activo", value: "ACTIVE" }, { label: "Inactivo", value: "INACTIVE" }], { required: true })}
                            </div>
                            <div className="modal-footer">
                                <Button type="button" severity="secondary" data-bs-dismiss="modal">Cancelar</Button>
                                <Button type="submit" severity="primary" disabled={loading}>
                                    {loading ? <><span className="spinner-border spinner-border-sm me-2" />Actualizando...</> : 'Actualizar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
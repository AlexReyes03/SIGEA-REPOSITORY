import React, { useRef, useState, useMemo, useEffect } from 'react';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Button } from 'primereact/button';
import { Tag } from "primereact/tag";
import { Toolbar } from 'primereact/toolbar';
import { MdOutlineGroup } from "react-icons/md";
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import * as bootstrap from 'bootstrap';
import {
    getAllUsers,
    getUserByRole,
    createUser,
    deleteUser
} from '../../../api/userService';
import { useToast } from '../../../components/providers/ToastProvider';
import { useAuth } from '../../../contexts/AuthContext';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';
import { OverlayPanel } from 'primereact/overlaypanel';

const tiposUsuario = [
    { label: "Todos", value: null },
    { label: "Estudiante", value: 4 },
    { label: "Maestro", value: 3 },
    { label: "Administrador", value: 1 },
];

const roleLabels = {
    ADMIN: "Administrador",
    TEACHER: "Maestro",
    STUDENT: "Estudiante"
};

export default function UsersManagement() {
    const dt = useRef(null);
    const toast = useRef(null);
    const createModalRef = useRef(null);
    const openModalBtnRef = useRef(null);
    const { user } = useAuth();
    const { showError, showSuccess, showWarn } = useToast();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedTipoUsuario, setSelectedTipoUsuario] = useState(null);
    const [selected, setSelected] = useState([]);
    const [newUser, setNewUser] = useState({
        name: '',
        paternalSurname: '',
        maternalSurname: '',
        email: '',
        registrationNumber: '',
        roleId: '',
        plantelId: user?.campus?.id || '',
        password: 'usuarioCetec@'
    });

    useBootstrapModalFocus(createModalRef, openModalBtnRef);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        if (typeof selectedTipoUsuario === 'number') {
            loadUsersByRole(selectedTipoUsuario);
        } else {
            loadUsers();
        }
    }, [selectedTipoUsuario]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
            showSuccess("Éxito", "Usuarios cargados correctamente");
        } catch (error) {
            console.error('Error loading all users:', error);
            showError("Error", "No se pudieron cargar los usuarios");
        } finally {
            setLoading(false);
        }
    };

    const loadUsersByRole = async (roleId) => {
        try {
            setLoading(true);
            const data = await getUserByRole(roleId);
            setUsers(data);
            showSuccess("Éxito", "Usuarios filtrados correctamente");
        } catch (error) {
            console.error('Error loading users by role:', error);
            showError("Error", "No se pudieron filtrar los usuarios por rol");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId, userName) => {
        confirmDialog({
            message: `¿Estás seguro de que deseas eliminar al usuario ${userName}?`,
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await deleteUser(userId);
                    await loadUsers();
                    showSuccess("Éxito", `Usuario ${userName} eliminado correctamente`);
                } catch (error) {
                    console.error('Error deleting user:', error);
                    showError("Error", "Error al eliminar el usuario");
                }
            }
        });
    };

    const handleDeleteSelected = async () => {
        if (!selected || selected.length === 0) {
            showWarn("Atención", "Selecciona al menos un usuario para eliminar");
            return;
        }

        confirmDialog({
            message: `¿Estás seguro de que deseas eliminar ${selected.length} usuario(s) seleccionado(s)?`,
            header: 'Confirmar eliminación múltiple',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    const deletePromises = selected.map(user => deleteUser(user.id));
                    await Promise.all(deletePromises);
                    await loadUsers();
                    setSelected([]);
                    showSuccess("Éxito", `${selected.length} usuario(s) eliminado(s) correctamente`);
                } catch (error) {
                    console.error('Error deleting users:', error);
                    showError("Error", "Error al eliminar los usuarios seleccionados");
                }
            }
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            if (!newUser.name || !newUser.paternalSurname || !newUser.email || !newUser.roleId || !newUser.plantelId) {
                showWarn("Campos incompletos", "Por favor llena todos los campos obligatorios.");
                return;
            }
            await createUser(newUser);
            showSuccess("Éxito", "Usuario registrado correctamente");
            setNewUser({
                name: '',
                paternalSurname: '',
                maternalSurname: '',
                email: '',
                registrationNumber: '',
                roleId: '',
                plantelId: user?.campus?.id || '',
                password: 'usuarioCetec@'
            });
            const modal = bootstrap.Modal.getInstance(createModalRef.current);
            modal.hide();
            loadUsers();
        } catch (err) {
            console.error("Error al registrar usuario:", err);
            showError("Error", "No se pudo registrar el usuario");
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        const modal = new bootstrap.Modal(createModalRef.current);
        modal.show();
    };

    const header = useMemo(() => (
        <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
            <div className="col-12 col-md d-flex align-items-center flex-wrap gap-2">
                <div className='title-icon p-1 rounded-circle'>
                    <MdOutlineGroup className='p-1' size={38} />
                </div>
                <h5 className="title-text ms-2 me-2 mb-0">Lista de Usuarios</h5>
                <span className="badge bg-blue-500 p-2 me-2">{users.length}</span>

            </div>
            <span className="p-input-icon-left">
                <InputText
                    placeholder="Buscar..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    disabled={loading}
                />
                <Button icon="pi pi-refresh" rounded text raised severity="secondary" className="me-2" onClick={loadUsers} disabled={loading} />
                <Button icon="pi pi-upload" className="cetec-btn-primary" onClick={() => dt.current?.exportCSV()} disabled={loading || !users.length}>
                    <span className="d-none d-sm-inline ms-1">Exportar</span>
                </Button>
            </span>
        </div>
    ), [globalFilter, users.length, loading]);

    const toolbarLeft = () => (
        <div className="flex flex-wrap">
            <Dropdown value={selectedTipoUsuario} options={tiposUsuario} onChange={(e) => setSelectedTipoUsuario(e.value)} placeholder="Tipo de Usuario" className="me-2 mb-2 mb-md-0" style={{ minWidth: 160 }} optionLabel="label" disabled={loading} />
        </div>
    );

    const toolbarRight = () => (
        <div className="d-flex align-items-center gap-2">

            {selected.length > 0 && (
                <Button
                    icon="pi pi-trash"
                    severity="danger"
                    className="me-2"
                    onClick={handleDeleteSelected}
                    disabled={loading}
                >
                    <span className="d-none d-sm-inline ms-1">Eliminar</span>
                </Button>
            )}
            <Button
                icon="pi pi-user-plus"
                className="cetec-btn-blue"
                onClick={openCreateModal}
                ref={openModalBtnRef}
                disabled={loading}
            >
                <span className="d-none d-sm-inline ms-1">Agregar Usuario</span>
            </Button>
        </div>
    );

    const actions = (row) => (
        <>
            <Button icon="pi pi-pencil" rounded outlined className="me-2" disabled={loading} tooltip="Editar usuario" />
            <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => handleDeleteUser(row.id, row.name)} disabled={loading} tooltip="Eliminar usuario" />
        </>
    );

    const statusBodyTemplate = (rowData) => {
        const estadoOriginal = rowData.status || 'Activo';
        const estado = estadoOriginal === 'Activo' || estadoOriginal === 'ACTIVE' ? 'Activo' : 'Inactivo';
        const className = estado === 'Activo' ? 'primary' : 'cetec-badge-inactive';

        return <Tag value={estado} className={className} />;
    };



    return (
        <>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="bg-white rounded-top p-2">
                <h3 className="text-blue-500 fw-semibold mx-3 my-1 mb-0">Usuarios</h3>
            </div>
            <div className="shadow-sm my-2 p-3 bg-white rounded">
                <Toolbar className="p-0 bg-white border-0" start={toolbarLeft} end={toolbarRight} />
            </div>

            <div>
                <DataTable
                    ref={dt}
                    value={users}
                    selection={selected}
                    onSelectionChange={(e) => setSelected(e.value)}
                    dataKey="id"
                    paginator
                    rows={10}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    filterDisplay="menu"
                    globalFilter={globalFilter}
                    globalFilterFields={['name', 'paternalSurname', 'maternalSurname', 'registrationNumber', 'plantelName', 'roleName']}
                    header={header}
                    loading={loading}
                    emptyMessage={
                        <div className="text-center my-5">
                            <i className="pi pi-users" style={{ fontSize: '2rem', color: '#ccc' }} />
                            <p className="mt-2">No hay usuarios registrados</p>
                        </div>
                    }
                    className="shadow-sm"
                >
                    <Column selectionMode="multiple" headerStyle={{ width: '3em' }} />

                    <Column
                        field="registrationNumber"
                        header="Matrícula"
                        sortable
                        style={{ minWidth: '120px' }}
                    />

                    <Column
                        header="Nombre"
                        body={(rowData) => (
                            `${rowData.name} ${rowData.paternalSurname} ${rowData.maternalSurname}`
                        )}
                        sortable
                        style={{ minWidth: '200px' }}
                    />


                    <Column
                        field="plantelName"
                        header="Plantel"
                        sortable
                        style={{ minWidth: '150px' }}
                    />

                    <Column
                        header="Rol"
                        body={(row) => roleLabels[row.roleName] || row.roleName}
                        sortable
                        style={{ minWidth: '120px' }}
                    />

                    <Column
                        field="status"
                        header="Estado"
                        body={statusBodyTemplate}
                        style={{ minWidth: '100px' }}
                    />

                    <Column
                        field="createdAt"
                        header="Fecha de Registro"
                        body={(row) =>
                            new Date(row.createdAt).toLocaleDateString('es-MX', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                            })
                        }
                        sortable
                        style={{ minWidth: '150px' }}
                    />


                    <Column
                        body={actions}
                        header="Acciones"
                        exportable={false}
                        style={{ minWidth: '120px' }}
                    />

                </DataTable>
            </div>


            {/* Modal CREAR USUARIO */}
            <div className="modal fade" ref={createModalRef} tabIndex="-1">
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Registrar nuevo usuario</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" />
                        </div>

                        <form onSubmit={handleCreateUser}>
                            <div className="modal-body row g-3 px-3">
                                <div className="col-md-4">
                                    <label className="form-label">Nombre</label>
                                    <input
                                        name="name"
                                        className="form-control"
                                        autoComplete="off"
                                        required
                                        value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Apellido paterno</label>
                                    <input
                                        name="paternalSurname"
                                        className="form-control"
                                        autoComplete="off"
                                        required
                                        value={newUser.paternalSurname}
                                        onChange={(e) => setNewUser({ ...newUser, paternalSurname: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label">Apellido materno</label>
                                    <input
                                        name="maternalSurname"
                                        className="form-control"
                                        autoComplete="off"
                                        required
                                        value={newUser.maternalSurname}
                                        onChange={(e) => setNewUser({ ...newUser, maternalSurname: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Correo</label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="form-control"
                                        required
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Matrícula</label>
                                    <input
                                        name="registrationNumber"
                                        className="form-control"
                                        required
                                        value={newUser.registrationNumber}
                                        onChange={(e) => setNewUser({ ...newUser, registrationNumber: e.target.value })}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label className="form-label">Rol</label>
                                    <select
                                        className="form-select"
                                        value={newUser.roleId}
                                        required
                                        onChange={(e) => setNewUser({ ...newUser, roleId: Number(e.target.value) })}
                                    >
                                        <option value="">Selecciona un rol</option>
                                        <option value={1}>Administrador</option>
                                        <option value={3}>Maestro</option>
                                        <option value={4}>Estudiante</option>
                                    </select>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="reset" className="btn btn-secondary" data-bs-dismiss="modal">
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
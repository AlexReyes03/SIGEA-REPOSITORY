import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BreadCrumb } from 'primereact/breadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toolbar } from 'primereact/toolbar';
import { InputText } from 'primereact/inputtext';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Modal } from 'bootstrap';

import { getGroupByCareer, deleteGroup, createGroup } from '../../../api/academics/groupService';
import { getAllUsers } from '../../../api/userService';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';

export default function Groups() {
  const navigate = useNavigate();
  const location = useLocation();
  const { career } = location.state || {};

  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();
  const createModalRef = useRef(null);
  const toast = useRef(null);
  const dt = useRef(null);

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');

  // Breadcrumb items
  const items = [{ label: 'Carreras', command: () => navigate('/admin/careers') }, { label: career?.name || '--', command: () => navigate('/admin/careers') }, { label: 'Grupos' }];
  const home = { icon: 'pi pi-home', command: () => navigate('/') };

  // Cargar Grupos
  useEffect(() => {
    if (!career?.id) return;
    let ignore = false;
    getGroupByCareer(career.id)
      .then(({ data }) => {
        if (!ignore) setGroups(data);
      })
      .catch((err) => {
        showError('Error', err.message || 'No se pudieron cargar los grupos');
      });
    return () => {
      ignore = true;
    };
  }, [career?.id]);

  // Cargar docentes
  useEffect(() => {
    getAllUsers()
      .then((list) => {
        console.log(list);
        const onlyTeachers = list.filter((u) => u.roleName === 'TEACHER');
        setTeachers(onlyTeachers);
        console.log(onlyTeachers);
      })
      .catch((err) => {
        showError('Error', err.message || 'No se pudieron cargar docentes');
      });
  }, []);

  const openModal = (ref) => ref.current && new Modal(ref.current).show();

  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = {
      name: form.name.value,
      weekDay: form.weekDay.value,
      startTime: form.startTime.value,
      endTime: form.endTime.value,
      teacherId: form.teacherId.value,
      careerId: career.id,
    };
    try {
      await createGroup(payload);
      const { data } = await getGroupByCareer(career.id);
      setGroups(data);
      showSuccess('Grupo creado');
      Modal.getInstance(createModalRef.current).hide();
      form.reset();
    } catch (err) {
      showError(err.message || 'No se pudo crear');
    }
  };

  const askDeleteGroup = (group) => {
    confirmAction({
      header: 'Eliminar grupo',
      message: `¿Eliminar el grupo "${group.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      onAccept: () => doDeleteGroup(group),
    });
  };

  const doDeleteGroup = (group) => {
    deleteGroup(group.groupId)
      .then(() => {
        setGroups((prev) => prev.filter((g) => g.groupId !== group.groupId));
        showSuccess('Grupo eliminado');
      })
      .catch((err) => showError(err.message || 'No se pudo eliminar'));
  };

  const askDeleteSelected = () => {
    confirmAction({
      header: 'Eliminar grupos',
      message: `¿Eliminar ${selectedGroups.length} grupos seleccionados?`,
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      onAccept: () => {
        const promises = selectedGroups.map((g) => deleteGroup(g.groupId));
        Promise.all(promises)
          .then(() => {
            const ids = selectedGroups.map((g) => g.groupId);
            setGroups((prev) => prev.filter((g) => !ids.includes(g.groupId)));
            setSelectedGroups(null);
            showSuccess('Grupos eliminados');
          })
          .catch((err) => showError(err.message || 'Error al eliminar'));
      },
    });
  };

  // TOOLBAR
  const leftToolbarTemplate = () => (
    <div className="flex flex-wrap">
      <Button icon="pi pi-plus" severity="success" className="me-2" onClick={() => openModal(createModalRef)}>
        <span className="ms-1 d-none d-sm-block">Crear grupo</span>
      </Button>
      <Button icon="pi pi-trash" severity="danger" onClick={askDeleteSelected} disabled={!selectedGroups || !selectedGroups.length}>
        <span className="ms-1 d-none d-sm-block">Eliminar</span>
      </Button>
    </div>
  );

  const rightToolbarTemplate = () => (
    <Button icon="pi pi-upload" className="p-button-help" onClick={() => dt.current.exportCSV()}>
      <span className="ms-1 d-none d-sm-block">Exportar</span>
    </Button>
  );

  // ACTION COLUMN
  const actionBodyTemplate = (row) => (
    <>
      <Button icon="pi pi-pencil" rounded outlined className="me-2" onClick={() => navigate('/admin/careers/groups/edit', { state: { career, group: row } })} />
      <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => askDeleteGroup(row)} />
    </>
  );

  // TABLE HEADER
  const tableHeader = useMemo(
    () => (
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
        <h4 className="m-0">Grupos de la carrera</h4>
        <span className="p-input-icon-left">
          <InputText type="search" value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Buscar..." />
        </span>
      </div>
    ),
    [career?.name, globalFilter]
  );

  // RENDER
  return (
    <>
      <Toast ref={toast} />

      <div className="bg-white rounded-top p-2">
        <h3 className="text-blue-500 fw-semibold m-0">Grupos</h3>
      </div>

      <BreadCrumb model={items} home={home} className="mt-2 pb-0 ps-0" />

      <Toolbar className="mb-1 mt-2" left={leftToolbarTemplate} right={rightToolbarTemplate} />

      <div className="card border-0 mt-2">
        <DataTable
          ref={dt}
          value={groups}
          selection={selectedGroups}
          onSelectionChange={(e) => setSelectedGroups(e.value)}
          dataKey="groupId"
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} grupos"
          globalFilter={globalFilter}
          header={tableHeader}
          responsiveLayout="scroll"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column field="name" header="Nombre" sortable style={{ minWidth: '12rem' }} />
          <Column field="weekDay" header="Día" sortable style={{ minWidth: '8rem' }} />
          <Column field="startTime" header="Inicio" sortable style={{ minWidth: '8rem' }} />
          <Column field="endTime" header="Fin" sortable style={{ minWidth: '8rem' }} />
          <Column field="teacher.name" header="Docente" sortable style={{ minWidth: '12rem' }} />
          <Column body={actionBodyTemplate} header="Acciones" exportable={false} style={{ minWidth: '10rem' }} />
        </DataTable>
      </div>

      {/* MODAL CREAR GRUPO */}
      <div className="modal fade" ref={createModalRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear grupo</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input name="name" className="form-control" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Día</label>
                  <select name="weekDay" className="form-select" required>
                    <option value="">Seleccione…</option>
                    <option value="MONDAY">Lunes</option>
                    <option value="TUESDAY">Martes</option>
                    <option value="WEDNESDAY">Miércoles</option>
                    <option value="THURSDAY">Jueves</option>
                    <option value="FRIDAY">Viernes</option>
                    <option value="SATURDAY">Sábado</option>
                  </select>
                </div>
                <div className="row">
                  <div className="col mb-3">
                    <label className="form-label">Hora inicio</label>
                    <input type="time" name="startTime" className="form-control" required />
                  </div>
                  <div className="col mb-3">
                    <label className="form-label">Hora fin</label>
                    <input type="time" name="endTime" className="form-control" required />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Docente</label>
                  <select name="teacherId" className="form-select" required>
                    <option value="">Seleccione docente…</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.paternalSurname}
                      </option>
                    ))}
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

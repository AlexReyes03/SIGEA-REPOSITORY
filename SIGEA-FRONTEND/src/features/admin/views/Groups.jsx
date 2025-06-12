import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Modal } from 'bootstrap';

import { getGroupByCareer, createGroup, deleteGroup } from '../../../api/academics/groupService';
import { getAllUsers } from '../../../api/userService';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';
import CareerTabs from '../components/CareerTabs';

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

const fmtTime = (d) => d?.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

const midnight = new Date();
midnight.setHours(12, 0, 0, 0);

export default function Groups() {
  const navigate = useNavigate();
  const career = useLocation().state?.career;
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();

  const createModalRef = useRef(null);
  const createButtonRef = useRef(null);
  const updateModalRef = useRef(null);
  const updateButtonRef = useRef(null);
  const dt = useRef(null);
  useBootstrapModalFocus(createModalRef, createButtonRef);
  useBootstrapModalFocus(updateModalRef, updateButtonRef);

  const [data, setData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', weekDay: null, startTime: midnight, endTime: midnight, teacher: null });

  const loadGroups = async () => {
    const res = await getGroupByCareer(career.id);
    setData(Array.isArray(res) ? res : res?.data ?? []);
  };

  useEffect(() => {
    if (career?.id) loadGroups().catch((e) => showError('Error', 'Ha ocurrido un error al cargar los grupos'));
  }, [career?.id]);

  useEffect(() => {
    getAllUsers()
      .then((u) => setTeachers(u.filter((x) => x.roleName === 'TEACHER')))
      .catch((e) => showError('Error', 'Ha ocurrido un error al cargar los docentes'));
  }, []);

  const saveGroup = async (e) => {
    e.preventDefault();

    const payload = {
      name: form.name,
      weekDay: form.weekDay,
      startTime: fmtTime(form.startTime),
      endTime: fmtTime(form.endTime),
      teacherId: form.teacher?.id,
      careerId: career.id,
    };

    try {
      await createGroup(payload);
      await loadGroups();
      showSuccess('Grupo creado');
      Modal.getInstance(createModalRef.current).hide();
      setForm({ name: '', weekDay: null, startTime: null, endTime: null, teacher: null });
    } catch (e) {
      showError('Error', e.message || 'No se pudo crear');
    }
  };

  const removeGroup = (row) =>
    confirmAction({
      message: `¿Eliminar el grupo "${row.name}"?`,
      header: 'Eliminar grupo',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      onAccept: () =>
        deleteGroup(row.groupId)
          .then(() => {
            setData((g) => g.filter((x) => x.groupId !== row.groupId));
            showSuccess('Grupo eliminado');
          })
          .catch((e) => showError('Error', e.message)),
    });

  const removeSelected = () =>
    confirmAction({
      message: `¿Eliminar ${selected.length} grupos seleccionados?`,
      header: 'Eliminar grupos',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Sí',
      rejectLabel: 'No',
      onAccept: async () => {
        await Promise.all(selected.map((g) => deleteGroup(g.groupId)));
        await loadGroups();
        setSelected(null);
        showSuccess('Grupos eliminados');
      },
    });

  const header = useMemo(
    () => (
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
        <h4 className="m-0">Grupos de la carrera</h4>
        <span className="p-input-icon-left">
          <InputText placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </span>
      </div>
    ),
    [search]
  );

  const toolbarLeft = () => (
    <div className="flex flex-wrap">
      <Button ref={createButtonRef} icon="pi pi-plus" severity="primary" className="me-2" onClick={() => new Modal(createModalRef.current).show()}>
        <span className="d-none d-sm-inline ms-1">Crear grupo</span>
      </Button>
      <Button icon="pi pi-trash" severity="danger" disabled={!selected?.length} onClick={removeSelected}>
        <span className="d-none d-sm-inline ms-1">Eliminar</span>
      </Button>
    </div>
  );

  const toolbarRight = () => (
    <Button icon="pi pi-upload" className="p-button-help" onClick={() => dt.current.exportCSV()}>
      <span className="d-none d-sm-inline ms-1">Exportar</span>
    </Button>
  );

  const actions = (row) => (
    <>
      <Button ref={updateButtonRef} icon="pi pi-pencil" rounded outlined className="me-2" onClick={() => new Modal(updateModalRef.current).show()} />
      <Button icon="pi pi-trash" rounded outlined severity="danger" onClick={() => removeGroup(row)} />
    </>
  );

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <CareerTabs />
      </div>

      <BreadCrumb
        model={[{ label: 'Carreras', command: () => navigate('/admin/careers') }, { label: career?.name || '--', command: () => navigate('/admin/careers') }, { label: 'Grupos' }]}
        home={{ icon: 'pi pi-home', command: () => navigate('/') }}
        className="mt-2 pb-0 ps-0 text-nowrap"
      />

      <Toolbar className="my-2 py-2" start={toolbarLeft} end={toolbarRight} />

      <div className="card border-0">
        <DataTable
          ref={dt}
          value={data}
          selection={selected}
          onSelectionChange={(e) => setSelected(e.value)}
          dataKey="groupId"
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          globalFilter={search}
          header={header}
          emptyMessage={<p className="text-center my-5">Aún no hay registros</p>}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column field="name" header="Nombre" sortable />
          <Column field="weekDay" header="Día" body={(row) => weekLabel(row.weekDay)} sortable />
          <Column field="startTime" header="Inicio" sortable />
          <Column field="endTime" header="Fin" sortable />
          <Column field="teacherName" header="Docente" sortable />
          <Column body={actions} header="Acciones" exportable={false} />
        </DataTable>
      </div>

      {/* ───────── MODAL CREAR ───────── */}
      <div className="modal fade" ref={createModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={saveGroup}>
              <div className="modal-header">
                <h5 className="modal-title">Crear grupo</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <InputText className="w-100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div className="mb-3">
                  <label className="form-label">Día</label>
                  <Dropdown value={form.weekDay} options={weekDayOptions} placeholder="Seleccione día…" onChange={(e) => setForm({ ...form, weekDay: e.value })} className="w-100" required />
                </div>

                <div className="row">
                  <div className="col mb-3">
                    <label className="form-label">Hora inicio</label>
                    <Calendar className="w-100 gap-1" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.value })} timeOnly hourFormat="12" showIcon required />
                  </div>
                  <div className="col mb-3">
                    <label className="form-label">Hora fin</label>
                    <Calendar className="w-100 gap-1" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.value })} timeOnly hourFormat="12" showIcon required />
                  </div>
                </div>

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Docente</label>
                    <Dropdown className="w-100" value={form.teacher} options={teachers} optionLabel={(t) => `${t.name} ${t.paternalSurname}`} placeholder="Seleccione docente…" filter onChange={(e) => setForm({ ...form, teacher: e.value })} required />
                  </div>

                  <div className="col-6 mb-3">
                    <label className="form-label">Plan de estudios</label>
                    <Dropdown className="w-100" value={null} options={null} optionLabel={null} placeholder="Seleccione plan…" filter  />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <Button type='reset' icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal">
                  <span className="d-none d-sm-inline ms-1">Cancelar</span>
                </Button>
                <Button type='submit' icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                  <span className="d-none d-sm-inline ms-1">Guardar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ───────── MODAL MODIFICAR ───────── */}
      <div className="modal fade" ref={updateModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={saveGroup}>
              <div className="modal-header">
                <h5 className="modal-title">Modificar grupo</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <InputText className="w-100" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div className="mb-3">
                  <label className="form-label">Día</label>
                  <Dropdown value={form.weekDay} options={weekDayOptions} placeholder="Seleccione…" onChange={(e) => setForm({ ...form, weekDay: e.value })} className="w-100" required />
                </div>

                <div className="row">
                  <div className="col mb-3">
                    <label className="form-label">Hora inicio</label>
                    <Calendar className="w-100 gap-1" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.value })} timeOnly hourFormat="12" showIcon required />
                  </div>
                  <div className="col mb-3">
                    <label className="form-label">Hora fin</label>
                    <Calendar className="w-100 gap-1" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.value })} timeOnly hourFormat="12" showIcon required />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Docente</label>
                  <Dropdown className="w-100" value={form.teacher} options={teachers} optionLabel={(t) => `${t.name} ${t.paternalSurname}`} placeholder="Seleccione docente…" filter onChange={(e) => setForm({ ...form, teacher: e.value })} required />
                </div>
              </div>

              <div className="modal-footer">
                <Button type='reset' icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal">
                  <span className="d-none d-sm-inline ms-1">Cancelar</span>
                </Button>
                <Button type='submit' icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                  <span className="d-none d-sm-inline ms-1">Modificar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

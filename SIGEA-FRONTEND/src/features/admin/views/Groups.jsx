import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdOutlineGroup } from 'react-icons/md';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Toolbar } from 'primereact/toolbar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Modal } from 'bootstrap';

import { getGroupByCareer, createGroup, updateGroup, deleteGroup } from '../../../api/academics/groupService';
import { getCurriculumByCareerId } from '../../../api/academics/curriculumService';
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

// Funciones de validación
const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);

  if (end <= start) {
    return 'La hora de fin debe ser posterior a la hora de inicio';
  }
  return null;
};

const validateTeacherConflict = (teachers, selectedTeacher, weekDay, startTime, endTime, groups, excludeGroupId = null) => {
  if (!selectedTeacher || !weekDay || !startTime || !endTime) return null;

  const conflictingGroup = groups.find((group) => {
    if (excludeGroupId && group.groupId === excludeGroupId) return false;
    if (group.teacherId !== selectedTeacher.id) return false;
    if (group.weekDay !== weekDay) return false;

    const groupStart = new Date(`1970-01-01T${group.startTime}`);
    const groupEnd = new Date(`1970-01-01T${group.endTime}`);
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    return !(newEnd <= groupStart || newStart >= groupEnd);
  });

  if (conflictingGroup) {
    return `El docente ya tiene asignado el grupo "${conflictingGroup.name}" el día ${weekLabel(conflictingGroup.weekDay)} de ${conflictingGroup.startTime} a ${conflictingGroup.endTime}`;
  }

  return null;
};

export default function Groups() {
  const navigate = useNavigate();
  const career = useLocation().state?.career;
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();

  const createModalRef = useRef(null);
  const createButtonRef = useRef(null);
  const updateModalRef = useRef(null);
  const updateButtonRef = useRef(null);
  const dt = useRef(null);
  useBootstrapModalFocus(createModalRef, createButtonRef);
  useBootstrapModalFocus(updateModalRef, updateButtonRef);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    name: '',
    weekDay: null,
    startTime: midnight,
    endTime: midnight,
    teacher: null,
    curriculum: null,
  });
  const [validationErrors, setValidationErrors] = useState({});

  // Procesar datos para incluir campos searchables
  const processedData = useMemo(() => {
    return data.map((group) => ({
      ...group,
      // Campo virtual que combina código y etiqueta para búsqueda
      weekDaySearchable: `${group.weekDay} ${weekLabel(group.weekDay)}`,
    }));
  }, [data]);

  // Validar formulario
  const validateForm = (formData = form) => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre del grupo es obligatorio';
    }

    if (!formData.weekDay) {
      errors.weekDay = 'Debe seleccionar un día de la semana';
    }

    if (!formData.teacher) {
      errors.teacher = 'Debe seleccionar un docente';
    }

    if (!formData.curriculum) {
      errors.curriculum = 'Debe seleccionar un plan de estudios';
    }

    // Validar rango de horarios
    const timeError = validateTimeRange(formData.startTime, formData.endTime);
    if (timeError) {
      errors.timeRange = timeError;
    }

    // Validar conflictos de horario del docente
    const conflictError = validateTeacherConflict(teachers, formData.teacher, formData.weekDay, formData.startTime, formData.endTime, data, editingGroupId);
    if (conflictError) {
      errors.teacherConflict = conflictError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (form.name || form.weekDay || form.teacher || form.curriculum || form.startTime || form.endTime) {
      validateForm();
    }
  }, [form, data, editingGroupId]);

  const loadGroups = async () => {
    try {
      const response = await getGroupByCareer(career.id);
      setData(Array.isArray(response) ? response : response?.data ?? []);
    } catch (e) {
      showError('Error', 'No se pudieron cargar los grupos');
      setData([]);
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      if (!career?.id) {
        navigate('/admin/careers');
        return;
      }
      setLoading(true);
      try {
        const [groupsRes, usersRes, curriculumsRes] = await Promise.all([getGroupByCareer(career.id), getAllUsers(), getCurriculumByCareerId(career.id)]);
        setData(Array.isArray(groupsRes) ? groupsRes : groupsRes?.data ?? []);
        setTeachers(Array.isArray(usersRes) ? usersRes.filter((x) => x.roleName === 'TEACHER') : []);
        setCurriculums(Array.isArray(curriculumsRes) ? curriculumsRes : curriculumsRes?.data ?? []);
      } catch (e) {
        showError('Error', 'Ocurrió un error al cargar los datos');
        setData([]);
        setTeachers([]);
        setCurriculums([]);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [career?.id]);

  const resetForm = () => {
    setForm({
      name: '',
      weekDay: null,
      startTime: midnight,
      endTime: midnight,
      teacher: null,
      curriculum: null,
    });
    setValidationErrors({});
  };

  const openCreateModal = () => {
    resetForm();
    setEditingGroupId(null);
    new Modal(createModalRef.current).show();
  };

  const openUpdateModal = (group) => {
    const updatedForm = {
      name: group.name,
      weekDay: group.weekDay,
      startTime: new Date(`1970-01-01T${group.startTime}`),
      endTime: new Date(`1970-01-01T${group.endTime}`),
      teacher: teachers.find((t) => t.id === group.teacherId) || null,
      curriculum: curriculums.find((c) => c.id === group.curriculumId) || null,
    };
    setForm(updatedForm);
    setEditingGroupId(group.groupId);
    new Modal(updateModalRef.current).show();
  };

  const saveGroup = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showWarn('Validación', 'Por favor corrige los errores en el formulario');
      return;
    }

    const payload = {
      name: form.name.trim(),
      weekDay: form.weekDay,
      startTime: fmtTime(form.startTime),
      endTime: fmtTime(form.endTime),
      teacherId: form.teacher?.id,
      careerId: career.id,
      curriculumId: form.curriculum.id,
    };

    try {
      await createGroup(payload);
      await loadGroups();
      showSuccess('Éxito', 'El grupo ha sido creado correctamente');
      Modal.getInstance(createModalRef.current).hide();
      resetForm();
    } catch (e) {
      console.error('Error al crear grupo:', e);
      showError('Error', e.message || 'No se pudo crear el grupo');
    }
  };

  const updateGroupAction = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showWarn('Validación', 'Por favor corrige los errores en el formulario');
      return;
    }

    try {
      const payload = {
        name: form.name.trim(),
        weekDay: form.weekDay,
        startTime: fmtTime(form.startTime),
        endTime: fmtTime(form.endTime),
        teacherId: form.teacher?.id,
        careerId: career.id,
        curriculumId: form.curriculum.id,
      };
      await updateGroup(editingGroupId, payload);
      await loadGroups();
      showSuccess('Éxito', 'El grupo ha sido actualizado correctamente');
      Modal.getInstance(updateModalRef.current).hide();
      setEditingGroupId(null);
      resetForm();
    } catch (e) {
      console.error('Error al actualizar grupo:', e);
      showError('Error', e.message || 'No se pudo actualizar el grupo');
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
            showSuccess('Éxito', 'El grupo ha sido eliminado');
          })
          .catch((e) => showError('Error', 'No se puede eliminar este grupo')),
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
        try {
          await Promise.all(selected.map((g) => deleteGroup(g.groupId)));
          await loadGroups();
          setSelected(null);
          showSuccess('Éxito', 'Grupos eliminados correctamente');
        } catch (e) {
          showError('Error', 'No se pudieron eliminar algunos grupos');
        }
      },
    });

  const header = useMemo(
    () => (
      <div className="d-flex flex-wrap gap-2 align-items-center justify-content-between w-100">
        <div className="d-flex align-items-center">
          <div className="title-icon p-1 rounded-circle">
            <MdOutlineGroup size={40} className="p-1" />
          </div>
          <h6 className="text-blue-500 fs-5 fw-semibold ms-2 mb-0">Grupos de la carrera</h6>
        </div>
        <span className="p-input-icon-left">
          <InputText placeholder="Buscar grupos..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-100" />
        </span>
      </div>
    ),
    [search]
  );

  const toolbarLeft = () => (
    <div className="flex flex-wrap">
      <Button ref={createButtonRef} icon="pi pi-plus" severity="primary" disabled={curriculums.length === 0} className="me-2" onClick={openCreateModal}>
        <span className="d-none d-sm-inline ms-1">Crear grupo</span>
      </Button>
      <Button icon="pi pi-trash" severity="danger" disabled={!selected?.length} onClick={removeSelected}>
        <span className="d-none d-sm-inline ms-1">Eliminar</span>
      </Button>
    </div>
  );

  const toolbarRight = () => (
    <Button icon="pi pi-upload" severity="help" disabled={data.length === 0} onClick={() => dt.current.exportCSV()}>
      <span className="d-none d-sm-inline ms-1">Exportar</span>
    </Button>
  );

  const actions = (row) => (
    <div className="d-flex align-items-center justify-content-center">
      <Button icon="pi pi-pencil" rounded outlined tooltip="Editar" onClick={() => openUpdateModal(row)} />
      <Button icon="pi pi-trash" rounded outlined severity="danger" className="mx-2" tooltip="Eliminar este grupo" tooltipOptions={{ position: 'left' }} onClick={() => removeGroup(row)} />
      <Button icon="pi pi-arrow-up-right" rounded outlined tooltip="Ver detalles" tooltipOptions={{ position: 'left' }} onClick={() => navigate('/admin/careers/groups/detail', { state: { group: row, career } })} />
    </div>
  );

  const isFormValid = Object.keys(validationErrors).length === 0 && form.name.trim() && form.weekDay && form.teacher && form.curriculum;

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

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
        </div>
      ) : curriculums?.length !== 0 ? (
        <div className="card border-0">
          <DataTable
            ref={dt}
            value={processedData}
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
            <Column field="weekDaySearchable" header="Día" body={(row) => weekLabel(row.weekDay)} sortable />
            <Column field="startTime" header="Inicio" sortable />
            <Column field="endTime" header="Fin" sortable />
            <Column field="teacherName" header="Docente" sortable />
            <Column field="curriculumName" header="Plan de estudios" sortable />
            <Column body={actions} header="Acciones" exportable={false} />
          </DataTable>
        </div>
      ) : (
        <div className="d-flex justify-content-center my-2">
          <Message severity="warn" text="Para crear un grupo, primero debes definir un plan de estudios en la sección 'Plan de estudios'." className="py-4" />
        </div>
      )}

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
                  <label className="form-label">Nombre *</label>
                  <InputText className={`w-100 ${validationErrors.name ? 'p-invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  {validationErrors.name && <small className="p-error">{validationErrors.name}</small>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Día *</label>
                  <Dropdown value={form.weekDay} options={weekDayOptions} placeholder="Seleccione día…" onChange={(e) => setForm({ ...form, weekDay: e.value })} className={`w-100 ${validationErrors.weekDay ? 'p-invalid' : ''}`} required />
                  {validationErrors.weekDay && <small className="p-error">{validationErrors.weekDay}</small>}
                </div>

                <div className="row">
                  <div className="col mb-3">
                    <label className="form-label">Hora inicio *</label>
                    <Calendar
                      className={`w-100 gap-1 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.value })}
                      timeOnly
                      hourFormat="24"
                      showIcon
                      icon={() => <i className="pi pi-clock" />}
                      required
                    />
                  </div>
                  <div className="col mb-3">
                    <label className="form-label">Hora fin *</label>
                    <Calendar
                      className={`w-100 gap-1 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.value })}
                      timeOnly
                      hourFormat="24"
                      showIcon
                      icon={() => <i className="pi pi-clock" />}
                      required
                    />
                  </div>
                </div>
                {validationErrors.timeRange && (
                  <div className="mb-3">
                    <small className="p-error">{validationErrors.timeRange}</small>
                  </div>
                )}

                <div className="row">
                  <div className="col-6 mb-3">
                    <label className="form-label">Docente *</label>
                    <Dropdown
                      className={`w-100 ${validationErrors.teacher ? 'p-invalid' : ''}`}
                      value={form.teacher}
                      options={teachers}
                      optionLabel={(t) => `${t.name} ${t.paternalSurname}`}
                      placeholder="Seleccione docente…"
                      filter
                      onChange={(e) => setForm({ ...form, teacher: e.value })}
                      required
                    />
                    {validationErrors.teacher && <small className="p-error">{validationErrors.teacher}</small>}
                  </div>

                  <div className="col-6 mb-3">
                    <label className="form-label">Plan de estudios *</label>
                    <Dropdown
                      className={`w-100 ${validationErrors.curriculum ? 'p-invalid' : ''}`}
                      value={form.curriculum}
                      options={curriculums}
                      optionLabel="name"
                      placeholder="Seleccione plan…"
                      filter
                      onChange={(e) => setForm({ ...form, curriculum: e.value })}
                      required
                      disabled={loading || curriculums.length === 0}
                    />
                    {validationErrors.curriculum && <small className="p-error">{validationErrors.curriculum}</small>}
                  </div>
                </div>

                {validationErrors.teacherConflict && (
                  <div className="mb-3">
                    <Message severity="error" text={validationErrors.teacherConflict} />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <Button type="button" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" onClick={resetForm}>
                  <span className="d-none d-sm-inline ms-1">Cancelar</span>
                </Button>
                <Button type="submit" icon="pi pi-check" severity="primary" disabled={!isFormValid}>
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
            <form onSubmit={updateGroupAction}>
              <div className="modal-header">
                <h5 className="modal-title">Modificar grupo</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre *</label>
                  <InputText className={`w-100 ${validationErrors.name ? 'p-invalid' : ''}`} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  {validationErrors.name && <small className="p-error">{validationErrors.name}</small>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Día *</label>
                  <Dropdown value={form.weekDay} options={weekDayOptions} placeholder="Seleccione…" onChange={(e) => setForm({ ...form, weekDay: e.value })} className={`w-100 ${validationErrors.weekDay ? 'p-invalid' : ''}`} required />
                  {validationErrors.weekDay && <small className="p-error">{validationErrors.weekDay}</small>}
                </div>

                <div className="row">
                  <div className="col mb-3">
                    <label className="form-label">Hora inicio *</label>
                    <Calendar
                      className={`w-100 gap-1 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.value })}
                      timeOnly
                      hourFormat="24"
                      showIcon
                      icon={() => <i className="pi pi-clock" />}
                      required
                    />
                  </div>
                  <div className="col mb-3">
                    <label className="form-label">Hora fin *</label>
                    <Calendar
                      className={`w-100 gap-1 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.value })}
                      timeOnly
                      hourFormat="24"
                      showIcon
                      icon={() => <i className="pi pi-clock" />}
                      required
                    />
                  </div>
                </div>
                {validationErrors.timeRange && (
                  <div className="mb-3">
                    <small className="p-error">{validationErrors.timeRange}</small>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label">Docente *</label>
                  <Dropdown
                    className={`w-100 ${validationErrors.teacher ? 'p-invalid' : ''}`}
                    value={form.teacher}
                    options={teachers}
                    optionLabel={(t) => `${t.name} ${t.paternalSurname}`}
                    placeholder="Seleccione docente…"
                    filter
                    onChange={(e) => setForm({ ...form, teacher: e.value })}
                    required
                  />
                  {validationErrors.teacher && <small className="p-error">{validationErrors.teacher}</small>}
                </div>

                <div className="mb-3">
                  <label className="form-label">Plan de estudios *</label>
                  <Dropdown
                    className={`w-100 ${validationErrors.curriculum ? 'p-invalid' : ''}`}
                    value={form.curriculum}
                    options={curriculums}
                    optionLabel="name"
                    placeholder="Seleccione plan…"
                    filter
                    onChange={(e) => setForm({ ...form, curriculum: e.value })}
                    required
                    disabled={curriculums.length === 0}
                  />
                  {validationErrors.curriculum && <small className="p-error">{validationErrors.curriculum}</small>}
                  {curriculums.length === 0 && <Message severity="warn" text="Para crear o modificar un grupo, primero debes definir un plan de estudios en la sección 'Plan de estudios'." className="mt-2" />}
                </div>

                {validationErrors.teacherConflict && (
                  <div className="mb-3">
                    <Message severity="error" text={validationErrors.teacherConflict} />
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <Button
                  type="button"
                  icon="pi pi-times"
                  severity="secondary"
                  outlined
                  data-bs-dismiss="modal"
                  onClick={() => {
                    setEditingGroupId(null);
                    resetForm();
                  }}
                >
                  <span className="d-none d-sm-inline ms-1">Cancelar</span>
                </Button>
                <Button type="submit" icon="pi pi-check" severity="primary" disabled={!isFormValid}>
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

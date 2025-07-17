import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdOutlineGroup, MdOutlinePerson, MdOutlineAssignment, MdOutlineSchedule, MdOutlineCalendarToday } from 'react-icons/md';
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
import { Divider } from 'primereact/divider';
import { Modal } from 'bootstrap';

import { getTeachersByCareer } from '../../../api/academics/enrollmentService';
import { getGroupByCareer, createGroup, updateGroup, deleteGroup } from '../../../api/academics/groupService';
import { getCurriculumByCareerId } from '../../../api/academics/curriculumService';
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

const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return null;

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end <= start) {
    return 'La fecha de fin debe ser posterior a la fecha de inicio';
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

// Función para calcular duración de un curriculum
const calculateCurriculumDuration = (curriculum) => {
  if (!curriculum?.modules || curriculum.modules.length === 0) {
    return { weeks: 0, months: 0, years: 0 };
  }

  const totalWeeks = curriculum.modules.reduce((acc, module) => {
    if (!module.subjects) return acc;
    return acc + module.subjects.reduce((subAcc, subject) => subAcc + (subject.weeks || 0), 0);
  }, 0);

  const totalMonths = totalWeeks / 4;
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = Math.floor(totalMonths % 12);

  return {
    weeks: totalWeeks,
    months: totalMonths,
    years: years,
    remainingMonths: remainingMonths,
  };
};

// Función para calcular fecha de fin basándose en el curriculum
const calculateEndDate = (startDate, curriculum) => {
  if (!startDate || !curriculum) return null;

  const duration = calculateCurriculumDuration(curriculum);
  const endDate = new Date(startDate);
  
  // Añadir la duración calculada
  endDate.setDate(endDate.getDate() + (duration.weeks * 7));
  
  return endDate;
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
  const [careerTeachers, setCareerTeachers] = useState([]);
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
    startDate: new Date(),
    endDate: null,
  });
  const [validationErrors, setValidationErrors] = useState({});

  const processedData = useMemo(() => {
    return data.map((group) => ({
      ...group,
      weekDaySearchable: `${group.weekDay} ${weekLabel(group.weekDay)}`,
    }));
  }, [data]);

  const teacherOptions = useMemo(() => {
    return careerTeachers.map((teacher) => ({
      label: `${teacher.name} ${teacher.paternalSurname}`,
      value: teacher,
      ...teacher,
    }));
  }, [careerTeachers]);

  // Efecto para calcular automáticamente la fecha de fin
  useEffect(() => {
    if (form.startDate && form.curriculum) {
      const calculatedEndDate = calculateEndDate(form.startDate, form.curriculum);
      setForm(prev => ({ ...prev, endDate: calculatedEndDate }));
    }
  }, [form.startDate, form.curriculum]);

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

    if (!formData.startDate) {
      errors.startDate = 'Debe seleccionar una fecha de inicio';
    }

    // Validar rango de horarios
    const timeError = validateTimeRange(formData.startTime, formData.endTime);
    if (timeError) {
      errors.timeRange = timeError;
    }

    // Validar rango de fechas
    const dateError = validateDateRange(formData.startDate, formData.endDate);
    if (dateError) {
      errors.dateRange = dateError;
    }

    const conflictError = validateTeacherConflict(careerTeachers, formData.teacher, formData.weekDay, formData.startTime, formData.endTime, data, editingGroupId);
    if (conflictError) {
      errors.teacherConflict = conflictError;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (form.name || form.weekDay || form.teacher || form.curriculum || form.startTime || form.endTime || form.startDate || form.endDate) {
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
        const [groupsRes, curriculumsRes] = await Promise.all([getGroupByCareer(career.id), getCurriculumByCareerId(career.id)]);

        const teachersRes = await getTeachersByCareer(career.id);

        setData(Array.isArray(groupsRes) ? groupsRes : groupsRes?.data ?? []);
        setCareerTeachers(Array.isArray(teachersRes) ? teachersRes : []);
        setCurriculums(Array.isArray(curriculumsRes) ? curriculumsRes : curriculumsRes?.data ?? []);
      } catch (e) {
        showError('Error', 'Ocurrió un error al cargar los datos');
        setData([]);
        setCareerTeachers([]);
        setCurriculums([]);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [career?.id, navigate, showError]);

  const resetForm = () => {
    setForm({
      name: '',
      weekDay: null,
      startTime: midnight,
      endTime: midnight,
      teacher: null,
      curriculum: null,
      startDate: new Date(),
      endDate: null,
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
      teacher: careerTeachers.find((t) => t.id === group.teacherId) || null,
      curriculum: curriculums.find((c) => c.id === group.curriculumId) || null,
      startDate: group.startDate ? new Date(group.startDate) : new Date(),
      endDate: group.endDate ? new Date(group.endDate) : null,
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
      startDate: form.startDate.toISOString().split('T')[0],
      endDate: form.endDate ? form.endDate.toISOString().split('T')[0] : null,
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
        startDate: form.startDate.toISOString().split('T')[0],
        endDate: form.endDate ? form.endDate.toISOString().split('T')[0] : null,
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
    <div className="flex flex-wrap align-items-center">
      <Button ref={createButtonRef} icon="pi pi-plus" severity="primary" disabled={curriculums.length === 0 || careerTeachers.length === 0} className="me-2" onClick={openCreateModal}>
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
      <Button icon="pi pi-arrow-up-right" rounded outlined tooltip="Ver detalles" tooltipOptions={{ position: 'left' }} onClick={() => navigate('/admin/careers/groups/details', { state: { group: row, career } })} />
    </div>
  );

  const dateBodyTemplate = (rowData) => {
    if (!rowData.startDate) return <span className="text-muted">-</span>;
    return new Date(rowData.startDate).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isFormValid = Object.keys(validationErrors).length === 0 && form.name.trim() && form.weekDay && form.teacher && form.curriculum && form.startDate;

  if (loading) {
    return (
      <>
        <div className="bg-white rounded-top p-2">
          <CareerTabs />
        </div>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 220 }}>
          <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
        </div>
      </>
    );
  }

  if (curriculums?.length === 0) {
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
        <div className="d-flex justify-content-center my-2">
          <Message severity="warn" text="Para crear un grupo, primero debes definir un plan de estudios en la sección 'Plan de estudios'." className="py-4" />
        </div>
      </>
    );
  }

  if (careerTeachers.length === 0) {
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
        <div className="d-flex justify-content-center my-2">
          <Message severity="warn" text="No hay docentes asignados a esta carrera. Para asignar docentes, ve a la sección de Usuarios y asígnalos a esta carrera." className="py-4" />
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        .btn-close {
          --bs-btn-close-bg: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%23e31e24'%3e%3cpath d='M.293.293a1 1 0 0 1 1.414 0L8 6.586 14.293.293a1 1 0 1 1 1.414 1.414L9.414 8l6.293 6.293a1 1 0 0 1-1.414 1.414L8 9.414l-6.293 6.293a1 1 0 0 1-1.414-1.414L6.586 8 .293 1.707a1 1 0 0 1 0-1.414'/%3e%3c/svg%3e");
        }
      `}</style>

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
          value={processedData}
          selection={selected}
          onSelectionChange={(e) => setSelected(e.value)}
          dataKey="groupId"
          paginator
          rows={5}
          rowsPerPageOptions={[5, 10, 25]}
          globalFilter={search}
          header={header}
          className="text-nowrap"
          emptyMessage={<p className="text-center my-5">Aún no hay registros</p>}
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column field="name" header="Nombre" sortable />
          <Column field="weekDaySearchable" header="Día" body={(row) => weekLabel(row.weekDay)} sortable />
          <Column field="startTime" header="Hora Inicio" sortable />
          <Column field="endTime" header="Hora Fin" sortable />
          <Column field="startDate" header="Fecha Inicio" body={dateBodyTemplate} sortable />
          <Column field="teacherName" header="Docente" sortable />
          <Column field="curriculumName" header="Plan de estudios" sortable />
          <Column body={actions} header="Acciones" exportable={false} />
        </DataTable>
      </div>

      {/* MODAL CREAR */}
      <div className="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" ref={createModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <h5 className="modal-title text-blue-500 mb-0">Crear Grupo</h5>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>

            <form onSubmit={saveGroup}>
              <div className="modal-body p-4">
                {/* Sección: Información General */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineGroup className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Información General</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Nombre del grupo *</label>
                        <InputText
                          className={`w-100 ${validationErrors.name ? 'p-invalid' : ''}`}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Ingrese el nombre del grupo"
                          required
                          autoFocus
                        />
                        {validationErrors.name && <small className="p-error">{validationErrors.name}</small>}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Sección: Asignación de Docente */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlinePerson className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Asignación de Docente</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Docente asignado *
                          <small className="text-secondary ms-1">({careerTeachers.length} disponibles)</small>
                        </label>
                        <Dropdown
                          className={`w-100 ${validationErrors.teacher ? 'p-invalid' : ''}`}
                          value={form.teacher}
                          options={teacherOptions}
                          optionLabel="label"
                          placeholder="Seleccione un docente"
                          filter
                          onChange={(e) => setForm({ ...form, teacher: e.value })}
                          required
                        />
                        {validationErrors.teacher && <small className="p-error">{validationErrors.teacher}</small>}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Sección: Plan de Estudios */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineAssignment className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Plan de Estudios</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Plan de estudios *</label>
                        <Dropdown
                          className={`w-100 ${validationErrors.curriculum ? 'p-invalid' : ''}`}
                          value={form.curriculum}
                          options={curriculums}
                          optionLabel="name"
                          placeholder="Seleccione un plan de estudios"
                          filter
                          onChange={(e) => setForm({ ...form, curriculum: e.value })}
                          required
                        />
                        {validationErrors.curriculum && <small className="p-error">{validationErrors.curriculum}</small>}
                        {form.curriculum && (
                          <small className="text-muted d-block mt-1">
                            Duración: {calculateCurriculumDuration(form.curriculum).weeks} semanas
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Sección: Horario */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineSchedule className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Horario</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label fw-semibold">Día de la semana *</label>
                        <Dropdown
                          value={form.weekDay}
                          options={weekDayOptions}
                          placeholder="Seleccione un día"
                          onChange={(e) => setForm({ ...form, weekDay: e.value })}
                          className={`w-100 ${validationErrors.weekDay ? 'p-invalid' : ''}`}
                          required
                        />
                        {validationErrors.weekDay && <small className="p-error">{validationErrors.weekDay}</small>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Hora de inicio *</label>
                        <Calendar
                          className={`w-100 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.value })}
                          timeOnly
                          hourFormat="24"
                          showIcon
                          icon={() => <i className="pi pi-clock" />}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Hora de fin *</label>
                        <Calendar
                          className={`w-100 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
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
                    {validationErrors.timeRange && <small className="p-error">{validationErrors.timeRange}</small>}
                  </div>
                </div>

                <Divider />

                {/* Sección: Fechas del Curso */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineCalendarToday className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Fechas del Curso</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Fecha de inicio *</label>
                        <Calendar
                          className={`w-100 ${validationErrors.startDate ? 'p-invalid' : ''}`}
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.value })}
                          showIcon
                          dateFormat="dd/mm/yy"
                          placeholder="Seleccione la fecha de inicio"
                          required
                        />
                        {validationErrors.startDate && <small className="p-error">{validationErrors.startDate}</small>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Fecha de finalización</label>
                        <Calendar
                          className="w-100"
                          value={form.endDate}
                          onChange={(e) => setForm({ ...form, endDate: e.value })}
                          showIcon
                          dateFormat="dd/mm/yy"
                          placeholder="Se calcula automáticamente"
                          disabled={!form.curriculum}
                        />
                        <small className="text-muted">
                          {form.curriculum ? 'Se calcula automáticamente basándose en el plan de estudios' : 'Seleccione primero un plan de estudios'}
                        </small>
                      </div>
                    </div>
                    {validationErrors.dateRange && <small className="p-error">{validationErrors.dateRange}</small>}
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
                  <span className="ms-2">Cancelar</span>
                </Button>
                <Button type="submit" icon="pi pi-save" severity="primary" disabled={!isFormValid}>
                  <span className="ms-2">Guardar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL MODIFICAR */}
      <div className="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" ref={updateModalRef} tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-xl">
          <div className="modal-content">
            <div className="modal-header">
              <div className="d-flex align-items-center">
                <h5 className="modal-title text-blue-500 mb-0">Modificar Grupo</h5>
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>

            <form onSubmit={updateGroupAction}>
              <div className="modal-body p-4">
                {/* Sección: Información General */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineGroup className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Información General</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Nombre del grupo *</label>
                        <InputText
                          className={`w-100 ${validationErrors.name ? 'p-invalid' : ''}`}
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          placeholder="Ingrese el nombre del grupo"
                          required
                          autoFocus
                        />
                        {validationErrors.name && <small className="p-error">{validationErrors.name}</small>}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Sección: Asignación de Docente */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlinePerson className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Asignación de Docente</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Docente asignado *
                          <small className="text-secondary ms-1">({careerTeachers.length} disponibles)</small>
                        </label>
                        <Dropdown
                          className={`w-100 ${validationErrors.teacher ? 'p-invalid' : ''}`}
                          value={form.teacher}
                          options={teacherOptions}
                          optionLabel="label"
                          placeholder="Seleccione un docente"
                          filter
                          onChange={(e) => setForm({ ...form, teacher: e.value })}
                          required
                        />
                        {validationErrors.teacher && <small className="p-error">{validationErrors.teacher}</small>}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Sección: Plan de Estudios */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineAssignment className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Plan de Estudios</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12">
                        <label className="form-label fw-semibold">Plan de estudios *</label>
                        <Dropdown
                          className={`w-100 ${validationErrors.curriculum ? 'p-invalid' : ''}`}
                          value={form.curriculum}
                          options={curriculums}
                          optionLabel="name"
                          placeholder="Seleccione un plan de estudios"
                          filter
                          onChange={(e) => setForm({ ...form, curriculum: e.value })}
                          required
                        />
                        {validationErrors.curriculum && <small className="p-error">{validationErrors.curriculum}</small>}
                        {form.curriculum && (
                          <small className="text-muted d-block mt-1">
                            Duración: {calculateCurriculumDuration(form.curriculum).weeks} semanas
                          </small>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Sección: Horario */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineSchedule className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Horario</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-12 mb-3">
                        <label className="form-label fw-semibold">Día de la semana *</label>
                        <Dropdown
                          value={form.weekDay}
                          options={weekDayOptions}
                          placeholder="Seleccione un día"
                          onChange={(e) => setForm({ ...form, weekDay: e.value })}
                          className={`w-100 ${validationErrors.weekDay ? 'p-invalid' : ''}`}
                          required
                        />
                        {validationErrors.weekDay && <small className="p-error">{validationErrors.weekDay}</small>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Hora de inicio *</label>
                        <Calendar
                          className={`w-100 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
                          value={form.startTime}
                          onChange={(e) => setForm({ ...form, startTime: e.value })}
                          timeOnly
                          hourFormat="24"
                          showIcon
                          icon={() => <i className="pi pi-clock" />}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Hora de fin *</label>
                        <Calendar
                          className={`w-100 ${validationErrors.timeRange ? 'p-invalid' : ''}`}
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
                    {validationErrors.timeRange && <small className="p-error">{validationErrors.timeRange}</small>}
                  </div>
                </div>

                <Divider />

                {/* Sección: Fechas del Curso */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <MdOutlineCalendarToday className="text-muted me-2" size={20} />
                    <h6 className="text-muted fw-semibold mb-0">Fechas del Curso</h6>
                  </div>
                  <div className="px-3 rounded">
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Fecha de inicio *</label>
                        <Calendar
                          className={`w-100 ${validationErrors.startDate ? 'p-invalid' : ''}`}
                          value={form.startDate}
                          onChange={(e) => setForm({ ...form, startDate: e.value })}
                          showIcon
                          dateFormat="dd/mm/yy"
                          placeholder="Seleccione la fecha de inicio"
                          required
                        />
                        {validationErrors.startDate && <small className="p-error">{validationErrors.startDate}</small>}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-semibold">Fecha de finalización</label>
                        <Calendar
                          className="w-100"
                          value={form.endDate}
                          onChange={(e) => setForm({ ...form, endDate: e.value })}
                          showIcon
                          dateFormat="dd/mm/yy"
                          placeholder="Se calcula automáticamente"
                          disabled={!form.curriculum}
                        />
                        <small className="text-muted">
                          {form.curriculum ? 'Se calcula automáticamente basándose en el plan de estudios' : 'Seleccione primero un plan de estudios'}
                        </small>
                      </div>
                    </div>
                    {validationErrors.dateRange && <small className="p-error">{validationErrors.dateRange}</small>}
                  </div>
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
                  <span className="ms-2">Cancelar</span>
                </Button>
                <Button type="submit" icon="pi pi-save" severity="primary" disabled={!isFormValid}>
                  <span className="ms-2">Modificar</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
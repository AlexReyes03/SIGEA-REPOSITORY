import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdOutlineCoPresent, MdOutlineBook, MdOutlineMoreHoriz, MdOutlineSchool } from 'react-icons/md';
import { Modal } from 'bootstrap';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getCareerByPlantelId, createCareer, updateCareer, deleteCareer } from '../../../api/academics/careerService';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';

export default function Careers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();

  const opRef = useRef(null);
  const [selectedCareer, setSelectedCareer] = useState(null);

  const createButtonRef = useRef(null);
  const editButtonRef = useRef(null);
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  useBootstrapModalFocus(createModalRef, createButtonRef);
  useBootstrapModalFocus(editModalRef, editButtonRef);

  const [careers, setCareers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCareer, setEditing] = useState(null);

  // NUEVOS ESTADOS PARA LOADING
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    differentiator: '',
  });
  const [differentiatorPreview, setDifferentiatorPreview] = useState('');

  const loadCareers = async () => {
    try {
      setLoading(true);
      const list = await getCareerByPlantelId(user.campus.id);
      setCareers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error loading careers:', err);
      showError('Error', 'Error al cargar carreras');
      setCareers([]);
    } finally {
      setLoading(false);
    }
  };

  // Generar preview de matrícula
  const generatePreview = (differentiator) => {
    if (!differentiator) return '';
    const year = new Date().getFullYear().toString().slice(-2);
    return `${year}${differentiator.toUpperCase()}0001`;
  };

  const handleDifferentiatorChange = (value) => {
    const upperValue = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 5);
    setFormData((prev) => ({ ...prev, differentiator: upperValue }));
    setDifferentiatorPreview(generatePreview(upperValue));
  };

  const validateDifferentiator = (differentiator) => {
    if (!differentiator) return 'El diferenciador es obligatorio';
    if (differentiator.length < 2) return 'Mínimo 2 caracteres';
    if (differentiator.length > 5) return 'Máximo 5 caracteres';
    if (!/^[A-Z0-9]+$/.test(differentiator)) return 'Solo letras mayúsculas y números';
    return null;
  };

  useEffect(() => {
    loadCareers();
  }, []);

  // CREAR CARRERA - CON LOADING STATE
  const handleCreate = async (e) => {
    e.preventDefault();

    // Prevenir doble envío
    if (isCreating) return;

    const differentiatorError = validateDifferentiator(formData.differentiator);
    if (differentiatorError) {
      showWarn('Error de validación', differentiatorError);
      return;
    }

    if (!formData.name.trim()) {
      showWarn('Error de validación', 'El nombre es obligatorio');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      differentiator: formData.differentiator,
      plantelId: user.campus.id,
    };

    try {
      setIsCreating(true);
      await createCareer(payload);
      showSuccess('Éxito', 'Carrera creada correctamente');

      // Cerrar modal correctamente
      const modalInstance = Modal.getInstance(createModalRef.current);
      if (modalInstance) {
        modalInstance.hide();
      }

      // Limpiar formulario
      setFormData({ name: '', differentiator: '' });
      setDifferentiatorPreview('');

      // Recargar datos
      await loadCareers();
    } catch (err) {
      console.error('Error creating career:', err);
      const message = err.message || 'Error al crear la carrera';
      showError('Error', message);
    } finally {
      setIsCreating(false);
    }
  };

  // ACTUALIZAR CARRERA - CON LOADING STATE
  const handleUpdate = async (e) => {
    e.preventDefault();

    // Prevenir doble envío
    if (isUpdating) return;

    const differentiatorError = validateDifferentiator(formData.differentiator);
    if (differentiatorError) {
      showWarn('Error de validación', differentiatorError);
      return;
    }

    if (!formData.name.trim()) {
      showWarn('Error de validación', 'El nombre es obligatorio');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      differentiator: formData.differentiator,
      plantelId: user.campus.id,
    };

    try {
      setIsUpdating(true);
      await updateCareer(editingCareer.id, payload);
      showSuccess('Éxito', 'Carrera actualizada correctamente');

      // Cerrar modal correctamente
      const modalInstance = Modal.getInstance(editModalRef.current);
      if (modalInstance) {
        modalInstance.hide();
      }

      // Recargar datos
      await loadCareers();
    } catch (err) {
      console.error('Error updating career:', err);
      const message = err.message || 'Error al actualizar la carrera';
      showError('Error', message);
    } finally {
      setIsUpdating(false);
    }
  };

  // ELIMINAR CARRERA - CON LOADING STATE
  const handleDelete = (careerToDelete) => {
    if (isDeleting) return;

    confirmAction({
      message: '¿Estás seguro de eliminar esta carrera?',
      header: 'Eliminar carrera',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      onAccept: async () => {
        try {
          setIsDeleting(true);
          await deleteCareer(careerToDelete.id);
          showSuccess('Hecho', `Carrera "${careerToDelete.name}" eliminada`);
          await loadCareers();
        } catch (err) {
          console.error('Error deleting career:', err);
          const message = err.message || 'Error al eliminar la carrera';
          showError('Error', message);
        } finally {
          setIsDeleting(false);
        }
      },
    });
  };

  // Abre cualquiera de los dos modales
  const openModal = (ref, career = null) => {
    if (career) {
      setEditing(career);
      setFormData({
        name: career.name || '',
        differentiator: career.differentiator || '',
      });
      setDifferentiatorPreview(generatePreview(career.differentiator || ''));
    } else {
      setFormData({ name: '', differentiator: '' });
      setDifferentiatorPreview('');
    }
    if (ref.current) new Modal(ref.current).show();
  };

  const isCareerActive = (career) => {
    return career.studentsCount > 0 || career.groupsCount > 0 || career.teachersCount > 0;
  };

  if (loading) {
    return (
      <>
        <div className="bg-white rounded-top p-2 d-flex align-items-center">
          <h3 className="text-blue-500 fw-semibold mx-3 my-1">Carreras</h3>
          <div className="ms-auto">
            <Button icon="pi pi-plus" severity="primary" rounded disabled>
              <span className="d-none d-sm-inline ms-2">Crear carrera</span>
            </Button>
          </div>
        </div>

        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando carreras...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="bg-white rounded-top p-2 d-flex align-items-center">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Carreras</h3>
        <div className="ms-auto d-flex align-items-center gap-2">
          <Button ref={createButtonRef} icon="pi pi-plus" severity="primary" rounded onClick={() => openModal(createModalRef)} disabled={isCreating || isUpdating || isDeleting}>
            <span className="d-none d-sm-inline ms-2">Crear carrera</span>
          </Button>
        </div>
      </div>

      {careers.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineSchool className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No hay carreras registradas</h5>
            <p className="text-muted">Crea tu primera carrera para comenzar</p>
          </div>
        </div>
      ) : (
        <div className="row mt-3">
          {careers.map((career) => (
            <div key={career.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
              <div className="card border-0 h-100 hovereable shadow-sm" onClick={() => navigate('/admin/careers/curriculums', { state: { career } })}>
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1 text-truncate">
                      <h6 className="fw-semibold lh-sm mb-2 text-dark text-truncate">{career.name}</h6>
                      <div className="d-flex align-items-center gap-2">
                        <div className="ms-2 my-2">
                          {career.studentsCount === 0 && career.teachersCount === 0 && career.groupsCount === 0 ? (
                            <small className="text-muted">
                              <i className="pi pi-info-circle me-1"></i>
                              Carrera sin actividad
                            </small>
                          ) : (
                            <small className="text-success">
                              <i className="pi pi-check-circle me-1"></i>
                              {career.studentsCount > 0 && career.groupsCount > 0 ? 'Operativa' : career.studentsCount > 0 ? 'Con estudiantes' : 'Con personal'}
                            </small>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn border-0 p-1 ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCareer(career);
                        opRef.current.toggle(e);
                      }}
                      disabled={isDeleting}
                    >
                      <MdOutlineMoreHoriz size={20} />
                    </button>
                  </div>

                  <div className="row g-2 text-center">
                    <div className="col-4">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlineCoPresent className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{career.studentsCount || 0}</div>
                        <small className="text-muted">Estudiantes</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlineBook className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{career.groupsCount || 0}</div>
                        <small className="text-muted">Grupos</small>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <i className="pi pi-users text-secondary mb-1" style={{ fontSize: '1.5rem' }}></i>
                        <div className="fw-bold text-secondary">{career.teachersCount || 0}</div>
                        <small className="text-muted">Maestros</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OverlayPanel de acciones */}
      <OverlayPanel ref={opRef}>
        <button
          ref={editButtonRef}
          className="dropdown-item"
          onClick={() => {
            openModal(editModalRef, selectedCareer);
            opRef.current.hide();
          }}
          disabled={isUpdating || isDeleting}
        >
          <i className="pi pi-pencil me-2" />
          Modificar
        </button>
        <button
          className="dropdown-item text-danger"
          onClick={() => {
            handleDelete(selectedCareer);
            opRef.current.hide();
          }}
          disabled={isDeleting}
        >
          <i className="pi pi-trash me-2" />
          Eliminar
        </button>
      </OverlayPanel>

      {/* Modal CREAR */}
      <div className="modal fade" ref={createModalRef} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear carrera</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" disabled={isCreating} />
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre *</label>
                  <input className="form-control" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} autoComplete="off" spellCheck="false" placeholder="Carrera Técnica en..." required disabled={isCreating} />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Diferenciador * <small className="text-muted">(2-5 caracteres, solo mayúsculas y números)</small>
                  </label>
                  <InputText className="form-control" value={formData.differentiator} onChange={(e) => handleDifferentiatorChange(e.target.value)} placeholder="CO, IN, MEC..." maxLength={5} required disabled={isCreating} />
                  {differentiatorPreview && (
                    <small className="text-muted">
                      Previsualizar matrícula: <strong>{differentiatorPreview}</strong>
                    </small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <Button type="button" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" disabled={isCreating}>
                  <span className="ms-1">Cancelar</span>
                </Button>
                <Button type="submit" icon={isCreating ? 'pi pi-spin pi-spinner' : 'pi pi-check'} severity="primary" disabled={isCreating}>
                  <span className="ms-1">{isCreating ? 'Creando...' : 'Guardar'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal EDITAR */}
      <div className="modal fade" ref={editModalRef} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Modificar carrera</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" disabled={isUpdating} />
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre *</label>
                  <input className="form-control" value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="Carrera Técnica en..." autoComplete="off" spellCheck="false" required disabled={isUpdating} />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Diferenciador * <small className="text-muted">(2-5 caracteres, solo mayúsculas y números)</small>
                  </label>
                  <InputText className="form-control" value={formData.differentiator} onChange={(e) => handleDifferentiatorChange(e.target.value)} placeholder="CO, IN, MEC..." maxLength={5} required disabled={isUpdating} />
                  {differentiatorPreview && (
                    <small className="text-muted">
                      Previsualizar matrícula: <strong>{differentiatorPreview}</strong>
                    </small>
                  )}
                </div>

                {editingCareer && isCareerActive(editingCareer) && (
                  <div className="mb-3">
                    <label className="form-label">Estado actual</label>
                    <div className="row g-2 text-center">
                      <div className="col-4">
                        <div className="p-2 rounded bg-light">
                          <div className="fw-bold text-secondary">{editingCareer.studentsCount || 0}</div>
                          <small className="text-muted">Estudiantes</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded bg-light">
                          <div className="fw-bold text-secondary">{editingCareer.groupsCount || 0}</div>
                          <small className="text-muted">Grupos</small>
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="p-2 rounded bg-light">
                          <div className="fw-bold text-secondary">{editingCareer.teachersCount || 0}</div>
                          <small className="text-muted">Maestros</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Button type="button" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" disabled={isUpdating}>
                  <span className="ms-1">Cancelar</span>
                </Button>
                <Button type="submit" icon={isUpdating ? 'pi pi-spin pi-spinner' : 'pi pi-check'} severity="primary" disabled={isUpdating}>
                  <span className="ms-1">{isUpdating ? 'Modificando...' : 'Modificar'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

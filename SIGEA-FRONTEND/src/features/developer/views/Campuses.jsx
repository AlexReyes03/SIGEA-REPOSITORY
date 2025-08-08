import React, { useRef, useEffect, useState, useCallback } from 'react';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Button } from 'primereact/button';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdOutlineLocationOn, MdOutlineGroups, MdOutlineSupervisorAccount, MdOutlineMoreHoriz, MdOutlineBusiness } from 'react-icons/md';
import { Modal } from 'bootstrap';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { getAllCampus, createCampus, updateCampus } from '../../../api/academics/campusService';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';

export default function Campuses() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarn } = useToast();

  const opRef = useRef(null);
  const [selectedCampus, setSelectedCampus] = useState(null);

  const createButtonRef = useRef(null);
  const editButtonRef = useRef(null);
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);
  useBootstrapModalFocus(createModalRef, createButtonRef);
  useBootstrapModalFocus(editModalRef, editButtonRef);

  const [campuses, setCampuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCampus, setEditing] = useState(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
  });

  const loadCampuses = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getAllCampus();
      setCampuses(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Error loading campuses:', err);
      showError('Error', 'Error al cargar planteles');
      setCampuses([]);
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadCampuses();
  }, [loadCampuses]);

  useEffect(() => {
    return () => {
      const createModal = Modal.getInstance(createModalRef.current);
      const editModal = Modal.getInstance(editModalRef.current);
      if (createModal) createModal.hide();
      if (editModal) editModal.hide();
    };
  }, []);

  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();

      if (isCreating) return;

      if (!formData.name.trim()) {
        showWarn('Error de validación', 'El nombre del plantel es obligatorio');
        return;
      }

      const payload = {
        name: formData.name.trim(),
      };

      try {
        setIsCreating(true);
        await createCampus(payload);
        showSuccess('Éxito', 'Plantel creado correctamente');

        const modalInstance = Modal.getInstance(createModalRef.current);
        if (modalInstance) {
          modalInstance.hide();
        }

        setFormData({ name: '' });
        await loadCampuses();
      } catch (err) {
        console.error('Error creating campus:', err);
        const message = err.message || 'Error al crear el plantel';
        showError('Error', message);
      } finally {
        setIsCreating(false);
      }
    },
    [isCreating, formData, showWarn, showSuccess, showError, loadCampuses]
  );

  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();

      if (isUpdating) return;

      if (!formData.name.trim()) {
        showWarn('Error de validación', 'El nombre del plantel es obligatorio');
        return;
      }

      const payload = {
        name: formData.name.trim(),
      };

      try {
        setIsUpdating(true);
        await updateCampus(editingCampus.id, payload);
        showSuccess('Éxito', 'Plantel actualizado correctamente');

        const modalInstance = Modal.getInstance(editModalRef.current);
        if (modalInstance) {
          modalInstance.hide();
        }

        await loadCampuses();
      } catch (err) {
        console.error('Error updating campus:', err);
        const message = err.message || 'Error al actualizar el plantel';
        showError('Error', message);
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, formData, editingCampus?.id, showWarn, showSuccess, showError, loadCampuses]
  );

  const openModal = useCallback((ref, campus = null) => {
    if (campus) {
      setEditing(campus);
      setFormData({
        name: campus.name || '',
      });
    } else {
      setFormData({ name: '' });
    }
    if (ref.current) new Modal(ref.current).show();
  }, []);

  return (
    <>
      <div className="bg-white rounded-top p-2 d-flex align-items-center">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1 text-truncate">Planteles</h3>
        <div className="ms-auto">
          <Button ref={createButtonRef} icon="pi pi-plus" severity="primary" rounded disabled={loading || isCreating || isUpdating} onClick={() => !loading && openModal(createModalRef)}>
            <span className="d-none d-sm-inline ms-2">Crear plantel</span>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando planteles...</p>
          </div>
        </div>
      ) : campuses.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="text-center">
            <MdOutlineBusiness className="text-secondary" size={70} />
            <h5 className="mt-3 text-muted">No hay planteles registrados</h5>
            <p className="text-muted">Crea tu primer plantel para comenzar</p>
          </div>
        </div>
      ) : (
        <div className="row mt-3">
          {campuses.map((campus) => (
            <div key={campus.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
              <div className="card border-0 h-100 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-grow-1 text-truncate">
                      <h6 className="fw-semibold lh-sm mb-2 text-dark text-truncate">{campus.name}</h6>
                      <div className="d-flex align-items-center gap-2">
                        <div className="ms-2 my-2">
                          {campus.totalUsers === 0 && campus.totalSupervisors === 0 ? (
                            <small className="text-muted">
                              <i className="pi pi-info-circle me-1"></i>
                              Sin usuarios asignados
                            </small>
                          ) : (
                            <small className="text-success">
                              <i className="pi pi-check-circle me-1"></i>
                              Plantel operativo
                            </small>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      className="btn border-0 p-1 ms-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCampus(campus);
                        opRef.current.toggle(e);
                      }}
                    >
                      <MdOutlineMoreHoriz size={20} />
                    </button>
                  </div>

                  <div className="row g-2 text-center">
                    <div className="col-6">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlineGroups className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{campus.totalUsers || 0}</div>
                        <small className="text-muted">Usuarios</small>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-2 rounded bg-light h-100 text-truncate">
                        <MdOutlineSupervisorAccount className="text-secondary mb-1" size={24} />
                        <div className="fw-bold text-secondary">{campus.totalSupervisors || 0}</div>
                        <small className="text-muted">Supervisores</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OverlayPanel de acciones - Solo modificar */}
      <OverlayPanel ref={opRef}>
        <button
          ref={editButtonRef}
          className="dropdown-item"
          onClick={() => {
            openModal(editModalRef, selectedCampus);
            opRef.current.hide();
          }}
          disabled={isUpdating}
        >
          <i className="pi pi-pencil me-2" />
          Modificar
        </button>
      </OverlayPanel>

      {/* Modal CREAR */}
      <div className="modal fade" ref={createModalRef} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear plantel</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" disabled={isCreating} />
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre del plantel *</label>
                  <input
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    autoComplete="off"
                    spellCheck="false"
                    placeholder="Ej: Cuernavaca, Temixco, Jiutepec..."
                    required
                    disabled={isCreating}
                    autoFocus
                  />
                  <small className="text-muted">Este será el nombre principal del plantel que verán todos los usuarios</small>
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
              <h5 className="modal-title">Modificar plantel</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" disabled={isUpdating} />
            </div>
            <form onSubmit={handleUpdate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre del plantel *</label>
                  <input
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Cuernavaca, Temixco, Jiutepec..."
                    autoComplete="off"
                    spellCheck="false"
                    required
                    disabled={isUpdating}
                    autoFocus
                  />
                  <small className="text-muted">Este será el nombre del plantel que verán todos los usuarios</small>
                </div>

                {editingCampus && (
                  <div className="mb-3">
                    <div className="row g-2 text-center">
                      <div className="col-6">
                        <div className="p-2 rounded bg-gray-800">
                          <div className="fw-bold text-secondary">{editingCampus.totalUsers || 0}</div>
                          <small className="text-muted">Usuarios</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="p-2 rounded bg-gray-800">
                          <div className="fw-bold text-secondary">{editingCampus.totalSupervisors || 0}</div>
                          <small className="text-muted">Supervisores</small>
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

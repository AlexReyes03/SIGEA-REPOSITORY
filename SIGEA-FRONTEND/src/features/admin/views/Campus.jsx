import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import { MdOutlineBusiness, MdOutlinePerson, MdOutlineLocationOn, MdOutlinePhone, MdOutlineAssignment, MdApartment } from 'react-icons/md';
import { Modal } from 'bootstrap';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getCampusById, updateCampus } from '../../../api/academics/campusService';
import { getUserByRoleAndPlantel } from '../../../api/userService';
import { getAllRoles } from '../../../api/roleService';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';

export default function Campus() {
  const { user } = useAuth();
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();

  const editModalRef = useRef(null);
  const editButtonRef = useRef(null);
  useBootstrapModalFocus(editModalRef, editButtonRef);

  const [campus, setCampus] = useState(null);
  const [availableDirectors, setAvailableDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadingDirectors, setLoadingDirectors] = useState(false);
  const [modalOpened, setModalOpened] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    director: null,
    directorIdentifier: '',
    address: '',
    phone: '',
    rfc: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Validar formulario
  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre del plantel es obligatorio';
    }

    // Validar que identificador y director vayan juntos
    const hasIdentifier = formData.directorIdentifier && formData.directorIdentifier.trim();
    const hasDirector = formData.director;

    if (hasIdentifier && !hasDirector) {
      errors.directorGroup = 'Si especifica un identificador, debe seleccionar un director';
    }
    if (hasDirector && !hasIdentifier) {
      errors.directorGroup = 'Si selecciona un director, debe especificar su identificador';
    }

    if (formData.directorIdentifier && formData.directorIdentifier.length > 50) {
      errors.directorIdentifier = 'El identificador no puede exceder 50 caracteres';
    }

    if (formData.address && formData.address.length > 255) {
      errors.address = 'La dirección no puede exceder 255 caracteres';
    }

    if (formData.phone) {
      const phoneRegex = /^\d{3}-\d{2,3}-\d{2,4}$/;
      if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Formato de teléfono inválido. Ejemplo: 777-123-4567';
      }
    }

    if (formData.rfc) {
      const rfcRegex = /^[A-Z]{3}-\d{6}-[A-Z0-9]{3}$/;
      if (!rfcRegex.test(formData.rfc)) {
        errors.rfc = 'Formato de RFC inválido. Ejemplo: ABC-123456-XYZ';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Cargar datos del campus
  const loadCampusData = useCallback(async () => {
    if (!user?.campus?.id) {
      showError('Error', 'No se pudo identificar el plantel del usuario');
      return;
    }

    try {
      setLoading(true);
      const campusData = await getCampusById(user.campus.id);
      setCampus(campusData);
    } catch (err) {
      showError('Error', 'Error al cargar información del plantel');
    } finally {
      setLoading(false);
    }
  }, [user?.campus?.id, showError]);

  // Cargar directores disponibles (ADMINS del campus)
  const loadAvailableDirectors = useCallback(async () => {
    if (!user?.campus?.id) return;

    try {
      setLoadingDirectors(true);

      const roles = await getAllRoles();
      const adminRole = roles.find((role) => role.roleName === 'ADMIN');

      if (!adminRole) {
        setAvailableDirectors([]);
        return;
      }

      const response = await getUserByRoleAndPlantel(adminRole.id, user.campus.id);
      const directors = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];

      setAvailableDirectors(directors);
    } catch (err) {
      showError('Error', 'Error al cargar directores disponibles');
      setAvailableDirectors([]);
    } finally {
      setLoadingDirectors(false);
    }
  }, [user?.campus?.id, showError]);

  useEffect(() => {
    if (user?.campus?.id) {
      loadCampusData();
    }
  }, [loadCampusData]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  // Inicializar formulario cuando se carguen los directores y el modal esté abierto
  useEffect(() => {
    if (modalOpened && availableDirectors.length >= 0 && campus) {
      let currentDirector = null;
      if (campus.director && availableDirectors.length > 0) {
        currentDirector = availableDirectors.find((d) => `${d.name} ${d.paternalSurname} ${d.maternalSurname || ''}`.trim() === campus.director);
      }

      setFormData({
        name: campus.name || '',
        director: currentDirector || null,
        directorIdentifier: campus.directorIdentifier || '',
        address: campus.address || '',
        phone: campus.phone || '',
        rfc: campus.rfc || '',
      });
    }
  }, [modalOpened, availableDirectors, campus]);

  // Formatear opciones de directores para el dropdown
  const directorOptions = availableDirectors.map((director) => ({
    label: `${director.name} ${director.paternalSurname} ${director.maternalSurname || ''}`.trim(),
    value: director,
    ...director,
  }));

  // Abrir modal de edición
  const openEditModal = useCallback(async () => {
    if (!campus) return;

    // Primero cargar directores
    await loadAvailableDirectors();

    // Marcar modal como abierto
    setModalOpened(true);

    // Mostrar modal
    new Modal(editModalRef.current).show();
  }, [campus, loadAvailableDirectors]);

  // Limpiar formulario al cerrar modal
  const handleModalClose = useCallback(() => {
    setModalOpened(false);
    setFormData({
      name: '',
      director: null,
      directorIdentifier: '',
      address: '',
      phone: '',
      rfc: '',
    });
    setValidationErrors({});
  }, []);

  // Manejar actualización
  const handleUpdate = useCallback(
    async (e) => {
      e.preventDefault();

      if (isUpdating) return;

      if (!validateForm()) {
        showWarn('Error de validación', 'Por favor corrige los errores en el formulario');
        return;
      }

      // Construir payload - cada campo se evalúa independientemente
      const payload = {
        name: formData.name.trim(),
        director: formData.director ? `${formData.director.name} ${formData.director.paternalSurname} ${formData.director.maternalSurname || ''}`.trim() : null,
        directorIdentifier: formData.directorIdentifier.trim() || null,
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        rfc: formData.rfc.trim() || null,
      };

      console.log('FormData antes del payload:', formData);
      console.log('Payload que se enviará:', payload);

      try {
        setIsUpdating(true);
        await updateCampus(campus.id, payload);
        showSuccess('Éxito', 'Campus actualizado correctamente');

        const modalInstance = Modal.getInstance(editModalRef.current);
        if (modalInstance) {
          modalInstance.hide();
        }

        handleModalClose();
        await loadCampusData();
      } catch (err) {
        const message = err.message || 'Error al actualizar el plantel';
        showError('Error', message);
      } finally {
        setIsUpdating(false);
      }
    },
    [isUpdating, validateForm, formData, campus?.id, showWarn, showSuccess, showError, loadCampusData, handleModalClose]
  );

  // Manejar cambio de teléfono con formato automático
  const handlePhoneChange = useCallback((value) => {
    let numbers = value.replace(/\D/g, '');

    if (numbers.length <= 3) {
      setFormData((prev) => ({ ...prev, phone: numbers }));
    } else if (numbers.length <= 5) {
      setFormData((prev) => ({ ...prev, phone: `${numbers.slice(0, 3)}-${numbers.slice(3)}` }));
    } else if (numbers.length <= 9) {
      setFormData((prev) => ({ ...prev, phone: `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5)}` }));
    } else {
      setFormData((prev) => ({ ...prev, phone: `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}` }));
    }
  }, []);

  // Manejar cambio de RFC con formato automático
  const handleRfcChange = useCallback((value) => {
    let clean = value.replace(/-/g, '').toUpperCase();

    if (clean.length > 12) {
      clean = clean.slice(0, 12);
    }

    let formatted = '';
    if (clean.length <= 3) {
      formatted = clean;
    } else if (clean.length <= 9) {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
    } else {
      formatted = `${clean.slice(0, 3)}-${clean.slice(3, 9)}-${clean.slice(9)}`;
    }

    setFormData((prev) => ({ ...prev, rfc: formatted }));
  }, []);

  // Limpiar director si se borra el identificador
  const handleIdentifierChange = useCallback((value) => {
    setFormData((prev) => ({
      ...prev,
      directorIdentifier: value,
      // Si se borra el identificador, también borrar el director
      director: value.trim() ? prev.director : null,
    }));
  }, []);

  // Limpiar identificador si se borra el director
  const handleDirectorChange = useCallback((value) => {
    console.log('Director change:', value); // Debug log
    setFormData((prev) => {
      const newFormData = {
        ...prev,
        director: value,
        // Si se borra el director, también borrar el identificador
        directorIdentifier: value ? prev.directorIdentifier : '',
      };
      console.log('New form data after director change:', newFormData); // Debug log
      return newFormData;
    });
  }, []);

  return (
    <>
      <div className="bg-white rounded-top p-2 d-flex align-items-center">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Plantel</h3>
        {campus && (
          <div className="ms-auto">
            <Button ref={editButtonRef} icon="pi pi-pencil" severity="primary" onClick={openEditModal} disabled={isUpdating}>
              <span className="d-none d-sm-inline ms-2">Editar plantel</span>
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando información del Plantel...</p>
          </div>
        </div>
      ) : !campus ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <Message severity="error" text="No se pudo cargar la información del plantel" />
        </div>
      ) : (
        <>
          <div className="row mt-3">
            <div className="col-12">
              <div className="card border-0">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-4">
                    <div className="title-icon p-1 rounded-circle">
                      <MdApartment size={40} className="p-1" />
                    </div>
                    <h5 className="text-blue-500 fw-semibold ms-2 mb-0">Información del Plantel</h5>
                  </div>

                  <div className="row">
                    <div className="col-12 col-md-6 mb-4">
                      <div className="info-item p-3 border rounded bg-light">
                        <div className="d-flex align-items-center mb-2">
                          <MdOutlineBusiness className="text-secondary me-2" size={20} />
                          <strong className="text-secondary">Nombre</strong>
                        </div>
                        <p className="mb-0 text-dark">{campus.name || 'Sin nombre'}</p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 mb-4">
                      <div className="info-item p-3 border rounded bg-light">
                        <div className="d-flex align-items-center mb-2">
                          <MdOutlinePerson className="text-secondary me-2" size={20} />
                          <strong className="text-secondary">Director</strong>
                        </div>
                        <p className="mb-0 text-dark">{campus.directorIdentifier && campus.director ? `${campus.directorIdentifier} ${campus.director}` : campus.director || 'Sin asignar'}</p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 mb-4">
                      <div className="info-item p-3 border rounded bg-light">
                        <div className="d-flex align-items-center mb-2">
                          <MdOutlineLocationOn className="text-secondary me-2" size={20} />
                          <strong className="text-secondary">Dirección</strong>
                        </div>
                        <p className="mb-0 text-dark">{campus.address || 'Sin dirección'}</p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 mb-4">
                      <div className="info-item p-3 border rounded bg-light">
                        <div className="d-flex align-items-center mb-2">
                          <MdOutlinePhone className="text-secondary me-2" size={20} />
                          <strong className="text-secondary">Teléfono</strong>
                        </div>
                        <p className="mb-0 text-dark">{campus.phone || 'Sin teléfono'}</p>
                      </div>
                    </div>

                    <div className="col-12 col-md-6 mb-4">
                      <div className="info-item p-3 border rounded bg-light">
                        <div className="d-flex align-items-center mb-2">
                          <MdOutlineAssignment className="text-secondary me-2" size={20} />
                          <strong className="text-secondary">RFC</strong>
                        </div>
                        <p className="mb-0 text-dark">{campus.rfc || 'Sin RFC'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de edición */}
          <div className="modal fade" ref={editModalRef} tabIndex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
            <div className="modal-dialog modal-dialog-centered modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <div className="d-flex align-items-center">
                    <h5 className="modal-title text-blue-500 mb-0">Configurar Plantel</h5>
                  </div>
                  <button type="button" className="btn-close btn-close-gray" data-bs-dismiss="modal" disabled={isUpdating} onClick={handleModalClose} />
                </div>

                <form onSubmit={handleUpdate}>
                  <div className="modal-body p-4">
                    {/* Sección: Información General */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <MdOutlineBusiness className="text-muted me-2" size={20} />
                        <h6 className="text-muted fw-semibold mb-0">Información General</h6>
                      </div>
                      <div className="px-3 rounded">
                        <div className="row">
                          <div className="col-12">
                            <label className="form-label fw-semibold">Nombre del plantel *</label>
                            <InputText
                              className={`w-100 ${validationErrors.name ? 'p-invalid' : ''}`}
                              value={formData.name}
                              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                              placeholder="Ingrese el nombre del plantel"
                              disabled={isUpdating}
                              autoFocus
                            />
                            {validationErrors.name && <small className="p-error">{validationErrors.name}</small>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    {/* Sección: Director del Campus */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <MdOutlinePerson className="text-muted me-2" size={20} />
                        <h6 className="text-muted fw-semibold mb-0">Encargado</h6>
                      </div>
                      <div className="px-3 rounded">
                        <div className="row">
                          <div className="col-12 mb-1">
                            <label className="form-label fw-semibold">Director del plantel</label>
                            <div className={`p-inputgroup ${validationErrors.directorGroup ? 'p-invalid' : ''}`}>
                              <span className="p-inputgroup-addon bg-light" style={{ minWidth: '80px', justifyContent: 'center' }}>
                                <InputText
                                  value={formData.directorIdentifier}
                                  onChange={(e) => handleIdentifierChange(e.target.value)}
                                  placeholder="---"
                                  style={{ border: 'none', outline: 'none', textAlign: 'center', width: '60px' }}
                                  maxLength={50}
                                  disabled={isUpdating}
                                  className="p-0 bg-light"
                                />
                              </span>
                              <Dropdown
                                value={formData.director}
                                options={directorOptions}
                                optionLabel="label"
                                placeholder={loadingDirectors ? 'Cargando directores...' : 'Seleccione un director...'}
                                filter
                                onChange={(e) => handleDirectorChange(e.value)}
                                disabled={isUpdating || loadingDirectors}
                                showClear
                                className="flex-1"
                              />
                              {loadingDirectors && (
                                <span className="p-inputgroup-addon">
                                  <i className="pi pi-spin pi-spinner"></i>
                                </span>
                              )}
                            </div>

                            {validationErrors.directorGroup && <small className="p-error">{validationErrors.directorGroup}</small>}
                            {!loadingDirectors && directorOptions.length === 0 && <small className="text-muted">No hay administradores disponibles en este plantel</small>}
                            <small className="text-muted d-block mt-1">Ambos campos son opcionales, pero si completa uno debe completar el otro</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    {/* Sección: Datos de Contacto */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <MdOutlineLocationOn className="text-muted me-2" size={20} />
                        <h6 className="text-muted fw-semibold mb-0">Datos de Contacto</h6>
                      </div>
                      <div className="px-3 rounded">
                        <div className="row">
                          <div className="col-12 col-md-8 mb-1">
                            <label className="form-label fw-semibold">Dirección</label>
                            <InputText
                              className={`w-100 ${validationErrors.address ? 'p-invalid' : ''}`}
                              value={formData.address}
                              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                              placeholder="Dirección completa del plantel"
                              disabled={isUpdating}
                            />
                            {validationErrors.address && <small className="p-error">{validationErrors.address}</small>}
                          </div>

                          <div className="col-12 col-md-4 mb-3">
                            <label className="form-label fw-semibold">Teléfono</label>
                            <InputText className={`w-100 ${validationErrors.phone ? 'p-invalid' : ''}`} value={formData.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="XXX-XXX-XXXX" maxLength={12} disabled={isUpdating} />
                            {validationErrors.phone && <small className="p-error">{validationErrors.phone}</small>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    {/* Sección: Información Fiscal */}
                    <div className="mb-4">
                      <div className="d-flex align-items-center mb-3">
                        <MdOutlineAssignment className="text-muted me-2" size={20} />
                        <h6 className="text-muted fw-semibold mb-0">Información Fiscal</h6>
                      </div>
                      <div className="px-3 rounded">
                        <div className="row">
                          <div className="col-12 col-md-6">
                            <label className="form-label fw-semibold">RFC</label>
                            <InputText className={`w-100 ${validationErrors.rfc ? 'p-invalid' : ''}`} value={formData.rfc} onChange={(e) => handleRfcChange(e.target.value)} placeholder="ABC-123456-XYZ" maxLength={14} disabled={isUpdating} />
                            {validationErrors.rfc && <small className="p-error">{validationErrors.rfc}</small>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-footer">
                    <Button type="button" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" disabled={isUpdating} onClick={handleModalClose}>
                      <span className="ms-2">Cancelar</span>
                    </Button>
                    <Button type="submit" icon={isUpdating ? 'pi pi-spin pi-spinner' : 'pi pi-save'} severity="primary" disabled={isUpdating || Object.keys(validationErrors).length > 0}>
                      <span className="ms-2">{isUpdating ? 'Guardando...' : 'Guardar cambios'}</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'primereact/menu';
import { Button } from 'primereact/button';
import { MdOutlineCoPresent, MdOutlineBook, MdOutlineMoreHoriz } from 'react-icons/md';
import { Modal } from 'bootstrap';

import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getAllCareers, createCareer, updateCareer } from '../../../api/academics/careerService';

export default function Careers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();

  const menuRefByCareerId = useRef({});
  const createModalRef = useRef(null);
  const editModalRef = useRef(null);

  const [careers, setCareers] = useState([]);
  const [editingCareer, setEditing] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await getAllCareers();
        setCareers(list);
      } catch (err) {
        showError(err.message || 'Error al cargar carreras');
      }
    };

    load();
  }, []);

  const loadCareers = async () => {
    try {
      const list = await getAllCareers();
      setCareers(list);
    } catch (e) {
      showError(e.message || 'Error al obtener carreras');
    }
  };

  /* Crea una carrera */
  const handleCreate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = { name: form.name.value };
    try {
      await createCareer(payload, user.campus.id);
      showSuccess('Carrera creada');
      await loadCareers();
      Modal.getInstance(createModalRef.current).hide();
      form.reset();
    } catch (err) {
      showError(err.message || 'No se pudo crear');
    }
  };

  /* Actualiza la carrera en edición */
  const handleUpdate = async (e) => {
    e.preventDefault();
    const form = e.target;
    const payload = { name: form.name.value };
    try {
      await updateCareer(editingCareer.id, payload, user.campus.id);
      showSuccess('Carrera actualizada');
      await loadCareers();
      Modal.getInstance(editModalRef.current).hide();
    } catch (err) {
      showError(err.message || 'No se pudo actualizar');
    }
  };

  const handleDelete = (id) => {
    confirmAction({
      message: '¿Estás seguro de eliminar esta carrera?',
      header: 'Eliminar carrera',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      onAccept: () => {
        showSuccess('Carrera eliminada');
      },
    });
  };

  const openModal = (ref) => {
    if (ref.current) new Modal(ref.current).show();
  };

  return (
    <>
      <div className="bg-white rounded-top p-2 d-flex align-items-center">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1">Carreras</h3>

        <div className="ms-auto">
          <Button icon="pi pi-plus" severity="primary" rounded onClick={() => openModal(createModalRef)}>
            <span className="d-none d-sm-inline ms-2">Crear carrera</span>
          </Button>
        </div>
      </div>

      <div className="row mt-3">
        {careers.map((career) => {
          const items = [
            {
              label: 'Modificar',
              icon: 'pi pi-pencil',
              command: () => {
                setEditing(career);
                openModal(editModalRef);
              },
            },
            {
              label: 'Eliminar',
              icon: 'pi pi-trash',
              command: () => handleDelete(career.id),
            },
          ];

          return (
            <div key={career.id} className="col-12 col-sm-6 col-lg-4 col-xl-3 mb-3" style={{ maxWidth: '25rem' }}>
              <div className="card border-0 h-100 hovereable" onClick={() => navigate('/admin/careers/groups', { state: { career } })}>
                <img src={career.imageUrl || 'https://placehold.co/600x400?text=Cetec-Fallback'} className="card-img-top" alt={career.name} style={{ objectFit: 'cover', height: 180 }} />

                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <p className="fw-semibold lh-sm mb-0 flex-grow-1">{career.name}</p>

                    <button
                      className="btn border-0 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        const menuRef = menuRefByCareerId.current[career.id];
                        if (menuRef) {
                          menuRef.toggle(e);
                        }
                      }}
                    >
                      <MdOutlineMoreHoriz size={24} />
                    </button>

                    <Menu model={items} popup ref={(el) => (menuRefByCareerId.current[career.id] = el)} />
                  </div>

                  <div className="d-flex flex-column gap-2 text-secondary fs-6">
                    <span>
                      <MdOutlineCoPresent className="me-2 fs-4" />
                      Docentes: <strong>{career.teachersCount || 0}</strong>
                    </span>
                    <span>
                      <MdOutlineBook className="me-2 fs-4" />
                      Grupos: <strong>{career.groupsCount || 0}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ───────── Modal CREAR ───────── */}
      <div className="modal fade" ref={createModalRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Crear carrera</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>

            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Nombre</label>
                  <input name="name" className="form-control" autoComplete="off" spellCheck="false" placeholder="Carrera Técnica en" required pattern="^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ ]+$" title="Debe iniciar en mayúscula y solo letras/espacios" />
                </div>

                {/* plantel_id oculto */}
                <input type="hidden" name="plantelId" value={user.campus.id} />

                <div className="mb-3">
                  <label className="form-label">Imagen (opcional)</label>
                  <input type="file" className="form-control" accept="image/*" />
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

      {/* ───────── Modal EDITAR ───────── */}
      <div className="modal fade" ref={editModalRef} tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Modificar carrera</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>

            {editingCareer && (
              <form onSubmit={handleUpdate}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input
                      name="name"
                      className="form-control"
                      defaultValue={editingCareer.name}
                      placeholder="Carrera Técnica en"
                      autoComplete="off"
                      spellCheck="false"
                      required
                      pattern="^[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ ]+$"
                      title="Debe iniciar en mayúscula y solo letras/espacios"
                    />
                  </div>

                  <input type="hidden" name="plantelId" value={user.campus.id} />

                  <div className="mb-3">
                    <label className="form-label">Imagen (opcional)</label>
                    <input type="file" className="form-control" accept="image/*" />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="reset" className="btn btn-secondary" data-bs-dismiss="modal">
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar cambios
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

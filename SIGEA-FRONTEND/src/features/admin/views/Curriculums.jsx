import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BreadCrumb } from 'primereact/breadcrumb';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Modal } from 'bootstrap';

import CareerTabs from '../components/CareerTabs';
import { useToast } from '../../../components/providers/ToastProvider';

/* ─── mock api ─────── (reemplaza) */
const api = {
  getCurricula: async (careerId) => [], // lista de planes
  createCurriculum: async (payload) => ({}), // devuelve {id, name}
  getModules: async (currId) => [], // módulos con materias
  createModule: async (currId, payload) => ({}),
  createSubject: async (modId, payload) => ({}),
};
/*──────────────────────────────────*/

export default function Curriculums() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const career = state?.career;

  const { showSuccess, showError } = useToast();

  /* refs a modales */
  const modalCurrRef = useRef(null);
  const modalModRef = useRef(null);
  const modalSubRef = useRef(null);

  /* datos */
  const [curricula, setCurricula] = useState([]);
  const [selectedCurr, setSelectedCurr] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedMod, setSelectedMod] = useState(null);

  /* formularios */
  const [newCurrName, setNewCurrName] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newSubName, setNewSubName] = useState('');

  /* cargar planes al montar */
  useEffect(() => {
    if (!career?.id) return navigate('/admin/careers');
    api
      .getCurricula(career.id)
      .then(setCurricula)
      .catch(() => showError('Error al cargar planes'));
  }, [career?.id]);

  /* cuando selecciono plan, cargo módulos */
  useEffect(() => {
    if (!selectedCurr?.id) {
      setModules([]);
      return;
    }
    api
      .getModules(selectedCurr.id)
      .then(setModules)
      .catch(() => showError('Error al cargar módulos'));
  }, [selectedCurr?.id]);

  /*───────────────────────────────*
   *  crear curriculum / módulo / materia
   *───────────────────────────────*/
  const saveCurriculum = async (e) => {
    e.preventDefault();
    const res = await api.createCurriculum({ name: newCurrName, careerId: career.id });
    setCurricula((c) => [...c, res]);
    setNewCurrName('');
    Modal.getInstance(modalCurrRef.current).hide();
    showSuccess('Plan creado');
  };

  const saveModule = async (e) => {
    e.preventDefault();
    const res = await api.createModule(selectedCurr.id, { name: newModName });
    setModules((m) => [...m, { ...res, subjects: [] }]);
    setNewModName('');
    Modal.getInstance(modalModRef.current).hide();
    showSuccess('Módulo creado');
  };

  const saveSubject = async (e) => {
    e.preventDefault();
    const res = await api.createSubject(selectedMod.id, { name: newSubName });
    setModules((m) => m.map((mod) => (mod.id === selectedMod.id ? { ...mod, subjects: [...mod.subjects, res] } : mod)));
    setNewSubName('');
    Modal.getInstance(modalSubRef.current).hide();
    showSuccess('Materia creada');
  };

  /*───────────────────────────────*/
  return (
    <>
      {/* barra superior */}
      <div className="bg-white rounded-top p-2">
        <CareerTabs />
      </div>

      <BreadCrumb
        model={[{ label: 'Carreras', command: () => navigate('/admin/careers') }, { label: career?.name || '--', command: () => navigate('/admin/careers') }, { label: 'Plan de estudios' }]}
        home={{ icon: 'pi pi-home', command: () => navigate('/') }}
        className="mt-2 pb-0 ps-0"
      />

      {/*──────── layout principal ────────*/}
      <div className="row gx-3 mt-2">
        {/*──────── izquierda: lista de planes ────────*/}
        <div className="col-12 col-md-4 col-lg-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h5 className="mb-0">Currículos</h5>
            <Button size="small" icon="pi pi-plus" rounded severity="success" onClick={() => new Modal(modalCurrRef.current).show()} />
          </div>

          <ul className="list-group">
            {curricula.map((c) => (
              <li
                key={c.id}
                className={'list-group-item list-group-item-action ' + (selectedCurr?.id === c.id ? 'active' : '')}
                role="button"
                onClick={() => {
                  setSelectedCurr(c);
                  setSelectedMod(null);
                }}
              >
                {c.name}
              </li>
            ))}
          </ul>
        </div>

        {/*──────── derecha: editor ────────*/}
        <div className="col">
          {!selectedCurr ? (
            <p className="text-muted">Selecciona o crea un currículo para comenzar.</p>
          ) : (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h5 className="mb-0">Módulos de “{selectedCurr.name}”</h5>
                <Button size="small" icon="pi pi-plus" rounded severity="info" onClick={() => new Modal(modalModRef.current).show()} />
              </div>

              {/* módulos + materias */}
              <div className="row gx-3">
                {/* lista módulos */}
                <div className="col-12 col-lg-4">
                  <ul className="list-group">
                    {modules.map((m) => (
                      <li key={m.id} className={'list-group-item ' + (selectedMod?.id === m.id ? 'active' : '')} role="button" onClick={() => setSelectedMod(m)}>
                        {m.name}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* materias del módulo */}
                <div className="col">
                  {!selectedMod ? (
                    <p className="text-muted">Selecciona un módulo para ver sus materias.</p>
                  ) : (
                    <>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h6 className="mb-0">Materias de “{selectedMod.name}”</h6>
                        <Button size="small" icon="pi pi-plus" rounded severity="secondary" onClick={() => new Modal(modalSubRef.current).show()} />
                      </div>

                      <DataTable value={selectedMod.subjects} dataKey="id" size="small" emptyMessage="Sin materias">
                        <Column field="name" header="Nombre" />
                      </DataTable>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/*──────── modal: crear currículo ────────*/}
      <div className="modal fade" ref={modalCurrRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={saveCurriculum} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nuevo plan de estudios</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del plan</label>
              <InputText className="w-100" value={newCurrName} onChange={(e) => setNewCurrName(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/*──────── modal: crear módulo ────────*/}
      <div className="modal fade" ref={modalModRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={saveModule} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nuevo módulo</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del módulo</label>
              <InputText className="w-100" value={newModName} onChange={(e) => setNewModName(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/*──────── modal: crear materia ────────*/}
      <div className="modal fade" ref={modalSubRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={saveSubject} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nueva materia</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre de la materia</label>
              <InputText className="w-100" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal" type="button">
                Cancelar
              </button>
              <button className="btn btn-primary" type="submit">
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

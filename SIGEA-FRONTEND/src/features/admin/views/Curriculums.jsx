import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdRemove, MdAdd } from 'react-icons/md';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Modal } from 'bootstrap';

import { getCurriculumByCareerId, createCurriculum } from '../../../api/academics/curriculumService';
import { createModule } from '../../../api/academics/moduleService';
import { createSubject } from '../../../api/academics/subjectService';

import CareerTabs from '../components/CareerTabs';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';
import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';

export default function Curriculums() {
  const navigate = useNavigate();
  const career = useLocation().state?.career;
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();

  const modalCurrRef = useRef(null);
  const modalModRef = useRef(null);
  const modalSubRef = useRef(null);
  const modalCurrButtonRef = useRef(null);
  const modalModButtonRef = useRef(null);
  const modalSubButtonRef = useRef(null);
  useBootstrapModalFocus(modalCurrRef, modalCurrButtonRef);
  useBootstrapModalFocus(modalModRef, modalModButtonRef);
  useBootstrapModalFocus(modalSubRef, modalSubButtonRef);

  const [isCurriculumsCollapsed, setIsCurriculumsCollapsed] = useState(false);
  const [isModuleCollapsed, setIsModuleCollapsed] = useState(false);
  const [isSubjectCollapsed, setIsSubjectCollapsed] = useState(true);
  const [data, setData] = useState([]);
  const [selectedCurriculumId, setSelectedCurriculumId] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  const selectedCurriculum = data.find((c) => c.id === selectedCurriculumId) || null;
  const selectedModule = selectedCurriculum?.modules.find((m) => m.id === selectedModuleId) || null;
  const selectedSubject = selectedModule?.subjects.find((s) => s.id === selectedSubjectId) || null;

  const [newCurrName, setNewCurrName] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [weeksNumber, setWeeksNumber] = useState(1);

  const loadCurriculums = async () => {
    const res = await getCurriculumByCareerId(career.id);
    setData(Array.isArray(res) ? res : res?.data ?? []);
  };

  useEffect(() => {
    if (career?.id) loadCurriculums().catch((e) => showError('Error', 'Ha ocurrido un error al cargar los planes de estudio'));
  }, [career?.id]);

  useEffect(() => {
    if (selectedCurriculumId && !data.some((c) => c.id === selectedCurriculumId)) {
      setSelectedCurriculumId(null);
      setSelectedModuleId(null);
      setSelectedSubjectId(null);
    }
    if (selectedCurriculum && selectedModuleId && !selectedCurriculum.modules.some((m) => m.id === selectedModuleId)) {
      setSelectedModuleId(null);
      setSelectedSubjectId(null);
    }
    if (selectedModule && selectedSubjectId && !selectedModule.subjects.some((s) => s.id === selectedSubjectId)) {
      setSelectedSubjectId(null);
    }
  }, [data]);

  // Crear plan de estudios
  const handleCreateCurriculum = async (e) => {
    e.preventDefault();
    if (!newCurrName.trim()) return;
    try {
      await createCurriculum({
        name: newCurrName,
        career: { id: career.id },
      });
      showSuccess('Plan de estudios creado');
      setNewCurrName('');
      await loadCurriculums();
      Modal.getInstance(modalCurrRef.current).hide();
    } catch (err) {
      showError('Error', 'No se pudo crear el plan');
    }
  };

  // Crear módulo
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!selectedCurriculum) {
      showError('Error', 'Selecciona un plan de estudios');
      return;
    }
    if (!newModName.trim()) return;
    try {
      await createModule({
        name: newModName,
        curriculum: { id: selectedCurriculum.id },
      });
      showSuccess('Módulo creado');
      setNewModName('');
      await loadCurriculums();
      Modal.getInstance(modalModRef.current).hide();
    } catch (err) {
      showError('Error', 'No se pudo crear el módulo');
    }
  };

  // Crear materia
  const handleCreateSubject = async (e) => {
    e.preventDefault();
    if (!selectedModule) {
      showError('Error', 'Selecciona un módulo');
      return;
    }
    if (!newSubName.trim()) return;
    try {
      await createSubject({
        name: newSubName,
        module: { id: selectedModule.id },
        weeks: weeksNumber,
      });
      showSuccess('Materia creada');
      setNewSubName('');
      await loadCurriculums();
      Modal.getInstance(modalSubRef.current).hide();
    } catch (err) {
      showError('Error', 'No se pudo crear la materia');
    }
  };

  return (
    <>
      <div className="bg-white rounded-top p-2">
        <CareerTabs />
      </div>

      <BreadCrumb
        model={[{ label: 'Carreras', command: () => navigate('/admin/careers') }, { label: career?.name || '--', command: () => navigate('/admin/careers') }, { label: 'Plan de estudios' }]}
        home={{ icon: 'pi pi-home', command: () => navigate('/') }}
        className="mt-2 pb-0 ps-0 text-nowrap"
      />

      <div className="row mt-2">
        <div className="col-12 col-md-4 mb-3">
          <div className="card border-0">
            <div className="card-body">
              <div className="d-flex align-items-center w-100">
                <div className="d-flex align-items-center text-secondary rounded-circle" style={{ cursor: 'pointer' }} onClick={() => setIsCurriculumsCollapsed(!isCurriculumsCollapsed)}>
                  {isCurriculumsCollapsed ? <MdAdd size={35} /> : <MdRemove size={35} />}
                  <h4 className="text-blue-500 fw-semibold mb-0 ms-2">Planes</h4>
                </div>
                <div className="ms-auto">
                  <Button ref={modalCurrButtonRef} className="rounded-circle" severity="primary" icon="pi pi-plus" size="small" onClick={() => new Modal(modalCurrRef.current).show()}></Button>
                </div>
              </div>
              {!isCurriculumsCollapsed && (
                <>
                  <hr />
                  <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '33rem' }}>
                    {data.length === 0 ? (
                      <div className="text-center text-secondary">Aún no hay planes de estudio</div>
                    ) : (
                      data.map((curriculum) => (
                        <div
                          key={curriculum.id}
                          className={`card p-3 hovereable ${selectedCurriculumId === curriculum.id ? 'bg-blue-500 text-white' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (selectedCurriculumId === curriculum.id) {
                              setSelectedCurriculumId(null);
                              setSelectedModuleId(null);
                              setSelectedSubjectId(null);
                            } else {
                              setSelectedCurriculumId(curriculum.id);
                              setSelectedModuleId(null);
                              setSelectedSubjectId(null);
                              setIsModuleCollapsed(false);
                            }
                          }}
                        >
                          <span className="text-truncate">{curriculum.name}</span>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 mb-3">
          <div className="card border-0 rounded-start-0">
            <div className="card-body">
              <div className="d-flex align-items-center w-100">
                <div className="d-flex align-items-center text-secondary rounded-circle" style={{ cursor: 'pointer' }} onClick={() => setIsModuleCollapsed(!isModuleCollapsed)}>
                  {isModuleCollapsed ? <MdAdd size={35} /> : <MdRemove size={35} />}
                  <h4 className="text-blue-500 fw-semibold mb-0 ms-2">Módulos</h4>
                </div>
                <div className="ms-auto">
                  <Button ref={modalModButtonRef} className="rounded-circle" severity="primary" icon="pi pi-plus" size="small" disabled={!selectedCurriculum} onClick={() => new Modal(modalModRef.current).show()}></Button>
                </div>
              </div>
              {!isModuleCollapsed && (
                <>
                  <hr />
                  <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '33rem' }}>
                    {selectedCurriculum && selectedCurriculum.modules.length > 0 ? (
                      selectedCurriculum.modules.map((module) => (
                        <div
                          key={module.id}
                          className={`card p-3 hovereable ${selectedModuleId === module.id ? 'bg-blue-500 text-white' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (selectedModuleId === module.id) {
                              setSelectedModuleId(null);
                              setSelectedSubjectId(null);
                            } else {
                              setSelectedModuleId(module.id);
                              setSelectedSubjectId(null);
                              setIsSubjectCollapsed(false);
                            }
                          }}
                        >
                          {module.name}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-secondary">{selectedCurriculum ? 'No hay módulos registrados' : 'Selecciona un plan de estudios para ver los módulos'}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4 mb-3">
          <div className="card border-0 rounded-start-0">
            <div className="card-body">
              <div className="d-flex align-items-center w-100">
                <div className="d-flex align-items-center text-secondary rounded-circle" style={{ cursor: 'pointer' }} onClick={() => setIsSubjectCollapsed(!isSubjectCollapsed)}>
                  {isSubjectCollapsed ? <MdAdd size={35} /> : <MdRemove size={35} />}
                  <h4 className="text-blue-500 fw-semibold mb-0 ms-2">Materias</h4>
                </div>
                <div className="ms-auto">
                  <Button ref={modalSubButtonRef} className="rounded-circle" severity="primary" icon="pi pi-plus" size="small" disabled={!selectedModule} onClick={() => new Modal(modalSubRef.current).show()}></Button>
                </div>
              </div>
              {!isSubjectCollapsed && (
                <>
                  <hr />
                  <div className="d-grid gap-2 px-2 overflow-auto" style={{ maxHeight: '33rem' }}>
                    {selectedModule && selectedModule.subjects.length > 0 ? (
                      selectedModule.subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className={`card p-3 hovereable ${selectedSubjectId === subject.id ? 'bg-blue-500 text-white' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (selectedSubjectId === subject.id) {
                              setSelectedSubjectId(null);
                            } else {
                              setSelectedSubjectId(subject.id);
                            }
                          }}
                        >
                          {subject.name}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-secondary">{selectedModule ? 'No hay materias registradas' : 'Selecciona un módulo para ver las materias'}</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/*──────── modal: crear plan ────────*/}
      <div className="modal fade" ref={modalCurrRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={handleCreateCurriculum} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nuevo plan de estudios</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del plan</label>
              <InputText className="w-100" value={newCurrName} onChange={(e) => setNewCurrName(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <Button type="reset" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="submit" icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">Guardar</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/*──────── modal: crear módulo ────────*/}
      <div className="modal fade" ref={modalModRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={handleCreateModule} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nuevo módulo</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del módulo</label>
              <InputText className="w-100" value={newModName} onChange={(e) => setNewModName(e.target.value)} required />
            </div>
            <div className="modal-footer">
              <Button type="reset" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="submit" icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">Guardar</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/*──────── modal: crear materia ────────*/}
      <div className="modal fade" ref={modalSubRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={handleCreateSubject} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nueva materia</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre de la materia</label>
                <InputText className="w-100" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Semanas</label>
                <InputNumber className="w-100" value={weeksNumber} onValueChange={(e) => setWeeksNumber(e.target.value)} useGrouping={false} min={0} max={20} />
              </div>
            </div>
            <div className="modal-footer">
              <Button type="reset" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="submit" icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">Guardar</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

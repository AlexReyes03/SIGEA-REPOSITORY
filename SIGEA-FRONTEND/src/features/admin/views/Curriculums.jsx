import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdRemove, MdAdd } from "react-icons/md";
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Modal } from 'bootstrap';

import CareerTabs from '../components/CareerTabs';
import useBootstrapModalFocus from '../../../utils/hooks/useBootstrapModalFocus';
import { useToast } from '../../../components/providers/ToastProvider';

// Helpers
const carrera = [
  {
    curriculum: [
      {
        name: 'Plan de estudios 1',
        modules: [
          {
            name: 'Módulo 1',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          },
          {
            name: 'Módulo 2',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          }
        ]
      },
      {
        name: 'Plan de estudios 2',
        modules: [
          {
            name: 'Módulo 1',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          },
          {
            name: 'Módulo 2',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          },
          {
            name: 'Módulo 3',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          }
        ]
      }
    ]
  },
  {
    curriculum: [
      {
        name: 'Plan de estudios 3',
        modules: [
          {
            name: 'Módulo 1',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          }
        ]
      },
      {
        name: 'Plan de estudios 4',
        modules: [
          {
            name: 'Módulo 1',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          },
          {
            name: 'Módulo 2',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          },
          {
            name: 'Módulo 3',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          },
          {
            name: 'Módulo 4',
            materias: [
              { name: "Nombre Materia" },
              { name: "Nombre Materia" }
            ]
          }
        ]
      }
    ]
  }
];

export default function Curriculums() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const career = state?.career;

  const { showSuccess, showError } = useToast();

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
  const [selectedCurriculumIndex, setSelectedCurriculumIndex] = useState(null);
  const [selectedModuleIndex, setSelectedModuleIndex] = useState(null);
  const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(null);

  const [curricula, setCurricula] = useState([]);
  const [selectedCurr, setSelectedCurr] = useState(null);
  const [modules, setModules] = useState([]);
  const [selectedMod, setSelectedMod] = useState(null);

  const [newCurrName, setNewCurrName] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newSubName, setNewSubName] = useState('');

  const logs = async (item) => {
    console.log(item);
  }

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
          <div className='d-flex align-items-center w-100'>
            <div
              className="d-flex align-items-center text-secondary rounded-circle"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsCurriculumsCollapsed(!isCurriculumsCollapsed)}
            >
              {isCurriculumsCollapsed ? <MdAdd size={35} /> : <MdRemove size={35} />}
              <h4 className="text-blue-500 fw-semibold mb-0 ms-2">Planes</h4>
            </div>
            <div className='ms-auto'>
              <Button
                ref={modalCurrButtonRef}
                className='rounded-circle'
                severity="primary"
                icon="pi pi-plus"
                size='small'
                onClick={() => new Modal(modalCurrRef.current).show()}
              ></Button>
            </div>
          </div>
          {!isCurriculumsCollapsed && (
          <>
            <hr />
            <div className='d-grid gap-2 px-2 overflow-auto' style={{ maxHeight: '33rem' }}>
              {carrera.length === 0 || carrera.every(careerItem => careerItem.curriculum.length === 0) ? (
                <div className="text-center text-secondary">
                  Aún no hay planes de estudio
                </div>
              ) : (
                carrera.map((careerItem, index) =>
                  careerItem.curriculum.map((curriculum, currIndex) => {
                    const isSelected = selectedCurriculumIndex === `${index}-${currIndex}`;
                    return (
                      <div
                        key={`${index}-${currIndex}`}
                        className={`card p-3 hovereable ${isSelected ? 'bg-blue-500 text-white' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedCurriculumIndex(null);
                            setSelectedModuleIndex(null);
                            setSelectedSubjectIndex(null);
                          } else {
                            setSelectedCurriculumIndex(`${index}-${currIndex}`);
                            setIsModuleCollapsed(false);
                          }
                        }}
                      >
                        <span className='text-truncate'>{curriculum.name}</span>
                      </div>
                    );
                  })
                )
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
          <div className='d-flex align-items-center w-100'>
            <div
              className="d-flex align-items-center text-secondary rounded-circle"
              style={{ cursor: 'pointer' }}
              onClick={() => setIsModuleCollapsed(!isModuleCollapsed)}
            >
              {isModuleCollapsed ? <MdAdd size={35} /> : <MdRemove size={35} />}
              <h4 className="text-blue-500 fw-semibold mb-0 ms-2">Módulos</h4>
            </div>
            <div className='ms-auto'>
              <Button
                ref={modalModButtonRef}
                className='rounded-circle'
                severity="primary"
                icon="pi pi-plus"
                size='small'
                onClick={() => new Modal(modalModRef.current).show()}
              ></Button>
            </div>
          </div>
          {!isModuleCollapsed && (
          <>
            <hr />
            <div className='d-grid gap-2 px-2 overflow-auto' style={{ maxHeight: '33rem' }}>
              {selectedCurriculumIndex ? (
                carrera
                  .flatMap((careerItem) => careerItem.curriculum)
                  .filter((_, currIndex) => `${Math.floor(currIndex / carrera[0].curriculum.length)}-${currIndex % carrera[0].curriculum.length}` === selectedCurriculumIndex)
                  .flatMap((curriculum) => curriculum.modules.map((module, modIndex) => {
                    const isSelected = selectedModuleIndex === `${modIndex}`;
                    return (
                      <div
                        key={modIndex}
                        className={`card p-3 hovereable ${isSelected ? 'bg-blue-500 text-white' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedModuleIndex(null);
                          } else {
                            setSelectedModuleIndex(`${modIndex}`);
                            setIsSubjectCollapsed(false);
                          }
                        }}
                      >
                        {module.name}
                      </div>
                    );
                  }))
              ) : (
                <div className="text-center text-secondary">
                  Selecciona un plan de estudios para ver los módulos
                </div>
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
              <div className='d-flex align-items-center w-100'>
                <div
                  className="d-flex align-items-center text-secondary rounded-circle"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setIsSubjectCollapsed(!isSubjectCollapsed)}
                >
                  {isSubjectCollapsed ? <MdAdd size={35} /> : <MdRemove size={35} />}
                  <h4 className="text-blue-500 fw-semibold mb-0 ms-2">Materias</h4>
                </div>
                <div className='ms-auto'>
                  <Button
                    ref={modalSubButtonRef}
                    className='rounded-circle'
                    severity="primary"
                    icon="pi pi-plus"
                    size='small'
                    onClick={() => new Modal(modalSubRef.current).show()}
                  ></Button>
                </div>
              </div>
              {!isSubjectCollapsed && (
              <>
                <hr />
                <div className='d-grid gap-2 px-2 overflow-auto' style={{ maxHeight: '33rem' }}>
                  {selectedModuleIndex ? (
                    carrera
                      .flatMap((careerItem) => careerItem.curriculum)
                      .flatMap((curriculum) => curriculum.modules)
                      .filter((_, modIndex) => `${modIndex}` === selectedModuleIndex)
                      .flatMap((module) => module.materias.map((subject, subIndex) => {
                        const isSelected = selectedSubjectIndex === `${subIndex}`;
                        return (
                          <div
                            key={subIndex}
                            className={`card p-3 hovereable ${isSelected ? 'bg-blue-500 text-white' : ''}`}
                            style={{ cursor: 'pointer' }}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedSubjectIndex(null);
                              } else {
                                setSelectedSubjectIndex(`${subIndex}`);
                              }
                            }}
                          >
                            {subject.name}
                          </div>
                        );
                      }))
                  ) : (
                    <div className="text-center text-secondary">
                      Selecciona un módulo para ver las materias
                    </div>
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
          <form onSubmit={null} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nuevo plan de estudios</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del plan</label>
              <InputText className="w-100" value={newCurrName} onChange={(e) => setNewCurrName(e.target.value)} required />
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

      {/*──────── modal: crear módulo ────────*/}
      <div className="modal fade" ref={modalModRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={null} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nuevo módulo</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del módulo</label>
              <InputText className="w-100" value={newModName} onChange={(e) => setNewModName(e.target.value)} required />
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

      {/*──────── modal: crear materia ────────*/}
      <div className="modal fade" ref={modalSubRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={null} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Nueva materia</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre de la materia</label>
              <InputText className="w-100" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} required />
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
    </>
  );
}

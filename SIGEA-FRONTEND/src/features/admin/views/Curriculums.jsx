import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdRemove, MdAdd, MdOutlineMoreHoriz } from 'react-icons/md';
import { motion } from 'framer-motion';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Modal } from 'bootstrap';

import { getCurriculumByCareerId, createCurriculum, updateCurriculum, deleteCurriculum } from '../../../api/academics/curriculumService';
import { createModule, updateModule, deleteModule } from '../../../api/academics/moduleService';
import { createSubject, updateSubject, deleteSubject } from '../../../api/academics/subjectService';

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
  const opCurrRef = useRef(null);
  const opModRef = useRef(null);
  const opSubRef = useRef(null);
  const modalCurrButtonRef = useRef(null);
  const modalModButtonRef = useRef(null);
  const modalSubButtonRef = useRef(null);
  const [isEditingCurriculum, setIsEditingCurriculum] = useState(false);
  const [isEditingModule, setIsEditingModule] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
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

  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [editingModule, setEditingModule] = useState(null);
  const [editingSubject, setEditingSubject] = useState(null);

  const [lastCreatedCurriculumId, setLastCreatedCurriculumId] = useState(null);
  const [lastCreatedModuleId, setLastCreatedModuleId] = useState(null);
  const [pendingFocus, setPendingFocus] = useState(null);

  const selectedCurriculum = data.find((c) => c.id === selectedCurriculumId) || null;
  const selectedModule = selectedCurriculum?.modules.find((m) => m.id === selectedModuleId) || null;
  const selectedSubject = selectedModule?.subjects.find((s) => s.id === selectedSubjectId) || null;

  const [loading, setLoading] = useState(true);
  const [newCurrName, setNewCurrName] = useState('');
  const [newModName, setNewModName] = useState('');
  const [newSubName, setNewSubName] = useState('');
  const [weeksNumber, setWeeksNumber] = useState(1);

  // Función mejorada para hacer focus y selección
  const focusAndSelectElement = (itemId, type) => {
    setPendingFocus({ itemId, type });
  };

  // Efecto para manejar focus pendiente después de cargar datos
  useEffect(() => {
    if (pendingFocus && !loading) {
      const { itemId, type } = pendingFocus;

      if (type === 'curriculum') {
        // Simular click en el curriculum
        setSelectedCurriculumId(itemId);
        setSelectedModuleId(null);
        setSelectedSubjectId(null);
        setIsModuleCollapsed(false);

        // Hacer scroll al elemento
        setTimeout(() => {
          const element = document.querySelector(`[data-curriculum-id="${itemId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else if (type === 'module') {
        // Simular click en el módulo
        setSelectedModuleId(itemId);
        setSelectedSubjectId(null);
        setIsSubjectCollapsed(false);

        // Hacer scroll al elemento
        setTimeout(() => {
          const element = document.querySelector(`[data-module-id="${itemId}"]`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }

      // Limpiar el pending focus después de un tiempo
      setTimeout(() => {
        setPendingFocus(null);
        if (type === 'curriculum') {
          setLastCreatedCurriculumId(null);
        } else if (type === 'module') {
          setLastCreatedModuleId(null);
        }
      }, 2000);
    }
  }, [data, loading, pendingFocus]);

  // Calcular duración de un módulo específico
  const getModuleDuration = useMemo(() => {
    return (module) => {
      if (!module?.subjects || module.subjects.length === 0) {
        return { weeks: 0, months: 0, text: 'Sin materias' };
      }

      const totalWeeks = module.subjects.reduce((acc, subject) => acc + (subject.weeks || 0), 0);
      const months = totalWeeks / 4;
      const monthsRounded = parseFloat(months.toFixed(2));
      const monthsText = monthsRounded === 1 ? 'mes' : 'meses';

      return {
        weeks: totalWeeks,
        months: months,
        text: `${totalWeeks} ${totalWeeks === 1 ? 'semana' : 'semanas'} (${monthsRounded} ${monthsText})`,
      };
    };
  }, [data]);

  // Calcular duración de un curriculum específico
  const getCurriculumDuration = useMemo(() => {
    return (curriculum) => {
      if (!curriculum?.modules || curriculum.modules.length === 0) {
        return { weeks: 0, months: 0, years: 0, text: 'Sin módulos' };
      }

      const totalWeeks = curriculum.modules.reduce((acc, module) => {
        if (!module.subjects) return acc;
        return acc + module.subjects.reduce((subAcc, subject) => subAcc + (subject.weeks || 0), 0);
      }, 0);

      const totalMonths = totalWeeks / 4;
      const years = Math.floor(totalMonths / 12);
      const remainingMonths = Math.floor(totalMonths % 12);

      let text = '';
      if (years > 0 && remainingMonths > 0) {
        text = `${years} año${years > 1 ? 's' : ''} y ${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
      } else if (years > 0) {
        text = `${years} año${years > 1 ? 's' : ''}`;
      } else if (remainingMonths > 0) {
        text = `${remainingMonths} mes${remainingMonths > 1 ? 'es' : ''}`;
      } else {
        text = `${totalWeeks} ${totalWeeks === 1 ? 'semana' : 'semanas'}`;
      }

      return {
        weeks: totalWeeks,
        months: totalMonths,
        years: years,
        remainingMonths: remainingMonths,
        text: text,
      };
    };
  }, [data]);

  useEffect(() => {
    if (!career?.id) {
      navigate('/admin/careers');
    }
  }, [career?.id, navigate]);

  const loadCurriculums = async () => {
    setLoading(true);
    try {
      const res = await getCurriculumByCareerId(career.id);
      setData(Array.isArray(res) ? res : res?.data ?? []);
    } catch (e) {
      showError('Error', 'Ha ocurrido un error al cargar los planes de estudio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (career?.id) loadCurriculums();
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
      const newCurriculum = await createCurriculum({
        name: newCurrName,
        career: { id: career.id },
      });
      showSuccess('Hecho', 'Plan de estudios creado exitosamente');
      setNewCurrName('');
      Modal.getInstance(modalCurrRef.current).hide();

      // Configurar focus para después de cargar datos
      setLastCreatedCurriculumId(newCurriculum.id);
      focusAndSelectElement(newCurriculum.id, 'curriculum');

      await loadCurriculums();
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
      const newModule = await createModule({
        name: newModName,
        curriculum: { id: selectedCurriculum.id },
      });
      showSuccess('Hecho', 'Módulo creado exitosamente');
      setNewModName('');
      Modal.getInstance(modalModRef.current).hide();

      // Configurar focus para después de cargar datos
      setLastCreatedModuleId(newModule.id);
      focusAndSelectElement(newModule.id, 'module');

      await loadCurriculums();
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
      showSuccess('Hecho', 'Materia creada exitosamente');
      setNewSubName('');
      setWeeksNumber(1);
      await loadCurriculums();
      Modal.getInstance(modalSubRef.current).hide();
      // No hacemos focus para materias como solicitado
    } catch (err) {
      showError('Error', 'No se pudo crear la materia');
    }
  };

  const handleUpdateCurriculum = async (e) => {
    e.preventDefault();
    if (!editingCurriculum) return;
    if (!newCurrName.trim()) return;
    try {
      await updateCurriculum(editingCurriculum.id, {
        name: newCurrName,
        career: { id: career.id },
      });
      showSuccess('Hecho', 'Plan de estudios actualizado exitosamente');
      setNewCurrName('');
      setEditingCurriculum(null);
      setIsEditingCurriculum(false);
      await loadCurriculums();
      Modal.getInstance(modalCurrRef.current).hide();
    } catch (err) {
      showError('Error', 'No se pudo actualizar el plan');
    }
  };

  const handleUpdateModule = async (e) => {
    e.preventDefault();
    if (!editingModule) return;
    if (!newModName.trim()) return;
    try {
      await updateModule(editingModule.id, {
        name: newModName,
        curriculum: { id: selectedCurriculum.id },
      });
      showSuccess('Hecho', 'Módulo actualizado exitosamente');
      setNewModName('');
      setEditingModule(null);
      setIsEditingModule(false);
      await loadCurriculums();
      Modal.getInstance(modalModRef.current).hide();
    } catch (err) {
      showError('Error', 'No se pudo actualizar el módulo');
    }
  };

  const handleUpdateSubject = async (e) => {
    e.preventDefault();
    if (!editingSubject) return;
    if (!newSubName.trim()) return;
    try {
      await updateSubject(editingSubject.id, {
        name: newSubName,
        module: { id: selectedModule.id },
        weeks: weeksNumber,
      });
      showSuccess('Hecho', 'Materia actualizada exitosamente');
      setNewSubName('');
      setEditingSubject(null);
      setIsEditingSubject(false);
      await loadCurriculums();
      Modal.getInstance(modalSubRef.current).hide();
    } catch (err) {
      showError('Error', 'No se pudo actualizar la materia');
    }
  };

  const openEditCurriculumModal = (curriculum) => {
    setEditingCurriculum(curriculum);
    setNewCurrName(curriculum.name);
    setIsEditingCurriculum(true);
    new Modal(modalCurrRef.current).show();
  };

  const openEditModuleModal = (module) => {
    setEditingModule(module);
    setNewModName(module.name);
    setIsEditingModule(true);
    new Modal(modalModRef.current).show();
  };

  const openEditSubjectModal = (subject) => {
    setEditingSubject(subject);
    setNewSubName(subject.name);
    setWeeksNumber(subject.weeks);
    setIsEditingSubject(true);
    new Modal(modalSubRef.current).show();
  };

  const resetCurriculumModal = () => {
    setEditingCurriculum(null);
    setIsEditingCurriculum(false);
    setNewCurrName('');
  };
  const resetModuleModal = () => {
    setEditingModule(null);
    setIsEditingModule(false);
    setNewModName('');
  };
  const resetSubjectModal = () => {
    setEditingSubject(null);
    setIsEditingSubject(false);
    setNewSubName('');
    setWeeksNumber(1);
  };

  return (
    <>
      <style jsx>{`
        .card:focus {
          outline: 2px solid #007bff;
          outline-offset: 2px;
          box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.25);
        }

        .card[data-curriculum-id='${lastCreatedCurriculumId}'] {
          animation: highlightPulse 2s ease-in-out;
        }

        .card[data-module-id='${lastCreatedModuleId}'] {
          animation: highlightPulse 2s ease-in-out;
        }

        @keyframes highlightPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(0, 123, 255, 0.2);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
          }
        }
      `}</style>

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
              <motion.div
                initial={false}
                animate={{
                  height: isCurriculumsCollapsed ? 0 : 'auto',
                  opacity: isCurriculumsCollapsed ? 0 : 1,
                }}
                transition={{
                  height: {
                    duration: 0.4,
                    ease: [0.04, 0.62, 0.23, 0.98],
                  },
                  opacity: {
                    duration: 0.3,
                    ease: 'easeOut',
                  },
                }}
                style={{
                  overflow: 'hidden',
                }}
              >
                <hr />
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 150 }}>
                    <div className="d-flex flex-column align-items-center">
                      <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" fill="var(--surface-ground)" animationDuration=".5s" />
                      <span className="mt-3 fs-5 text-muted">Cargando...</span>
                    </div>
                  </div>
                ) : (
                  <div className="d-grid gap-2 p-2 overflow-auto" style={{ maxHeight: '33rem' }}>
                    {data.length === 0 ? (
                      <div className="text-center">
                        <Message severity="info" text="Aún no hay planes de estudio" />
                      </div>
                    ) : (
                      data.map((curriculum) => {
                        const duration = getCurriculumDuration(curriculum);
                        return (
                          <React.Fragment key={curriculum.id}>
                            <div
                              className={`card p-3 hovereable d-flex flex-row align-items-center justify-content-between ${selectedCurriculumId === curriculum.id ? 'bg-blue-500 text-white' : ''}`}
                              style={{ cursor: 'pointer' }}
                              data-curriculum-id={curriculum.id}
                              tabIndex={0}
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
                              <div className="flex-grow-1 text-truncate">
                                <div className="text-truncate fw-semibold">{curriculum.name}</div>
                                <small className={`${selectedCurriculumId === curriculum.id ? 'text-white-50' : 'text-muted'}`}>{duration.text}</small>
                              </div>
                              <button
                                className={`btn border-0 p-1 ms-2 ${selectedCurriculumId === curriculum.id && 'text-white'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingCurriculum(curriculum);
                                  opCurrRef.current.toggle(e);
                                }}
                                tabIndex={-1}
                              >
                                <MdOutlineMoreHoriz size={22} />
                              </button>
                            </div>

                            <OverlayPanel ref={opCurrRef}>
                              <button
                                className="dropdown-item"
                                onClick={() => {
                                  openEditCurriculumModal(curriculum);
                                  opCurrRef.current.hide();
                                }}
                              >
                                <i className="pi pi-pencil me-2" />
                                Modificar
                              </button>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => {
                                  if (editingCurriculum.modules && editingCurriculum.modules.length > 0) {
                                    showError('No se puede eliminar', 'El plan tiene módulos registrados');
                                    opCurrRef.current.hide();
                                    return;
                                  }
                                  confirmAction({
                                    message: '¿Estás seguro? Esta acción no se podrá deshacer',
                                    header: `Eliminar plan "${editingCurriculum.name}"`,
                                    icon: 'pi pi-exclamation-triangle',
                                    acceptClassName: 'p-button-danger',
                                    acceptLabel: 'Confirmar',
                                    onAccept: async () => {
                                      await deleteCurriculum(editingCurriculum.id);
                                      showSuccess('Hecho', 'Plan eliminado exitosamente');
                                      await loadCurriculums();
                                    },
                                  });
                                  opCurrRef.current.hide();
                                }}
                              >
                                <i className="pi pi-trash me-2" />
                                Eliminar
                              </button>
                            </OverlayPanel>
                          </React.Fragment>
                        );
                      })
                    )}
                  </div>
                )}
              </motion.div>
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
              <motion.div
                initial={false}
                animate={{
                  height: isModuleCollapsed ? 0 : 'auto',
                  opacity: isModuleCollapsed ? 0 : 1,
                }}
                transition={{
                  height: {
                    duration: 0.4,
                    ease: [0.04, 0.62, 0.23, 0.98],
                  },
                  opacity: {
                    duration: 0.3,
                    ease: 'easeOut',
                  },
                }}
                style={{
                  overflow: 'hidden',
                }}
              >
                <hr />
                <div className="d-grid gap-2 p-2 overflow-auto" style={{ maxHeight: '33rem' }}>
                  {selectedCurriculum && selectedCurriculum.modules.length > 0 ? (
                    selectedCurriculum.modules.map((module) => {
                      const duration = getModuleDuration(module);
                      return (
                        <React.Fragment key={module.id}>
                          <div
                            className={`card p-3 hovereable d-flex flex-row align-items-center justify-content-between ${selectedModuleId === module.id ? 'bg-blue-500 text-white' : ''}`}
                            style={{ cursor: 'pointer' }}
                            data-module-id={module.id}
                            tabIndex={0}
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
                            <div className="flex-grow-1 text-truncate">
                              <div className="text-truncate fw-semibold">{module.name}</div>
                              <small className={`${selectedModuleId === module.id ? 'text-white-50' : 'text-muted'}`}>{duration.text}</small>
                            </div>
                            <button
                              className={`btn border-0 p-1 ms-2 ${selectedModuleId === module.id && 'text-white'}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingModule(module);
                                opModRef.current.toggle(e);
                              }}
                              tabIndex={-1}
                            >
                              <MdOutlineMoreHoriz size={22} />
                            </button>
                          </div>

                          <OverlayPanel ref={opModRef}>
                            <button
                              className="dropdown-item"
                              onClick={() => {
                                openEditModuleModal(editingModule);
                                opModRef.current.hide();
                              }}
                            >
                              <i className="pi pi-pencil me-2" />
                              Modificar
                            </button>
                            <button
                              className="dropdown-item text-danger"
                              onClick={() => {
                                if (editingModule.subjects && editingModule.subjects.length > 0) {
                                  showError('No se puede eliminar', 'El módulo tiene materias');
                                  opModRef.current.hide();
                                  return;
                                }
                                confirmAction({
                                  message: '¿Estás seguro? Esta acción no se podrá deshacer',
                                  header: `Eliminar módulo "${editingModule.name}"`,
                                  icon: 'pi pi-exclamation-triangle',
                                  acceptClassName: 'p-button-danger',
                                  acceptLabel: 'Confirmar',
                                  onAccept: async () => {
                                    deleteModule(editingModule.id);
                                    showSuccess('Hecho', 'Módulo eliminado exitosamente');
                                    await loadCurriculums();
                                  },
                                });
                                opModRef.current.hide();
                              }}
                            >
                              <i className="pi pi-trash me-2" />
                              Eliminar
                            </button>
                          </OverlayPanel>
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <div className="text-center text-secondary">{selectedCurriculum ? <Message severity="info" text="No hay módulos registrados" /> : <Message severity="info" text="Selecciona un plan de estudios para ver los módulos" />}</div>
                  )}
                </div>
              </motion.div>
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
              <motion.div
                initial={false}
                animate={{
                  height: isSubjectCollapsed ? 0 : 'auto',
                  opacity: isSubjectCollapsed ? 0 : 1,
                }}
                transition={{
                  height: {
                    duration: 0.4,
                    ease: [0.04, 0.62, 0.23, 0.98],
                  },
                  opacity: {
                    duration: 0.3,
                    ease: 'easeOut',
                  },
                }}
                style={{
                  overflow: 'hidden',
                }}
              >
                <hr />
                <div className="d-grid gap-2 p-2 overflow-auto" style={{ maxHeight: '33rem' }}>
                  {selectedModule && selectedModule.subjects.length > 0 ? (
                    selectedModule.subjects.map((subject) => (
                      <React.Fragment key={subject.id}>
                        <div
                          className={`card p-3 hovereable d-flex flex-row align-items-center justify-content-between ${selectedSubjectId === subject.id ? 'bg-blue-500 text-white' : ''}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            if (selectedSubjectId === subject.id) {
                              setSelectedSubjectId(null);
                            } else {
                              setSelectedSubjectId(subject.id);
                            }
                          }}
                        >
                          <div className="flex-grow-1 text-truncate">
                            <div className="text-truncate fw-semibold">{subject.name}</div>
                            <small className={`${selectedSubjectId === subject.id ? 'text-white-50' : 'text-muted'}`}>
                              {subject.weeks} {subject.weeks === 1 ? 'semana' : 'semanas'}
                            </small>
                          </div>
                          <button
                            className={`btn border-0 p-1 ms-2 ${selectedSubjectId === subject.id && 'text-white'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingSubject(subject);
                              opSubRef.current.toggle(e);
                            }}
                            tabIndex={-1}
                          >
                            <MdOutlineMoreHoriz size={22} />
                          </button>
                        </div>

                        <OverlayPanel ref={opSubRef}>
                          <button
                            className="dropdown-item"
                            onClick={() => {
                              openEditSubjectModal(editingSubject);
                              opSubRef.current.hide();
                            }}
                          >
                            <i className="pi pi-pencil me-2" />
                            Modificar
                          </button>
                          <button
                            className="dropdown-item text-danger"
                            onClick={() => {
                              confirmAction({
                                message: '¿Estás seguro? Esta acción no se podrá deshacer',
                                header: `Eliminar materia "${editingSubject.name}"`,
                                icon: 'pi pi-exclamation-triangle',
                                acceptClassName: 'p-button-danger',
                                acceptLabel: 'Confirmar',
                                onAccept: async () => {
                                  await deleteSubject(editingSubject.id);
                                  showSuccess('Hecho', 'Materia eliminada exitosamente');
                                  await loadCurriculums();
                                },
                              });
                              opSubRef.current.hide();
                            }}
                          >
                            <i className="pi pi-trash me-2" />
                            Eliminar
                          </button>
                        </OverlayPanel>
                      </React.Fragment>
                    ))
                  ) : (
                    <div className="text-center text-secondary">{selectedModule ? <Message severity="info" text="No hay materias registradas" /> : <Message severity="info" text="Selecciona un módulo para ver las materias" />}</div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/*──────── modal: crear plan ────────*/}
      <div className="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" ref={modalCurrRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={isEditingCurriculum ? handleUpdateCurriculum : handleCreateCurriculum} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{isEditingCurriculum ? 'Editar plan de estudios' : 'Nuevo plan de estudios'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={resetCurriculumModal} />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del plan</label>
              <InputText className="w-100" value={newCurrName} onChange={(e) => setNewCurrName(e.target.value)} autoFocus required />
            </div>
            <div className="modal-footer">
              <Button type="reset" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" onClick={resetCurriculumModal}>
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="submit" icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">{isEditingCurriculum ? 'Actualizar' : 'Guardar'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/*──────── modal: crear módulo ────────*/}
      <div className="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" ref={modalModRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={isEditingModule ? handleUpdateModule : handleCreateModule} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{isEditingModule ? 'Editar módulo' : 'Nuevo módulo'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={resetModuleModal} />
            </div>
            <div className="modal-body">
              <label className="form-label">Nombre del módulo</label>
              <InputText className="w-100" value={newModName} onChange={(e) => setNewModName(e.target.value)} autoFocus required />
            </div>
            <div className="modal-footer">
              <Button type="reset" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" onClick={resetModuleModal}>
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="submit" icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">{isEditingModule ? 'Actualizar' : 'Guardar'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/*──────── modal: crear materia ────────*/}
      <div className="modal fade" data-bs-backdrop="static" data-bs-keyboard="false" ref={modalSubRef} tabIndex={-1}>
        <div className="modal-dialog">
          <form onSubmit={isEditingSubject ? handleUpdateSubject : handleCreateSubject} className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{isEditingSubject ? 'Editar materia' : 'Nueva materia'}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" onClick={resetSubjectModal} />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Nombre de la materia</label>
                <InputText className="w-100" value={newSubName} onChange={(e) => setNewSubName(e.target.value)} autoFocus required />
              </div>
              <div className="mb-3">
                <label className="form-label">Semanas</label>
                <InputNumber className="w-100" value={weeksNumber} onValueChange={(e) => setWeeksNumber(e.target.value)} useGrouping={false} min={0} max={20} />
              </div>
            </div>
            <div className="modal-footer">
              <Button type="reset" icon="pi pi-times" severity="secondary" outlined data-bs-dismiss="modal" onClick={resetSubjectModal}>
                <span className="d-none d-sm-inline ms-1">Cancelar</span>
              </Button>
              <Button type="submit" icon="pi pi-check" severity="primary" data-bs-dismiss="modal">
                <span className="d-none d-sm-inline ms-1">{isEditingSubject ? 'Actualizar' : 'Guardar'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

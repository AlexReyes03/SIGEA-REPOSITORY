import React, { useState, useEffect, useCallback } from 'react';
import { PickList } from 'primereact/picklist';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';

import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getStudentsByCareer } from '../../../api/academics/enrollmentService';
import { getGroupStudents, enrollStudentInGroup, removeStudentFromGroup, getStudentsWithGroup, validateQualificationCopy, transferStudents } from '../../../api/academics/groupService';

export default function AssignStudentsPickList({ group }) {
  const [source, setSource] = useState([]);
  const [target, setTarget] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();
  const [careerStudents, setCareerStudents] = useState([]);
  const [currentGroupStudents, setCurrentGroupStudents] = useState([]);
  const [studentsWithGroup, setStudentsWithGroup] = useState([]);
  const [curriculumValidations, setCurriculumValidations] = useState({});
  const [loadingValidations, setLoadingValidations] = useState(false);

  const modes = [
    { name: ' Añadir al grupo', code: 'ADD', icon: 'pi-user-plus', color: 'success' },
    { name: ' Mover de un grupo', code: 'MOVE', icon: 'pi-arrows-h', color: 'info' },
    { name: ' Quitar del grupo', code: 'REMOVE', icon: 'pi-user-minus', color: 'danger' },
  ];

  const [selectedMode, setSelectedMode] = useState(modes[0]);

  const normalizeStudent = (student, isFromGroup = false) => {
    if (isFromGroup) {
      return {
        id: student.studentId,
        fullName: student.fullName,
        registrationNumber: student.primaryRegistrationNumber || '',
        email: student.email || '',
        groupId: student.groupId,
        careerId: student.careerId,
        searchText: `${student.fullName} ${student.primaryRegistrationNumber || ''} ${student.email || ''}`.toLowerCase(),
      };
    } else {
      const fullName = `${student.userName || student.name || ''} ${student.userPaternalSurname || student.paternalSurname || ''} ${student.userMaternalSurname || student.maternalSurname || ''}`.trim();

      return {
        id: student.userId || student.id,
        fullName: fullName,
        registrationNumber: student.registrationNumber || '',
        email: student.userEmail || student.email || '',
        groupId: null,
        careerId: student.careerId,
        searchText: `${fullName} ${student.registrationNumber || ''} ${student.userEmail || student.email || ''}`.toLowerCase(),
      };
    }
  };

  const loadCurriculumValidations = useCallback(
    async (students) => {
      if (selectedMode.code !== 'MOVE' || !students.length) return;

      setLoadingValidations(true);
      const validations = {};

      const uniqueGroupIds = [...new Set(students.map((s) => s.groupId).filter(Boolean))];

      try {
        for (const sourceGroupId of uniqueGroupIds) {
          try {
            const validation = await validateQualificationCopy(sourceGroupId, group.groupId);
            validations[sourceGroupId] = validation;
          } catch (error) {
            console.error(`Error validating curriculum for group ${sourceGroupId}:`, error);
            validations[sourceGroupId] = { sameCurriculum: false, canCopy: false };
          }
        }

        setCurriculumValidations(validations);
      } catch (error) {
        console.error('Error loading curriculum validations:', error);
      } finally {
        setLoadingValidations(false);
      }
    },
    [selectedMode.code, group.groupId]
  );

  const resetToOriginalState = useCallback(() => {
    if (loading || !selectedMode?.code) return;

    const studentsWithGroupInCurrentCareer = studentsWithGroup.filter((student) => student.careerId === group.careerId);
    const studentsWithGroupInCurrentCareerIds = studentsWithGroupInCurrentCareer.map((s) => s.studentId);

    let originalSource = [];

    switch (selectedMode.code) {
      case 'ADD':
        originalSource = careerStudents
          .filter((student) => {
            const studentId = student.userId || student.id;
            return !studentsWithGroupInCurrentCareerIds.includes(studentId);
          })
          .map((student) => normalizeStudent(student, false));
        break;

      case 'MOVE':
        const moveStudents = studentsWithGroupInCurrentCareer.filter((student) => student.groupId !== group.groupId).map((student) => normalizeStudent(student, true));
        originalSource = moveStudents;
        loadCurriculumValidations(moveStudents);
        break;

      case 'REMOVE':
        originalSource = currentGroupStudents.map((student) => normalizeStudent(student, true));
        break;

      default:
        originalSource = [];
    }

    setSource(originalSource);
    setTarget([]);
  }, [selectedMode, careerStudents, currentGroupStudents, studentsWithGroup, loading, group?.groupId, group?.careerId, loadCurriculumValidations]);

  useEffect(() => {
    const loadData = async () => {
      if (!group?.groupId || !group?.careerId) {
        showError('Error', 'No se especificó un grupo válido');
        return;
      }

      setLoading(true);
      try {
        const [careerStudentsRes, groupStudentsRes, studentsWithGroupRes] = await Promise.all([getStudentsByCareer(group.careerId), getGroupStudents(group.groupId), getStudentsWithGroup()]);

        setCareerStudents(Array.isArray(careerStudentsRes) ? careerStudentsRes : []);
        setCurrentGroupStudents(Array.isArray(groupStudentsRes) ? groupStudentsRes : []);
        setStudentsWithGroup(Array.isArray(studentsWithGroupRes) ? studentsWithGroupRes : []);
      } catch (error) {
        console.error('Error cargando datos:', error);
        showError('Error', 'No se pudieron cargar los datos');
        setCareerStudents([]);
        setCurrentGroupStudents([]);
        setStudentsWithGroup([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [group?.groupId, group?.careerId, showError]);

  useEffect(() => {
    resetToOriginalState();
  }, [resetToOriginalState]);

  const onChange = (event) => {
    setSource(event.source || []);
    setTarget(event.target || []);
  };

  const itemTemplate = (item) => {
    if (!item) return <div>Estudiante no válido</div>;

    const validation = item.groupId ? curriculumValidations[item.groupId] : null;
    const showCurriculumBadge = selectedMode.code === 'MOVE' && validation !== undefined;

    return (
      <div className="d-flex w-100 align-items-center">
        <div className="flex-grow-1 d-flex flex-column gap-1">
          <div className="d-flex align-items-center gap-2">
            <span className="fw-bold">{item.fullName}</span>
            {showCurriculumBadge && <Tag value={validation.sameCurriculum ? 'Mismo plan' : 'Plan diferente'} severity={validation.sameCurriculum ? 'success' : 'danger'} icon={validation.sameCurriculum ? 'pi pi-check' : 'pi pi-times'} className="text-xs" />}
          </div>
          {item.email && (
            <span className="text-secondary small">
              <i className="pi pi-envelope me-1" />
              {item.email}
            </span>
          )}
          {item.registrationNumber && (
            <span className="text-secondary small">
              <i className="pi pi-id-card me-1" />
              {item.registrationNumber}
            </span>
          )}
          {selectedMode.code === 'MOVE' && item.groupId && (
            <span className="text-muted small">
              <i className="pi pi-users me-1" />
              Grupo {item.groupId}
            </span>
          )}
        </div>
      </div>
    );
  };

  const saveChanges = () => {
    if (!target || target.length === 0) {
      showWarn('Atención', 'No hay estudiantes seleccionados para procesar');
      return;
    }

    if (!selectedMode?.code) {
      showError('Error', 'Modo de operación no válido');
      return;
    }

    if (selectedMode.code !== 'MOVE') {
      handleSave();
      return;
    }

    handleMove();
  };

  const handleSave = () => {
    let actionText, confirmMessage;

    switch (selectedMode.code) {
      case 'ADD':
        actionText = 'añadir';
        confirmMessage = `¿Confirma añadir ${target.length} estudiante(s) al grupo "${group.name}"?`;
        break;
      case 'REMOVE':
        actionText = 'quitar';
        confirmMessage = `¿Confirma quitar ${target.length} estudiante(s) del grupo "${group.name}"?\n\nNOTA: Las calificaciones se conservarán en el historial.`;
        break;
      default:
        showError('Error', 'Modo de operación no reconocido');
        return;
    }

    confirmAction({
      message: confirmMessage,
      header: `Confirmar ${selectedMode.name.toLowerCase()}`,
      icon: 'pi pi-question-circle',
      acceptClassName: selectedMode.code === 'REMOVE' ? 'p-button-danger' : 'p-button-success',
      acceptLabel: 'Sí, confirmar',
      rejectLabel: 'Cancelar',
      onAccept: async () => {
        try {
          setLoading(true);

          for (const student of target) {
            if (selectedMode.code === 'REMOVE') {
              await removeStudentFromGroup(group.groupId, student.id);
            } else {
              await enrollStudentInGroup(group.groupId, student.id);
            }
          }

          const successMessage = selectedMode.code === 'ADD' ? `Se añadieron ${target.length} estudiante(s) al grupo correctamente` : `Se quitaron ${target.length} estudiante(s) del grupo correctamente`;

          showSuccess('Éxito', successMessage);
          await reloadData();
        } catch (error) {
          console.error('Error al guardar cambios:', error);
          showError('Error', `No se pudieron ${actionText} los estudiantes`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleMove = () => {
    const compatibleStudents = [];
    const incompatibleStudents = [];

    target.forEach((student) => {
      const validation = curriculumValidations[student.groupId];
      if (validation?.sameCurriculum) {
        compatibleStudents.push(student);
      } else {
        incompatibleStudents.push(student);
      }
    });

    if (compatibleStudents.length > 0) {
      handleCompatibleStudentsConfirmation(compatibleStudents, incompatibleStudents);
    } else if (incompatibleStudents.length > 0) {
      handleIncompatibleStudentsConfirmation(incompatibleStudents);
    }
  };

  const handleCompatibleStudentsConfirmation = (compatibleStudents, incompatibleStudents) => {
    const groupsInfo = getGroupsInfo(compatibleStudents);

    confirmAction({
      message: `¿Confirma mover ${compatibleStudents.length} estudiante(s) de ${groupsInfo} al grupo "${group.name}"? Estos grupos tienen el mismo plan de estudios.`,
      header: 'Transferir estudiantes compatibles',
      icon: 'pi pi-check-circle',
      acceptClassName: 'p-button-success',
      acceptLabel: 'Sí, transferir',
      rejectLabel: 'Cancelar',
      onAccept: () => {
        // Añadir delay para que el diálogo actual se cierre completamente
        setTimeout(() => {
          showCopyQualificationsDialog(compatibleStudents, incompatibleStudents);
        }, 300);
      },
    });
  };

  const showCopyQualificationsDialog = (compatibleStudents, incompatibleStudents) => {
    confirmAction({
      message: `¿Desea copiar las calificaciones al nuevo grupo "${group.name}"?\n\nLas calificaciones originales se conservarán en el historial.`,
      header: 'Copiar calificaciones',
      icon: 'pi pi-question-circle',
      acceptLabel: 'Sí, copiar calificaciones',
      rejectLabel: 'No copiar',
      onAccept: async () => {
        await executeCompatibleTransfer(compatibleStudents, true);
        if (incompatibleStudents.length > 0) {
          setTimeout(() => {
            handleIncompatibleStudentsConfirmation(incompatibleStudents);
          }, 500);
        }
      },
      onReject: async () => {
        await executeCompatibleTransfer(compatibleStudents, false);
        if (incompatibleStudents.length > 0) {
          setTimeout(() => {
            handleIncompatibleStudentsConfirmation(incompatibleStudents);
          }, 500);
        }
      },
    });
  };

  const handleIncompatibleStudentsConfirmation = (incompatibleStudents) => {
    const groupsInfo = getGroupsInfo(incompatibleStudents);

    confirmAction({
      message: `¿Confirma mover ${incompatibleStudents.length} estudiante(s) de ${groupsInfo} al grupo "${group.name}"?\n\nEstos grupos tienen planes de estudio diferentes.\nLas calificaciones NO se copiarán, pero se conservarán en el grupo original.`,
      header: 'Transferir estudiantes incompatibles',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-warning',
      acceptLabel: 'Sí, transferir sin calificaciones',
      rejectLabel: 'Cancelar',
      onAccept: async () => {
        await executeIncompatibleTransfer(incompatibleStudents);
      },
    });
  };

  const executeCompatibleTransfer = async (students, copyQualifications) => {
    try {
      setLoading(true);

      const studentsByGroup = groupStudentsBySourceGroup(students);

      for (const [sourceGroupId, groupStudents] of Object.entries(studentsByGroup)) {
        const studentIds = groupStudents.map((s) => s.id);

        const result = await transferStudents(studentIds, parseInt(sourceGroupId), group.groupId, copyQualifications);

        if (result.success) {
          const copiedCount = result.results.filter((r) => r.qualificationsCopied).length;
          showSuccess('Éxito', `Transferidos ${groupStudents.length} estudiante(s) del Grupo ${sourceGroupId}`);

          if (copyQualifications && copiedCount > 0) {
            showSuccess('Calificaciones', `Se copiaron calificaciones para ${copiedCount} estudiante(s)`);
          }
        }
      }

      await reloadData();
    } catch (error) {
      console.error('Error en transferencia compatible:', error);
      showError('Error', 'No se pudieron transferir algunos estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const executeIncompatibleTransfer = async (students) => {
    try {
      setLoading(true);

      const studentsByGroup = groupStudentsBySourceGroup(students);

      for (const [sourceGroupId, groupStudents] of Object.entries(studentsByGroup)) {
        const studentIds = groupStudents.map((s) => s.id);

        const result = await transferStudents(studentIds, parseInt(sourceGroupId), group.groupId, false);

        if (result.success) {
          showSuccess('Éxito', `Transferidos ${groupStudents.length} estudiante(s) del Grupo ${sourceGroupId} (sin calificaciones)`);
        }
      }

      await reloadData();
    } catch (error) {
      console.error('Error en transferencia incompatible:', error);
      showError('Error', 'No se pudieron transferir algunos estudiantes');
    } finally {
      setLoading(false);
    }
  };

  const getGroupsInfo = (students) => {
    const groups = [...new Set(students.map((s) => s.groupId))];
    return groups.length === 1 ? `Grupo ${groups[0]}` : `${groups.length} grupos diferentes`;
  };

  const groupStudentsBySourceGroup = (students) => {
    return students.reduce((acc, student) => {
      if (!acc[student.groupId]) {
        acc[student.groupId] = [];
      }
      acc[student.groupId].push(student);
      return acc;
    }, {});
  };

  const reloadData = async () => {
    const [groupStudentsRes, studentsWithGroupRes] = await Promise.all([getGroupStudents(group.groupId), getStudentsWithGroup()]);

    setCurrentGroupStudents(Array.isArray(groupStudentsRes) ? groupStudentsRes : []);
    setStudentsWithGroup(Array.isArray(studentsWithGroupRes) ? studentsWithGroupRes : []);
  };

  const cancel = () => {
    if (target && target.length > 0) {
      confirmAction({
        message: '¿Está seguro de cancelar? Se perderán los cambios no guardados.',
        header: 'Confirmar cancelación',
        icon: 'pi pi-exclamation-triangle',
        acceptClassName: 'p-button-danger',
        acceptLabel: 'Sí, cancelar',
        rejectLabel: 'No',
        onAccept: () => {
          resetToOriginalState();
        },
      });
    }
  };

  const handleModeChange = (e) => {
    const newMode = e.value;
    if (newMode && newMode.code) {
      setSelectedMode(newMode);
    }
  };

  const sourceCount = source.length;
  const targetCount = target.length;
  const hasSelectedStudents = targetCount > 0;

  const studentsWithGroupInCurrentCareer = studentsWithGroup.filter((s) => s.careerId === group.careerId);
  const studentsWithoutGroupInCurrentCareer = careerStudents.length - studentsWithGroupInCurrentCareer.length;

  const toolbarRight = () => (
    <div className="flex flex-wrap">
      {hasSelectedStudents && (
        <Button icon="pi pi-times" outlined severity="secondary" className="me-2" onClick={cancel} disabled={loading} tooltip="Cancelar y restaurar selección" tooltipOptions={{ position: 'top' }}>
          <span className="d-none d-sm-inline ms-1">Cancelar</span>
        </Button>
      )}
      <Button
        icon={selectedMode?.code === 'REMOVE' ? 'pi pi-user-minus' : 'pi pi-save'}
        severity={selectedMode?.code === 'REMOVE' ? 'danger' : 'success'}
        onClick={saveChanges}
        disabled={loading || !hasSelectedStudents || (selectedMode.code === 'MOVE' && loadingValidations)}
        tooltip={loadingValidations ? 'Cargando validaciones...' : hasSelectedStudents ? `${selectedMode?.name} ${targetCount} estudiante(s)` : 'Selecciona estudiantes para continuar'}
        tooltipOptions={{ position: 'top' }}
      >
        <span className="d-none d-sm-inline ms-2">{selectedMode?.code === 'REMOVE' ? 'Quitar del grupo' : 'Guardar cambios'}</span>
      </Button>
    </div>
  );

  const toolbarLeft = () => (
    <div className="flex flex-wrap align-items-center gap-2">
      <Dropdown
        value={selectedMode}
        onChange={handleModeChange}
        options={modes}
        optionLabel="name"
        placeholder="Selecciona una acción"
        className="w-full md:w-15rem"
        disabled={loading}
        itemTemplate={(option) => (
          <div className="flex align-items-center gap-2">
            <i className={`pi ${option.icon} text-${option.color}-500`}></i>
            <span>{option.name}</span>
          </div>
        )}
        valueTemplate={(option) =>
          option ? (
            <div className="flex align-items-center gap-2">
              <i className={`pi ${option.icon} text-${option.color}-500`}></i>
              <span>{option.name}</span>
            </div>
          ) : (
            'Selecciona una acción'
          )
        }
      />
      {selectedMode.code === 'MOVE' && loadingValidations && (
        <div className="d-flex align-items-center gap-2 text-muted">
          <i className="pi pi-spinner pi-spin" style={{ fontSize: '0.8rem' }}></i>
          <small>Validando planes de estudio...</small>
        </div>
      )}
    </div>
  );

  const getSourceHeader = () => {
    let text, icon, severity;

    switch (selectedMode?.code) {
      case 'ADD':
        text = 'Sin grupo en esta carrera ';
        icon = 'pi pi-user-plus';
        severity = 'success';
        break;
      case 'MOVE':
        text = 'En otros grupos de esta carrera ';
        icon = 'pi pi-arrows-h';
        severity = 'info';
        break;
      case 'REMOVE':
        text = 'Estudiantes en este grupo ';
        icon = 'pi pi-user-minus';
        severity = 'danger';
        break;
      default:
        text = 'Estudiantes disponibles ';
        icon = 'pi pi-users';
        severity = 'info';
    }

    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">{text}</span>
        <Tag icon={icon} value={sourceCount} severity={severity} />
      </div>
    );
  };

  const getTargetHeader = () => {
    const actionText = selectedMode?.code === 'ADD' ? 'añadir' : selectedMode?.code === 'MOVE' ? 'mover' : 'quitar';
    const severity = selectedMode?.code === 'REMOVE' ? 'danger' : selectedMode?.code === 'MOVE' ? 'info' : 'success';

    return (
      <div className="flex align-items-center gap-2">
        <span className="font-semibold">Seleccionados para {actionText} </span>
        <Tag icon="pi pi-check" value={targetCount} severity={severity} />
      </div>
    );
  };

  const getInfoMessage = () => {
    switch (selectedMode?.code) {
      case 'ADD':
        if (sourceCount === 0 && studentsWithoutGroupInCurrentCareer === 0) {
          return {
            severity: 'info',
            text: 'Todos los estudiantes de esta carrera ya tienen un grupo asignado en esta carrera. No hay estudiantes disponibles para añadir.',
          };
        }
        if (careerStudents.length === 0) {
          return {
            severity: 'warn',
            text: 'No hay estudiantes inscritos en esta carrera. Ve a la sección de Usuarios para inscribir estudiantes.',
          };
        }
        break;
      case 'MOVE':
        if (sourceCount === 0) {
          return {
            severity: 'warn',
            text: 'No hay estudiantes de esta carrera en otros grupos para mover.',
          };
        }
        break;
      case 'REMOVE':
        if (sourceCount === 0) {
          return {
            severity: 'info',
            text: 'Este grupo no tiene estudiantes asignados para quitar.',
          };
        }
        break;
    }
    return null;
  };

  const infoMessage = getInfoMessage();

  if (loading) {
    return (
      <div className="card border-0">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <i className="pi pi-spinner pi-spin" style={{ fontSize: '2rem', color: '#6366f1' }}></i>
            <p className="mt-3 text-600">Cargando estudiantes de la carrera...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 mt-3">
      <Toolbar className="py-2 border-0 border-bottom rounded-bottom-0" start={toolbarLeft} end={toolbarRight} />

      <div className="px-3 py-2 bg-light border-bottom">
        <div className="row text-center">
          <div className="col-md-3">
            <small className="text-muted d-block">Total en carrera</small>
            <strong className="text-secondary">{careerStudents.length}</strong>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">En este grupo</small>
            <strong className="text-secondary">{currentGroupStudents.length}</strong>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Otros grupos</small>
            <strong className="text-secondary">{studentsWithGroupInCurrentCareer.filter((s) => s.groupId !== group.groupId).length}</strong>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Sin grupo</small>
            <strong className="text-secondary">{studentsWithoutGroupInCurrentCareer}</strong>
          </div>
        </div>
      </div>

      <PickList
        dataKey="id"
        className="m-3"
        source={source}
        target={target}
        onChange={onChange}
        itemTemplate={itemTemplate}
        filter
        filterBy="searchText"
        breakpoint="1280px"
        showSourceControls={false}
        showTargetControls={false}
        sourceHeader={getSourceHeader()}
        targetHeader={getTargetHeader()}
        sourceStyle={{ height: '30rem' }}
        targetStyle={{ height: '30rem' }}
        sourceFilterPlaceholder="Buscar por nombre, matrícula o email..."
        targetFilterPlaceholder="Buscar seleccionados..."
      />

      {infoMessage && (
        <div className="m-3 text-center">
          <Message severity={infoMessage.severity} text={infoMessage.text} />
        </div>
      )}

      {selectedMode?.code === 'REMOVE' && sourceCount > 0 && (
        <div className="m-3 text-center">
          <Message severity="info" text="Los estudiantes eliminados del grupo conservarán sus calificaciones en el historial y podrán reactivarse si regresan al grupo." />
        </div>
      )}

      {selectedMode?.code === 'MOVE' && sourceCount > 0 && (
        <div className="m-3 text-center">
          <Message severity="info" text="Los badges indican si el plan de estudios es compatible para copiar calificaciones. El sistema manejará automáticamente las transferencias." />
        </div>
      )}
    </div>
  );
}

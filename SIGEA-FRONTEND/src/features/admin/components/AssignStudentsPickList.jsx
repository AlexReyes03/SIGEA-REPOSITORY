import React, { useState, useEffect, useCallback } from 'react';
import { PickList } from 'primereact/picklist';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getStudentsByCareer } from '../../../api/academics/enrollmentService';
import { getGroupStudents, enrollStudentInGroup, removeStudentFromGroup, getStudentsWithGroup } from '../../../api/academics/groupService';

export default function AssignStudentsPickList({ group }) {
  const [source, setSource] = useState([]);
  const [target, setTarget] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();
  const [careerStudents, setCareerStudents] = useState([]);
  const [currentGroupStudents, setCurrentGroupStudents] = useState([]);
  const [studentsWithGroup, setStudentsWithGroup] = useState([]);

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
        registrationNumber: student.primaryRegistrationNumber || '', // CAMBIO: usar primaryRegistrationNumber
        email: student.email || '',
        groupId: student.groupId,
        searchText: `${student.fullName} ${student.primaryRegistrationNumber || ''} ${student.email || ''}`.toLowerCase(),
      };
    } else {
      const fullName = `${student.userName || student.name} ${student.userPaternalSurname || student.paternalSurname} ${student.userMaternalSurname || student.maternalSurname}`.trim();

      return {
        id: student.userId || student.id,
        fullName: fullName,
        registrationNumber: student.registrationNumber || '',
        email: student.userEmail || student.email || '',
        groupId: null,
        searchText: `${fullName} ${student.registrationNumber || ''} ${student.userEmail || student.email || ''}`.toLowerCase(),
      };
    }
  };

  const resetToOriginalState = useCallback(() => {
    if (loading || !selectedMode?.code) return;

    const currentGroupStudentIds = currentGroupStudents.map((s) => s.studentId);
    const careerStudentIds = careerStudents.map((s) => s.userId || s.id); // IDs de estudiantes de esta carrera

    let originalSource = [];

    switch (selectedMode.code) {
      case 'ADD':
        // Solo estudiantes de la carrera que NO tienen NINGÚN grupo asignado
        const allStudentsWithGroupIds = studentsWithGroup.map((s) => s.studentId);
        originalSource = careerStudents
          .filter((student) => {
            const studentId = student.userId || student.id;
            return !currentGroupStudentIds.includes(studentId) && !allStudentsWithGroupIds.includes(studentId);
          })
          .map((student) => normalizeStudent(student, false));
        break;

      case 'MOVE':
        // CORRECCIÓN: Solo estudiantes de la MISMA CARRERA que tienen grupo pero NO están en el grupo actual
        originalSource = studentsWithGroup
          .filter(
            (student) => student.groupId !== group.groupId && careerStudentIds.includes(student.studentId) // FILTRAR por carrera
          )
          .map((student) => normalizeStudent(student, true));
        break;

      case 'REMOVE':
        // Estudiantes que están en el grupo actual
        originalSource = currentGroupStudents.map((student) => normalizeStudent(student, true));
        break;

      default:
        originalSource = [];
    }

    setSource(originalSource);
    setTarget([]);
  }, [selectedMode, careerStudents, currentGroupStudents, studentsWithGroup, loading, group?.groupId]);

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

    return (
      <div className="d-flex w-100">
        <div className="flex-grow-1 d-flex flex-column gap-1">
          <span className="fw-bold">{item.fullName}</span>
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

    let actionText, confirmMessage;

    switch (selectedMode.code) {
      case 'ADD':
        actionText = 'añadir';
        confirmMessage = `¿Confirma añadir ${target.length} estudiante(s) al grupo "${group.name}"?`;
        break;
      case 'MOVE':
        actionText = 'mover';
        confirmMessage = `¿Confirma mover ${target.length} estudiante(s) a este grupo "${group.name}"?`;
        break;
      case 'REMOVE':
        actionText = 'quitar';
        confirmMessage = `¿Confirma quitar ${target.length} estudiante(s) del grupo "${group.name}"? Quedarán sin grupo asignado.`;
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
              // Para ADD y MOVE
              if (selectedMode.code === 'MOVE' && student.groupId) {
                await removeStudentFromGroup(student.groupId, student.id);
              }
              await enrollStudentInGroup(group.groupId, student.id);
            }
          }

          let successMessage;
          switch (selectedMode.code) {
            case 'ADD':
              successMessage = `Se añadieron ${target.length} estudiante(s) al grupo correctamente`;
              break;
            case 'MOVE':
              successMessage = `Se movieron ${target.length} estudiante(s) al grupo correctamente`;
              break;
            case 'REMOVE':
              successMessage = `Se quitaron ${target.length} estudiante(s) del grupo correctamente`;
              break;
          }

          showSuccess('Éxito', successMessage);

          const [groupStudentsRes, studentsWithGroupRes] = await Promise.all([getGroupStudents(group.groupId), getStudentsWithGroup()]);

          setCurrentGroupStudents(Array.isArray(groupStudentsRes) ? groupStudentsRes : []);
          setStudentsWithGroup(Array.isArray(studentsWithGroupRes) ? studentsWithGroupRes : []);
        } catch (error) {
          console.error('Error al guardar cambios:', error);
          showError('Error', `No se pudieron ${actionText} los estudiantes`);
        } finally {
          setLoading(false);
        }
      },
    });
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
  const studentsWithoutGroup = careerStudents.length - studentsWithGroup.filter((s) => careerStudents.some((cs) => (cs.userId || cs.id) === s.studentId)).length;

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
        disabled={loading || !hasSelectedStudents}
        tooltip={hasSelectedStudents ? `${selectedMode?.name} ${targetCount} estudiante(s)` : 'Selecciona estudiantes para continuar'}
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
    </div>
  );

  const getSourceHeader = () => {
    let text, icon, severity;

    switch (selectedMode?.code) {
      case 'ADD':
        text = 'Estudiantes sin grupo ';
        icon = 'pi pi-user-plus';
        severity = 'success';
        break;
      case 'MOVE':
        text = 'Estudiantes en otros grupos ';
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
        if (sourceCount === 0 && studentsWithoutGroup === 0) {
          return {
            severity: 'info',
            text: 'Todos los estudiantes de esta carrera ya tienen un grupo asignado. No hay estudiantes disponibles para añadir.',
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
            <small className="text-muted d-block">En otros grupos</small>
            <strong className="text-secondary">{studentsWithGroup.filter((s) => careerStudents.some((cs) => (cs.userId || cs.id) === s.studentId) && s.groupId !== group.groupId).length}</strong>
          </div>
          <div className="col-md-3">
            <small className="text-muted d-block">Sin grupo</small>
            <strong className="text-secondary">{studentsWithoutGroup}</strong>
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

      {/* Mensajes informativos */}
      {infoMessage && (
        <div className="m-3 text-center">
          <Message severity={infoMessage.severity} text={infoMessage.text} />
        </div>
      )}

      {/* Para modo REMOVE */}
      {selectedMode?.code === 'REMOVE' && sourceCount > 0 && (
        <div className="m-3 text-center">
          <Message severity="warn" text="Los estudiantes eliminados del grupo quedarán sin grupo asignado hasta que sean añadidos a otro grupo." />
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { PickList } from 'primereact/picklist';
import { Toolbar } from 'primereact/toolbar';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';

import { useToast } from '../../../components/providers/ToastProvider';
import { useConfirmDialog } from '../../../components/providers/ConfirmDialogProvider';
import { getAllUsers } from '../../../api/userService';
import { getGroupStudents, enrollStudentInGroup, removeStudentFromGroup, getStudentsWithGroup } from '../../../api/academics/groupService';

export default function AssignStudentsPickList({ group }) {
  const [source, setSource] = useState([]);
  const [target, setTarget] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showSuccess, showError, showWarn } = useToast();
  const { confirmAction } = useConfirmDialog();
  const [allStudents, setAllStudents] = useState([]);
  const [currentGroupStudents, setCurrentGroupStudents] = useState([]);
  const [studentsWithGroup, setStudentsWithGroup] = useState([]);

  const modes = [
    { name: ' Añadir al grupo', code: 'ADD', icon: 'pi-user-plus', color: 'success' },
    { name: ' Mover de un grupo', code: 'MOVE', icon: 'pi-arrows-h', color: 'info' },
    { name: ' Quitar del grupo', code: 'REMOVE', icon: 'pi-user-minus', color: 'danger' },
  ];

  const [selectedMode, setSelectedMode] = useState(modes[0]);

  // Función para normalizar datos de estudiantes
  const normalizeStudent = (student, isFromGroup = false) => {
    if (isFromGroup) {
      return {
        id: student.studentId,
        fullName: student.fullName,
        registrationNumber: '',
        email: '',
        groupId: student.groupId,
        searchText: student.fullName.toLowerCase(),
      };
    } else {
      const fullName = `${student.name} ${student.paternalSurname} ${student.maternalSurname}`.trim();
      return {
        id: student.id,
        fullName: fullName,
        registrationNumber: student.registrationNumber || '',
        email: student.email || '',
        groupId: null,
        searchText: `${fullName} ${student.registrationNumber || ''} ${student.email || ''}`.toLowerCase(),
      };
    }
  };

  // Función para restablecer las listas al estado original del modo actual
  const resetToOriginalState = useCallback(() => {
    if (loading || !selectedMode?.code) return;

    const currentGroupStudentIds = currentGroupStudents.map((s) => s.studentId);
    const allStudentsWithGroupIds = studentsWithGroup.map((s) => s.studentId);

    let originalSource = [];

    switch (selectedMode.code) {
      case 'ADD':
        // Modo ADD: Solo estudiantes que NO tienen NINGÚN grupo asignado
        originalSource = allStudents.filter((student) => !currentGroupStudentIds.includes(student.id) && !allStudentsWithGroupIds.includes(student.id)).map((student) => normalizeStudent(student));
        break;

      case 'MOVE':
        // Modo MOVE: Solo estudiantes que SÍ tienen grupo pero NO están en el grupo actual
        originalSource = studentsWithGroup.filter((student) => student.groupId !== group.groupId).map((student) => normalizeStudent(student, true));
        break;

      case 'REMOVE':
        // Modo REMOVE: Estudiantes que están en el grupo actual
        originalSource = currentGroupStudents.map((student) => normalizeStudent(student, true));
        break;

      default:
        originalSource = [];
    }

    setSource(originalSource);
    setTarget([]);
  }, [selectedMode, allStudents, currentGroupStudents, studentsWithGroup, loading, group?.groupId]);

  useEffect(() => {
    const loadData = async () => {
      if (!group?.groupId) {
        showError('Error', 'No se especificó un grupo válido');
        return;
      }

      setLoading(true);
      try {
        const [allUsersRes, groupStudentsRes, studentsWithGroupRes] = await Promise.all([getAllUsers(), getGroupStudents(group.groupId), getStudentsWithGroup()]);

        const students = Array.isArray(allUsersRes) ? allUsersRes.filter((user) => user.roleName === 'STUDENT') : [];
        const groupStudents = Array.isArray(groupStudentsRes) ? groupStudentsRes : [];
        const studentsWithGroup = Array.isArray(studentsWithGroupRes) ? studentsWithGroupRes : [];

        setAllStudents(students);
        setCurrentGroupStudents(groupStudents);
        setStudentsWithGroup(studentsWithGroup);
      } catch (error) {
        console.error('Error cargando datos:', error);
        showError('Error', 'No se pudieron cargar los datos');
        setAllStudents([]);
        setCurrentGroupStudents([]);
        setStudentsWithGroup([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [group?.groupId, showError]);

  // Configurar source y target según el modo seleccionado
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
      <div className="flex flex-wrap p-2 align-items-center gap-3">
        <div className="flex-1 flex flex-column gap-1">
          <span className="font-bold">{item.fullName}</span>
          <div className="flex gap-3 text-500 text-sm">
            {item.registrationNumber && <p className="mb-0">{item.registrationNumber}</p>}
            {item.email && <p className="mt-0">{item.email}</p>}
          </div>
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

          // Recargar datos para actualizar las listas
          const [groupStudentsRes, studentsWithGroupRes] = await Promise.all([getGroupStudents(group.groupId), getStudentsWithGroup()]);

          setCurrentGroupStudents(Array.isArray(groupStudentsRes) ? groupStudentsRes : []);
          setStudentsWithGroup(Array.isArray(studentsWithGroupRes) ? studentsWithGroupRes : []);

          // Después de guardar, resetear al estado original del modo actual
          // El useEffect se encargará de esto automáticamente
        } catch (error) {
          console.error('Error al guardar cambios:', error);
          showError('Error', `No se pudieron ${actionText} los estudiantes`);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  // FUNCIÓN CANCEL CORREGIDA - Restaura el estado original
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
          // Restablecer al estado original del modo actual
          resetToOriginalState();
        },
      });
    }
  };

  const customFilter = (value, filter) => {
    if (!filter) return true;
    if (!value?.searchText) return false;
    const filterLower = filter.toLowerCase().trim();
    return value.searchText.includes(filterLower);
  };

  const handleModeChange = (e) => {
    const newMode = e.value;
    if (newMode && newMode.code) {
      setSelectedMode(newMode);
      // El useEffect se encargará de restablecer las listas
    }
  };

  const sourceCount = source.length;
  const targetCount = target.length;
  const hasSelectedStudents = targetCount > 0;
  const studentsWithoutGroup = allStudents.length - studentsWithGroup.length;

  const toolbarRight = () => (
    <div className="flex flex-wrap">
      {/* Solo mostrar botón cancelar si hay estudiantes seleccionados */}
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

  // Headers con Tags para mostrar contadores
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
            text: 'Todos los estudiantes ya tienen un grupo asignado. No hay estudiantes disponibles para añadir.',
          };
        }
        break;
      case 'MOVE':
        if (sourceCount === 0) {
          return {
            severity: 'warn',
            text: 'No hay estudiantes en otros grupos para mover. Todos los estudiantes con grupo ya están en este grupo.',
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
            <p className="mt-3 text-600">Cargando estudiantes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card border-0 mt-3">
      <Toolbar className="py-2 border-0 border-bottom rounded-bottom-0" start={toolbarLeft} end={toolbarRight} />

      <PickList
        dataKey="id"
        className="m-3"
        source={source}
        target={target}
        onChange={onChange}
        itemTemplate={itemTemplate}
        filter
        filterBy="searchText"
        filterFunction={customFilter}
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

      {/* Mensaje informativo usando PrimeReact Message */}
      {infoMessage && (
        <div className="m-3 text-center">
          <Message severity={infoMessage.severity} text={infoMessage.text} />
        </div>
      )}

      {/* Información adicional para modo REMOVE */}
      {selectedMode?.code === 'REMOVE' && sourceCount > 0 && (
        <div className="m-3 text-center">
          <Message severity="warn" text="Los estudiantes eliminados del grupo quedarán sin grupo asignado hasta que sean añadidos a otro grupo." />
        </div>
      )}
    </div>
  );
}

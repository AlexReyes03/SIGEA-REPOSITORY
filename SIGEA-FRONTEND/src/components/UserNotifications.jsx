import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { ProgressSpinner } from 'primereact/progressspinner';
import { MdNotifications, MdNotificationsNone, MdNotificationImportant, MdMoreHoriz, MdDeleteSweep } from 'react-icons/md';

import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/providers/ToastProvider';
import { useConfirmDialog } from '../components/providers/ConfirmDialogProvider';
import { useNotificationContext } from '../components/providers/NotificationProvider';
import { 
  markAsRead, 
  deleteNotification, 
  deleteAllReadNotifications 
} from '../api/notificationService';
import avatarFallback from '../assets/img/profile.png';

export default function UserNotifications() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const { confirmAction } = useConfirmDialog();
  const opRef = useRef(null);

  // Usar el contexto de notificaciones
  const {
    notifications,
    notificationCount,
    loading,
    connected,
    loadNotifications,
    updateNotificationLocally,
    removeNotificationLocally
  } = useNotificationContext();

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Todas, 1: No leídas, 2: Leídas
  
  // Paginación
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(5);
  
  // Estados de operaciones
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const rowsPerPageOptions = [5, 10, 15];

  // Filtrar notificaciones según el tab activo
  const filteredNotifications = useMemo(() => {
    switch (activeTab) {
      case 1: // No leídas
        return notifications.filter(n => !n.read);
      case 2: // Leídas
        return notifications.filter(n => n.read);
      default: // Todas
        return notifications;
    }
  }, [notifications, activeTab]);

  // Paginación de notificaciones filtradas
  const paginatedNotifications = useMemo(() => {
    const startIndex = first;
    const endIndex = first + rows;
    return filteredNotifications.slice(startIndex, endIndex);
  }, [filteredNotifications, first, rows]);

  // Conteos para los tabs
  const notificationCounts = useMemo(() => {
    const unread = notifications.filter(n => !n.read).length;
    const read = notifications.filter(n => n.read).length;
    return {
      all: notifications.length,
      unread,
      read
    };
  }, [notifications]);

  // Resetear paginación cuando cambie el tab
  useEffect(() => {
    setFirst(0);
  }, [activeTab]);

  const handleMarkAsRead = useCallback(async (notification) => {
    if (isMarkingRead || !user?.id) return;

    try {
      setIsMarkingRead(true);
      await markAsRead(user.id, notification.id);
      
      updateNotificationLocally(notification.id, { 
        read: true, 
        readAt: new Date().toISOString() 
      });
      
      showSuccess('Éxito', 'Notificación marcada como leída');
      opRef.current.hide();
    } catch (err) {
      console.error('Error marking as read:', err);
      showError('Error', 'Error al marcar como leída');
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead, user?.id, updateNotificationLocally, showSuccess, showError]);

  const handleMarkAsUnread = useCallback(async (notification) => {
    if (isMarkingRead || !user?.id) return;

    try {
      setIsMarkingRead(true);
      // Nota: Si no tienes endpoint para marcar como no leída, 
      // solo actualizaremos localmente
      updateNotificationLocally(notification.id, { 
        read: false, 
        readAt: null 
      });
      
      showSuccess('Éxito', 'Notificación marcada como no leída');
      opRef.current.hide();
    } catch (err) {
      console.error('Error marking as unread:', err);
      showError('Error', 'Error al marcar como no leída');
    } finally {
      setIsMarkingRead(false);
    }
  }, [isMarkingRead, user?.id, updateNotificationLocally, showSuccess, showError]);

  const handleDeleteNotification = useCallback(async (notification) => {
    if (isDeleting || !user?.id) return;

    confirmAction({
      message: '¿Estás seguro de eliminar esta notificación?',
      header: 'Eliminar notificación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      onAccept: async () => {
        try {
          setIsDeleting(true);
          await deleteNotification(user.id, notification.id);
          
          removeNotificationLocally(notification.id);
          showSuccess('Éxito', 'Notificación eliminada');
          opRef.current.hide();
        } catch (err) {
          console.error('Error deleting notification:', err);
          showError('Error', 'Error al eliminar la notificación');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  }, [isDeleting, user?.id, removeNotificationLocally, confirmAction, showSuccess, showError]);

  const handleDeleteAllRead = useCallback(async () => {
    if (isDeletingAll || !user?.id) return;

    const readCount = notificationCounts.read;
    if (readCount === 0) {
      showError('Información', 'No hay notificaciones leídas para eliminar');
      return;
    }

    confirmAction({
      message: `¿Estás seguro de eliminar todas las ${readCount} notificaciones leídas?`,
      header: 'Eliminar notificaciones leídas',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar todas',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      onAccept: async () => {
        try {
          setIsDeletingAll(true);
          await deleteAllReadNotifications(user.id);
          
          // Actualizar estado local eliminando todas las leídas
          const readNotificationIds = notifications
            .filter(n => n.read)
            .map(n => n.id);
          
          readNotificationIds.forEach(id => removeNotificationLocally(id));
          
          showSuccess('Éxito', `${readCount} notificaciones eliminadas`);
        } catch (err) {
          console.error('Error deleting all read notifications:', err);
          showError('Error', 'Error al eliminar las notificaciones');
        } finally {
          setIsDeletingAll(false);
        }
      }
    });
  }, [isDeletingAll, user?.id, notificationCounts.read, notifications, removeNotificationLocally, confirmAction, showSuccess, showError]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const dateFormatted = date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const timeFormatted = date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      return `${dateFormatted} - ${timeFormatted}`;
    } catch (error) {
      console.warn('Error formatting date:', dateString);
      return 'Fecha no disponible';
    }
  };

  const getNotificationTypeIcon = (type) => {
    switch (type) {
      case 'warning':
        return 'pi pi-exclamation-triangle text-warning';
      case 'error':
        return 'pi pi-times-circle text-danger';
      case 'success':
        return 'pi pi-check-circle text-success';
      default:
        return 'pi pi-info-circle text-info';
    }
  };

  const onPageChange = (event) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  return (
    <>
      <div className="bg-white rounded-top p-2 d-flex align-items-center">
        <h3 className="text-blue-500 fw-semibold mx-3 my-1 d-flex align-items-center gap-2">
          Panel de notificaciones
          {/* Indicador de conexión WebSocket */}
          <span className={`badge ${connected ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.6rem' }}>
            {connected ? 'En línea' : 'Desconectado'}
          </span>
        </h3>
        
        {/* Botón eliminar todas las leídas */}
        {notificationCounts.read > 0 && (
          <div className="ms-auto">
            <Button
              icon={isDeletingAll ? 'pi pi-spin pi-spinner' : <MdDeleteSweep size={18} />}
              severity="danger"
              outlined
              size="small"
              label={`Eliminar leídas (${notificationCounts.read})`}
              onClick={handleDeleteAllRead}
              disabled={isDeletingAll || loading}
              className="d-none d-md-flex"
            />
            <Button
              icon={isDeletingAll ? 'pi pi-spin pi-spinner' : <MdDeleteSweep size={18} />}
              severity="danger"
              outlined
              size="small"
              onClick={handleDeleteAllRead}
              disabled={isDeletingAll || loading}
              className="d-md-none"
              tooltip="Eliminar notificaciones leídas"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 400 }}>
          <div className="text-center">
            <ProgressSpinner style={{ width: '50px', height: '50px' }} strokeWidth="8" />
            <p className="mt-3 text-600">Cargando notificaciones...</p>
          </div>
        </div>
      ) : (
        <div className="row mt-3">
          {/* Sidebar con tabs */}
          <div className="col-12 col-md-3">
            <div className="card border-0 rounded-end-0">
              <div className="card-body">
                <div className="d-flex w-100 mb-2">
                  <h5 className="text-blue-500">Notificaciones</h5>
                  <Tag className="ms-auto px-3" value={notificationCounts.unread} severity={notificationCounts.unread > 0 ? 'danger' : 'secondary'} />
                </div>
                
                {/* Tabs como botones */}
                <div className="d-flex flex-md-column justify-content-center justify-content-md-start text-center">
                  <Button
                    text
                    severity={activeTab === 0 ? 'primary' : 'secondary'}
                    className={`mb-2 px-0 ${activeTab === 0 ? 'fw-bold' : ''}`}
                    onClick={() => setActiveTab(0)}
                  >
                    <MdNotifications className="d-none d-md-inline" size={24} />
                    <span className="ms-2">Todas ({notificationCounts.all})</span>
                  </Button>
                  
                  <Button
                    text
                    severity={activeTab === 1 ? 'primary' : 'secondary'}
                    className={`mb-2 px-0 ${activeTab === 1 ? 'fw-bold' : ''}`}
                    onClick={() => setActiveTab(1)}
                  >
                    <MdNotificationImportant className="d-none d-md-inline" size={24} />
                    <span className="ms-2">No leídas ({notificationCounts.unread})</span>
                  </Button>
                  
                  <Button
                    text
                    severity={activeTab === 2 ? 'primary' : 'secondary'}
                    className={`mb-2 px-0 ${activeTab === 2 ? 'fw-bold' : ''}`}
                    onClick={() => setActiveTab(2)}
                  >
                    <MdNotificationsNone className="d-none d-md-inline" size={24} />
                    <span className="ms-2">Leídas ({notificationCounts.read})</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="col-12 col-md-9 mt-3 mt-md-0">
            {filteredNotifications.length === 0 ? (
              <div className="card border-0 text-center py-5">
                <div className="d-flex justify-content-center mb-3">
                  {activeTab === 0 && <MdNotifications size={70} className="text-secondary" />}
                  {activeTab === 1 && <MdNotificationImportant size={70} className="text-secondary" />}
                  {activeTab === 2 && <MdNotificationsNone size={70} className="text-secondary" />}
                </div>
                <h5 className="mt-3 text-muted">
                  {activeTab === 0 && 'No tienes notificaciones'}
                  {activeTab === 1 && 'No tienes notificaciones sin leer'}
                  {activeTab === 2 && 'No tienes notificaciones leídas'}
                </h5>
                <p className="text-muted">
                  {activeTab === 0 && 'Las notificaciones aparecerán aquí cuando las recibas'}
                  {activeTab === 1 && 'Todas tus notificaciones están marcadas como leídas'}
                  {activeTab === 2 && 'Las notificaciones que hayas leído aparecerán aquí'}
                </p>
              </div>
            ) : (
              <>
                {/* Lista de notificaciones */}
                <div className="d-flex flex-column gap-3 mb-3">
                  {paginatedNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`card p-4 border-0 ${!notification.read ? 'border-start border-primary border-3' : ''}`}
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div className="d-flex align-items-center justify-content-center rounded-circle bg-light" style={{ width: '60px', height: '60px', flexShrink: 0 }}>
                          <i className={getNotificationTypeIcon(notification.type)} style={{ fontSize: '24px' }}></i>
                        </div>
                        
                        <div className="flex-grow-1 overflow-x-auto">
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="w-100">
                              <div className="d-flex align-items-center gap-2">
                                <h6 className="text-dark mb-1 text-truncate flex-grow-1">
                                  {notification.title}
                                  <small className="text-muted"> - {formatDate(notification.createdAt)}</small>
                                </h6>
                                
                                {!notification.read && (
                                  <div className="bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></div>
                                )}
                                <button
                                  className="btn border-0 p-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedNotification(notification);
                                    opRef.current.toggle(e);
                                  }}
                                  disabled={isMarkingRead || isDeleting}
                                >
                                  <MdMoreHoriz size={20} className="text-muted" />
                                </button>
                              </div>
                              
                            </div>
                          </div>

                          <div className="text-muted">
                            <p className="mb-0">{notification.message}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Paginador */}
                {filteredNotifications.length > rows && (
                  <Paginator
                    first={first}
                    rows={rows}
                    totalRecords={filteredNotifications.length}
                    rowsPerPageOptions={rowsPerPageOptions}
                    onPageChange={onPageChange}
                    template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} notificaciones"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* OverlayPanel de acciones */}
      <OverlayPanel ref={opRef}>
        {selectedNotification && (
          <>
            {!selectedNotification.read ? (
              <button
                className="dropdown-item"
                onClick={() => handleMarkAsRead(selectedNotification)}
                disabled={isMarkingRead || isDeleting}
              >
                <i className="pi pi-check me-2" />
                Marcar como leída
              </button>
            ) : (
              <button
                className="dropdown-item"
                onClick={() => handleMarkAsUnread(selectedNotification)}
                disabled={isMarkingRead || isDeleting}
              >
                <i className="pi pi-times me-2" />
                Marcar como no leída
              </button>
            )}
            
            <button
              className="dropdown-item text-danger"
              onClick={() => handleDeleteNotification(selectedNotification)}
              disabled={isMarkingRead || isDeleting}
            >
              <i className="pi pi-trash me-2" />
              Eliminar
            </button>
          </>
        )}
      </OverlayPanel>
    </>
  );
}
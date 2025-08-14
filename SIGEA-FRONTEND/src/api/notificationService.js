import request from './fetchWrapper';

export const getNotificationCount = async (userId) => {
  return await request(`/api/notifications/count/${userId}`);
};

export const getNotificationsByUserId = async (userId) => {
  return await request(`/api/notifications/${userId}`);
};

export const markAsRead = async (userId, notificationId) => {
  return await request(`/api/notifications/mark-read/${userId}/${notificationId}`, {
    method: 'PUT',
  });
};

export const deleteNotification = async (userId, notificationId) => {
  return await request(`/api/notifications/delete/${userId}/${notificationId}`, {
    method: 'DELETE',
  });
};

export const deleteAllReadNotifications = async (userId) => {
  return await request(`/api/notifications/delete-read/${userId}`, {
    method: 'DELETE',
  });
};
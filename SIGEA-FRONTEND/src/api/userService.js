import request from './fetchWrapper';

export const getAllUsers = async () => {
  const res = await request('/api/users');
  return res;
};

export const getUserById = async (id) => {
  const res = await request(`/api/users/${id}`);
  return res;
};

export const getUserByRole = async (roleId) => {
  const res = await request(`/api/users/role/${roleId}`);
  return res;
};

export const getUserByRoleAndPlantel = async (roleId, campusId) => {
  const res = await request(`/api/users/role/${roleId}/campus/${campusId}`);
  return res;
};

export const createUser = async (userDto) => {
  return await request('/api/users', {
    method: 'POST',
    body: userDto,
  });
};

export const updateUser = async (id, userDto) => {
  return await request(`/api/users/${id}`, {
    method: 'PUT',
    body: userDto,
  });
};

export const deleteUser = async (id) => {
  return await request(`/api/users/${id}`, {
    method: 'DELETE',
  });
};

export const deactivateUser = async (id) => {
  return await request(`/api/users/${id}/deactivate`, {
    method: 'PATCH',
  });
};

export const reactivateUser = async (id) => {
  return await request(`/api/users/${id}/reactivate`, {
    method: 'PATCH',
  });
};

// Método auxiliar para toggle del estado de usuario
export const toggleUserStatus = async (id, currentStatus) => {
  if (currentStatus === 'ACTIVE') {
    return await deactivateUser(id);
  } else {
    return await reactivateUser(id);
  }
};

export const getActiveUsers = async () => {
  const { activeUsers } = await request('/auth/active-users');
  return activeUsers;
};
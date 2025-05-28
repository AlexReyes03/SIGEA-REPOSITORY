import request from './fetchWrapper';

export const getAllUsers = async () => {
  return await request('/api/users');
};

export const getUserById = async (id) => {
  return await request(`/api/users/${id}`);
};

export const createUser = async (userDto) => {
  return await request('/api/users', {
    method: 'POST',
    body: userDto
  });
};

export const updateUser = async (id, userDto) => {
  return await request(`/api/users/${id}`, {
    method: 'PUT',
    body: userDto
  });
};

export const deleteUser = async (id) => {
  return await request(`/api/users/${id}`, {
    method: 'DELETE'
  });
};

export const getActiveUsers = async () => {
  const { activeUsers } = await request('/auth/active-users');
  return activeUsers;
};

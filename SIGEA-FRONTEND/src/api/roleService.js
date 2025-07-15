import request from './fetchWrapper';

export const getAllRoles = async () => {
    const res = await request('/api/roles');
    return res.data;
};

export const getRoleById = async (id) => {
  const res = await request(`/api/roles/${id}`);
  return res.data;
};
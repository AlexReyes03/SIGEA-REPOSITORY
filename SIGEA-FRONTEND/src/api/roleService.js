import request from './fetchWrapper';

export const getAllRoles = async () => {
    const res = await request('/api/roles');
    return res.data;
};
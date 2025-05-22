import request from './fetchWrapper';

export const login = async (credentials) => {
  const payload = await request('/auth/login', {
    method: 'POST',
    body: credentials,
  });
  return payload;
};

export const logout = async () => {
  await request('/auth/logout', { method: 'POST' });
  localStorage.removeItem('token');
};

export const getActiveUsers = async () => {
  const { activeUsers } = await request('/auth/active-users');
  return activeUsers;
};
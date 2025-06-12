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

export const requestOtp = (email) => request('/auth/forgot-password', { method: 'POST', body: { email } });

export const verifyOtp = (email, code) => request('/auth/verify-code', { method: 'POST', body: { email, code } });

export const resetPassword = (email, code, newPassword) =>
  request('/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
  });

export const changePassword = async (currentPassword, newPassword) => {
  const sanitizedCurrentPassword = currentPassword?.trim();
  const sanitizedNewPassword = newPassword?.trim();

  const payload = await request('/auth/change-password', {
    method: 'POST',
    body: {
      currentPassword: sanitizedCurrentPassword,
      newPassword: sanitizedNewPassword,
    },
  });

  return payload;
};

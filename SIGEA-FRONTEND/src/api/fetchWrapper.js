import { BASE_URL } from './common-url';

// Referencia a las funciones de AuthContext
let authHandlers = null;

// Establecer los handlers de autenticación
export const setAuthHandlers = (handlers) => {
  authHandlers = handlers;
};

export default async function request(endpoint, { method = 'GET', body = null, headers = {}, signal, isMultipart = false } = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const opts = { method, headers: { ...headers }, signal };

  if (token) opts.headers.Authorization = `Bearer ${token}`;

  if (body) {
    if (isMultipart) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403 || res.status === 500) {
        if (authHandlers && authHandlers.handleAuthError) {
          authHandlers.handleAuthError(res.status, data?.message || 'Sesión invalidada');
        }
      }

      const err = new Error(data?.message || res.statusText);
      err.status = res.status;
      throw err;
    }

    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Error de conexión. Verifica tu conexión a internet.');
      networkError.status = 0;
      throw networkError;
    }

    throw error;
  }
}

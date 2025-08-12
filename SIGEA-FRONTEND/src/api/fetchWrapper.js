import { BASE_URL } from './common-url';

let authHandlers = null;

export const setAuthHandlers = (handlers) => {
  authHandlers = handlers;
};

/**
 * Configuración de retry
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  retryDelay: 1500,
  retryStatuses: [503],
};

/**
 * Pausa la ejecución por el tiempo especificado
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Determina si un error debe ser reintentado
 */
const shouldRetry = (status, attempt, maxRetries) => {
  return attempt < maxRetries && RETRY_CONFIG.retryStatuses.includes(status);
};

export default async function request(endpoint, { method = 'GET', body = null, headers = {}, signal, isMultipart = false, skipRetry = false } = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const opts = { method, headers: { ...headers }, signal };
  const hadAuthToken = !!token;

  if (token) opts.headers.Authorization = `Bearer ${token}`;

  if (body) {
    if (isMultipart) {
      opts.body = body;
    } else {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
  }

  let lastError = null;
  let attempt = 0;

  while (attempt <= RETRY_CONFIG.maxRetries) {
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
        const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/login') || endpoint.includes('/register');

        if (res.status === 503 && !skipRetry && shouldRetry(res.status, attempt, RETRY_CONFIG.maxRetries)) {
          attempt++;
          console.warn(`🔄 Reintentando request a ${endpoint} (intento ${attempt}/${RETRY_CONFIG.maxRetries + 1}) - Error 503`);

          if (attempt <= RETRY_CONFIG.maxRetries) {
            await delay(RETRY_CONFIG.retryDelay * attempt);
            continue;
          }

          console.error(`❌ Todos los reintentos fallaron para ${endpoint}`);

          if (authHandlers && authHandlers.handleAuthError && hadAuthToken && !isAuthEndpoint) {
            authHandlers.handleAuthError(res.status, 'El servicio no está disponible después de varios intentos. Tu sesión se cerrará por seguridad.', endpoint, hadAuthToken);
          }
        } else if ((res.status === 401 || res.status === 403) && !skipRetry) {
          if (authHandlers && authHandlers.handleAuthError && hadAuthToken && !isAuthEndpoint) {
            authHandlers.handleAuthError(res.status, data?.message || 'Sesión invalidada', endpoint, hadAuthToken);
          }
        } else if (res.status === 500 && !skipRetry) {
          if (authHandlers && authHandlers.handleAuthError && hadAuthToken && !isAuthEndpoint) {
            authHandlers.handleAuthError(res.status, data?.message || 'Error interno del servidor', endpoint, hadAuthToken);
          }
        }

        const err = new Error(data?.message || res.statusText);
        err.status = res.status;
        throw err;
      }

      if (attempt > 0) {
        console.log(`✅ Request exitoso a ${endpoint} después de ${attempt} reintentos`);
      }

      return data;
    } catch (error) {
      lastError = error;

      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        if (!skipRetry && shouldRetry(503, attempt, RETRY_CONFIG.maxRetries)) {
          attempt++;
          console.warn(`🔄 Reintentando por error de red (intento ${attempt}/${RETRY_CONFIG.maxRetries + 1})`);

          if (attempt <= RETRY_CONFIG.maxRetries) {
            await delay(RETRY_CONFIG.retryDelay * attempt);
            continue;
          }
        }

        const networkError = new Error('Error de conexión. Verifica tu conexión a internet.');
        networkError.status = 0;
        throw networkError;
      }

      if (error.status && !skipRetry && shouldRetry(error.status, attempt, RETRY_CONFIG.maxRetries)) {
        attempt++;
        console.warn(`🔄 Reintentando por error ${error.status} (intento ${attempt}/${RETRY_CONFIG.maxRetries + 1})`);

        if (attempt <= RETRY_CONFIG.maxRetries) {
          await delay(RETRY_CONFIG.retryDelay * attempt);
          continue;
        }
      }

      throw lastError;
    }
  }

  throw lastError || new Error('Error inesperado en request');
}

/**
 * Función de utilidad para hacer requests sin retry automático
 */
export const requestWithoutRetry = (endpoint, options = {}) => {
  return request(endpoint, { ...options, skipRetry: true });
};

/**
 * Función de utilidad para verificar la salud del servidor
 */
export const healthCheck = async () => {
  try {
    const response = await requestWithoutRetry('/health/ping');
    return { healthy: true, response };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
};

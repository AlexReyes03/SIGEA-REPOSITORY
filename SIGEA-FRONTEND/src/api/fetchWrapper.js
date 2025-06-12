import { BASE_URL } from './common-url';

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

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

import { BASE_URL } from './common-url';

export default async function request(
  endpoint,
  {
    method = 'GET',
    body = null,
    headers = {},
    signal = undefined,
  } = {}
) {
  const url = `${BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');

  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    signal,
  };

  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const error = data?.message || res.statusText;
    throw new Error(error);
  }

  return data;
}

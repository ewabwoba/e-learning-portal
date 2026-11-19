import { getToken } from './session';

export class ApiError extends Error {
  constructor(message, status = 500, fields = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

const BASE = import.meta.env.VITE_API_URL || '/api';

export async function http(path, { method = 'GET', body, auth = true, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, signal, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError('We could not reach the server. Check your connection and try again.', 0);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || 'Something went wrong. Please try again.', res.status, data?.fields || {});
  return data;
}

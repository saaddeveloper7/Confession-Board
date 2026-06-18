import { getToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // body wasn't JSON — keep generic message
    }
    throw new Error(message);
  }
  return res.json();
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authedFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {}),
    ...authHeaders(),
  };
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

export async function getAllConfessions() {
  const res = await authedFetch('/api/confessions', { cache: 'no-store' });
  return handle(res);
}

export async function getConfessionById(id) {
  const res = await authedFetch(`/api/confessions/${id}`, { cache: 'no-store' });
  return handle(res);
}

export async function createConfession({ content, category }) {
  const res = await authedFetch('/api/confessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, category }),
  });
  return handle(res);
}

export async function deleteConfession(id) {
  const res = await authedFetch(`/api/confessions/${id}`, {
    method: 'DELETE',
  });
  return handle(res);
}

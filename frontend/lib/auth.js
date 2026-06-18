const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = 'auth_token';

async function handle(res) {
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // not JSON
    }
    throw new Error(message);
  }
  return res.json();
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function logout() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

export async function register({ email, username, password }) {
  const res = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, username, password }),
  });
  const data = await handle(res);
  if (data?.token) setToken(data.token);
  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await handle(res);
  if (data?.token) setToken(data.token);
  return data;
}

export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return handle(res);
}

export async function verifyResetToken(token) {
  try {
    const res = await fetch(
      `${API_URL}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' }
    );
    return await handle(res);
  } catch (err) {
    return { valid: false, error: err.message || 'Invalid or expired reset link' };
  }
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return handle(res);
}

export async function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (res.status === 401) {
    logout();
    return null;
  }

  const data = await handle(res);
  return data?.user || null;
}

export async function getPublicProfile(username) {
  const res = await fetch(`${API_URL}/api/users/${encodeURIComponent(username)}`, {
    cache: 'no-store',
  });
  const data = await handle(res);
  return data?.user || null;
}

export async function updateMyProfile({ username, bio }) {
  const token = getToken();
  if (!token) throw new Error('Not logged in');

  const body = {};
  if (username !== undefined) body.username = username;
  if (bio !== undefined) body.bio = bio;

  const res = await fetch(`${API_URL}/api/users/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await handle(res);
  return data?.user || null;
}

export async function changeMyPassword({ currentPassword, newPassword }) {
  const token = getToken();
  if (!token) throw new Error('Not logged in');

  const res = await fetch(`${API_URL}/api/users/me/change-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  return handle(res);
}

export async function uploadMyAvatar(fileObject) {
  const token = getToken();
  if (!token) throw new Error('Not logged in');

  const formData = new FormData();
  formData.append('avatar', fileObject);

  const res = await fetch(`${API_URL}/api/users/me/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handle(res);
}

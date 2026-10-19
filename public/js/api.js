/**
 * api.js — thin fetch wrapper that attaches the JWT automatically.
 * All modules import from this file.
 */
const API = (() => {
  const BASE = '/api';

  function getToken() { return localStorage.getItem('blyart_token'); }
  function setToken(t) { localStorage.setItem('blyart_token', t); }
  function clearToken() { localStorage.removeItem('blyart_token'); localStorage.removeItem('blyart_user'); }
  function getUser() {
    try { return JSON.parse(localStorage.getItem('blyart_user')); } catch { return null; }
  }
  function setUser(u) { localStorage.setItem('blyart_user', JSON.stringify(u)); }

  async function request(method, path, body) {
    const token = getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();

    // Token expired or invalid → force logout
    if (res.status === 401) {
      clearToken();
      window.location.reload();
    }

    if (!data.success) throw new Error(data.message || 'Request failed');
    return data;
  }

  return {
    get:    (path)        => request('GET',    path),
    post:   (path, body)  => request('POST',   path, body),
    put:    (path, body)  => request('PUT',    path, body),
    delete: (path)        => request('DELETE', path),
    getToken, setToken, clearToken, getUser, setUser,
  };
})();

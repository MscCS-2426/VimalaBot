// src/services/api.js
// All calls to FastAPI backend at /api/v1

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

function getToken() {
  return sessionStorage.getItem('adminToken');
}

function authHeaders(isMultipart = false) {
  const token = getToken();
  const headers = {};
  if (!isMultipart) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── CHAT ─────────────────────────────────────────
// POST /chat/  → { response, session_id, sources }
export async function sendChat(message, sessionId = null, collectionName = 'default') {
  return apiFetch('/chat/', {
    method: 'POST',
    body: JSON.stringify({
      message,
      session_id: sessionId || undefined,
      collection_name: collectionName,
    }),
  });
}

// POST /chat/session → { session_id, created_at }
export async function createSession() {
  return apiFetch('/chat/session', {
    method: 'POST',
    body: JSON.stringify({ user_id: null, metadata: {} }),
  });
}

// GET /chat/sessions → { total_sessions, sessions: [...] }
export async function listSessions() {
  return apiFetch('/chat/sessions');
}

// DELETE /chat/session/{id}
export async function deleteSession(sessionId) {
  return apiFetch(`/chat/session/${sessionId}`, { method: 'DELETE' });
}

// GET /chat/history/{session_id} → { session_id, history: [...] }
export async function getChatHistory(sessionId) {
  return apiFetch(`/chat/history/${sessionId}`);
}

// ── ADMIN AUTH ────────────────────────────────────
// POST /admin/login → { access_token, token_type }
export async function adminLogin(username, password) {
  const res = await fetch(`${API_BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid credentials');
  }
  return res.json();
}

// GET /admin/status → { message, admin }
export async function adminStatus() {
  return apiFetch('/admin/status');
}

// ── DOCUMENTS ─────────────────────────────────────
// POST /documents/upload  (multipart)
export async function uploadDocument(file, collectionName = 'default') {
  const form = new FormData();
  form.append('file', file);
  form.append('collection_name', collectionName);
  form.append('metadata', '{}');
  const token = getToken();
  const res = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Upload failed');
  }
  return res.json();
}

// POST /documents/embed → embed raw text
export async function embedText(content, source = 'manual', collectionName = 'default') {
  return apiFetch(`/documents/embed?collection_name=${encodeURIComponent(collectionName)}`, {
    method: 'POST',
    body: JSON.stringify({ content, metadata: { source } }),
  });
}

// GET /documents/?collection_name=&limit=
export async function listDocuments(collectionName = 'default', limit = 100) {
  return apiFetch(`/documents/?collection_name=${encodeURIComponent(collectionName)}&limit=${limit}`);
}

// DELETE /documents/{id}?collection_name=
export async function deleteDocument(docId, collectionName = 'default') {
  return apiFetch(
    `/documents/${docId}?collection_name=${encodeURIComponent(collectionName)}`,
    { method: 'DELETE' }
  );
}

// GET /documents/collections/list → { collections: [...] }
export async function listCollections() {
  return apiFetch('/documents/collections/list');
}

// POST /documents/collections/create
export async function createCollection(name) {
  return apiFetch('/documents/collections/create', {
    method: 'POST',
    body: JSON.stringify({ name, metadata: {}, overwrite: false }),
  });
}

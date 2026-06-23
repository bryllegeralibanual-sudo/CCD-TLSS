const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.detail || `Request failed (${res.status})`)
  }
  return data
}

export function getMetadata(token) {
  return request('/data/metadata', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function createAssignment(payload, token) {
  return request('/data/assignments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function withdrawAssignment(id, token) {
  return request(`/data/assignments/${id}/withdraw`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
}

export function approveAssignment(id, payload, token) {
  return request(`/data/assignments/${id}/approve`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function rejectAssignment(id, payload, token) {
  return request(`/data/assignments/${id}/reject`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function finalizeTerm(payload, token) {
  return request('/data/terms/finalize', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

export function reopenTerm(payload, token) {
  return request('/data/terms/reopen', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

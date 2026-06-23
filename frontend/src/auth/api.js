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

export function login(email, password) {
  return request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
}

export function register(payload) {
  return request('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function me(token) {
  return request('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
}

export function logout(token) {
  return request('/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
}

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api'

async function request(path, options = {}) {
  const token = sessionStorage.getItem('aquachile-token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.detail || 'No fue posible completar la operación')
  return data
}

async function download(path) {
  const token = sessionStorage.getItem('aquachile-token')
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'No fue posible descargar el archivo')
  }
  return response.blob()
}

export const api = {
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  createApplication: (formData) => request('/postulaciones', { method: 'POST', body: formData }),
  listApplications: () => request('/postulaciones'),
  getApplication: (id) => request(`/postulaciones/${id}`),
  downloadCv: (id) => download(`/postulaciones/${id}/cv`),
  updateEvaluation: (id, values) => request(`/postulaciones/${id}/evaluacion`, { method: 'PATCH', body: JSON.stringify(values) }),
  getSummary: () => request('/dashboard/resumen'),
}


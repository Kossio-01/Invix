'use client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const SESSION_KEY = 'invix_session';

export function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); }
  catch { return null; }
}
export function saveSession(payload) {
  const token = payload.token || payload.accessToken || payload.access_token;
  if (!token) throw new Error('El servidor no devolvió un token de acceso.');
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, user: payload.user || null }));
}
export function clearSession() { sessionStorage.removeItem(SESSION_KEY); }

export async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getSession()?.token;
    if (!token) throw new Error('Inicia sesión para continuar.');
    headers.Authorization = `Bearer ${token}`;
  }
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch { throw new Error('No se pudo conectar con el servidor. Revisa que esté encendido.'); }
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
  if (!response.ok) {
    if (response.status === 401 && auth) clearSession();
    const error = data?.message || data?.error || `Error del servidor (${response.status}).`;
    const requestError = new Error(typeof error === 'string' ? error : 'No se pudo completar la operación.');
    requestError.status = response.status;
    throw requestError;
  }
  return data;
}
export const login = (credentials) => apiRequest('/api/auth/login', { method: 'POST', body: credentials });
export const register = (user) => apiRequest('/api/auth/register', { method: 'POST', body: user });
export const getProfile = () => apiRequest('/api/auth/me', { auth: true });
export const getHealth = () => apiRequest('/health');
export const getProducts = () => apiRequest('/api/productos', { auth: true });
export const createProduct = (product) => apiRequest('/api/productos', { method: 'POST', body: product, auth: true });
export const updateProduct = (id, product) => apiRequest(`/api/productos/${id}`, { method: 'PUT', body: product, auth: true });
export const deleteProduct = (id) => apiRequest(`/api/productos/${id}`, { method: 'DELETE', auth: true });
export const getAuditLogs = (limit = 50) => apiRequest(`/api/auditoria?limit=${limit}`, { auth: true });
export const getCompanySummary = () => apiRequest('/api/dashboard/resumen', { auth: true });
export const getPlans = () => apiRequest('/api/planes');
export const getSubscription = () => apiRequest('/api/suscripcion', { auth: true });
export const changeSubscriptionPlan = (planCodigo) => apiRequest('/api/suscripcion', {
  method: 'PUT',
  body: { planCodigo },
  auth: true,
});
export const cancelSubscription = () => apiRequest('/api/suscripcion/cancelar', {
  method: 'POST',
  auth: true,
});
export const getCollaborators = () => apiRequest('/api/colaboradores', { auth: true });
export const inviteCollaborator = (data) => apiRequest('/api/colaboradores/invitaciones', {
  method: 'POST', body: data, auth: true,
});
export const updateCollaboratorRole = (id, rol) => apiRequest(`/api/colaboradores/${id}/rol`, {
  method: 'PATCH', body: { rol }, auth: true,
});
export const removeCollaborator = (id) => apiRequest(`/api/colaboradores/${id}`, {
  method: 'DELETE', auth: true,
});
export const cancelCollaboratorInvitation = (id) => apiRequest(`/api/colaboradores/invitaciones/${id}`, {
  method: 'DELETE', auth: true,
});
export const acceptCollaboratorInvitation = (token, data) => apiRequest(`/api/invitaciones/${token}/aceptar`, {
  method: 'POST', body: data,
});

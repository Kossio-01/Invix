// Ajustar estas rutas con el responsable del backend si su API usa otros nombres.
const API_BASE_URL = window.INVIX_API_URL || 'http://localhost:4000';
const API_ROUTES = Object.freeze({
  login: '/api/auth/login',
  register: '/api/auth/register',
  me: '/api/auth/me'
});
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
    throw new Error(typeof error === 'string' ? error : 'No se pudo completar la operación.');
  }
  return data;
}
export const login = (credentials) => apiRequest(API_ROUTES.login, { method: 'POST', body: credentials });
export const register = (user) => apiRequest(API_ROUTES.register, { method: 'POST', body: user });
export const getProfile = () => apiRequest(API_ROUTES.me, { auth: true });

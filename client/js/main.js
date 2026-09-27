import { clearSession, getProfile, getSession, login, register, saveSession } from './api.js';

const page = document.body.dataset.page;
const status = document.querySelector('[data-status]');
function message(text, kind = 'error') {
  if (!status) return;
  status.textContent = text;
  status.dataset.kind = kind;
  status.hidden = false;
}
function pending(form, active) {
  const button = form.querySelector('button[type="submit"]');
  button.disabled = active;
  button.textContent = active ? 'Espera un momento...' : button.dataset.label;
}
function showDashboard(user) {
  document.querySelector('[data-public]')?.setAttribute('hidden', '');
  const dashboard = document.querySelector('[data-dashboard]');
  if (!dashboard) return;
  dashboard.hidden = false;
  document.querySelector('[data-username]').textContent = user?.name || user?.nombre || user?.email || 'usuario';
}
if (page === 'home') {
  const session = getSession();
  if (session) {
    showDashboard(session.user);
    getProfile().then(data => showDashboard(data?.user || data || session.user)).catch(() => {
      clearSession();
      location.replace('./login.html');
    });
  } else if (new URLSearchParams(location.search).has('dashboard')) {
    location.replace('./login.html');
  }
  document.querySelector('[data-logout]')?.addEventListener('click', () => {
    clearSession();
    location.replace('./login.html');
  });
}
if (page === 'login' || page === 'register') {
  if (getSession()) location.replace('./index.html');
  const form = document.querySelector('form[data-auth-form]');
  const button = form.querySelector('button[type="submit"]');
  button.dataset.label = button.textContent;
  const fields = [...form.querySelectorAll('input')];
  const errorMessage = field => {
    if (field.validity.valueMissing) return 'Este campo es obligatorio.';
    if (field.validity.typeMismatch) return 'Ingresa un correo electrónico válido.';
    if (field.validity.tooShort) return `Usa al menos ${field.minLength} caracteres.`;
    if (field.name === 'confirmPassword' && field.value !== form.elements.password.value) return 'Las contraseñas no coinciden.';
    return '';
  };
  const validateField = field => {
    const error = field.closest('form').querySelector(`#${field.id}-error`);
    const text = errorMessage(field);
    field.classList.add('touched');
    if (error) {
      error.textContent = text;
      error.hidden = !text;
    }
    field.setAttribute('aria-invalid', String(Boolean(text)));
    return !text;
  };
  fields.forEach(field => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('touched')) validateField(field);
    });
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) return;
    const values = Object.fromEntries(new FormData(form));
    if (page === 'register' && values.password !== values.confirmPassword) {
      message('Las contraseñas no coinciden.');
      return;
    }
    delete values.confirmPassword;
    status.hidden = true;
    pending(form, true);
    try {
      if (page === 'register') {
        await register(values);
        location.replace('./login.html?registered=1');
      } else {
        saveSession(await login(values));
        location.replace('./index.html?dashboard=1');
      }
    } catch (error) { message(error.message); }
    finally { pending(form, false); }
  });
  if (page === 'login' && new URLSearchParams(location.search).has('registered')) {
    message('Cuenta creada. Ahora puedes iniciar sesión.', 'success');
  }
}

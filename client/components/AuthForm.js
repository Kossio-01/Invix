'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { login, register, saveSession } from '../js/api';

function getError(field, values) {
  if (!values[field]) return 'Este campo es obligatorio.';
  if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) return 'Ingresa un correo electrónico válido.';
  if (field === 'password' && values.password.length < 8) return 'Usa al menos 8 caracteres.';
  if (field === 'confirmPassword' && values.password !== values.confirmPassword) return 'Las contraseñas no coinciden.';
  return '';
}

export default function AuthForm({ page }) {
  const isRegister = page === 'register';
  const [values, setValues] = useState({ nombre: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({});
  const [status, setStatus] = useState(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!isRegister && new URLSearchParams(window.location.search).has('registered')) {
      setStatus({ text: 'Cuenta creada. Ahora puedes iniciar sesión.', kind: 'success' });
    }
  }, [isRegister]);

  function update(event) {
    const { name, value } = event.target;
    setValues(current => ({ ...current, [name]: value }));
    setTouched(current => ({ ...current, [name]: true }));
  }

  async function submit(event) {
    event.preventDefault();
    const fields = isRegister ? ['nombre', 'email', 'password', 'confirmPassword'] : ['email', 'password'];
    setTouched(Object.fromEntries(fields.map(field => [field, true])));
    if (fields.some(field => getError(field, values))) return;
    setPending(true);
    setStatus(null);
    try {
      if (isRegister) {
        await register({ nombre: values.nombre, email: values.email, password: values.password });
        window.location.replace('/login?registered=1');
      } else {
        saveSession(await login({ email: values.email, password: values.password }));
        window.location.replace('/?dashboard=1');
      }
    } catch (error) {
      setStatus({ text: error.message, kind: 'error' });
    } finally {
      setPending(false);
    }
  }

  const field = (name, label, type, autocomplete, options = {}) => {
    const error = touched[name] ? getError(name, values) : '';
    return <div key={name}>
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} value={values[name]} onChange={update}
        onBlur={() => setTouched(current => ({ ...current, [name]: true }))}
        autoComplete={autocomplete} required aria-invalid={Boolean(error)} aria-describedby={`${name}-error`} {...options} />
      <span className="error-msg" id={`${name}-error`} hidden={!error}>{error}</span>
    </div>;
  };

  return <>
    <p className="eyebrow">{isRegister ? 'Empieza con Invix' : 'Bienvenido de nuevo'}</p>
    <h1>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h1>
    <p>{isRegister ? 'Completa los datos para registrarte.' : 'Ingresa tus datos para acceder a Invix.'}</p>
    {status && <p className="status" role="alert" data-kind={status.kind}>{status.text}</p>}
    <form onSubmit={submit} noValidate>
      {isRegister && field('nombre', 'Nombre completo', 'text', 'name', { minLength: 2, maxLength: 100 })}
      {field('email', 'Correo electrónico', 'email', 'email', { maxLength: 254 })}
      {field('password', 'Contraseña', 'password', isRegister ? 'new-password' : 'current-password', { minLength: 8 })}
      {isRegister && field('confirmPassword', 'Confirmar contraseña', 'password', 'new-password', { minLength: 8 })}
      <button type="submit" className="button full" disabled={pending}>{pending ? 'Espera un momento...' : isRegister ? 'Registrarme' : 'Ingresar'}</button>
    </form>
    <p className="auth-switch">{isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
      <Link href={isRegister ? '/login' : '/register'}>{isRegister ? 'Inicia sesión' : 'Regístrate'}</Link>
    </p>
  </>;
}

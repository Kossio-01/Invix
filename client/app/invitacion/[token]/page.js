'use client';

import { useState } from 'react';
import { acceptCollaboratorInvitation } from '../../../js/api';

export default function InvitationPage({ params }) {
  const [form, setForm] = useState({ nombre: '', password: '', confirmacion: '' });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setPending(true);
    setError('');
    try {
      const response = await acceptCollaboratorInvitation(params.token, { nombre: form.nombre, password: form.password });
      setNotice(response.message || 'Invitación aceptada. Ya puedes iniciar sesión.');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  return <main className="invitation-page"><section className="auth-card">
    <p className="eyebrow">Invitación de equipo</p><h1>Únete a Invix</h1>
    <p>Completa tus datos para activar tu acceso a la empresa.</p>
    {error && <p className="status" data-kind="error" role="alert">{error}</p>}
    {notice ? <><p className="status" data-kind="success" role="status">{notice}</p><a className="button full" href="/login">Ir a iniciar sesión</a></> :
      <form className="auth-form" onSubmit={submit}>
        <label>Nombre<input value={form.nombre} onChange={event => setForm({ ...form, nombre: event.target.value })} required minLength={2} maxLength={100} /></label>
        <label>Contraseña<input type="password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} required minLength={8} maxLength={72} /></label>
        <label>Repetir contraseña<input type="password" value={form.confirmacion} onChange={event => setForm({ ...form, confirmacion: event.target.value })} required /></label>
        <button className="button full" disabled={pending}>{pending ? 'Activando...' : 'Aceptar invitación'}</button>
      </form>}
  </section></main>;
}

'use client';

import { useEffect, useState } from 'react';
import BackToDashboard from '../../../components/BackToDashboard';
import SiteFooter from '../../../components/SiteFooter';
import SiteHeader from '../../../components/SiteHeader';
import {
  cancelCollaboratorInvitation, clearSession, getCollaborators, getProfile, getSession,
  inviteCollaborator, removeCollaborator, updateCollaboratorRole,
} from '../../../js/api';

const roleLabels = { ADMIN: 'Administrador', JEFE_GESTION: 'Jefe de gestión', AYUDANTE: 'Ayudante', CLIENTE: 'Cliente' };

export default function CollaboratorsPage() {
  const [session, setSession] = useState(null);
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [form, setForm] = useState({ email: '', rol: 'AYUDANTE' });
  const [latestLink, setLatestLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadCollaborators() {
    setError('');
    const response = await getCollaborators();
    setMembers(response.data?.miembros || []);
    setInvitations(response.data?.invitaciones || []);
  }

  useEffect(() => {
    const current = getSession();
    if (!current) {
      window.location.replace('/login');
      return;
    }
    setSession(current);
    Promise.all([getProfile(), getCollaborators()])
      .then(([profile, response]) => {
        setSession({ ...current, user: profile?.user || current.user });
        setMembers(response.data?.miembros || []);
        setInvitations(response.data?.invitaciones || []);
      })
      .catch(requestError => {
        if (requestError.status === 401) {
          clearSession();
          window.location.replace('/login');
          return;
        }
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  async function submitInvitation(event) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError('');
    setNotice('');
    setLatestLink('');
    try {
      const response = await inviteCollaborator(form);
      const link = `${window.location.origin}/invitacion/${response.data.token}`;
      setLatestLink(link);
      setNotice('Invitación creada. Comparte el enlace con el colaborador.');
      setForm({ email: '', rol: 'AYUDANTE' });
      await loadCollaborators();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function changeRole(member, rol) {
    if (pending || member.rol === rol) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const response = await updateCollaboratorRole(member.id, rol);
      setNotice(response.message || 'Rol actualizado correctamente.');
      await loadCollaborators();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function removeMember(member) {
    if (pending || !window.confirm(`¿Eliminar a ${member.nombre} de la empresa?`)) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const response = await removeCollaborator(member.id);
      setNotice(response.message || 'Colaborador eliminado correctamente.');
      await loadCollaborators();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function cancelInvitation(invitation) {
    if (pending || !window.confirm(`¿Cancelar la invitación para ${invitation.email}?`)) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const response = await cancelCollaboratorInvitation(invitation.id);
      setNotice(response.message || 'Invitación cancelada correctamente.');
      await loadCollaborators();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(latestLink);
    setNotice('Enlace copiado al portapapeles.');
  }

  if (!session) return <p className="page-loading" role="status">Cargando colaboradores...</p>;

  return <>
    <SiteHeader user={session.user} />
    <main>
      <section className="module-page-heading">
        <BackToDashboard />
        <p className="eyebrow">Equipo empresarial</p>
        <h1>Colaboradores de {session.user?.empresa?.nombre || 'tu empresa'}</h1>
        <p>Invita personas y administra sus permisos dentro de la empresa.</p>
      </section>
      {error && <div className="status module-status" data-kind="error" role="alert"><p>{error}</p><button className="button secondary" onClick={loadCollaborators}>Reintentar</button></div>}
      {notice && <p className="status module-status" data-kind="success" role="status">{notice}</p>}
      <section className="collaborator-card">
        <div className="section-heading compact"><p className="eyebrow">Nueva invitación</p><h2>Agregar colaborador</h2></div>
        <form className="collaborator-form" onSubmit={submitInvitation}>
          <label>Correo electrónico<input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} required /></label>
          <label>Rol<select value={form.rol} onChange={event => setForm({ ...form, rol: event.target.value })}><option value="AYUDANTE">Ayudante</option><option value="JEFE_GESTION">Jefe de gestión</option></select></label>
          <button className="button" disabled={pending}>{pending ? 'Enviando...' : 'Crear invitación'}</button>
        </form>
        {latestLink && <div className="invitation-link"><strong>Enlace de invitación</strong><input readOnly value={latestLink} onFocus={event => event.target.select()} /><button className="button small secondary" onClick={copyLink}>Copiar enlace</button><small>La invitación vence en 7 días.</small></div>}
      </section>
      <section className="collaborator-card">
        <div className="section-heading compact"><p className="eyebrow">Acceso actual</p><h2>Miembros del equipo</h2></div>
        {loading ? <p role="status">Consultando colaboradores...</p> : members.length === 0 ? <p className="empty-state">No hay colaboradores activos.</p> :
          <div className="table-wrapper"><table><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Acciones</th></tr></thead><tbody>
            {members.map(member => <tr key={member.id}><td>{member.nombre}</td><td>{member.email}</td><td>{member.rol === 'ADMIN' ? <span className="role-badge">{roleLabels[member.rol]}</span> : <select value={member.rol} onChange={event => changeRole(member, event.target.value)} disabled={pending} aria-label={`Rol de ${member.nombre}`}><option value="AYUDANTE">Ayudante</option><option value="JEFE_GESTION">Jefe de gestión</option></select>}</td><td>{member.rol === 'ADMIN' ? <span className="role-note">Protegido</span> : <button className="button small danger" onClick={() => removeMember(member)} disabled={pending}>Eliminar</button>}</td></tr>)}
          </tbody></table></div>}
      </section>
      <section className="collaborator-card">
        <div className="section-heading compact"><p className="eyebrow">Pendientes</p><h2>Invitaciones enviadas</h2></div>
        {invitations.length === 0 ? <p className="empty-state">No hay invitaciones pendientes.</p> :
          <div className="table-wrapper"><table><thead><tr><th>Correo</th><th>Rol</th><th>Vence</th><th>Acción</th></tr></thead><tbody>
            {invitations.map(invitation => <tr key={invitation.id}><td>{invitation.email}</td><td>{roleLabels[invitation.rol]}</td><td>{new Date(invitation.expira_en).toLocaleDateString('es-CO')}</td><td><button className="button small danger" onClick={() => cancelInvitation(invitation)} disabled={pending}>Cancelar</button></td></tr>)}
          </tbody></table></div>}
      </section>
    </main>
    <SiteFooter user={session.user} />
  </>;
}

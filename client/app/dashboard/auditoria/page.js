'use client';

import { useEffect, useMemo, useState } from 'react';
import BackToDashboard from '../../../components/BackToDashboard';
import SiteFooter from '../../../components/SiteFooter';
import SiteHeader from '../../../components/SiteHeader';
import { clearSession, getAuditLogs, getProfile, getSession } from '../../../js/api';

function formatDate(value) {
  return new Date(value).toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AuditPage() {
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      const response = await getAuditLogs(100);
      setLogs(response.data || []);
    } catch (requestError) {
      if (requestError.status === 401) {
        clearSession();
        window.location.replace('/login');
        return;
      }
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const current = getSession();
    if (!current) {
      window.location.replace('/login');
      return;
    }
    setSession(current);
    Promise.all([getProfile(), getAuditLogs(100)])
      .then(([profile, response]) => {
        setSession({ ...current, user: profile?.user || current.user });
        setLogs(response.data || []);
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

  const entities = useMemo(() => ['TODOS', ...new Set(logs.map(log => log.entidad))], [logs]);
  const visibleLogs = filter === 'TODOS' ? logs : logs.filter(log => log.entidad === filter);

  if (!session) return <p className="page-loading" role="status">Cargando auditoría...</p>;

  return <>
    <SiteHeader user={session.user} />
    <main>
      <section className="module-page-heading">
        <BackToDashboard />
        <p className="eyebrow">Auditoría / Logs</p>
        <h1>Actividad de {session.user?.empresa?.nombre || 'tu empresa'}</h1>
        <p>Consulta las operaciones registradas y conserva la trazabilidad de los cambios.</p>
      </section>
      {error && <div className="status module-status" data-kind="error" role="alert"><p>{error}</p>
        <button className="button secondary" onClick={loadLogs} disabled={loading}>Reintentar</button>
      </div>}
      <section className="audit-card" aria-labelledby="audit-title">
        <div className="audit-toolbar">
          <div className="section-heading compact"><p className="eyebrow">Registro persistido</p><h2 id="audit-title">Últimas operaciones</h2></div>
          <label>Filtrar por entidad
            <select value={filter} onChange={event => setFilter(event.target.value)}>
              {entities.map(entity => <option key={entity} value={entity}>{entity === 'TODOS' ? 'Todas' : entity}</option>)}
            </select>
          </label>
        </div>
        {loading ? <p role="status">Consultando auditoría...</p> : visibleLogs.length === 0 ? <p className="empty-state">No hay operaciones registradas para este filtro.</p> :
          <div className="table-wrapper"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Detalle</th></tr></thead>
            <tbody>{visibleLogs.map(log => <tr key={log.id}>
              <td>{formatDate(log.creado_en)}</td><td>{log.usuario || 'Usuario eliminado'}</td><td><span className="audit-action">{log.accion}</span></td>
              <td>{log.entidad}{log.entidad_id ? ` #${log.entidad_id}` : ''}</td><td><code>{JSON.stringify(log.detalle || {})}</code></td>
            </tr>)}</tbody></table></div>}
      </section>
    </main>
    <SiteFooter user={session.user} />
  </>;
}

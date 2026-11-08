'use client';

import { useEffect, useState } from 'react';
import { getHealth, getSubscription } from '../js/api';

export default function SystemHealth({ maxUsers: initialMaxUsers, usedUsers = 1 }) {
  const [health, setHealth] = useState({ loading: true, online: false, database: false });
  const [maxUsers, setMaxUsers] = useState(initialMaxUsers);
  const nearLimit = maxUsers && usedUsers / maxUsers >= .8;

  useEffect(() => {
    let active = true;
    Promise.all([getHealth(), getSubscription()])
      .then(([healthData, subscriptionData]) => {
        if (!active) return;
        setHealth({ loading: false, online: true, database: healthData?.database === 'connected' });
        setMaxUsers(subscriptionData?.data?.max_usuarios || subscriptionData?.data?.plan?.max_usuarios);
      })
      .catch(() => {
        if (active) setHealth({ loading: false, online: false, database: false });
      });
    return () => { active = false; };
  }, []);

  return <section className="system-health" aria-labelledby="system-health-title">
    <div className="section-heading compact"><p className="eyebrow">Estado del sistema</p><h2 id="system-health-title">Invix en tiempo real</h2></div>
    <div className="health-row"><span className={`health-dot ${health.online ? 'online' : ''}`} aria-hidden="true" />
      <span>API Backend</span><strong>{health.loading ? 'Comprobando...' : health.online ? 'Online' : 'Sin conexión'}</strong></div>
    <div className="health-row"><span className={`health-dot ${health.database ? 'online' : ''}`} aria-hidden="true" />
      <span>Base de datos</span><strong>{health.loading ? 'Comprobando...' : health.database ? 'Conectada' : 'No disponible'}</strong></div>
    {nearLimit && <p className="limit-alert" role="status">Estás cerca de alcanzar el límite de tu plan.</p>}
  </section>;
}

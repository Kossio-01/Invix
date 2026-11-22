'use client';

import { useEffect, useState } from 'react';
import { getHealth } from '../js/api';

export default function SystemHealth() {
  const [health, setHealth] = useState({ loading: true, online: false, database: false });

  useEffect(() => {
    let active = true;
    Promise.all([getHealth()])
      .then(([healthData]) => {
        if (!active) return;
        setHealth({ loading: false, online: true, database: healthData?.database === 'connected' });
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
  </section>;
}

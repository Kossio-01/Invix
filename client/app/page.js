'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import SiteFooter from '../components/SiteFooter';
import SiteHeader from '../components/SiteHeader';
import { clearSession, getProfile, getSession } from '../js/api';

export default function HomePage() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    const current = getSession();
    if (!current) return;
    setSession(current);
    getProfile().then(data => setSession({ ...current, user: data?.user || current.user })).catch(() => {
      clearSession();
      window.location.replace('/login');
    });
  }, []);

  return <>
    <SiteHeader />
    {!session ? <main>
      <section className="hero">
        <div><p className="eyebrow">Tu negocio, una plataforma</p><h1>Administra tu empresa con Invix</h1>
          <p>Elige el plan adecuado para tu negocio y accede a una plataforma diseñada para organizar tu operación.</p>
          <div className="actions"><Link className="button" href="/register">Comenzar</Link><Link className="button secondary" href="/login">Ya tengo cuenta</Link></div>
        </div>
        <div className="hero-card-position"><div className="hero-card"><img src="/assets/invix-dashboard-preview.jpg" alt="Invix Dashboard Preview" className="dashboard-img" />
          <div className="floating-stock"><strong>Acceso seguro</strong><b>24/7</b><span /></div>
          <div className="floating-barcode"><small>Nombre</small><strong>Cajas de carga</strong><i>|||| |||| |||||</i></div>
        </div></div>
      </section>
      <section className="features"><div className="section-heading"><p className="eyebrow">Todo lo que necesitas</p><h2>Una operación que fluye mejor</h2><p>Centraliza la información y toma decisiones con una vista clara de cada movimiento.</p></div>
        <div className="feature-grid"><article className="feature-card"><span className="feature-icon" aria-hidden="true">▣</span><h3>Planes para cada negocio</h3><p>Empieza con el plan que se adapte al tamaño y las necesidades de tu empresa.</p></article>
          <article className="feature-card"><span className="feature-icon" aria-hidden="true">⌁</span><h3>Acceso seguro</h3><p>Tu empresa y sus usuarios acceden de forma segura al programa contratado.</p></article>
          <article className="feature-card"><span className="feature-icon" aria-hidden="true">↗</span><h3>Crece con Invix</h3><p>Amplía tu plan cuando tu negocio necesite más capacidad y usuarios.</p></article>
        </div>
      </section>
      <section className="metrics" aria-label="Métricas de Invix"><div><strong>3</strong><span>planes disponibles</span></div><div><strong>SEGURA</strong><span>gestión de acceso</span></div><div><strong>24/7</strong><span>plataforma disponible</span></div></section>
    </main> : <main><section className="dashboard"><p className="eyebrow">Área privada</p><h1>Bienvenido, {session.user?.nombre || session.user?.email || 'usuario'}</h1>
      <p>Tu suscripción está activa. Desde aquí tendrás acceso al programa y a las funciones incluidas en tu plan.</p>
      <button type="button" className="button secondary" onClick={() => { clearSession(); window.location.replace('/login'); }}>Cerrar sesión</button>
    </section></main>}
    <SiteFooter />
  </>;
}

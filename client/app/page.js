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
        <div><p className="eyebrow">Inventario y pedidos en un solo lugar</p><h1>Organiza tu inventario con Invix</h1>
          <p>Consulta tus productos, gestiona tus movimientos y mantén tus pedidos bajo control desde una misma plataforma.</p>
          <div className="actions"><Link className="button" href="/register">Comenzar</Link><Link className="button secondary" href="/login">Ya tengo cuenta</Link></div>
        </div>
        <div className="hero-card-position"><div className="hero-card"><img src="/assets/invix-dashboard-preview.jpg" alt="Invix Dashboard Preview" className="dashboard-img" />
          <div className="floating-stock"><strong>Calidad esperada</strong><b>85</b><span /></div>
          <div className="floating-barcode"><small>Nombre</small><strong>Cajas de carga</strong><i>|||| |||| |||||</i></div>
        </div></div>
      </section>
      <section className="features"><div className="section-heading"><p className="eyebrow">Todo lo que necesitas</p><h2>Una operación que fluye mejor</h2><p>Centraliza la información y toma decisiones con una vista clara de cada movimiento.</p></div>
        <div className="feature-grid"><article className="feature-card"><span className="feature-icon" aria-hidden="true">▣</span><h3>Control de stock</h3><p>Conoce existencias, ubicaciones y movimientos en tiempo real.</p></article>
          <article className="feature-card"><span className="feature-icon" aria-hidden="true">⌁</span><h3>Alertas inteligentes</h3><p>Anticípate al desabastecimiento con avisos oportunos.</p></article>
          <article className="feature-card"><span className="feature-icon" aria-hidden="true">↗</span><h3>Gestión de pedidos</h3><p>Organiza órdenes y consulta su estado desde un solo lugar.</p></article>
        </div>
      </section>
      <section className="metrics" aria-label="Métricas de Invix"><div><strong>+10,000</strong><span>productos gestionados</span></div><div><strong>COMPLETA</strong><span>disponibilidad para ti</span></div><div><strong>24/7</strong><span>información accesible</span></div></section>
    </main> : <main><section className="dashboard"><p className="eyebrow">Área privada</p><h1>Bienvenido, {session.user?.nombre || session.user?.email || 'usuario'}</h1>
      <p>Tu sesión está activa. Aquí se integrarán los módulos de productos, inventario y pedidos cuando el equipo defina sus endpoints.</p>
      <button type="button" className="button secondary" onClick={() => { clearSession(); window.location.replace('/login'); }}>Cerrar sesión</button>
    </section></main>}
    <SiteFooter />
  </>;
}

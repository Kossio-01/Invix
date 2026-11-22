'use client';

import Link from 'next/link';
import { clearSession } from '../js/api';

export default function SiteHeader({ user = null }) {
  const homeHref = user ? '/dashboard' : '/';

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href={homeHref} aria-label={user ? 'Invix, dashboard' : 'Invix, inicio'}>
          <img src="/assets/invix-logo.svg" alt="Invix" />
        </Link>
        <nav aria-label="Navegación principal">
          {user ? <><Link href="/dashboard">Dashboard</Link>
            <Link href="/dashboard#planes">Mi cuenta</Link>
            <button type="button" className="button small" onClick={() => { clearSession(); window.location.replace('/'); }}>Cerrar sesión</button>
          </> : <>
            <Link href="/">Inicio</Link>
            <Link href="/login">Ingresar</Link>
            <Link className="button small" href="/register">Crear cuenta</Link>
          </>}
        </nav>
      </div>
    </header>
  );
}

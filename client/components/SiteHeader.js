'use client';

import Link from 'next/link';
import { clearSession } from '../js/api';

export default function SiteHeader({ user = null }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Invix, inicio">
          <img src="/assets/invix-logo.svg" alt="Invix" />
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          {user ? <><Link href="/dashboard#planes">Planes</Link>
            <button type="button" className="button small" onClick={() => { clearSession(); window.location.replace('/'); }}>Cerrar sesión</button>
          </> : <>
            <Link href="/login">Ingresar</Link>
            <Link className="button small" href="/register">Crear cuenta</Link>
          </>}
        </nav>
      </div>
    </header>
  );
}

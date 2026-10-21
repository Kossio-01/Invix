import Link from 'next/link';

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Invix, inicio">
          <img src="/assets/invix-logo.svg" alt="Invix" />
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/">Inicio</Link>
          <Link href="/login">Ingresar</Link>
          <Link className="button small" href="/register">Crear cuenta</Link>
        </nav>
      </div>
    </header>
  );
}

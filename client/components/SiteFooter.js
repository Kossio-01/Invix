import Link from 'next/link';

export default function SiteFooter({ user = null }) {
  const homeHref = user ? '/dashboard' : '/';

  return (
    <footer>
      <div className="footer-inner">
        <div><Link className="footer-brand" href={homeHref}>Invix</Link><p>Suscripciones y acceso para negocios.</p></div>
        <div className="footer-links"><Link href={homeHref}>{user ? 'Dashboard' : 'Inicio'}</Link>
          {user ? <Link href="/dashboard#planes">Mi cuenta</Link> : <><Link href="/login">Ingresar</Link><Link href="/register">Crear cuenta</Link></>}</div>
        <div className="footer-contact"><span>Contacto</span><a href="mailto:hola@invix.com">hola@invix.com</a></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Invix. Todos los derechos reservados.</span><span>Inventario simple, decisiones claras.</span></div>
    </footer>
  );
}

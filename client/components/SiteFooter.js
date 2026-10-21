import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-inner">
        <div><Link className="footer-brand" href="/">Invix</Link><p>Sistema de inventario y pedidos.</p></div>
        <div className="footer-links"><Link href="/">Inicio</Link><Link href="/login">Ingresar</Link><Link href="/register">Crear cuenta</Link></div>
        <div className="footer-contact"><span>Contacto</span><a href="mailto:hola@invix.com">hola@invix.com</a></div>
      </div>
      <div className="footer-bottom"><span>© 2026 Invix. Todos los derechos reservados.</span><span>Inventario simple, decisiones claras.</span></div>
    </footer>
  );
}

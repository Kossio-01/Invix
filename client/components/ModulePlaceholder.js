import Link from 'next/link';

export default function ModulePlaceholder({ eyebrow, title, description }) {
  return <section className="module-placeholder">
    <Link className="back-link" href="/dashboard"><span className="back-link__arrow" aria-hidden="true">←</span><span>Volver al dashboard</span></Link>
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p>{description}</p>
    <Link className="button" href="/dashboard">Ir al dashboard</Link>
  </section>;
}

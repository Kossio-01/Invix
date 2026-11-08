import Link from 'next/link';

export default function ModulePlaceholder({ eyebrow, title, description }) {
  return <section className="module-placeholder">
    <p className="eyebrow">{eyebrow}</p>
    <h1>{title}</h1>
    <p>{description}</p>
    <Link className="button" href="/dashboard">Volver al dashboard</Link>
  </section>;
}

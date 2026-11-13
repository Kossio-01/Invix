import Link from 'next/link';

export default function BackToDashboard() {
  return <Link className="back-link" href="/dashboard"><span className="back-link__arrow" aria-hidden="true">←</span><span>Volver al dashboard</span></Link>;
}

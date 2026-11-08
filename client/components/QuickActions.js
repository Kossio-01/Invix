import Link from 'next/link';

export default function QuickActions({ summary }) {
  const actions = [
    { href: '/dashboard/productos', icon: '▣', title: 'Inventario / Productos', detail: `${summary?.productos ?? 0} productos registrados` },
    { href: '/dashboard/colaboradores', icon: '◎', title: 'Colaboradores', detail: `${summary?.usuarios ?? 0} de ${summary?.max_usuarios ?? '∞'} usuarios registrados` },
    { href: '/dashboard/auditoria', icon: '◷', title: 'Auditoría / Logs', detail: 'Consulta los cambios de la empresa' },
  ];

  return <section className="quick-actions" aria-labelledby="quick-actions-title">
    <div className="section-heading compact">
      <p className="eyebrow">Accesos rápidos</p>
      <h2 id="quick-actions-title">Módulos principales</h2>
    </div>
    <div className="quick-action-grid">
      {actions.map(action => <article className="quick-action-card" key={action.href}>
        <span className="quick-action-icon" aria-hidden="true">{action.icon}</span>
        <div><h3>{action.title}</h3><p>{action.detail}</p></div>
        <Link className="button secondary" href={action.href}>Abrir módulo</Link>
      </article>)}
    </div>
  </section>;
}

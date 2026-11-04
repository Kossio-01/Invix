'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { cancelSubscription, changeSubscriptionPlan, getPlans, getSubscription } from '../js/api';

const money = value => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', maximumFractionDigits: 0,
}).format(Number(value));
const date = value => value ? new Date(value).toLocaleString('es-CO') : 'Sin fecha';

export default function SubscriptionPanel({ user = null }) {
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [action, setAction] = useState(null);
  const dialog = useRef(null);
  const busy = useRef(false);
  const admin = user?.rol === 'ADMIN';
  const active = subscription?.estado === 'ACTIVA';

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [catalog, current] = await Promise.all([
        getPlans(), user ? getSubscription().catch(err => {
          if (err.status === 404) return { data: null };
          throw err;
        }) : Promise.resolve({ data: null }),
      ]);
      setPlans(catalog.data);
      setSubscription(current.data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [user?.id]);
  useEffect(() => {
    if (action) dialog.current?.showModal();
    else dialog.current?.close();
  }, [action]);

  async function confirm() {
    if (busy.current || !action) return;
    busy.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const result = action.kind === 'cancel'
        ? await cancelSubscription()
        : await changeSubscriptionPlan(action.plan.codigo);
      // Both mutation endpoints return the updated record. Avoid a second
      // request that could make a successful mutation appear to have failed.
      const updated = result.data;
      setSubscription(updated.plan ? {
        ...updated,
        plan_codigo: updated.plan.codigo,
        plan_nombre: updated.plan.nombre,
        precio_mensual: updated.plan.precio_mensual,
        max_usuarios: updated.plan.max_usuarios,
      } : { ...subscription, ...updated });
      setNotice(result.message);
    } catch (err) { setError(err.message); }
    finally {
      setAction(null);
      setPending(false);
      busy.current = false;
    }
  }

  return <section className="subscriptions" id="planes" aria-labelledby="plans-title" aria-busy={loading || pending}>
    <div className="section-heading"><p className="eyebrow">Planes Invix</p>
      <h2 id="plans-title">{user ? 'Tu plan, bajo tu control' : 'Un plan para cada etapa'}</h2>
      <p>Precios mensuales en pesos colombianos. En este MVP los cambios no generan cobros ni renovaciones automáticas.</p>
    </div>
    {loading && <p role="status">Cargando planes y suscripción...</p>}
    {error && <div className="status" data-kind="error" role="alert"><p>{error}</p>
      <button className="button secondary" onClick={load} disabled={pending || loading}>Volver a consultar</button>
    </div>}
    {notice && <p className="status" data-kind="success" role="status">{notice}</p>}
    {!loading && !error && user && <article className="subscription-summary">
      <div><p className="eyebrow">Suscripción de {user.empresa?.nombre || 'tu empresa'}</p>
        <h3>{subscription?.plan_nombre || 'Sin suscripción'}</h3>
        <span className={`plan-badge ${active ? 'is-active' : ''}`}>{subscription?.estado || 'SIN SUSCRIPCIÓN'}</span>
      </div>
      {subscription && <dl><div><dt>Precio mensual del plan</dt><dd>{money(subscription.precio_mensual)}</dd></div>
        <div><dt>Inicio</dt><dd>{date(subscription.inicia_en)}</dd></div>
        {subscription.termina_en && <div><dt>Finalización</dt><dd>{date(subscription.termina_en)}</dd></div>}
      </dl>}
      {admin && active && <button className="button danger" onClick={() => setAction({ kind: 'cancel' })} disabled={pending}>Cancelar suscripción</button>}
      {!active && subscription && <p>Tu suscripción no está activa. {admin ? 'Elige un plan para volver a activarla.' : 'Contacta al administrador de tu empresa.'}</p>}
      {!admin && <p>Solo el administrador de la empresa puede cambiar o cancelar la suscripción.</p>}
    </article>}
    {!loading && !error && <div className="plan-grid">{plans.map(plan => {
      const current = active && subscription?.plan_codigo === plan.codigo;
      return <article className={`plan-card ${current ? 'current-plan' : ''}`} key={plan.codigo}>
        {current && <span className="plan-badge is-active">Tu plan actual</span>}
        <h3>{plan.nombre}</h3><p>{plan.descripcion}</p>
        <p className="plan-price">{money(plan.precio_mensual)}<small> COP / mes</small></p>
        <ul><li>{plan.max_usuarios == null ? 'Usuarios ilimitados' : `Hasta ${plan.max_usuarios} ${Number(plan.max_usuarios) === 1 ? 'usuario' : 'usuarios'}`}</li>
          <li>Acceso a la plataforma Invix</li></ul>
        {!user ? <Link className="button" href="/register">Crear cuenta</Link> :
          <button className={`button ${current ? 'secondary' : ''}`} disabled={!admin || current || pending}
            onClick={() => setAction({ kind: 'change', plan })}>
            {current ? 'Plan actual' : !admin ? 'Solo administrador' : active ? 'Cambiar a este plan' : 'Activar este plan'}
          </button>}
      </article>;
    })}</div>}
    {!loading && !error && plans.length === 0 && <p>No hay planes disponibles en este momento.</p>}
    {!user && !loading && <p className="plan-note">El registro inicia con el plan Básico. Después puedes cambiarlo desde tu cuenta.</p>}
    <dialog ref={dialog} className="subscription-dialog" aria-labelledby="confirmation-title" aria-describedby="confirmation-description"
      onCancel={event => { if (busy.current) event.preventDefault(); else setAction(null); }}>
      <h2 id="confirmation-title">{action?.kind === 'cancel' ? '¿Cancelar suscripción?' : `¿Elegir ${action?.plan.nombre || 'este plan'}?`}</h2>
      <p id="confirmation-description">{action?.kind === 'cancel'
        ? 'La cancelación es inmediata y tu suscripción quedará cancelada. Podrás activar un plan de nuevo desde esta página.'
        : `El plan se activará inmediatamente por ${money(action?.plan.precio_mensual || 0)} COP al mes como precio de referencia. En este MVP no se realizará ningún cobro.`}</p>
      <div className="dialog-actions"><button autoFocus className="button secondary" disabled={pending} onClick={() => setAction(null)}>Volver</button>
        <button className={`button ${action?.kind === 'cancel' ? 'danger' : ''}`} disabled={pending} onClick={confirm}>{pending ? 'Procesando...' : 'Confirmar'}</button></div>
    </dialog>
  </section>;
}

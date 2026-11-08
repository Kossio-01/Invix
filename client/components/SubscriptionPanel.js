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
  const [billingCycle, setBillingCycle] = useState('monthly');
  const dialog = useRef(null);
  const busy = useRef(false);
  const admin = user?.rol === 'ADMIN';
  const active = subscription?.estado === 'ACTIVA';
  const currentPlan = plans.find(plan => plan.codigo === subscription?.plan_codigo);
  const renewalDate = subscription?.inicia_en
    ? new Date(new Date(subscription.inicia_en).setMonth(new Date(subscription.inicia_en).getMonth() + 1))
    : null;

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
      <h2 id="plans-title">{user ? 'Mejora tu plan cuando lo necesites' : 'Un plan para cada etapa'}</h2>
      <p>Compara las opciones disponibles y elige la capacidad que necesita tu empresa.</p>
    </div>
    {loading && <p role="status">Cargando planes y suscripción...</p>}
    {error && <div className="status" data-kind="error" role="alert"><p>{error}</p>
      <button className="button secondary" onClick={load} disabled={pending || loading}>Volver a consultar</button>
    </div>}
    {notice && <p className="status" data-kind="success" role="status">{notice}</p>}
    {!loading && !error && user && <article className="subscription-summary">
      <div className="summary-heading"><div><p className="eyebrow">Suscripción de {user.empresa?.nombre || 'tu empresa'}</p>
        <h3>{subscription?.plan_nombre || 'Sin suscripción'}</h3>
        <span className={`plan-badge ${active ? 'is-active' : ''}`}>{subscription?.estado || 'SIN SUSCRIPCIÓN'}</span>
      </div>
        {admin && active && <button className="button danger" onClick={() => setAction({ kind: 'cancel' })} disabled={pending}>Cancelar suscripción</button>}
      </div>
      <dl><div><dt>Próximo cobro / renovación</dt><dd>{renewalDate ? `Se renueva el ${renewalDate.toLocaleDateString('es-CO')}` : 'Aún no disponible'}</dd></div>
        <div><dt>Método de pago</dt><dd>No registrado en este MVP</dd></div>
        <div><dt>Precio mensual</dt><dd>{subscription ? money(subscription.precio_mensual) : 'Sin suscripción'}</dd></div>
      </dl>
      {!active && subscription && <p>Tu suscripción no está activa. {admin ? 'Elige un plan para volver a activarla.' : 'Contacta al administrador de tu empresa.'}</p>}
      {!admin && <p>Solo el administrador de la empresa puede cambiar o cancelar la suscripción.</p>}
    </article>}
    {!loading && !error && user && <div className="subscription-details">
      <section className="usage-card"><div className="section-heading compact"><p className="eyebrow">Uso del plan</p><h3>Consumo actual</h3></div>
        <div className="usage-item"><div><span>Usuarios utilizados</span><strong>1 {currentPlan?.max_usuarios ? `de ${currentPlan.max_usuarios}` : ''}</strong></div>
          <progress value="1" max={currentPlan?.max_usuarios || 1} /></div>
        <div className="usage-item"><div><span>Registros administrados</span><strong>Disponible próximamente</strong></div><progress value="0" max="100" /></div>
      </section>
      <section className="billing-card"><div className="section-heading compact"><p className="eyebrow">Facturación</p><h3>Historial de recibos</h3></div>
        <p className="empty-state">Todavía no hay facturas porque los pagos reales aún no están habilitados.</p>
      </section>
    </div>}
    {!loading && !error && <div className="billing-cycle"><span>Frecuencia de cobro</span>
      <div className="cycle-toggle" role="group" aria-label="Frecuencia de cobro">
        <button type="button" className={billingCycle === 'monthly' ? 'selected' : ''} onClick={() => setBillingCycle('monthly')}>Mensual</button>
        <button type="button" className={billingCycle === 'annual' ? 'selected' : ''} onClick={() => setBillingCycle('annual')}>Anual <b>20% OFF</b></button>
      </div>
    </div>}
    {!loading && !error && <div className="plan-grid">{plans.map(plan => {
      const current = active && subscription?.plan_codigo === plan.codigo;
      const displayedPrice = billingCycle === 'annual' ? Number(plan.precio_mensual) * 12 * .8 : Number(plan.precio_mensual);
      return <article className={`plan-card ${current ? 'current-plan' : ''}`} key={plan.codigo}>
        {current && <span className="plan-badge is-active">Tu plan actual</span>}
        <h3>{plan.nombre}</h3><p>{plan.descripcion}</p>
        <p className="plan-price">{money(displayedPrice)}<small>{billingCycle === 'annual' ? ' COP / año' : ' COP / mes'}</small></p>
        <ul><li>{plan.max_usuarios == null ? 'Usuarios ilimitados' : `Hasta ${plan.max_usuarios} ${Number(plan.max_usuarios) === 1 ? 'usuario' : 'usuarios'}`}</li>
          <li>Acceso a la plataforma Invix</li></ul>
        {!user ? <Link className="button" href="/register">Crear cuenta</Link> :
          <button className={`button ${current ? 'secondary' : ''}`} disabled={!admin || current || pending}
            onClick={() => setAction({ kind: 'change', plan })}>
            {current ? 'Plan actual' : !admin ? 'Solo administrador' : active ? 'Mejorar plan' : 'Activar este plan'}
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
        : `Vas a cambiar al ${action?.plan.nombre || 'plan seleccionado'} por ${money(action?.plan.precio_mensual || 0)} al mes. En este MVP no se realizará ningún cobro.`}</p>
      <div className="dialog-actions"><button autoFocus className="button secondary" disabled={pending} onClick={() => setAction(null)}>Volver</button>
        <button className={`button ${action?.kind === 'cancel' ? 'danger' : ''}`} disabled={pending} onClick={confirm}>{pending ? 'Procesando...' : action?.kind === 'cancel' ? 'Confirmar cancelación' : 'Confirmar cambio'}</button></div>
    </dialog>
  </section>;
}

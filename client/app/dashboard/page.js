'use client';

import { useEffect, useState } from 'react';
import QuickActions from '../../components/QuickActions';
import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
import SubscriptionPanel from '../../components/SubscriptionPanel';
import SystemHealth from '../../components/SystemHealth';
import { clearSession, getCompanySummary, getProfile, getSession } from '../../js/api';

export default function DashboardPage() {
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const current = getSession();
    if (!current) {
      window.location.replace('/login');
      return;
    }
    setSession(current);
    Promise.all([getProfile(), getCompanySummary()])
      .then(([profile, summaryResponse]) => {
        setSession({ ...current, user: profile?.user || current.user });
        setSummary(summaryResponse?.data || null);
      })
      .catch(() => {
        clearSession();
        window.location.replace('/login');
      });
  }, []);

  if (!session) return <p className="page-loading" role="status">Cargando tu espacio de trabajo...</p>;

  return <>
    <SiteHeader user={session.user} />
    <main>
      <section className="dashboard">
        <p className="eyebrow">Área privada</p>
        <h1>Bienvenido, {session.user?.nombre || session.user?.email || 'usuario'}</h1>
        <p>Administra tu suscripción y revisa el acceso de tu empresa desde un solo lugar.</p>
      </section>
      <QuickActions summary={summary} />
      <SystemHealth maxUsers={summary?.max_usuarios} />
      <SubscriptionPanel user={session.user} />
    </main>
    <SiteFooter />
  </>;
}

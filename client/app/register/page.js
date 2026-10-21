import SiteFooter from '../../components/SiteFooter';
import SiteHeader from '../../components/SiteHeader';
import AuthForm from '../../components/AuthForm';

export default function RegisterPage() {
  return <><SiteHeader /><main className="auth-layout"><section className="auth-card"><AuthForm page="register" /></section></main><SiteFooter /></>;
}

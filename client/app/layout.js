import '../css/styles.css';

export const metadata = {
  title: 'Invix | Acceso para negocios',
  description: 'Suscripciones y acceso seguro a la plataforma Invix.',
};

export default function RootLayout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}

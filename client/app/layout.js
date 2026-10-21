import '../css/styles.css';

export const metadata = {
  title: 'Invix | Inventario y pedidos',
  description: 'Sistema de inventario y pedidos.',
};

export default function RootLayout({ children }) {
  return <html lang="es"><body>{children}</body></html>;
}

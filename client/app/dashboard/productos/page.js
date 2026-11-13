'use client';

import { useEffect, useState } from 'react';
import BackToDashboard from '../../../components/BackToDashboard';
import SiteFooter from '../../../components/SiteFooter';
import SiteHeader from '../../../components/SiteHeader';
import {
  clearSession, createProduct, deleteProduct, getProfile, getProducts, getSession, updateProduct,
} from '../../../js/api';

const emptyProduct = { nombre: '', sku: '', stock: 0, precio: 0 };

export default function ProductsPage() {
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const isAdmin = session?.user?.rol === 'ADMIN';

  async function loadProducts() {
    setLoading(true);
    setError('');
    try {
      const response = await getProducts();
      setProducts(response.data || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const current = getSession();
    if (!current) {
      window.location.replace('/login');
      return;
    }
    setSession(current);
    Promise.all([getProfile(), getProducts()])
      .then(([profile, productResponse]) => {
        setSession({ ...current, user: profile?.user || current.user });
        setProducts(productResponse.data || []);
      })
      .catch(requestError => {
        if (requestError.status === 401) {
          clearSession();
          window.location.replace('/login');
          return;
        }
        setError(requestError.message);
      })
      .finally(() => setLoading(false));
  }, []);

  function changeField(event) {
    const { name, value } = event.target;
    setForm(current => ({ ...current, [name]: name === 'stock' || name === 'precio' ? value : value }));
  }

  function startEditing(product) {
    setEditingId(product.id);
    setForm({
      nombre: product.nombre,
      sku: product.sku || '',
      stock: product.stock,
      precio: product.precio,
    });
    setNotice('');
    setError('');
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyProduct);
  }

  async function submit(event) {
    event.preventDefault();
    if (pending || !isAdmin) return;
    setPending(true);
    setError('');
    setNotice('');
    const payload = {
      nombre: form.nombre.trim(),
      sku: form.sku.trim() || null,
      stock: Number(form.stock),
      precio: Number(form.precio),
    };
    try {
      const response = editingId
        ? await updateProduct(editingId, payload)
        : await createProduct(payload);
      setNotice(response.message || 'Producto guardado correctamente.');
      resetForm();
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  async function deactivate(product) {
    if (pending || !isAdmin || !window.confirm(`¿Desactivar "${product.nombre}"?`)) return;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const response = await deleteProduct(product.id);
      setNotice(response.message || 'Producto desactivado correctamente.');
      if (editingId === product.id) resetForm();
      await loadProducts();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setPending(false);
    }
  }

  if (!session) return <p className="page-loading" role="status">Cargando productos...</p>;

  return <>
    <SiteHeader user={session.user} />
    <main>
      <section className="module-page-heading">
        <BackToDashboard />
        <p className="eyebrow">Inventario / Productos</p>
        <h1>Productos de {session.user?.empresa?.nombre || 'tu empresa'}</h1>
        <p>Administra el catálogo y el inventario registrado para tu empresa.</p>
      </section>
      {error && <div className="status module-status" data-kind="error" role="alert"><p>{error}</p>
        <button className="button secondary" onClick={loadProducts} disabled={loading || pending}>Reintentar</button>
      </div>}
      {notice && <p className="status module-status" data-kind="success" role="status">{notice}</p>}
      {isAdmin && <section className="product-form-card" aria-labelledby="product-form-title">
        <div className="section-heading compact"><p className="eyebrow">{editingId ? 'Editar producto' : 'Nuevo producto'}</p>
          <h2 id="product-form-title">{editingId ? 'Actualizar producto' : 'Registrar producto'}</h2></div>
        <form className="product-form" onSubmit={submit}>
          <label>Nombre<input name="nombre" value={form.nombre} onChange={changeField} required maxLength={150} /></label>
          <label>SKU<input name="sku" value={form.sku} onChange={changeField} maxLength={80} /></label>
          <label>Stock<input name="stock" type="number" min="0" step="1" value={form.stock} onChange={changeField} required /></label>
          <label>Precio<input name="precio" type="number" min="0" step="0.01" value={form.precio} onChange={changeField} required /></label>
          <div className="product-form-actions"><button className="button" disabled={pending}>{pending ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}</button>
            {editingId && <button type="button" className="button secondary" onClick={resetForm} disabled={pending}>Cancelar edición</button>}</div>
        </form>
      </section>}
      {!isAdmin && <p className="status">Tu rol permite consultar productos. Solo un administrador puede modificarlos.</p>}
      <section className="product-list-card" aria-labelledby="products-list-title">
        <div className="section-heading compact"><p className="eyebrow">Catálogo empresarial</p><h2 id="products-list-title">Productos activos</h2></div>
        {loading ? <p role="status">Consultando productos...</p> : products.length === 0 ? <p className="empty-state">No hay productos activos registrados.</p> :
          <div className="table-wrapper"><table><thead><tr><th>Nombre</th><th>SKU</th><th>Stock</th><th>Precio</th>{isAdmin && <th>Acciones</th>}</tr></thead>
            <tbody>{products.filter(product => product.activo).map(product => <tr key={product.id}>
              <td>{product.nombre}</td><td>{product.sku || '—'}</td><td>{product.stock}</td>
              <td>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.precio)}</td>
              {isAdmin && <td className="table-actions"><button className="button small secondary" onClick={() => startEditing(product)} disabled={pending}>Editar</button>
                <button className="button small danger" onClick={() => deactivate(product)} disabled={pending}>Desactivar</button></td>}
            </tr>)}</tbody></table></div>}
      </section>
    </main>
    <SiteFooter user={session.user} />
  </>;
}

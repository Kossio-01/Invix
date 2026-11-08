const pool = require('../config/db');

async function writeAudit(client, { empresaId, usuarioId, accion, entidad, entidadId, detalle = {} }) {
  await client.query(
    `INSERT INTO auditoria (empresa_id, usuario_id, accion, entidad, entidad_id, detalle)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
    [empresaId, usuarioId, accion, entidad, entidadId || null, JSON.stringify(detalle)],
  );
}

async function listProducts(empresaId) {
  const result = await pool.query(
    `SELECT id, nombre, sku, stock, precio, activo, creado_en, actualizado_en
     FROM productos WHERE empresa_id = $1 ORDER BY id DESC`,
    [empresaId],
  );
  return result.rows.map(row => ({ ...row, id: Number(row.id), precio: Number(row.precio) }));
}

async function createProduct(empresaId, usuarioId, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO productos (empresa_id, nombre, sku, stock, precio)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, sku, stock, precio, activo, creado_en, actualizado_en`,
      [empresaId, data.nombre, data.sku || null, data.stock, data.precio],
    );
    await writeAudit(client, { empresaId, usuarioId, accion: 'CREAR', entidad: 'PRODUCTO', entidadId: result.rows[0].id, detalle: data });
    await client.query('COMMIT');
    return { ...result.rows[0], id: Number(result.rows[0].id), precio: Number(result.rows[0].precio) };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') error.statusCode = 409;
    throw error;
  } finally { client.release(); }
}

async function updateProduct(empresaId, usuarioId, id, data) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE productos SET nombre = $1, sku = $2, stock = $3, precio = $4, actualizado_en = now()
       WHERE id = $5 AND empresa_id = $6
       RETURNING id, nombre, sku, stock, precio, activo, creado_en, actualizado_en`,
      [data.nombre, data.sku || null, data.stock, data.precio, id, empresaId],
    );
    if (!result.rows[0]) {
      const error = new Error('Producto no encontrado.'); error.statusCode = 404; throw error;
    }
    await writeAudit(client, { empresaId, usuarioId, accion: 'ACTUALIZAR', entidad: 'PRODUCTO', entidadId: id, detalle: data });
    await client.query('COMMIT');
    return { ...result.rows[0], id: Number(result.rows[0].id), precio: Number(result.rows[0].precio) };
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function deleteProduct(empresaId, usuarioId, id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      'UPDATE productos SET activo = false, actualizado_en = now() WHERE id = $1 AND empresa_id = $2 AND activo RETURNING id',
      [id, empresaId],
    );
    if (!result.rows[0]) {
      const error = new Error('Producto no encontrado.'); error.statusCode = 404; throw error;
    }
    await writeAudit(client, { empresaId, usuarioId, accion: 'DESACTIVAR', entidad: 'PRODUCTO', entidadId: id });
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function listAudit(empresaId, limit = 50) {
  const result = await pool.query(
    `SELECT a.id, a.accion, a.entidad, a.entidad_id, a.detalle, a.creado_en,
            u.nombre AS usuario
     FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.empresa_id = $1 ORDER BY a.creado_en DESC LIMIT $2`,
    [empresaId, limit],
  );
  return result.rows.map(row => ({ ...row, id: Number(row.id), entidad_id: row.entidad_id ? Number(row.entidad_id) : null }));
}

async function getCompanySummary(empresaId) {
  const result = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM productos WHERE empresa_id = $1 AND activo) AS productos,
       (SELECT COUNT(*) FROM usuarios WHERE empresa_id = $1 AND activo) AS usuarios,
       (SELECT p.max_usuarios
        FROM suscripciones s JOIN planes p ON p.id = s.plan_id
        WHERE s.empresa_id = $1
        ORDER BY s.id DESC LIMIT 1) AS max_usuarios`,
    [empresaId],
  );
  const row = result.rows[0];
  return {
    productos: Number(row.productos),
    usuarios: Number(row.usuarios),
    max_usuarios: row.max_usuarios == null ? null : Number(row.max_usuarios),
  };
}

module.exports = {
  createProduct, deleteProduct, getCompanySummary, deleteProduct, listAudit, listProducts, updateProduct,
};

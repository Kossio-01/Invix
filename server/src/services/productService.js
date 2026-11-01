const pool = require('../config/db');

const COLUMNS = `id, sku, nombre, descripcion, precio, stock, stock_minimo,
                 activo, creado_en, actualizado_en`;

// pg devuelve BIGINT y NUMERIC como texto; se convierten a número para el JSON.
function toProduct(row) {
  if (!row) return null;
  return { ...row, id: Number(row.id), precio: Number(row.precio) };
}

// Catálogo. CLIENTE: solo activos con stock > 0. ADMIN (includeInactive): todos.
async function listProducts({ includeInactive = false } = {}) {
  const where = includeInactive ? '' : 'WHERE activo AND stock > 0';
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM productos ${where} ORDER BY nombre ASC, id ASC`,
  );
  return result.rows.map(toProduct);
}

// Alertas de inventario: activos con stock <= stock_minimo, del más crítico al menos crítico.
async function listLowStockProducts() {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM productos
     WHERE activo AND stock <= stock_minimo
     ORDER BY (stock - stock_minimo) ASC, nombre ASC`,
  );
  return result.rows.map(toProduct);
}

async function findProductById(id, { includeInactive = false } = {}) {
  const result = await pool.query(
    `SELECT ${COLUMNS} FROM productos
     WHERE id = $1 ${includeInactive ? '' : 'AND activo'}`,
    [id],
  );
  return toProduct(result.rows[0]);
}

async function createProduct({ sku, nombre, descripcion, precio, stock, stock_minimo }) {
  const result = await pool.query(
    `INSERT INTO productos (sku, nombre, descripcion, precio, stock, stock_minimo)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [sku, nombre, descripcion, precio, stock, stock_minimo],
  );
  return toProduct(result.rows[0]);
}

// RN-05: sin triggers, actualizado_en se actualiza de forma explícita.
async function updateProduct(id, { sku, nombre, descripcion, precio, stock, stock_minimo, activo }) {
  const result = await pool.query(
    `UPDATE productos
     SET sku = $1, nombre = $2, descripcion = $3, precio = $4,
         stock = $5, stock_minimo = $6, activo = COALESCE($7, activo),
         actualizado_en = now()
     WHERE id = $8
     RETURNING ${COLUMNS}`,
    [sku, nombre, descripcion, precio, stock, stock_minimo, activo ?? null, id],
  );
  return toProduct(result.rows[0]);
}

// RN-04: baja lógica, el producto nunca se borra porque puede tener historial de pedidos.
async function deactivateProduct(id) {
  const result = await pool.query(
    `UPDATE productos SET activo = FALSE, actualizado_en = now()
     WHERE id = $1
     RETURNING ${COLUMNS}`,
    [id],
  );
  return toProduct(result.rows[0]);
}

module.exports = {
  createProduct,
  deactivateProduct,
  findProductById,
  listLowStockProducts,
  listProducts,
  updateProduct,
};

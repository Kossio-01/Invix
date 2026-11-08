const service = require('../services/moduleService');

function text(value, field, max = 150) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    const error = new Error(`${field} es obligatorio y debe tener como máximo ${max} caracteres.`);
    error.statusCode = 400;
    throw error;
  }
  return value.trim();
}

function number(value, field, minimum = 0) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < minimum) {
    const error = new Error(`${field} debe ser un número entero válido.`);
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function price(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error('precio debe ser un número mayor o igual a cero.');
    error.statusCode = 400;
    throw error;
  }
  return parsed;
}

function productData(body) {
  return {
    nombre: text(body?.nombre, 'nombre'),
    sku: body?.sku ? text(body.sku, 'sku', 80) : null,
    stock: number(body?.stock ?? 0, 'stock'),
    precio: price(body?.precio ?? 0),
  };
}

function idParam(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('El identificador no es válido.'); error.statusCode = 400; throw error;
  }
  return id;
}

async function listProducts(req, res) {
  res.json({ success: true, data: await service.listProducts(req.user.empresa.id) });
}
async function createProduct(req, res) {
  res.status(201).json({ success: true, message: 'Producto creado correctamente.', data: await service.createProduct(req.user.empresa.id, req.user.id, productData(req.body)) });
}
async function updateProduct(req, res) {
  res.json({ success: true, message: 'Producto actualizado correctamente.', data: await service.updateProduct(req.user.empresa.id, req.user.id, idParam(req.params.id), productData(req.body)) });
}
async function deleteProduct(req, res) {
  await service.deleteProduct(req.user.empresa.id, req.user.id, idParam(req.params.id));
  res.json({ success: true, message: 'Producto desactivado correctamente.' });
}
async function listAudit(req, res) {
  const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
  res.json({ success: true, data: await service.listAudit(req.user.empresa.id, limit) });
}
async function getCompanySummary(req, res) {
  res.json({ success: true, data: await service.getCompanySummary(req.user.empresa.id) });
}

module.exports = {
  createProduct, deleteProduct, getCompanySummary, listAudit, listProducts, updateProduct,
};

// Validación de datos de producto en el servidor.
// Los límites coinciden con las restricciones de schema.sql (tabla productos).

const SKU_PATTERN = /^[A-Za-z0-9._-]+$/;
const MAX_PRICE = 9999999999.99; // NUMERIC(12,2)
const MAX_INT = 2147483647;      // INTEGER

function toNumber(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '') return Number(value);
  return NaN;
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

// Valida el cuerpo de POST (mode 'create') o PUT (mode 'update').
//  - create: sku, nombre y precio obligatorios; stock y stock_minimo valen 0 si no se envían.
//  - update: PUT reemplaza el producto, así que también exige stock y stock_minimo;
//            "activo" es opcional (si no se envía, se conserva el actual).
// Devuelve { errors: [{ campo, mensaje }], value }.
function validateProduct(body, mode = 'create') {
  const errors = [];
  const add = (campo, mensaje) => errors.push({ campo, mensaje });

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: [{ campo: 'body', mensaje: 'El cuerpo de la petición debe ser un objeto JSON.' }], value: null };
  }

  const value = {};

  // sku
  if (typeof body.sku !== 'string' || body.sku.trim() === '') {
    add('sku', 'El SKU es obligatorio.');
  } else {
    const sku = body.sku.trim().toUpperCase();
    if (sku.length > 50) add('sku', 'El SKU no puede superar 50 caracteres.');
    else if (!SKU_PATTERN.test(sku)) add('sku', 'El SKU solo admite letras, números, punto, guion y guion bajo.');
    else value.sku = sku;
  }

  // nombre
  if (typeof body.nombre !== 'string' || body.nombre.trim() === '') {
    add('nombre', 'El nombre es obligatorio.');
  } else {
    const nombre = body.nombre.trim();
    if (nombre.length < 2 || nombre.length > 150) add('nombre', 'El nombre debe tener entre 2 y 150 caracteres.');
    else value.nombre = nombre;
  }

  // descripcion (opcional)
  if (!hasValue(body.descripcion)) {
    value.descripcion = null;
  } else if (typeof body.descripcion !== 'string') {
    add('descripcion', 'La descripción debe ser texto.');
  } else if (body.descripcion.trim().length > 2000) {
    add('descripcion', 'La descripción no puede superar 2000 caracteres.');
  } else {
    value.descripcion = body.descripcion.trim() || null;
  }

  // precio
  const precio = toNumber(body.precio);
  if (!hasValue(body.precio)) {
    add('precio', 'El precio es obligatorio.');
  } else if (!Number.isFinite(precio) || precio < 0) {
    add('precio', 'El precio debe ser un número mayor o igual a 0.');
  } else if (precio > MAX_PRICE) {
    add('precio', 'El precio es demasiado alto.');
  } else if (Math.abs(precio * 100 - Math.round(precio * 100)) > 1e-6) {
    add('precio', 'El precio admite máximo 2 decimales.');
  } else {
    value.precio = Math.round(precio * 100) / 100;
  }

  // stock y stock_minimo (enteros >= 0)
  const stockRequired = mode === 'update';
  [['stock', 'El stock'], ['stock_minimo', 'El stock mínimo']].forEach(([campo, etiqueta]) => {
    if (!hasValue(body[campo])) {
      if (stockRequired) add(campo, `${etiqueta} es obligatorio.`);
      else value[campo] = 0;
      return;
    }
    const n = toNumber(body[campo]);
    if (!Number.isInteger(n) || n < 0) add(campo, `${etiqueta} debe ser un número entero mayor o igual a 0.`);
    else if (n > MAX_INT) add(campo, `${etiqueta} es demasiado alto.`);
    else value[campo] = n;
  });

  // activo (opcional; solo se usa al editar)
  if (hasValue(body.activo)) {
    if (typeof body.activo !== 'boolean') add('activo', 'El campo activo debe ser verdadero o falso.');
    else value.activo = body.activo;
  }

  return { errors, value };
}

// Convierte el :id de la URL en número positivo, o null si no es válido.
function parseId(raw) {
  return /^[1-9]\d{0,14}$/.test(String(raw)) ? Number(raw) : null;
}

module.exports = { validateProduct, parseId };

const pool = require('../config/db');

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
    empresa: user.empresa_nombre ? { id: Number(user.empresa_id), nombre: user.empresa_nombre } : null,
    plan: user.plan_codigo ? { codigo: user.plan_codigo, nombre: user.plan_nombre } : null,
    suscripcionEstado: user.suscripcion_estado || null,
  };
}

async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.password_hash, u.rol, u.activo,
            u.empresa_id, e.nombre AS empresa_nombre, s.estado AS suscripcion_estado,
            p.codigo AS plan_codigo, p.nombre AS plan_nombre
     FROM usuarios u
     JOIN empresas e ON e.id = u.empresa_id
     LEFT JOIN LATERAL (
       SELECT id, estado, plan_id
       FROM suscripciones
       WHERE empresa_id = e.id
       ORDER BY id DESC
       LIMIT 1
     ) s ON TRUE
     LEFT JOIN planes p ON p.id = s.plan_id
     WHERE lower(u.email) = lower($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    `SELECT u.id, u.nombre, u.email, u.password_hash, u.rol, u.activo,
            u.empresa_id, e.nombre AS empresa_nombre, s.estado AS suscripcion_estado,
            p.codigo AS plan_codigo, p.nombre AS plan_nombre
     FROM usuarios u
     JOIN empresas e ON e.id = u.empresa_id
     LEFT JOIN LATERAL (
       SELECT id, estado, plan_id
       FROM suscripciones
       WHERE empresa_id = e.id
       ORDER BY id DESC
       LIMIT 1
     ) s ON TRUE
     LEFT JOIN planes p ON p.id = s.plan_id
     WHERE u.id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] || null;
}

async function createUser({ nombre, email, passwordHash, empresaNombre, planCodigo = 'BASICO' }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const company = await client.query(
      'INSERT INTO empresas (nombre) VALUES ($1) RETURNING id, nombre',
      [empresaNombre],
    );
    const plan = await client.query(
      'SELECT id, codigo, nombre FROM planes WHERE codigo = $1 AND activo LIMIT 1',
      [planCodigo],
    );
    if (!plan.rows[0]) throw new Error('El plan seleccionado no existe.');
    const user = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, empresa_id)
       VALUES ($1, $2, $3, 'ADMIN', $4)
       RETURNING id, nombre, email, rol, activo, empresa_id`,
      [nombre, email, passwordHash, company.rows[0].id],
    );
    await client.query(
      'INSERT INTO suscripciones (empresa_id, plan_id) VALUES ($1, $2)',
      [company.rows[0].id, plan.rows[0].id],
    );
    await client.query('COMMIT');
    return {
      ...user.rows[0],
      empresa_nombre: company.rows[0].nombre,
      plan_codigo: plan.rows[0].codigo,
      plan_nombre: plan.rows[0].nombre,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  publicUser,
};

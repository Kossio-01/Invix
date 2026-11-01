const pool = require('../config/db');

async function listPlans() {
  const result = await pool.query(
    `SELECT id, codigo, nombre, descripcion, max_usuarios, precio_mensual, activo
     FROM planes
     WHERE activo
     ORDER BY precio_mensual ASC, id ASC`,
  );
  return result.rows.map(plan => ({
    ...plan,
    id: Number(plan.id),
    precio_mensual: Number(plan.precio_mensual),
  }));
}

async function findSubscriptionByCompanyId(empresaId) {
  const result = await pool.query(
    `SELECT s.id, s.empresa_id, s.plan_id, s.estado, s.inicia_en, s.termina_en,
            p.codigo AS plan_codigo, p.nombre AS plan_nombre,
            p.descripcion AS plan_descripcion, p.max_usuarios, p.precio_mensual
     FROM suscripciones s
     JOIN planes p ON p.id = s.plan_id
     WHERE s.empresa_id = $1
     ORDER BY s.id DESC
     LIMIT 1`,
    [empresaId],
  );
  return result.rows[0] || null;
}

async function changePlan(empresaId, planCodigo) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const plan = await client.query(
      `SELECT id, codigo, nombre, descripcion, max_usuarios, precio_mensual
       FROM planes
       WHERE codigo = $1 AND activo
       LIMIT 1`,
      [planCodigo],
    );
    if (!plan.rows[0]) {
      const error = new Error('El plan seleccionado no existe.');
      error.statusCode = 404;
      throw error;
    }

    await client.query(
      `UPDATE suscripciones
       SET estado = 'CANCELADA', termina_en = now()
       WHERE empresa_id = $1 AND estado = 'ACTIVA'`,
      [empresaId],
    );
    const subscription = await client.query(
      `INSERT INTO suscripciones (empresa_id, plan_id, estado)
       VALUES ($1, $2, 'ACTIVA')
       RETURNING id, empresa_id, plan_id, estado, inicia_en, termina_en`,
      [empresaId, plan.rows[0].id],
    );
    await client.query('COMMIT');
    return { ...subscription.rows[0], plan: plan.rows[0] };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function cancelSubscription(empresaId) {
  const result = await pool.query(
    `UPDATE suscripciones
     SET estado = 'CANCELADA', termina_en = now()
     WHERE empresa_id = $1 AND estado = 'ACTIVA'
     RETURNING id, empresa_id, plan_id, estado, inicia_en, termina_en`,
    [empresaId],
  );
  return result.rows[0] || null;
}

module.exports = {
  cancelSubscription,
  changePlan,
  findSubscriptionByCompanyId,
  listPlans,
};

const crypto = require('crypto');
const pool = require('../config/db');

const INVITATION_DAYS = 7;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function publicMember(row) {
  return { id: Number(row.id), nombre: row.nombre, email: row.email, rol: row.rol, activo: row.activo, creado_en: row.creado_en };
}

async function listMembers(empresaId) {
  const members = await pool.query(
    `SELECT id, nombre, email, rol, activo, creado_en
     FROM usuarios WHERE empresa_id = $1 AND activo
     ORDER BY CASE WHEN rol = 'ADMIN' THEN 0 ELSE 1 END, nombre`,
    [empresaId],
  );
  const invitations = await pool.query(
    `SELECT id, email, rol, expira_en, creado_en
     FROM invitaciones
     WHERE empresa_id = $1 AND aceptada_en IS NULL AND expira_en > now()
     ORDER BY creado_en DESC`,
    [empresaId],
  );
  return {
    miembros: members.rows.map(publicMember),
    invitaciones: invitations.rows.map(row => ({ ...row, id: Number(row.id) })),
  };
}

async function createInvitation({ empresaId, email, rol, usuarioId }) {
  const client = await pool.connect();
  const token = crypto.randomBytes(32).toString('hex');
  try {
    await client.query('BEGIN');
    const existing = await client.query(
      'SELECT id FROM usuarios WHERE lower(email) = lower($1)',
      [email],
    );
    if (existing.rows[0]) {
      const error = new Error('Ese correo ya tiene una cuenta registrada.'); error.statusCode = 409; throw error;
    }
    const plan = await client.query(
      `SELECT p.max_usuarios,
              (SELECT COUNT(*) FROM usuarios u WHERE u.empresa_id = s.empresa_id AND u.activo) AS usuarios,
              (SELECT COUNT(*) FROM invitaciones i WHERE i.empresa_id = s.empresa_id
                 AND i.aceptada_en IS NULL AND i.expira_en > now()) AS pendientes
       FROM suscripciones s JOIN planes p ON p.id = s.plan_id
       WHERE s.empresa_id = $1 AND s.estado = 'ACTIVA'
       ORDER BY s.id DESC LIMIT 1`,
      [empresaId],
    );
    const subscription = plan.rows[0];
    if (subscription && subscription.max_usuarios != null
      && Number(subscription.usuarios) + Number(subscription.pendientes) >= Number(subscription.max_usuarios)) {
      const error = new Error('El límite de usuarios de tu plan ya fue alcanzado.'); error.statusCode = 409; throw error;
    }
    await client.query(
      'DELETE FROM invitaciones WHERE empresa_id = $1 AND lower(email) = lower($2) AND aceptada_en IS NULL',
      [empresaId, email],
    );
    const expires = new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000);
    const result = await client.query(
      `INSERT INTO invitaciones (empresa_id, email, rol, token_hash, expira_en)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, rol, expira_en, creado_en`,
      [empresaId, email, rol, hashToken(token), expires],
    );
    await client.query(
      `INSERT INTO auditoria (empresa_id, usuario_id, accion, entidad, entidad_id, detalle)
       VALUES ($1, $2, 'INVITAR', 'COLABORADOR', $3, $4::jsonb)`,
      [empresaId, usuarioId, result.rows[0].id, JSON.stringify({ email, rol })],
    );
    await client.query('COMMIT');
    return { ...result.rows[0], id: Number(result.rows[0].id), token };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function changeRole(empresaId, actorId, memberId, rol) {
  if (Number(actorId) === Number(memberId)) {
    const error = new Error('No puedes cambiar tu propio rol.'); error.statusCode = 400; throw error;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE usuarios SET rol = $1, actualizado_en = now()
       WHERE id = $2 AND empresa_id = $3 AND activo AND rol <> 'ADMIN'
       RETURNING id, nombre, email, rol, activo, creado_en`,
      [rol, memberId, empresaId],
    );
    if (!result.rows[0]) {
      const error = new Error('Colaborador no encontrado o no se puede modificar.'); error.statusCode = 404; throw error;
    }
    await client.query(
      `INSERT INTO auditoria (empresa_id, usuario_id, accion, entidad, entidad_id, detalle)
       VALUES ($1, $2, 'ACTUALIZAR_ROL', 'COLABORADOR', $3, $4::jsonb)`,
      [empresaId, actorId, memberId, JSON.stringify({ rol })],
    );
    await client.query('COMMIT');
    return publicMember(result.rows[0]);
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function removeMember(empresaId, actorId, memberId) {
  if (Number(actorId) === Number(memberId)) {
    const error = new Error('No puedes eliminarte a ti mismo.'); error.statusCode = 400; throw error;
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `UPDATE usuarios SET activo = false, actualizado_en = now()
       WHERE id = $1 AND empresa_id = $2 AND activo AND rol <> 'ADMIN'
       RETURNING id`,
      [memberId, empresaId],
    );
    if (!result.rows[0]) {
      const error = new Error('Colaborador no encontrado o no se puede eliminar.'); error.statusCode = 404; throw error;
    }
    await client.query(
      `INSERT INTO auditoria (empresa_id, usuario_id, accion, entidad, entidad_id)
       VALUES ($1, $2, 'ELIMINAR', 'COLABORADOR', $3)`,
      [empresaId, actorId, memberId],
    );
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

async function cancelInvitation(empresaId, invitationId) {
  const result = await pool.query(
    `DELETE FROM invitaciones WHERE id = $1 AND empresa_id = $2 AND aceptada_en IS NULL RETURNING id`,
    [invitationId, empresaId],
  );
  if (!result.rows[0]) {
    const error = new Error('Invitación no encontrada.'); error.statusCode = 404; throw error;
  }
}

async function acceptInvitation(token, { nombre, password }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invitation = await client.query(
      `SELECT id, empresa_id, email, rol FROM invitaciones
       WHERE token_hash = $1 AND aceptada_en IS NULL AND expira_en > now()
       FOR UPDATE`,
      [hashToken(token)],
    );
    if (!invitation.rows[0]) {
      const error = new Error('La invitación no existe o ya expiró.'); error.statusCode = 400; throw error;
    }
    const item = invitation.rows[0];
    const existing = await client.query('SELECT id FROM usuarios WHERE lower(email) = lower($1)', [item.email]);
    if (existing.rows[0]) {
      const error = new Error('Ese correo ya tiene una cuenta registrada.'); error.statusCode = 409; throw error;
    }
    const user = await client.query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol, empresa_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, email, rol, activo, empresa_id`,
      [nombre, item.email, password, item.rol, item.empresa_id],
    );
    await client.query('UPDATE invitaciones SET aceptada_en = now() WHERE id = $1', [item.id]);
    await client.query(
      `INSERT INTO auditoria (empresa_id, usuario_id, accion, entidad, entidad_id, detalle)
       VALUES ($1, $2, 'ACEPTAR_INVITACION', 'COLABORADOR', $3, $4::jsonb)`,
      [item.empresa_id, user.rows[0].id, user.rows[0].id, JSON.stringify({ email: item.email, rol: item.rol })],
    );
    await client.query('COMMIT');
    return user.rows[0];
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}

module.exports = { acceptInvitation, cancelInvitation, changeRole, createInvitation, listMembers, removeMember };

const pool = require('../config/db');

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    rol: user.rol,
  };
}

async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, nombre, email, password_hash, rol, activo
     FROM usuarios
     WHERE lower(email) = lower($1)
     LIMIT 1`,
    [email],
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, nombre, email, password_hash, rol, activo
     FROM usuarios
     WHERE id = $1
     LIMIT 1`,
    [id],
  );
  return result.rows[0] || null;
}

async function createUser({ nombre, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, 'CLIENTE')
     RETURNING id, nombre, email, rol, activo`,
    [nombre, email, passwordHash],
  );
  return result.rows[0];
}

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  publicUser,
};

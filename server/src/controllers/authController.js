const bcrypt = require('bcryptjs');
const { signToken } = require('../config/auth');
const {
  createUser,
  findUserByEmail,
  findUserById,
  publicUser,
} = require('../services/userService');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeRegistration(body) {
  return {
    nombre: typeof body.nombre === 'string' ? body.nombre.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : '',
    password: typeof body.password === 'string' ? body.password : '',
  };
}

function validateCredentials({ nombre, email, password }, includeName = false) {
  if (includeName && (nombre.length < 2 || nombre.length > 100)) {
    return 'El nombre debe tener entre 2 y 100 caracteres.';
  }
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return 'Ingresa un correo electrónico válido.';
  }
  if (password.length < 8 || password.length > 72) {
    return 'La contraseña debe tener entre 8 y 72 caracteres.';
  }
  return null;
}

async function register(req, res) {
  try {
    const credentials = normalizeRegistration(req.body || {});
    const validationError = validateCredentials(credentials, true);
    if (validationError) return res.status(400).json({ message: validationError });

    if (await findUserByEmail(credentials.email)) {
      return res.status(409).json({ message: 'No se pudo registrar el usuario con esos datos.' });
    }

    const passwordHash = await bcrypt.hash(credentials.password, 12);
    const user = await createUser({
      nombre: credentials.nombre,
      email: credentials.email,
      passwordHash,
    });
    return res.status(201).json({
      message: 'Usuario registrado correctamente.',
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'No se pudo registrar el usuario con esos datos.' });
    }
    console.error('Error detallado en POST /api/auth/register:', error);
    throw error;
  }
}

async function login(req, res) {
  const credentials = normalizeRegistration(req.body || {});
  const validationError = validateCredentials(credentials);
  if (validationError) return res.status(400).json({ message: validationError });

  const user = await findUserByEmail(credentials.email);
  const passwordMatches = user
    ? await bcrypt.compare(credentials.password, user.password_hash)
    : false;

  if (!user || !user.activo || !passwordMatches) {
    return res.status(401).json({ message: 'Correo o contraseña incorrectos.' });
  }

  return res.status(200).json({
    token: signToken(user),
    user: publicUser(user),
  });
}

async function me(req, res) {
  const user = await findUserById(req.user.id);
  if (!user || !user.activo) {
    return res.status(401).json({ message: 'La sesión no es válida.' });
  }
  return res.status(200).json({ user: publicUser(user) });
}

module.exports = { login, me, register };

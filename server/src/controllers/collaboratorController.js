const bcrypt = require('bcryptjs');
const service = require('../services/collaboratorService');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ROLES = ['JEFE_GESTION', 'AYUDANTE'];

function idParam(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    const error = new Error('El identificador no es válido.'); error.statusCode = 400; throw error;
  }
  return id;
}

function invitationData(body) {
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const rol = typeof body?.rol === 'string' ? body.rol.trim().toUpperCase() : '';
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    const error = new Error('Ingresa un correo electrónico válido.'); error.statusCode = 400; throw error;
  }
  if (!ROLES.includes(rol)) {
    const error = new Error('El rol debe ser AYUDANTE o JEFE_GESTION.'); error.statusCode = 400; throw error;
  }
  return { email, rol };
}

async function list(req, res) {
  res.json({ success: true, data: await service.listMembers(req.user.empresa.id) });
}
async function invite(req, res) {
  const data = await service.createInvitation({ ...invitationData(req.body), empresaId: req.user.empresa.id, usuarioId: req.user.id });
  res.status(201).json({ success: true, message: 'Invitación creada correctamente.', data });
}
async function updateRole(req, res) {
  const rol = typeof req.body?.rol === 'string' ? req.body.rol.trim().toUpperCase() : '';
  if (!ROLES.includes(rol)) {
    const error = new Error('El rol debe ser AYUDANTE o JEFE_GESTION.'); error.statusCode = 400; throw error;
  }
  res.json({ success: true, message: 'Rol actualizado correctamente.', data: await service.changeRole(req.user.empresa.id, req.user.id, idParam(req.params.id), rol) });
}
async function remove(req, res) {
  await service.removeMember(req.user.empresa.id, req.user.id, idParam(req.params.id));
  res.json({ success: true, message: 'Colaborador eliminado correctamente.' });
}
async function cancel(req, res) {
  await service.cancelInvitation(req.user.empresa.id, idParam(req.params.id));
  res.json({ success: true, message: 'Invitación cancelada correctamente.' });
}
async function accept(req, res) {
  const nombre = typeof req.body?.nombre === 'string' ? req.body.nombre.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (nombre.length < 2 || nombre.length > 100 || password.length < 8 || password.length > 72) {
    return res.status(400).json({ success: false, message: 'El nombre debe tener entre 2 y 100 caracteres y la contraseña entre 8 y 72.' });
  }
  const user = await service.acceptInvitation(req.params.token, { nombre, password: await bcrypt.hash(password, 12) });
  res.status(201).json({ success: true, message: 'Invitación aceptada. Ya puedes iniciar sesión.', data: { email: user.email } });
}

module.exports = { accept, cancel, invite, list, remove, updateRole };

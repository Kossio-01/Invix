const jwt = require('jsonwebtoken');
const { authConfig } = require('../config/auth');
const { findUserById, publicUser } = require('../services/userService');

async function authMiddleware(req, res, next) {
  const authorization = req.get('Authorization') || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token de acceso requerido.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, authConfig.secret, {
      issuer: authConfig.issuer,
    });
  } catch (error) {
    return res.status(401).json({ message: 'La sesión no es válida o ha expirado.' });
  }

  try {
    const user = await findUserById(payload.sub);

    if (!user || !user.activo) {
      return res.status(401).json({ message: 'La sesión no es válida.' });
    }

    req.user = publicUser(user);
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = authMiddleware;

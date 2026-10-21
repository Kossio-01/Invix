const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const isProduction = process.env.NODE_ENV === 'production';
const secret = process.env.AUTH_SECRET
  || (isProduction ? null : crypto.randomBytes(32).toString('hex'));

if (!secret) {
  throw new Error('AUTH_SECRET es obligatorio en producción.');
}

const authConfig = Object.freeze({
  secret,
  expiresIn: process.env.AUTH_TOKEN_EXPIRES_IN || '2h',
  issuer: process.env.AUTH_JWT_ISSUER || 'invix-api',
});

function signToken(user) {
  return jwt.sign(
    { email: user.email, rol: user.rol },
    authConfig.secret,
    {
      subject: String(user.id),
      expiresIn: authConfig.expiresIn,
      issuer: authConfig.issuer,
    },
  );
}

module.exports = { authConfig, signToken };

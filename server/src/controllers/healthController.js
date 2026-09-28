const pool = require('../config/db');

// GET /health -> verifica que la API esté viva y que la base de datos responda.
async function getHealth(req, res) {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check falló:', error.message);
    res.status(503).json({
      status: 'error',
      database: 'unreachable',
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = { getHealth };
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

// Un solo pool de conexiones para toda la aplicación.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Evita que un error de una conexión inactiva tumbe el servidor.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL:', err.message);
});

module.exports = pool;
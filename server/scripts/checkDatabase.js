const fs = require('node:fs');
const path = require('node:path');
const pool = require('../src/config/db');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('Configura DATABASE_URL en server/.env antes de comprobar la base.');
    process.exitCode = 1;
    await pool.end();
    return;
  }
  let client;
  try {
    client = await pool.connect();
    const sql = fs.readFileSync(path.join(__dirname, '../src/database/audit.sql'), 'utf8');
    const results = await client.query(sql);
    console.table(results[1].rows);
    const rows = results[2].rows;
    console.table(rows);
    if (rows.some(row => row.resultado !== 'OK')) {
      console.error('Hay tablas ausentes o adicionales. REVISAR no significa borrar: comprueba datos y dependencias primero.');
      process.exitCode = 2;
    } else {
      console.log('OK: solo se encontraron las cuatro tablas esperadas del MVP.');
    }
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {});
    // Do not print the connection URL or credentials.
    console.error('No se pudo auditar la base:', error.code || 'error de conexion o consulta');
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}
main();

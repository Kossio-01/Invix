const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS restringido al origen del frontend (definido en .env)
app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());

app.use(healthRoutes);
app.use('/api/auth', authRoutes);

app.use((error, req, res, next) => {
  console.error('Error no controlado en la API:', error.message);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

app.listen(PORT, () => {
  console.log(`Servidor Invix escuchando en http://localhost:${PORT}`);
});

module.exports = app;
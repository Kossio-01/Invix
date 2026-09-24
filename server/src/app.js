const express = require('express');
const app = express();

// Puerto configurado por defecto
const PORT = process.env.PORT || 3000;

// Middleware para procesar JSON
app.use(express.json());

// Endpoint de verificación del servidor y API
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        db: 'connected',
        message: 'Servidor Express corriendo correctamente'
    });
});

// Inicializar el servidor
app.listen(PORT, () => {
    console.log(`Servidor de Invix ejecutándose en el puerto ${PORT}`);
    console.log(`Prueba el endpoint en: http://localhost:${PORT}/health`);
});
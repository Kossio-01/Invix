const express = require('express');
const router = express.Router();
const { getProducts, createProduct } = require('../controllers/productController');

// Ruta GET para listar productos
router.get('/productos', getProducts);

// Ruta POST para crear un producto
router.post('/productos', createProduct);

module.exports = router;
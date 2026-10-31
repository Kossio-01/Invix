// Obtener todos los productos (Ejemplo de GET)
const getProducts = (req, res) => {
    try {
        // Aquí luego irá la consulta a la base de datos
        res.status(200).json({
            success: true,
            message: "Lista de productos obtenida con éxito",
            data: []
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
};

// Crear un producto (Ejemplo de POST)
const createProduct = (req, res) => {
    try {
        const { nombre, precio, stock } = req.body;
        
        // Validar campos obligatorios
        if (!nombre || !precio) {
            return res.status(400).json({
                success: false,
                message: "El nombre y el precio son obligatorios"
            });
        }

        res.status(201).json({
            success: true,
            message: "Producto creado exitosamente",
            data: { nombre, precio, stock }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al crear el producto",
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    createProduct
};
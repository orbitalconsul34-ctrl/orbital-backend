const productoModel = require('../models/productoModel');

const getProductos = async (req, res) => {
    try {
        const productos = await productoModel.obtenerTodos();
        res.json(productos);
    } catch (error) {
        console.error('Error en getProductos:', error);
        res.status(500).json({ error: 'Error interno al obtener los productos' });
    }
};

const crearProducto = async (req, res) => {
    try {
        const nuevoId = await productoModel.crear(req.body);
        res.status(201).json({ mensaje: 'Producto creado exitosamente', id: nuevoId });
    } catch (error) {
        console.error('Error en crearProducto:', error);
        res.status(500).json({ error: 'Error al registrar el producto' });
    }
};

const actualizarProducto = async (req, res) => {
    try {
        const filasAfectadas = await productoModel.actualizar(req.params.id, req.body);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error en actualizarProducto:', error);
        res.status(500).json({ error: 'Error al actualizar el producto' });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const filasAfectadas = await productoModel.eliminar(req.params.id);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error('Error en eliminarProducto:', error);
        res.status(500).json({ error: 'Error al eliminar el producto' });
    }
};

const getProductoById = async (req, res) => {
    try {
        const producto = await productoModel.obtenerPorId(req.params.id);
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error('Error en getProductoById:', error);
        res.status(500).json({ error: 'Error interno al obtener el producto' });
    }
};

module.exports = {
    getProductoById,
    getProductos,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};
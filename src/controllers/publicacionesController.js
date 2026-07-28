const publicacionModel = require('../models/publicacionModel');

const getPublicaciones = async (req, res) => {
    try {
        const publicaciones = await publicacionModel.obtenerTodas();
        res.json(publicaciones);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener las publicaciones' });
    }
};

const crearPublicacion = async (req, res) => {
    try {
        const nuevoId = await publicacionModel.crear(req.body);
        res.status(201).json({ mensaje: 'Publicación creada exitosamente', id: nuevoId });
    } catch (error) {
        // ¡Esta es la línea mágica que te mostrará de qué se queja MySQL!
        console.error("¡Detalle del error en la Base de Datos:", error); 
        res.status(500).json({ error: 'Error al crear la publicación' });
    }
};

const actualizarPublicacion = async (req, res) => {
    try {
        const filasAfectadas = await publicacionModel.actualizar(req.params.id, req.body);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        res.json({ mensaje: 'Publicación actualizada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar la publicación' });
    }
};

const eliminarPublicacion = async (req, res) => {
    try {
        const filasAfectadas = await publicacionModel.eliminar(req.params.id);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        res.json({ mensaje: 'Publicación eliminada exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar la publicación' });
    }
};

const obtenerPorId = async (req, res) => {
    try {
        const publicacion = await publicacionModel.obtenerPorId(req.params.id);
        
        // Si la base de datos no encuentra el ID, devolvemos un error 404
        if (!publicacion) {
            return res.status(404).json({ error: 'Publicación no encontrada' });
        }
        
        res.json(publicacion);
    } catch (error) {
        console.error("Error al obtener publicación por ID:", error);
        res.status(500).json({ error: 'Error al obtener la publicación' });
    }
};

module.exports = {
    getPublicaciones,
    crearPublicacion,
    actualizarPublicacion,
    eliminarPublicacion,
    obtenerPorId // <- ¡Nueva función añadida!
};
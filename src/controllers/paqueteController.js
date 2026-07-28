const paqueteModel = require('../models/paqueteModel');

const getPaquetes = async (req, res) => {
    try {
        const paquetes = await paqueteModel.obtenerTodos();
        res.json(paquetes);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los paquetes' });
    }
};

const crearPaquete = async (req, res) => {
    try {
        const nuevoId = await paqueteModel.crear(req.body);
        res.status(201).json({ mensaje: 'Paquete creado exitosamente', id: nuevoId });
    } catch (error) {
        res.status(500).json({ error: 'Error al crear el paquete' });
    }
};

const actualizarPaquete = async (req, res) => {
    try {
        const filasAfectadas = await paqueteModel.actualizar(req.params.id, req.body);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Paquete no encontrado' });
        }
        res.json({ mensaje: 'Paquete actualizado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el paquete' });
    }
};

const eliminarPaquete = async (req, res) => {
    try {
        const filasAfectadas = await paqueteModel.eliminar(req.params.id);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Paquete no encontrado' });
        }
        res.json({ mensaje: 'Paquete eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el paquete' });
    }
};

module.exports = { getPaquetes, crearPaquete, actualizarPaquete, eliminarPaquete };
const doctorModel = require('../models/doctorModel');

const getDoctores = async (req, res) => {
    try {
        const doctores = await doctorModel.obtenerTodos();
        res.json(doctores);
    } catch (error) {
        console.error('Error en getDoctores:', error);
        res.status(500).json({ error: 'Error interno al obtener los doctores' });
    }
};

// Nueva función para manejar la creación
const crearDoctor = async (req, res) => {
    try {
        // req.body contiene el JSON con los datos que enviaremos en la petición
        const nuevoId = await doctorModel.crear(req.body);
        res.status(201).json({ 
            mensaje: 'Doctor creado exitosamente', 
            id: nuevoId 
        });
    } catch (error) {
        console.error('Error en crearDoctor:', error);
        res.status(500).json({ error: 'Error al registrar el doctor en la base de datos' });
    }
};

const actualizarDoctor = async (req, res) => {
    try {
        // req.params.id captura el número que enviemos en la URL
        const filasAfectadas = await doctorModel.actualizar(req.params.id, req.body);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Doctor no encontrado' });
        }
        res.json({ mensaje: 'Doctor actualizado exitosamente' });
    } catch (error) {
        console.error('Error en actualizarDoctor:', error);
        res.status(500).json({ error: 'Error al actualizar el doctor' });
    }
};

const eliminarDoctor = async (req, res) => {
    try {
        const filasAfectadas = await doctorModel.eliminar(req.params.id);
        
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Doctor no encontrado' });
        }
        res.json({ mensaje: 'Doctor eliminado exitosamente' });
    } catch (error) {
        console.error('Error en eliminarDoctor:', error);
        res.status(500).json({ error: 'Error al eliminar el doctor' });
    }
};

module.exports = {
    getDoctores,
    crearDoctor,
    actualizarDoctor,
    eliminarDoctor
};
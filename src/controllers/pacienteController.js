const pacienteModel = require('../models/pacienteModel');

const getPacientes = async (req, res) => {
    try {
        const pacientes = await pacienteModel.obtenerTodos();
        res.json(pacientes);
    } catch (error) {
        console.error('Error en getPacientes:', error);
        res.status(500).json({ error: 'Error interno al obtener los pacientes' });
    }
};

const crearPaciente = async (req, res) => {
    try {
        const nuevoId = await pacienteModel.crear(req.body);
        res.status(201).json({ mensaje: 'Paciente creado exitosamente', id: nuevoId });
    } catch (error) {
        console.error('Error en crearPaciente:', error);
        res.status(500).json({ error: 'Error al registrar el paciente' });
    }
};

const actualizarPaciente = async (req, res) => {
    try {
        const filasAfectadas = await pacienteModel.actualizar(req.params.id, req.body);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json({ mensaje: 'Paciente actualizado exitosamente' });
    } catch (error) {
        console.error('Error en actualizarPaciente:', error);
        res.status(500).json({ error: 'Error al actualizar el paciente' });
    }
};

const eliminarPaciente = async (req, res) => {
    try {
        const filasAfectadas = await pacienteModel.eliminar(req.params.id);
        if (filasAfectadas === 0) {
            return res.status(404).json({ error: 'Paciente no encontrado' });
        }
        res.json({ mensaje: 'Paciente eliminado exitosamente' });
    } catch (error) {
        console.error('Error en eliminarPaciente:', error);
        res.status(500).json({ error: 'Error al eliminar el paciente' });
    }
};

module.exports = {
    getPacientes,
    crearPaciente,
    actualizarPaciente,
    eliminarPaciente
};
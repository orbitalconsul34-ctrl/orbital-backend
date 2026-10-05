const doctorModel = require('../models/doctorModel');

// Envuelve cada handler para no repetir el try/catch
const manejar = (fn, mensaje) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error(mensaje, error);
        res.status(500).json({ error: mensaje });
    }
};

const getDoctores = manejar(async (req, res) => {
    res.json(await doctorModel.obtenerTodos());
}, 'Error interno al obtener los doctores');

const getDoctoresPublicos = manejar(async (req, res) => {
    res.json(await doctorModel.obtenerPublicos());
}, 'Error interno al obtener los doctores');

const getPerfil = manejar(async (req, res) => {
    const doctor = await doctorModel.obtenerPerfil(req.params.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado' });
    res.json(doctor);
}, 'Error interno al obtener el doctor');

const crearDoctor = manejar(async (req, res) => {
    const id = await doctorModel.crear(req.body);
    res.status(201).json({ mensaje: 'Doctor creado exitosamente', id });
}, 'Error al registrar el doctor en la base de datos');

const actualizarDoctor = manejar(async (req, res) => {
    const filas = await doctorModel.actualizar(req.params.id, req.body);
    if (filas === 0) return res.status(404).json({ error: 'Doctor no encontrado' });
    res.json({ mensaje: 'Doctor actualizado exitosamente' });
}, 'Error al actualizar el doctor');

const eliminarDoctor = manejar(async (req, res) => {
    const filas = await doctorModel.eliminar(req.params.id);
    if (filas === 0) return res.status(404).json({ error: 'Doctor no encontrado' });
    res.json({ mensaje: 'Doctor eliminado exitosamente' });
}, 'Error al eliminar el doctor');

// === NUEVOS CONTROLADORES DE TURNOS ===
const getConfigTurnos = manejar(async (req, res) => {
    const config = await doctorModel.obtenerConfigTurnos(req.params.id);
    // Si no tiene, devuelve objetos vacíos para que el frontend no falle
    res.json(config || { horarios_base: '{}', dias_bloqueados: '[]' });
}, 'Error al obtener los turnos del doctor');

const actualizarConfigTurnos = manejar(async (req, res) => {
    const { horarios_base, dias_bloqueados } = req.body;
    await doctorModel.actualizarConfigTurnos(req.params.id, horarios_base, dias_bloqueados);
    res.json({ mensaje: 'Horarios actualizados exitosamente' });
}, 'Error al actualizar los turnos del doctor');

module.exports = { 
    getDoctores, getDoctoresPublicos, getPerfil, crearDoctor, 
    actualizarDoctor, eliminarDoctor, getConfigTurnos, actualizarConfigTurnos 
};
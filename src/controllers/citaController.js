const crypto = require('crypto');
const citaModel = require('../models/citaModel');
const doctorModel = require('../models/doctorModel');
const pacienteModel = require('../models/pacienteModel');
const disponibilidad = require('../services/disponibilidad');
const culqi = require('../services/culqi');
const { ejecutarIntegraciones } = require('../services/integraciones');

const HOLD_MINUTOS = Number(process.env.HOLD_MINUTOS) || 15;
const reFecha = /^\d{4}-\d{2}-\d{2}$/;
const reHora = /^\d{2}:\d{2}$/;
const reMes = /^\d{4}-(0[1-9]|1[0-2])$/;
const db = require('../config/db');

const manejar = (fn, mensaje) => async (req, res) => {
    try {
        await fn(req, res);
    } catch (error) {
        console.error(mensaje, error);
        res.status(500).json({ error: mensaje });
    }
};

// GET /api/citas/disponibilidad/:idDoctor?mes=2026-10
const getDisponibilidad = manejar(async (req, res) => {
    if (!reMes.test(req.query.mes || '')) return res.status(400).json({ error: 'Usa mes=AAAA-MM' });
    const data = await disponibilidad.disponibilidadMes(req.params.idDoctor, req.query.mes);
    if (!data) return res.status(404).json({ error: 'Doctor no encontrado' });
    res.json(data);
}, 'Error al consultar la disponibilidad');

// POST /api/citas/reservar  { id_doctor, fecha, hora, modalidad } → separa el horario
const reservar = manejar(async (req, res) => {
    const { id_doctor, fecha, hora, modalidad = 'PRESENCIAL' } = req.body;
    
    if (!id_doctor || !reFecha.test(fecha || '') || !reHora.test(hora || '')) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }
    
    const doctorValido = await disponibilidad.horarioValido(id_doctor, fecha, hora);
    if (!doctorValido) return res.status(409).json({ error: 'Ese horario no está disponible. Elige otro.' });

    // Lógica para elegir el precio correcto según la modalidad
    const doctorBD = await doctorModel.obtenerPerfil(id_doctor);
    const montoCobrar = modalidad === 'VIRTUAL' ? doctorBD.precio_virtual : doctorBD.precio;

    const token = crypto.randomBytes(16).toString('hex');
    try {
        const id = await citaModel.crearReserva({
            id_doctor, fecha, hora, monto: montoCobrar, token, minutos: HOLD_MINUTOS, modalidad
        });
        res.status(201).json({ id, token, segundos_restantes: HOLD_MINUTOS * 60, monto: montoCobrar, modalidad });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Ese horario se acaba de ocupar. Elige otro.' });
        }
        throw error;
    }
}, 'Error al separar el horario');

// POST /api/citas/:id/pagar
const pagar = manejar(async (req, res) => {
    const { token, culqi_token, dni, nombre_completo, telefono, correo, motivo } = req.body;
    if (!token || !culqi_token || !/^\d{8}$/.test(dni || '') || !nombre_completo?.trim()
        || String(telefono || '').replace(/\D/g, '').length < 9 || !/^\S+@\S+\.\S+$/.test(correo || '')) {
        return res.status(400).json({ error: 'Revisa tus datos: DNI (8 dígitos), nombre, celular y correo.' });
    }

    // 1) Bloquea la reserva (evita doble cobro) y valida que siga siendo de esta persona
    const cita = await citaModel.tomarParaPago(req.params.id, token);
    if (!cita) {
        return res.status(410).json({
            error: 'Tu reserva venció, ya fue pagada o el horario ya no está disponible. Elige un horario nuevamente.'
        });
    }

    // 2) Cobra. El monto sale de la BD, no del navegador.
    let id_paciente, cargo;
    try {
        id_paciente = await pacienteModel.guardarPorDni({
            dni, nombre_completo: nombre_completo.trim(), telefono, correo
        });
        cargo = await culqi.crearCargo({
            monto: cita.monto,
            email: correo,
            tokenId: culqi_token,
            descripcion: `Consulta Orbital Salud - cita ${cita.id}`,
            metadata: { cita_id: String(cita.id) }
        });
    } catch (error) {
        await citaModel.soltarPago(cita.id); // la reserva queda lista para reintentar
        if (error.culqi) return res.status(402).json({ error: error.message }); // rechazo de Culqi/banco
        throw error;
    }
    console.log(`[culqi] cargo ${cargo.id} cobrado para la cita ${cita.id}`);

    // 3) Confirma la cita
    try {
        await citaModel.marcarPagada(cita.id, { id_paciente, motivo, cargoId: cargo.id });
    } catch (error) {
        console.error(`[culqi] COBRADO pero no se pudo guardar. cargo ${cargo.id}, cita ${cita.id}`, error);
        return res.status(500).json({
            error: `Tu pago se procesó, pero tuvimos un problema al registrar la cita. Escríbenos con este código: ${cargo.id}`
        });
    }
    res.json({ mensaje: 'Pago aprobado. Tu cita está confirmada.', codigo: cargo.id });

    // 4) En segundo plano: Calendar, Sheets y app de la clínica
    ejecutarIntegraciones(cita.id).catch((e) => console.error('Integraciones:', e));
}, 'Error al procesar el pago');

// PUT /api/citas/:id/reprogramar
const reprogramar = manejar(async (req, res) => {
    const { fecha, hora } = req.body;
    const idCita = req.params.id;

    if (!fecha || !hora) return res.status(400).json({ error: 'Falta fecha u hora' });

    // 1. Actualizar la nueva fecha y hora en la Base de Datos
    await db.query('UPDATE citas_transacciones SET fecha = ?, hora = ? WHERE id = ?', [fecha, hora, idCita]);

    // 2. Si hay Google Calendar, actualizar el evento de Google
    const cita = await citaModel.obtenerDetalle(idCita);
    if (cita && cita.google_calendar_id && cita.google_event_id && process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        try {
            const { google } = require('googleapis');
            const auth = new google.auth.GoogleAuth({
                credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
                scopes: ['https://www.googleapis.com/auth/calendar']
            });
            const calendar = google.calendar({ version: 'v3', auth });
            
            // Calculamos la hora de fin según la duración de la cita
            const sumarMin = (hhmm, min) => {
                const [h, m] = hhmm.split(':').map(Number);
                const t = h * 60 + m + min;
                return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
            };

            await calendar.events.patch({
                calendarId: cita.google_calendar_id,
                eventId: cita.google_event_id,
                requestBody: {
                    start: { dateTime: `${fecha}T${hora}:00`, timeZone: 'America/Lima' },
                    end: { dateTime: `${fecha}T${sumarMin(hora, cita.duracion_min)}:00`, timeZone: 'America/Lima' }
                }
            });
            console.log(`Cita ${idCita} reprogramada exitosamente en Google Calendar`);
        } catch (error) {
            console.error('Error al actualizar Google Calendar:', error);
            // No bloqueamos el proceso si falla GCalendar, la DB ya se actualizó
        }
    }

    res.json({ mensaje: 'Cita reprogramada con éxito' });
}, 'Error al reprogramar la cita');

// POST /api/citas/:id/liberar
const liberar = manejar(async (req, res) => {
    await citaModel.liberar(req.params.id, req.body.token);
    res.json({ ok: true });
}, 'Error al liberar el horario');

// GET /api/citas?estado=APROBADO
const listar = manejar(async (req, res) => {
    res.json(await citaModel.listar(req.query.estado));
}, 'Error al listar las citas');

module.exports = { getDisponibilidad, reservar, pagar, liberar, listar, reprogramar };
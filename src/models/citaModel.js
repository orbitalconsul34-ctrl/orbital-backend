const db = require('../config/db');

const BASE = `
    SELECT c.id,
           DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
           TIME_FORMAT(c.hora, '%H:%i') AS hora,
           c.estado, c.monto, c.motivo, c.metodo_pago,
           c.referencia_pago AS pago_id,
           c.google_event_id, c.creado_en,
           p.dni, p.nombre_completo AS paciente, p.telefono, p.correo,
           d.nombres AS doctor, d.especialidad, d.duracion_min, d.google_calendar_id
    FROM citas_transacciones c
    JOIN doctores d ON d.id = c.id_doctor
    LEFT JOIN pacientes p ON p.id = c.id_paciente`;

// Horarios ocupados de un doctor en un rango de fechas.
// Una reserva PENDIENTE cuyo tiempo venció ya NO cuenta como ocupada.
const ocupados = async (idDoctor, desde, hasta) => {
    const [rows] = await db.query(
        `SELECT DATE_FORMAT(fecha, '%Y-%m-%d') AS fecha, TIME_FORMAT(hora, '%H:%i') AS hora
         FROM citas_transacciones
         WHERE id_doctor = ? AND fecha BETWEEN ? AND ?
           AND (estado = 'APROBADO'
                OR (estado = 'PENDIENTE' AND (expira_en IS NULL OR expira_en > NOW())))`,
        [idDoctor, desde, hasta]
    );
    return rows;
};

// Separa el horario por X minutos. Si dos personas lo intentan a la vez,
// el índice único uq_cupo_activo hace fallar a la segunda (ER_DUP_ENTRY).
const crearReserva = async ({ id_doctor, fecha, hora, monto, token, minutos }) => {
    // Libera solo ESTE horario si quedó una reserva vencida sin pagar
    await db.query(
        `UPDATE citas_transacciones SET estado = 'EXPIRADA'
         WHERE id_doctor = ? AND fecha = ? AND hora = ?
           AND estado = 'PENDIENTE' AND expira_en IS NOT NULL AND expira_en < NOW()`,
        [id_doctor, fecha, hora]
    );
    const [r] = await db.query(
        `INSERT INTO citas_transacciones (id_doctor, fecha, hora, estado, monto, token_reserva, expira_en)
         VALUES (?, ?, ?, 'PENDIENTE', ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
        [id_doctor, fecha, hora, monto, token, minutos]
    );
    return r.insertId;
};

// Paso previo al cobro: bloquea la reserva (evita cobrar dos veces por doble clic)
// y le da 5 minutos más para que el pago termine. Devuelve la cita, o null si ya no se puede pagar.
// Acepta una reserva vencida mientras nadie más haya tomado el horario.
const tomarParaPago = async (id, token) => {
    const [r] = await db.query(
        `UPDATE citas_transacciones
         SET referencia_pago = 'PROCESANDO', expira_en = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
         WHERE id = ? AND token_reserva = ? AND estado = 'PENDIENTE' AND referencia_pago IS NULL`,
        [id, token]
    );
    if (!r.affectedRows) return null;
    const [rows] = await db.query('SELECT id, id_doctor, monto FROM citas_transacciones WHERE id = ?', [id]);
    return rows[0];
};

// El cobro falló (tarjeta rechazada, etc.): la reserva queda lista para reintentar
const soltarPago = async (id) => {
    await db.query(
        `UPDATE citas_transacciones SET referencia_pago = NULL WHERE id = ? AND referencia_pago = 'PROCESANDO'`,
        [id]
    );
};

// Cobro exitoso: la cita queda confirmada
const marcarPagada = async (id, { id_paciente, motivo, cargoId }) => {
    await db.query(
        `UPDATE citas_transacciones
         SET estado = 'APROBADO', metodo_pago = 'CULQI', referencia_pago = ?,
             id_paciente = ?, motivo = ?, expira_en = NULL
         WHERE id = ?`,
        [cargoId, id_paciente, motivo || null, id]
    );
};

// El paciente cambió de horario o de doctor
const liberar = async (id, token) => {
    const [r] = await db.query(
        `UPDATE citas_transacciones SET estado = 'CANCELADA'
         WHERE id = ? AND token_reserva = ? AND estado = 'PENDIENTE' AND referencia_pago IS NULL`,
        [id, token]
    );
    return r.affectedRows;
};

// Panel admin: citas con paciente registrado (es decir, pagadas)
const listar = async (estado) => {
    const [rows] = await db.query(
        `${BASE} WHERE c.id_paciente IS NOT NULL ${estado ? 'AND c.estado = ?' : ''}
         ORDER BY c.fecha DESC, c.hora DESC`,
        estado ? [estado] : []
    );
    return rows;
};

const obtenerDetalle = async (id) => {
    const [rows] = await db.query(`${BASE} WHERE c.id = ?`, [id]);
    return rows[0];
};

const guardarEventoId = async (id, eventId) => {
    await db.query('UPDATE citas_transacciones SET google_event_id = ? WHERE id = ?', [eventId, id]);
};

module.exports = {
    ocupados, crearReserva, tomarParaPago, soltarPago, marcarPagada,
    liberar, listar, obtenerDetalle, guardarEventoId
};
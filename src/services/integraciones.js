const citaModel = require('../models/citaModel');

// ---------- Google (Calendar + Sheets con una cuenta de servicio) ----------
let _auth;
const clienteGoogle = () => {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return null;
    const { google } = require('googleapis'); // carga perezosa: solo si se usa
    if (!_auth) {
        _auth = new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
            scopes: [
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/spreadsheets'
            ]
        });
    }
    return { google, auth: _auth };
};

const sumarMin = (hhmm, min) => {
    const [h, m] = hhmm.split(':').map(Number);
    const t = h * 60 + m + min;
    return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

// Evento en el calendario del doctor (él debe compartirlo con el email de la cuenta de servicio)
const crearEventoCalendar = async (c) => {
    const g = clienteGoogle();
    if (!g || !c.google_calendar_id) return 'omitido';
    const calendar = g.google.calendar({ version: 'v3', auth: g.auth });
    const { data } = await calendar.events.insert({
        calendarId: c.google_calendar_id,
        requestBody: {
            summary: `Cita: ${c.paciente}`,
            description: `Tel: ${c.telefono || '-'}\nMotivo: ${c.motivo || '-'}\nCita #${c.id}`,
            start: { dateTime: `${c.fecha}T${c.hora}:00`, timeZone: 'America/Lima' },
            end: { dateTime: `${c.fecha}T${sumarMin(c.hora, c.duracion_min)}:00`, timeZone: 'America/Lima' }
        }
    });
    await citaModel.guardarEventoId(c.id, data.id);
    return 'ok';
};

// Una fila por cita. Sin motivo de consulta: son datos de salud.
// La hoja debe tener una pestaña llamada "Citas" y estar compartida con la cuenta de servicio.
const agregarFilaSheets = async (c) => {
    const g = clienteGoogle();
    if (!g || !process.env.GOOGLE_SHEET_ID) return 'omitido';
    const sheets = g.google.sheets({ version: 'v4', auth: g.auth });
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'Citas!A:J',
        valueInputOption: 'RAW', // RAW conserva los ceros a la izquierda del DNI
        requestBody: {
            values: [[c.id, c.fecha, c.hora, c.doctor, c.paciente, c.dni, c.telefono, c.correo, c.monto, c.estado]]
        }
    });
    return 'ok';
};

// ---------- App web de la clínica ----------
// Cuando la clienta termine su sistema, solo se cambia CLINICA_APP_URL en el .env.
// Si la variable está vacía, este paso se omite.
const enviarAppClinica = async (c) => {
    if (!process.env.CLINICA_APP_URL) return 'omitido';
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.CLINICA_APP_KEY) headers.Authorization = `Bearer ${process.env.CLINICA_APP_KEY}`;
    const r = await fetch(process.env.CLINICA_APP_URL, { method: 'POST', headers, body: JSON.stringify(c) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return 'ok';
};

// ---------- Orquestador ----------
// Se ejecuta DESPUÉS de aprobar el pago y en segundo plano: si algo falla, la cita ya quedó guardada.
// Para sumar correo o WhatsApp, agrega otra función aquí.
const TAREAS = { calendar: crearEventoCalendar, sheets: agregarFilaSheets, app_clinica: enviarAppClinica };

const ejecutarIntegraciones = async (idCita) => {
    const cita = await citaModel.obtenerDetalle(idCita);
    if (!cita) return;
    for (const [nombre, tarea] of Object.entries(TAREAS)) {
        try {
            console.log(`[${nombre}] cita ${idCita}: ${await tarea(cita)}`);
        } catch (e) {
            console.error(`[${nombre}] cita ${idCita} falló:`, e.message);
        }
    }
};

module.exports = { ejecutarIntegraciones, agregarFilaSheets };
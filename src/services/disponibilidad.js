const db = require('../config/db');
const citaModel = require('../models/citaModel');

const ANTICIPACION_MIN = 60; // no se puede reservar un horario que empieza en menos de 1 hora

const leerJSON = (v, defecto) => {
    if (v == null) return defecto;
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return defecto; }
};

const aMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const aHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Hora actual en Lima (UTC-5 todo el año). Así no depende de la zona horaria del servidor (Render usa UTC).
const ahoraLima = () => {
    const d = new Date(Date.now() - 5 * 3600 * 1000);
    return { hoy: d.toISOString().slice(0, 10), minutos: d.getUTCHours() * 60 + d.getUTCMinutes() };
};

const getConfig = async (idDoctor) => {
    const [[doctor]] = await db.query(
        'SELECT id, duracion_min, precio, google_calendar_id FROM doctores WHERE id = ? AND activo = 1',
        [idDoctor]
    );
    if (!doctor) return null;
    const [[cfg]] = await db.query(
        'SELECT horarios_base, dias_bloqueados FROM turnos_configuracion WHERE id_doctor = ?',
        [idDoctor]
    );
    return {
        doctor,
        horarios: leerJSON(cfg?.horarios_base, {}),
        bloqueados: leerJSON(cfg?.dias_bloqueados, [])
    };
};

// Genera los cupos de un día a partir del horario semanal del doctor
const cuposDelDia = (fecha, { doctor, horarios, bloqueados }, ocupados, ahora) => {
    if (bloqueados.includes(fecha)) return [];
    const diaSemana = new Date(`${fecha}T12:00:00Z`).getUTCDay(); // 0 = domingo
    const cupos = [];
    for (const { inicio, fin } of horarios[diaSemana] || []) {
        for (let m = aMin(inicio); m + doctor.duracion_min <= aMin(fin); m += doctor.duracion_min) {
            const hora = aHHMM(m);
            const pasado = fecha < ahora.hoy || (fecha === ahora.hoy && m < ahora.minutos + ANTICIPACION_MIN);
            cupos.push({ hora, libre: !pasado && !ocupados.has(`${fecha} ${hora}`) });
        }
    }
    return cupos;
};

// mes = 'YYYY-MM' → estado de cada día + horas libres/ocupadas
const disponibilidadMes = async (idDoctor, mes) => {
    const cfg = await getConfig(idDoctor);
    if (!cfg) return null;

    const [y, m] = mes.split('-').map(Number);
    const totalDias = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const ocupados = new Set(
        (await citaModel.ocupados(idDoctor, `${mes}-01`, `${mes}-${String(totalDias).padStart(2, '0')}`))
            .map((o) => `${o.fecha} ${o.hora}`)
    );
    const ahora = ahoraLima();

    const dias = {};
    for (let d = 1; d <= totalDias; d++) {
        const fecha = `${mes}-${String(d).padStart(2, '0')}`;
        const horas = cuposDelDia(fecha, cfg, ocupados, ahora);
        const libres = horas.filter((h) => h.libre).length;

        let estado;
        if (fecha < ahora.hoy || horas.length === 0) estado = 'cerrado';          // pasado o sin atención
        else if (libres === 0) estado = 'lleno';
        else if (libres <= Math.max(2, Math.ceil(horas.length * 0.25))) estado = 'pocos';
        else estado = 'disponible';

        dias[fecha] = { estado, libres, total: horas.length, horas };
    }
    return { duracion_min: cfg.doctor.duracion_min, precio: cfg.doctor.precio, dias };
};

// ¿Ese horario existe en el calendario del doctor y no ya pasó? Devuelve el doctor (con precio) o null.
// La ocupación real la decide el índice único de la BD al insertar.
const horarioValido = async (idDoctor, fecha, hora) => {
    const cfg = await getConfig(idDoctor);
    if (!cfg) return null;
    const cupos = cuposDelDia(fecha, cfg, new Set(), ahoraLima());
    return cupos.some((c) => c.hora === hora && c.libre) ? cfg.doctor : null;
};

module.exports = { disponibilidadMes, horarioValido };
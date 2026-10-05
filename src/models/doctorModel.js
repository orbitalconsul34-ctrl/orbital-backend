const db = require('../config/db');

const CAMPOS = ['nombres', 'especialidad', 'titulo', 'foto_url', 'formacion', 'cursos', 'experiencia',
    'precio', 'duracion_min', 'google_calendar_id', 'correo_corporativo', 'activo'];
const CAMPOS_JSON = ['formacion', 'cursos', 'experiencia'];

// MariaDB devuelve las columnas JSON como texto; MySQL como objeto. Aceptamos ambos.
const leerJSON = (v) => {
    if (typeof v !== 'string') return v;
    try { return JSON.parse(v); } catch { return null; }
};
const normalizar = (r) => r && { ...r, formacion: leerJSON(r.formacion), cursos: leerJSON(r.cursos), experiencia: leerJSON(r.experiencia) };

// Solo los campos enviados; los JSON se guardan como texto
const preparar = (datos) => {
    const out = {};
    for (const c of CAMPOS) {
        if (datos[c] !== undefined) out[c] = CAMPOS_JSON.includes(c) ? JSON.stringify(datos[c]) : datos[c];
    }
    return out;
};

// Uso interno / panel admin (incluye google_calendar_id)
const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM doctores');
    return rows.map(normalizar);
};

// Página pública de reservas: sin datos privados
const obtenerPublicos = async () => {
    const [rows] = await db.query(
        'SELECT id, nombres, especialidad, titulo, foto_url, precio, duracion_min FROM doctores WHERE activo = 1 ORDER BY especialidad, nombres'
    );
    return rows;
};

// Página pública de perfil del doctor
const obtenerPerfil = async (id) => {
    const [rows] = await db.query(
        'SELECT id, nombres, especialidad, titulo, foto_url, formacion, cursos, experiencia, precio, duracion_min FROM doctores WHERE id = ? AND activo = 1',
        [id]
    );
    return normalizar(rows[0]);
};

const crear = async (datos) => {
    const [resultado] = await db.query('INSERT INTO doctores SET ?', [preparar(datos)]);
    
    // Novedad: Al crear el doctor, le creamos su configuración de turnos por defecto (vacía)
    await db.query(
        `INSERT INTO turnos_configuracion (id_doctor, horarios_base, dias_bloqueados) VALUES (?, '{}', '[]')`, 
        [resultado.insertId]
    );

    return resultado.insertId;
};

const actualizar = async (id, datos) => {
    const campos = preparar(datos);
    if (Object.keys(campos).length === 0) return 0;
    const [resultado] = await db.query('UPDATE doctores SET ? WHERE id = ?', [campos, id]);
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM doctores WHERE id = ?', [id]);
    return resultado.affectedRows;
};

// === NUEVAS FUNCIONES PARA TURNOS ===
const obtenerConfigTurnos = async (idDoctor) => {
    const [rows] = await db.query('SELECT horarios_base, dias_bloqueados FROM turnos_configuracion WHERE id_doctor = ?', [idDoctor]);
    return rows[0] || null;
};

const actualizarConfigTurnos = async (idDoctor, horariosBase, diasBloqueados) => {
    const [existe] = await db.query('SELECT id FROM turnos_configuracion WHERE id_doctor = ?', [idDoctor]);
    if (existe.length > 0) {
        await db.query('UPDATE turnos_configuracion SET horarios_base = ?, dias_bloqueados = ? WHERE id_doctor = ?', [horariosBase, diasBloqueados, idDoctor]);
    } else {
        await db.query('INSERT INTO turnos_configuracion (id_doctor, horarios_base, dias_bloqueados) VALUES (?, ?, ?)', [idDoctor, horariosBase, diasBloqueados]);
    }
};

module.exports = { 
    obtenerTodos, obtenerPublicos, obtenerPerfil, crear, actualizar, eliminar, 
    obtenerConfigTurnos, actualizarConfigTurnos 
};
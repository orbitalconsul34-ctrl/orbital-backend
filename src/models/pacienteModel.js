const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM pacientes ORDER BY id DESC');
    return rows;
};

const crear = async ({ dni, nombre_completo, telefono, correo }) => {
    const [resultado] = await db.query(
        'INSERT INTO pacientes (dni, nombre_completo, telefono, correo) VALUES (?, ?, ?, ?)',
        [dni, nombre_completo, telefono, correo]
    );
    return resultado.insertId;
};

// Para la página de reservas: si el DNI ya existe devuelve ese paciente, si no lo crea.
// NO pisa datos existentes (cualquiera podría escribir el DNI de otra persona);
// solo completa los que estén vacíos. Cambios reales se hacen desde el panel con PUT.
const guardarPorDni = async ({ dni, nombre_completo, telefono, correo }) => {
    const [resultado] = await db.query(
        `INSERT INTO pacientes (dni, nombre_completo, telefono, correo) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            id = LAST_INSERT_ID(id),
            nombre_completo = VALUES(nombre_completo),
            telefono = COALESCE(telefono, VALUES(telefono)),
            correo = COALESCE(correo, VALUES(correo))`,
        [dni, nombre_completo, telefono, correo]
    );
    return resultado.insertId;
};

const actualizar = async (id, { dni, nombre_completo, telefono, correo }) => {
    const [resultado] = await db.query(
        'UPDATE pacientes SET dni = ?, nombre_completo = ?, telefono = ?, correo = ? WHERE id = ?',
        [dni, nombre_completo, telefono, correo, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM pacientes WHERE id = ?', [id]);
    return resultado.affectedRows;
};

module.exports = { obtenerTodos, crear, guardarPorDni, actualizar, eliminar };
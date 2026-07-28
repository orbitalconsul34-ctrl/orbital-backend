const db = require('../config/db');

const obtenerTodos = async () => {
    const [rows] = await db.query('SELECT * FROM pacientes');
    return rows;
};

const crear = async (datosPaciente) => {
    const { nombre, apellido, fecha_nacimiento, correo, whatsapp, dni } = datosPaciente;
    const [resultado] = await db.query(
        'INSERT INTO pacientes (nombre, apellido, fecha_nacimiento, correo, whatsapp, dni) VALUES (?, ?, ?, ?, ?, ?)',
        [nombre, apellido, fecha_nacimiento, correo, whatsapp, dni]
    );
    return resultado.insertId;
};

const actualizar = async (id, datosPaciente) => {
    const { nombre, apellido, fecha_nacimiento, correo, whatsapp, dni } = datosPaciente;
    const [resultado] = await db.query(
        'UPDATE pacientes SET nombre = ?, apellido = ?, fecha_nacimiento = ?, correo = ?, whatsapp = ?, dni = ? WHERE id = ?',
        [nombre, apellido, fecha_nacimiento, correo, whatsapp, dni, id]
    );
    return resultado.affectedRows;
};

const eliminar = async (id) => {
    const [resultado] = await db.query('DELETE FROM pacientes WHERE id = ?', [id]);
    return resultado.affectedRows;
};

module.exports = {
    obtenerTodos,
    crear,
    actualizar,
    eliminar
};
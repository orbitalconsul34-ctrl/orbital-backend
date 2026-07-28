const db = require('../config/db');

const buscarPorCorreo = async (correo) => {
    // Buscamos si hay algún registro que coincida con el email
    const [rows] = await db.query('SELECT * FROM usuarios_admin WHERE correo = ?', [correo]);
    return rows[0]; // Retorna el usuario si existe, o undefined si no
};

const crearAdmin = async (correo, password_hash) => {
    const [resultado] = await db.query(
        'INSERT INTO usuarios_admin (correo, password_hash) VALUES (?, ?)',
        [correo, password_hash]
    );
    return resultado.insertId;
};

module.exports = { buscarPorCorreo, crearAdmin };